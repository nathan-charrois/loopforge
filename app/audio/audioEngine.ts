import { MixerGraph } from './mixerGraph'
import {
  decibelsToGain,
  type DrumInstrument,
  type DrumPiece,
  type MelodicInstrument,
} from '~/domain'
import type { PlaybackTrigger } from '~/playback/buildSchedule'
import {
  selectInstrument,
  selectTrack,
  type Workspace,
} from '~/store/workspace'

export type AudioEngineState
  = | 'uninitialized'
    | 'suspended'
    | 'running'
    | 'closed'

export type AudioEngineSnapshot = {
  state: AudioEngineState
  activeVoiceCount: number
}

export type ScheduleAudioTriggerInput = {
  trigger: PlaybackTrigger
  whenSeconds: number
  durationSeconds?: number
}

export const INITIAL_AUDIO_ENGINE_SNAPSHOT: AudioEngineSnapshot = {
  activeVoiceCount: 0,
  state: 'uninitialized',
}

export class AudioEngine {
  private activeVoices = new Map<OscillatorNode, () => void>()
  private context: AudioContext | undefined
  private disposed = false
  private listeners = new Set<() => void>()
  private mixerGraph: MixerGraph | undefined
  private snapshot = INITIAL_AUDIO_ENGINE_SNAPSHOT
  private workspace: Workspace | undefined

  public getSnapshot = (): AudioEngineSnapshot => this.snapshot

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  public async initialize(): Promise<void> {
    if (this.disposed) {
      throw new Error('Audio engine has been disposed')
    }

    if (this.context === undefined) {
      if (typeof AudioContext === 'undefined') {
        throw new Error('Web Audio is not supported in this environment')
      }

      this.context = new AudioContext()
      this.mixerGraph = new MixerGraph(this.context)
      this.context.addEventListener('statechange', this.handleContextStateChange)

      if (this.workspace !== undefined) {
        this.mixerGraph.loadWorkspace(this.workspace)
      }

      this.updateSnapshot()
    }

    if (this.context.state === 'suspended') {
      await this.context.resume()
    }

    this.updateSnapshot()
  }

  public loadWorkspace(workspace: Workspace): void {
    if (this.disposed) {
      throw new Error('Audio engine has been disposed')
    }

    this.workspace = workspace

    if (this.mixerGraph !== undefined) {
      this.stopAll()
      this.mixerGraph.loadWorkspace(workspace)
    }
  }

  public getCurrentTime(): number {
    return this.requiredContext().currentTime
  }

  public scheduleTrigger(
    input: ScheduleAudioTriggerInput,
  ): void {
    const context = this.requiredRunningContext()
    const workspace = this.requiredWorkspace()
    const track = selectTrack(workspace, input.trigger.source.trackId)
    const instrument = track === undefined
      ? undefined
      : selectInstrument(workspace, track.instrumentId)
    const mixerGraph = this.requiredMixerGraph()
    const destination = mixerGraph.getChannelInput(
      input.trigger.source.mixChannelId,
    )

    if (track === undefined || instrument === undefined || destination === undefined) {
      return
    }

    const whenSeconds = Math.max(input.whenSeconds, context.currentTime)

    switch (input.trigger.kind) {
      case 'automation':
        mixerGraph.scheduleAutomation(
          input.trigger.source.mixChannelId,
          input.trigger.parameter,
          input.trigger.value,
          whenSeconds,
        )
        return
      case 'drum':
        if (instrument.kind === 'drum') {
          this.scheduleDrumVoice(
            destination,
            instrument,
            input.trigger.piece,
            input.trigger.velocity,
            whenSeconds,
          )
        }
        return
      case 'note':
        if (instrument.kind === 'melodic') {
          this.scheduleNoteVoice(
            destination,
            instrument,
            input.trigger.pitch,
            input.trigger.velocity,
            whenSeconds,
            input.durationSeconds,
            track.role === 'bass',
          )
        }
    }
  }

  public stopAll(): void {
    const activeVoices = [...this.activeVoices.entries()]

    this.activeVoices.clear()

    for (const [voice, disconnect] of activeVoices) {
      voice.onended = null

      try {
        voice.stop()
      }
      catch {
        // A voice may already have ended between the set copy and stop().
      }

      voice.disconnect()
      disconnect()
    }

    this.updateSnapshot()
  }

  public async dispose(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.stopAll()
    this.mixerGraph?.dispose()

    const context = this.context

    if (context !== undefined) {
      context.removeEventListener('statechange', this.handleContextStateChange)

      if (context.state !== 'closed') {
        await context.close()
      }
    }

    this.replaceSnapshot({
      activeVoiceCount: 0,
      state: 'closed',
    })
    this.listeners.clear()
  }

  private handleContextStateChange = (): void => {
    this.updateSnapshot()
  }

  private scheduleNoteVoice(
    destination: GainNode,
    instrument: MelodicInstrument,
    pitch: number,
    velocity: number,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
    isBass: boolean,
  ): void {
    const context = this.requiredRunningContext()
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const durationSeconds = Math.max(0.02, requestedDurationSeconds ?? 0.1)
    const attackSeconds = Math.min(0.01, durationSeconds / 4)
    const releaseStartSeconds = whenSeconds + Math.max(
      attackSeconds,
      durationSeconds - 0.03,
    )
    const endSeconds = whenSeconds + durationSeconds
    const midiNote = pitch < 12
      ? pitch + (isBass ? 36 : 60)
      : pitch
    const peakGain = Math.max(0, Math.min(1, velocity / 127))

    oscillator.type = getOscillatorType(instrument)
    oscillator.frequency.setValueAtTime(
      midiNoteToFrequency(midiNote),
      whenSeconds,
    )

    envelope.gain.setValueAtTime(0, whenSeconds)
    envelope.gain.linearRampToValueAtTime(
      peakGain,
      whenSeconds + attackSeconds,
    )
    envelope.gain.setValueAtTime(
      peakGain * 0.85,
      releaseStartSeconds,
    )
    envelope.gain.linearRampToValueAtTime(0, endSeconds)

    oscillator.connect(envelope)
    envelope.connect(destination)
    oscillator.start(whenSeconds)
    oscillator.stop(endSeconds + 0.01)
    this.registerVoice(oscillator, () => envelope.disconnect())
  }

  private scheduleDrumVoice(
    destination: GainNode,
    instrument: DrumInstrument,
    piece: DrumPiece,
    velocity: number,
    whenSeconds: number,
  ): void {
    const context = this.requiredRunningContext()
    const oscillator = context.createOscillator()
    const envelope = context.createGain()
    const sound = instrument.pieces[piece]
    const drum = getDrumVoiceSettings(piece)
    const pitchRatio = 2 ** ((sound?.pitchSemitones ?? 0) / 12)
    const endSeconds = whenSeconds + drum.durationSeconds
    const peakGain = Math.max(0, Math.min(1, velocity / 127))
      * decibelsToGain(sound?.volumeDb ?? 0)

    oscillator.type = drum.type
    oscillator.frequency.setValueAtTime(
      drum.startFrequency * pitchRatio,
      whenSeconds,
    )
    oscillator.frequency.exponentialRampToValueAtTime(
      drum.endFrequency * pitchRatio,
      endSeconds,
    )

    envelope.gain.setValueAtTime(peakGain, whenSeconds)
    envelope.gain.exponentialRampToValueAtTime(0.0001, endSeconds)

    oscillator.connect(envelope)
    envelope.connect(destination)
    oscillator.start(whenSeconds)
    oscillator.stop(endSeconds + 0.01)
    this.registerVoice(oscillator, () => envelope.disconnect())
  }

  private registerVoice(
    voice: OscillatorNode,
    disconnect: () => void,
  ): void {
    this.activeVoices.set(voice, disconnect)
    voice.onended = () => {
      voice.disconnect()
      disconnect()

      if (this.activeVoices.delete(voice)) {
        this.updateSnapshot()
      }
    }
    this.updateSnapshot()
  }

  private updateSnapshot(): void {
    this.replaceSnapshot({
      activeVoiceCount: this.activeVoices.size,
      state: getAudioEngineState(this.context),
    })
  }

  private replaceSnapshot(nextSnapshot: AudioEngineSnapshot): void {
    if (
      nextSnapshot.activeVoiceCount === this.snapshot.activeVoiceCount
      && nextSnapshot.state === this.snapshot.state
    ) {
      return
    }

    this.snapshot = nextSnapshot

    for (const listener of this.listeners) {
      listener()
    }
  }

  private requiredContext(): AudioContext {
    if (this.context === undefined) {
      throw new Error('Audio engine has not been initialized')
    }

    return this.context
  }

  private requiredRunningContext(): AudioContext {
    const context = this.requiredContext()

    if (context.state !== 'running') {
      throw new Error(`Audio context is ${context.state}`)
    }

    return context
  }

  private requiredMixerGraph(): MixerGraph {
    if (this.mixerGraph === undefined) {
      throw new Error('Audio engine has not been initialized')
    }

    return this.mixerGraph
  }

  private requiredWorkspace(): Workspace {
    if (this.workspace === undefined) {
      throw new Error('No workspace has been loaded')
    }

    return this.workspace
  }
}

function getAudioEngineState(
  context: AudioContext | undefined,
): AudioEngineState {
  if (context === undefined) {
    return 'uninitialized'
  }

  if (context.state === 'running' || context.state === 'closed') {
    return context.state
  }

  return 'suspended'
}

function getOscillatorType(
  instrument: MelodicInstrument,
): OscillatorType {
  if (instrument.soundId.includes('bass')) {
    return 'sawtooth'
  }

  if (instrument.soundId.includes('lead')) {
    return 'square'
  }

  return 'triangle'
}

function getDrumVoiceSettings(
  piece: DrumPiece,
): {
  durationSeconds: number
  endFrequency: number
  startFrequency: number
  type: OscillatorType
} {
  switch (piece) {
    case 'kick':
      return {
        durationSeconds: 0.22,
        endFrequency: 45,
        startFrequency: 140,
        type: 'sine',
      }
    case 'snare':
    case 'clap':
      return {
        durationSeconds: 0.12,
        endFrequency: 100,
        startFrequency: 220,
        type: 'sawtooth',
      }
    case 'closedHat':
      return {
        durationSeconds: 0.04,
        endFrequency: 5000,
        startFrequency: 9000,
        type: 'square',
      }
    case 'openHat':
    case 'crash':
    case 'ride':
      return {
        durationSeconds: 0.3,
        endFrequency: 3500,
        startFrequency: 8500,
        type: 'square',
      }
    case 'lowTom':
      return {
        durationSeconds: 0.18,
        endFrequency: 80,
        startFrequency: 150,
        type: 'sine',
      }
    case 'midTom':
      return {
        durationSeconds: 0.16,
        endFrequency: 110,
        startFrequency: 200,
        type: 'sine',
      }
    case 'highTom':
      return {
        durationSeconds: 0.14,
        endFrequency: 150,
        startFrequency: 280,
        type: 'sine',
      }
  }
}

function midiNoteToFrequency(midiNote: number): number {
  return 440 * (2 ** ((midiNote - 69) / 12))
}
