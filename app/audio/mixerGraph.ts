import {
  decibelsToGain,
  type MixChannel,
  type MixChannelId,
} from '~/domain'
import type { Workspace } from '~/store/workspace'

type MixChannelGraph = {
  input: GainNode
  filter: BiquadFilterNode
  gain: GainNode
  panner: StereoPannerNode
  meter: AnalyserNode
}

export type MixerMeterSnapshot = Readonly<Record<MixChannelId, number>>

export const INITIAL_MIXER_METER_SNAPSHOT: MixerMeterSnapshot = Object.freeze({})

const METER_FFT_SIZE = 256
const METER_RELEASE_SECONDS = 0.02

export class MixerGraph {
  private activeMixChannelIds: MixChannelId[] = []
  private channelGraphs = new Map<MixChannelId, MixChannelGraph>()
  private masterGain: GainNode | undefined
  private meterAnimationFrameId: number | undefined
  private meterListeners = new Set<() => void>()
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
      case 'filterCutoff': {
        const normalizedValue = Math.max(0, Math.min(1, value))
        const frequency = 80 * ((20000 / 80) ** normalizedValue)

        channelGraph.filter.frequency.setValueAtTime(
          frequency,
          whenSeconds,
        )
        return
      }
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
    const filter = this.context.createBiquadFilter()
    const panner = this.context.createStereoPanner()
    const meter = this.context.createAnalyser()

    filter.type = 'lowpass'
    filter.frequency.value = this.context.sampleRate / 2
    meter.fftSize = METER_FFT_SIZE

    input.connect(filter)
    filter.connect(gain)
    gain.connect(panner)
    panner.connect(meter)
    meter.connect(masterGain)

    return {
      input,
      filter,
      gain,
      panner,
      meter,
    }
  }

  private renderMeters = (frameTime: number): void => {
    this.meterAnimationFrameId = undefined

    const nextSnapshot: Record<MixChannelId, number> = {}
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

      let peak = 0

      for (const sample of this.meterTimeDomainData) {
        peak = Math.max(peak, Math.abs(sample))
      }

      const previousPeak = this.meterSnapshot[mixChannelId] ?? 0

      nextSnapshot[mixChannelId] = Math.max(
        peak,
        previousPeak * releaseMultiplier,
      )
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
      graph.filter.disconnect()
      graph.panner.disconnect()
      graph.meter.disconnect()
    }

    this.channelGraphs.clear()
    this.masterGain?.disconnect()
    this.masterGain = undefined
  }
}
