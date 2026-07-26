import { decibelsToGain } from '~/domain'
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
    this.disconnect()

    const masterGain = this.context.createGain()
    masterGain.gain.value = workspace.mixer.master.muted
      ? 0
      : decibelsToGain(workspace.mixer.master.volumeDb)
    masterGain.connect(this.context.destination)
    this.masterGain = masterGain

    const mixChannels = workspace.mixer.channels.allIds
      .map(channelId => workspace.mixer.channels.byId[channelId])
      .filter(channel => channel !== undefined)
    const hasSoloedChannel = mixChannels.some(channel => channel.soloed)

    for (const channel of mixChannels) {
      const gain = this.context.createGain()
      const filter = this.context.createBiquadFilter()
      const panner = this.context.createStereoPanner()
      const audible = !channel.muted
        && (!hasSoloedChannel || channel.soloed)

      gain.gain.value = audible
        ? decibelsToGain(channel.volumeDb)
        : 0
      filter.type = 'lowpass'
      filter.frequency.value = this.context.sampleRate / 2
      panner.pan.value = channel.pan

      gain.connect(filter)
      filter.connect(panner)
      panner.connect(masterGain)

      this.channelGraphs.set(channel.id, {
        filter,
        gain,
        panner,
      })
    }
  }

  public getChannelInput(mixChannelId: string): GainNode | undefined {
    return this.channelGraphs.get(mixChannelId)?.gain
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
