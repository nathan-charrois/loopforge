import {
  createEffectGraph,
  type EffectGraph,
} from './effectGraph'
import {
  decibelsToGain,
  type Effect,
  type MixChannel,
  type MixChannelId,
} from '~/domain'
import type { Workspace } from '~/store/workspace'

type MixChannelGraph = {
  effectGraphs: EffectGraph[]
  effects: Effect[]
  input: GainNode
  gain: GainNode
  panner: StereoPannerNode
  meter: AnalyserNode
}

export type MixerMeterReading = Readonly<{
  level: number
  peak: number
}>

export type MixerMeterSnapshot = Readonly<Record<MixChannelId, MixerMeterReading>>

export const INITIAL_MIXER_METER_READING: MixerMeterReading = Object.freeze({
  level: 0,
  peak: 0,
})

export const INITIAL_MIXER_METER_SNAPSHOT: MixerMeterSnapshot = Object.freeze({})

const METER_FFT_SIZE = 256
const METER_PEAK_DECAY_DB_PER_SECOND = 18
const METER_PEAK_HOLD_SECONDS = 0.6
const METER_RELEASE_SECONDS = 0.02

export class MixerGraph {
  private activeMixChannelIds: MixChannelId[] = []
  private channelGraphs = new Map<MixChannelId, MixChannelGraph>()
  private masterGain: GainNode | undefined
  private meterAnimationFrameId: number | undefined
  private meterListeners = new Set<() => void>()
  private meterPeakHeldAt = new Map<MixChannelId, number>()
  private meterRenderedAt: number | undefined
  private meterSnapshot = INITIAL_MIXER_METER_SNAPSHOT
  private readonly meterTimeDomainData = new Float32Array(METER_FFT_SIZE)

  public constructor(
    private readonly context: AudioContext,
  ) {}

  public loadWorkspace(workspace: Workspace): void {
    const masterGain = this.masterGain ?? this.createMasterGain()

    masterGain.gain.value = workspace.mixer.master.muted ? 0 : decibelsToGain(workspace.mixer.master.volumeDb)

    const mixChannels = workspace.mixer.channels.allIds
      .map(channelId => workspace.mixer.channels.byId[channelId])
      .filter(channel => channel !== undefined)

    this.activeMixChannelIds = mixChannels.map(channel => channel.id)

    for (const channel of mixChannels) {
      const graph = this.getChannelGraph(channel.id)
      const audible = this.getChannelAudible(mixChannels, channel)
      const effects = this.resolveChannelEffects(workspace, channel.id)

      this.reconcileChannelEffects(graph, effects)
      graph.gain.gain.value = audible ? decibelsToGain(channel.volumeDb) : 0
      graph.panner.pan.value = channel.pan
    }
  }

  public getChannelInput(mixChannelId: string): GainNode | undefined {
    return this.channelGraphs.get(mixChannelId)?.input
  }

  public getChannelGraph(mixChannelId: string) {
    const channelGraph = this.channelGraphs.get(mixChannelId)

    if (channelGraph) {
      return channelGraph
    }

    const masterGain = this.masterGain ?? this.createMasterGain()
    const graph = this.createChannelGraph(masterGain)

    this.channelGraphs.set(mixChannelId, graph)

    return graph
  }

  public getMeterSnapshot = (): MixerMeterSnapshot => this.meterSnapshot

  public subscribeMeters = (listener: () => void): (() => void) => {
    this.meterListeners.add(listener)

    if (this.meterListeners.size === 1) {
      this.startMeterRendering()
    }

    return () => {
      this.meterListeners.delete(listener)

      if (this.meterListeners.size === 0) {
        this.stopMeterRendering()
      }
    }
  }

  public getChannelAudible(mixChannels: MixChannel[], channel: MixChannel) {
    const isAnyChannelSoloed = mixChannels.some(channel => channel.soloed)
    const isSoloed = !isAnyChannelSoloed || channel.soloed

    return !channel.muted && isSoloed
  }

  public scheduleAutomation(
    mixChannelId: string,
    parameter: string,
    value: boolean | number | string,
    whenSeconds: number,
  ): void {
    if (typeof value !== 'number') {
      return
    }

    const channelGraph = this.channelGraphs.get(mixChannelId)

    if (channelGraph === undefined) {
      return
    }

    switch (parameter) {
      case 'pan':
        channelGraph.panner.pan.setValueAtTime(
          Math.max(-1, Math.min(1, value)),
          whenSeconds,
        )
        return
      case 'volumeDb':
        channelGraph.gain.gain.setValueAtTime(
          decibelsToGain(value),
          whenSeconds,
        )
    }
  }

  public dispose(): void {
    this.stopMeterRendering()
    this.disconnect()
    this.meterPeakHeldAt.clear()
    this.meterSnapshot = INITIAL_MIXER_METER_SNAPSHOT
    this.meterListeners.clear()
  }

  private createMasterGain(): GainNode {
    const masterGain = this.context.createGain()

    masterGain.connect(this.context.destination)
    this.masterGain = masterGain

    return masterGain
  }

  private createChannelGraph(
    masterGain: GainNode,
  ): MixChannelGraph {
    const input = this.context.createGain()
    const gain = this.context.createGain()
    const panner = this.context.createStereoPanner()
    const meter = this.context.createAnalyser()

    meter.fftSize = METER_FFT_SIZE

    input.connect(panner)
    panner.connect(gain)
    gain.connect(meter)
    meter.connect(masterGain)

    return {
      effectGraphs: [],
      effects: [],
      input,
      gain,
      panner,
      meter,
    }
  }

  private reconcileChannelEffects(
    graph: MixChannelGraph,
    effects: Effect[],
  ): void {
    const hasSameStructure = graph.effects.length === effects.length
      && graph.effects.every((effect, index) => (
        effect.id === effects[index].id
        && effect.kind === effects[index].kind
      ))

    if (hasSameStructure) {
      effects.forEach((effect, index) => {
        if (effect !== graph.effects[index]) {
          graph.effectGraphs[index].update(effect)
        }
      })

      graph.effects = effects
      return
    }

    graph.input.disconnect()

    for (const effectGraph of graph.effectGraphs) {
      effectGraph.dispose()
    }

    const effectGraphs = effects.map(effect => (
      createEffectGraph(this.context, effect)
    ))
    let chainOutput: AudioNode = graph.input

    for (const effectGraph of effectGraphs) {
      chainOutput.connect(effectGraph.input)
      chainOutput = effectGraph.output
    }

    chainOutput.connect(graph.panner)
    graph.effectGraphs = effectGraphs
    graph.effects = effects
  }

  private resolveChannelEffects(
    workspace: Workspace,
    mixChannelId: MixChannelId,
  ): Effect[] {
    const trackId = workspace.tracks.allIds.find(currentTrackId => (
      workspace.tracks.byId[currentTrackId].mixChannelId === mixChannelId
    ))

    if (trackId === undefined) {
      return []
    }

    const instrument = workspace.instruments.byId[
      workspace.tracks.byId[trackId].instrumentId
    ]

    if (instrument === undefined) {
      return []
    }

    return instrument.effectIds.flatMap((effectId) => {
      const effect = workspace.effects.byId[effectId]
      return effect === undefined ? [] : [effect]
    })
  }

  private renderMeters = (frameTime: number): void => {
    this.meterAnimationFrameId = undefined

    const nextSnapshot: Record<MixChannelId, MixerMeterReading> = {}
    const elapsedSeconds = this.meterRenderedAt === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, (frameTime - this.meterRenderedAt) / 1000)

    const releaseMultiplier = Math.exp(
      -elapsedSeconds / METER_RELEASE_SECONDS,
    )

    this.meterRenderedAt = frameTime

    for (const mixChannelId of this.activeMixChannelIds) {
      const graph = this.channelGraphs.get(mixChannelId)

      if (graph === undefined) {
        continue
      }

      graph.meter.getFloatTimeDomainData(this.meterTimeDomainData)

      let sampledPeak = 0

      for (const sample of this.meterTimeDomainData) {
        sampledPeak = Math.max(sampledPeak, Math.abs(sample))
      }

      const previousReading = this.meterSnapshot[mixChannelId]
        ?? INITIAL_MIXER_METER_READING

      const level = Math.max(
        sampledPeak,
        previousReading.level * releaseMultiplier,
      )

      let peak = previousReading.peak
      let peakHeldAt = this.meterPeakHeldAt.get(mixChannelId) ?? frameTime

      if (sampledPeak > peak) {
        peak = sampledPeak
        peakHeldAt = frameTime
      }
      else if ((frameTime - peakHeldAt) / 1000 >= METER_PEAK_HOLD_SECONDS) {
        const decayedPeak = peak * decibelsToGain(
          -METER_PEAK_DECAY_DB_PER_SECOND * elapsedSeconds,
        )

        if (sampledPeak >= decayedPeak) {
          peak = sampledPeak
          peakHeldAt = frameTime
        }
        else {
          peak = decayedPeak
        }
      }

      this.meterPeakHeldAt.set(mixChannelId, peakHeldAt)

      nextSnapshot[mixChannelId] = { level, peak }
    }

    this.meterSnapshot = nextSnapshot

    for (const listener of this.meterListeners) {
      listener()
    }

    if (this.meterListeners.size > 0) {
      this.meterAnimationFrameId = requestAnimationFrame(this.renderMeters)
    }
  }

  private startMeterRendering(): void {
    if (this.meterAnimationFrameId === undefined) {
      this.meterAnimationFrameId = requestAnimationFrame(this.renderMeters)
    }
  }

  private stopMeterRendering(): void {
    if (this.meterAnimationFrameId !== undefined) {
      cancelAnimationFrame(this.meterAnimationFrameId)
    }

    this.meterAnimationFrameId = undefined
    this.meterRenderedAt = undefined
  }

  private disconnect(): void {
    for (const graph of this.channelGraphs.values()) {
      graph.input.disconnect()
      graph.gain.disconnect()
      graph.panner.disconnect()
      graph.meter.disconnect()

      for (const effectGraph of graph.effectGraphs) {
        effectGraph.dispose()
      }
    }

    this.channelGraphs.clear()
    this.masterGain?.disconnect()
    this.masterGain = undefined
  }
}
