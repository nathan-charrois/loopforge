import { MixerGraph } from './mixerGraph'
import {
  decibelsToGain,
  type DrumInstrument,
  type DrumPiece,
  type Instrument,
  type MidiNote,
  type ThorInstrument,
  type Velocity,
} from '~/domain'
import type { SynthEnvelope } from '~/domain/instrument/synth'
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
    const mixerGraph = this.requiredMixerGraph()

    const track = selectTrack(workspace, input.trigger.source.trackId)
    if (track === undefined) {
      return
    }
    const instrument = selectInstrument(workspace, track.instrumentId)
    if (instrument === undefined) {
      return
    }

    const destination = mixerGraph.getChannelInput(input.trigger.source.mixChannelId)
    if (destination === undefined) {
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
        if (instrument.kind === 'thor') {
          this.scheduleInstrumentNoteVoice(
            destination,
            instrument,
            input.trigger.pitch,
            input.trigger.velocity,
            whenSeconds,
            input.durationSeconds,
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

  private scheduleInstrumentNoteVoice(
    destination: GainNode,
    instrument: Instrument,
    pitch: MidiNote,
    velocity: Velocity,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
  ): void {
    switch (instrument.kind) {
      case 'thor':
        this.scheduleThorVoice(
          destination,
          instrument,
          pitch,
          velocity,
          whenSeconds,
          requestedDurationSeconds,
        )
        return
    }
  }

  private scheduleThorVoice(
    destination: GainNode,
    instrument: ThorInstrument,
    pitch: MidiNote,
    velocity: Velocity,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
  ): void {
    const context = this.requiredRunningContext()
    const durationSeconds = Math.max(0.02, requestedDurationSeconds ?? 0.1)

    const oscillators = instrument.oscillators.filter(
      oscillator => oscillator.level > 0,
    )

    if (oscillators.length === 0) {
      return
    }

    const filter = context.createBiquadFilter()
    const envelope = context.createGain()

    filter.type = instrument.filter.type
    filter.frequency.setValueAtTime(instrument.filter.cutoffHz, whenSeconds)
    filter.Q.setValueAtTime(instrument.filter.resonance, whenSeconds)

    const endSeconds = this.scheduleSynthEnvelope(
      envelope.gain,
      instrument.envelope,
      velocity,
      whenSeconds,
      durationSeconds,
    )

    filter.connect(envelope)
    envelope.connect(destination)

    const totalLevel = oscillators.reduce((sum, oscillator) => sum + oscillator.level, 0)

    const levelNormalization = 1 / Math.max(1, totalLevel)
    let remainingOscillators = oscillators.length
    let sharedNodesDisconnected = false

    for (const oscillatorSettings of oscillators) {
      const oscillator = context.createOscillator()
      const oscillatorGain = context.createGain()

      const oscillatorPitch = pitch
        + oscillatorSettings.octave * 12
        + oscillatorSettings.semitone

      oscillator.type = oscillatorSettings.waveform
      oscillator.frequency.setValueAtTime(
        midiNoteToFrequency(oscillatorPitch),
        whenSeconds,
      )
      oscillator.detune.setValueAtTime(
        oscillatorSettings.detuneCents,
        whenSeconds,
      )

      oscillatorGain.gain.setValueAtTime(
        oscillatorSettings.level * levelNormalization,
        whenSeconds,
      )

      oscillator.connect(oscillatorGain)
      oscillatorGain.connect(filter)

      oscillator.start(whenSeconds)
      oscillator.stop(endSeconds + 0.01)

      let oscillatorCleanedUp = false

      this.registerVoice(oscillator, () => {
        if (oscillatorCleanedUp) {
          return
        }

        oscillatorCleanedUp = true
        oscillator.disconnect()
        oscillatorGain.disconnect()
        remainingOscillators -= 1

        if (
          remainingOscillators === 0
          && !sharedNodesDisconnected
        ) {
          sharedNodesDisconnected = true
          filter.disconnect()
          envelope.disconnect()
        }
      })
    }
  }

  private scheduleSynthEnvelope(
    gain: AudioParam,
    envelope: SynthEnvelope,
    velocity: Velocity,
    whenSeconds: number,
    durationSeconds: number,
  ): number {
    const peakGain = Math.max(0, velocity / 127)
    const sustainGain = peakGain * Math.max(0, envelope.sustain)
    const noteOffSeconds = whenSeconds + durationSeconds
    const attack = Math.min(Math.max(0, envelope.attack), durationSeconds)
    const attackEnd = whenSeconds + attack
    const availableDecay = Math.max(0, noteOffSeconds - attackEnd)
    const decay = Math.min(Math.max(0, envelope.decay), availableDecay)
    const decayEnd = attackEnd + decay
    const release = Math.max(0.01, envelope.release)
    const endSeconds = noteOffSeconds + release

    gain.cancelScheduledValues(whenSeconds)
    gain.setValueAtTime(0, whenSeconds)

    if (attack === 0) {
      gain.setValueAtTime(peakGain, whenSeconds)
    }
    else {
      gain.linearRampToValueAtTime(
        peakGain,
        attackEnd,
      )
    }

    if (decay > 0) {
      gain.linearRampToValueAtTime(
        sustainGain,
        decayEnd,
      )
    }

    if (noteOffSeconds > decayEnd) {
      gain.setValueAtTime(
        decay > 0 ? sustainGain : peakGain,
        noteOffSeconds,
      )
    }

    gain.linearRampToValueAtTime(0, endSeconds)

    return endSeconds
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
    const durationSeconds = Math.max(
      0.02,
      sound?.durationSeconds ?? drum.durationSeconds,
    )
    const endSeconds = whenSeconds + durationSeconds
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
