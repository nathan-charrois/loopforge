import { decibelsToGain, type MixChannel } from '~/domain'
import type { Workspace } from '~/store/workspace'

type MixChannelGraph = {
  filter: BiquadFilterNode
  gain: GainNode
  panner: StereoPannerNode
}

export class MixerGraph {
  private channelGraphs = new Map<string, MixChannelGraph>()
  private masterGain: GainNode | undefined

  public constructor(
    private readonly context: AudioContext,
  ) {}

  public loadWorkspace(workspace: Workspace): void {
    const masterGain = this.masterGain ?? this.createMasterGain()

    masterGain.gain.value = workspace.mixer.master.muted ? 0 : decibelsToGain(workspace.mixer.master.volumeDb)

    const mixChannels = workspace.mixer.channels.allIds
      .map(channelId => workspace.mixer.channels.byId[channelId])
      .filter(channel => channel !== undefined)

    for (const channel of mixChannels) {
      const graph = this.getChannelGraph(channel.id)
      const audible = this.getChannelAudible(mixChannels, channel)

      graph.gain.gain.value = audible ? decibelsToGain(channel.volumeDb) : 0
      graph.panner.pan.value = channel.pan

      this.channelGraphs.set(channel.id, graph)
    }
  }

  public getChannelInput(mixChannelId: string): GainNode | undefined {
    return this.channelGraphs.get(mixChannelId)?.gain
  }

  public getChannelGraph(mixChannelId: string) {
    const channelGraph = this.channelGraphs.get(mixChannelId)

    if (channelGraph) {
      return channelGraph
    }

    const masterGain = this.masterGain ?? this.createMasterGain()

    return this.createChannelGraph(masterGain)
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
    this.disconnect()
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
    const gain = this.context.createGain()
    const filter = this.context.createBiquadFilter()
    const panner = this.context.createStereoPanner()

    filter.type = 'lowpass'
    filter.frequency.value = this.context.sampleRate / 2

    gain.connect(filter)
    filter.connect(panner)
    panner.connect(masterGain)

    return {
      filter,
      gain,
      panner,
    }
  }

  private disconnect(): void {
    for (const graph of this.channelGraphs.values()) {
      graph.gain.disconnect()
      graph.filter.disconnect()
      graph.panner.disconnect()
    }

    this.channelGraphs.clear()
    this.masterGain?.disconnect()
    this.masterGain = undefined
  }
}
