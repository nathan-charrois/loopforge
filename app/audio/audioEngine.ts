import {
  INITIAL_MIXER_METER_SNAPSHOT,
  MixerGraph,
  type MixerMeterSnapshot,
} from './mixerGraph'
import { prepareSidechainCompressor } from './sidechainCompressor'
import { createWavetablePeriodicWave } from './wavetable'
import {
  decibelsToGain,
  type DrumInstrument,
  type DrumPiece,
  type FmInstrument,
  type Instrument,
  type InstrumentId,
  type MidiNote,
  type SubtractorInstrument,
  type ThorInstrument,
  type Velocity,
  type WavetableInstrument,
} from '~/domain'
import type { SynthAlgorithm, SynthEnvelope } from '~/domain/instrument/synth'
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

type SubtractorMonoVoice = {
  oscillators: OscillatorNode[]
  pitch: MidiNote
}

export class AudioEngine {
  private context: BaseAudioContext | undefined
  private mixerGraph: MixerGraph | undefined
  private workspace: Workspace | undefined

  private disposed = false

  private activeVoices = new Map<OscillatorNode, () => void>()
  private listeners = new Set<() => void>()
  private mixerMeterListeners = new Set<() => void>()
  private subtractorMonoVoices = new Map<InstrumentId, SubtractorMonoVoice>()
  private unsubscribeMixerMeters: (() => void) | undefined

  private snapshot = INITIAL_AUDIO_ENGINE_SNAPSHOT

  public constructor(context?: BaseAudioContext) {
    this.context = context
  }

  public getSnapshot = (): AudioEngineSnapshot => this.snapshot

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  public getMixerMeterSnapshot = (): MixerMeterSnapshot =>
    this.mixerGraph?.getMeterSnapshot() ?? INITIAL_MIXER_METER_SNAPSHOT

  public subscribeMixerMeters = (listener: () => void): (() => void) => {
    this.mixerMeterListeners.add(listener)
    this.connectMixerMeterSubscription()

    return () => {
      this.mixerMeterListeners.delete(listener)

      if (this.mixerMeterListeners.size === 0) {
        this.unsubscribeMixerMeters?.()
        this.unsubscribeMixerMeters = undefined
      }
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
    }

    if (this.mixerGraph === undefined) {
      try {
        await prepareSidechainCompressor(this.context)
      }
      catch (error) {
        if (this.workspace !== undefined && hasSidechainCompressor(this.workspace)) {
          throw new Error('Sidechain compression is not supported by this browser.', {
            cause: error,
          })
        }
      }

      this.mixerGraph = new MixerGraph(this.context)

      if (isRealtimeAudioContext(this.context)) {
        this.context.addEventListener('statechange', this.handleContextStateChange)
      }

      if (this.workspace !== undefined) {
        this.mixerGraph.loadWorkspace(this.workspace)
      }

      this.connectMixerMeterSubscription()
      this.updateSnapshot()
    }

    if (isRealtimeAudioContext(this.context) && this.context.state === 'suspended') {
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
    const context = this.requiredSchedulingContext()
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
        if (instrument.kind !== 'drum') {
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
    this.subtractorMonoVoices.clear()

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
    this.unsubscribeMixerMeters?.()
    this.unsubscribeMixerMeters = undefined
    this.mixerGraph?.dispose()

    const context = this.context

    if (context !== undefined && isRealtimeAudioContext(context)) {
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
    this.mixerMeterListeners.clear()
  }

  private handleContextStateChange = (): void => {
    this.updateSnapshot()
  }

  private connectMixerMeterSubscription(): void {
    if (
      this.mixerGraph === undefined
      || this.mixerMeterListeners.size === 0
      || this.unsubscribeMixerMeters !== undefined
    ) {
      return
    }

    this.unsubscribeMixerMeters = this.mixerGraph.subscribeMeters(() => {
      for (const listener of this.mixerMeterListeners) {
        listener()
      }
    })
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
      case 'fm':
        this.scheduleFmVoice(
          destination,
          instrument,
          pitch,
          velocity,
          whenSeconds,
          requestedDurationSeconds,
        )
        return
      case 'subtractor':
        this.scheduleSubtractorVoice(
          destination,
          instrument,
          pitch,
          velocity,
          whenSeconds,
          requestedDurationSeconds,
        )
        return
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
      case 'wavetable':
        this.scheduleWavetableVoice(
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

  private scheduleFmVoice(
    destination: GainNode,
    instrument: FmInstrument,
    pitch: MidiNote,
    velocity: Velocity,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
  ): void {
    const context = this.requiredSchedulingContext()
    const durationSeconds = Math.max(0.02, requestedDurationSeconds ?? 0.1)
    const routing = getFmOperatorRouting(instrument.algorithm, instrument.operators.length)

    const totalCarrierLevel = routing.carrierIndices.reduce(
      (total, operatorIndex) => (
        total + Math.max(0, instrument.operators[operatorIndex].level)
      ),
      0,
    )

    if (instrument.operators.length === 0 || totalCarrierLevel === 0) {
      return
    }

    const fundamentalFrequency = midiNoteToFrequency(pitch)
    const masterGain = context.createGain()

    const operatorNodes = instrument.operators.map((operator) => {
      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      const frequency = fundamentalFrequency * Math.max(0.01, operator.ratio)
      const endSeconds = this.scheduleSynthEnvelope(
        envelope.gain,
        operator.envelope,
        127,
        whenSeconds,
        durationSeconds,
      )

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, whenSeconds)
      oscillator.detune.setValueAtTime(operator.detuneCents, whenSeconds)
      oscillator.connect(envelope)

      return {
        endSeconds,
        envelope,
        frequency,
        oscillator,
        routingGains: [] as GainNode[],
      }
    })

    masterGain.gain.setValueAtTime(
      Math.max(0, Math.min(1, velocity / 127)),
      whenSeconds,
    )
    masterGain.connect(destination)

    operatorNodes.forEach((operatorNode, operatorIndex) => {
      const operator = instrument.operators[operatorIndex]

      if (routing.carrierIndices.includes(operatorIndex)) {
        const carrierGain = context.createGain()

        carrierGain.gain.setValueAtTime(
          Math.max(0, operator.level) / Math.max(1, totalCarrierLevel),
          whenSeconds,
        )
        operatorNode.envelope.connect(carrierGain)
        carrierGain.connect(masterGain)
        operatorNode.routingGains.push(carrierGain)
      }

      const modulationTarget = routing.modulationTargets[operatorIndex]

      if (modulationTarget !== undefined) {
        const modulationGain = context.createGain()

        modulationGain.gain.setValueAtTime(
          operatorNodes[modulationTarget].frequency * Math.max(0, operator.level),
          whenSeconds,
        )
        operatorNode.envelope.connect(modulationGain)
        modulationGain.connect(operatorNodes[modulationTarget].oscillator.frequency)
        operatorNode.routingGains.push(modulationGain)
      }

      if (operator.feedback > 0) {
        const feedbackGain = context.createGain()

        feedbackGain.gain.setValueAtTime(
          operatorNode.frequency * operator.feedback,
          whenSeconds,
        )
        operatorNode.envelope.connect(feedbackGain)
        feedbackGain.connect(operatorNode.oscillator.frequency)
        operatorNode.routingGains.push(feedbackGain)
      }
    })

    let remainingOperators = operatorNodes.length

    operatorNodes.forEach((operatorNode) => {
      operatorNode.oscillator.start(whenSeconds)
      operatorNode.oscillator.stop(operatorNode.endSeconds + 0.01)

      let operatorCleanedUp = false

      this.registerVoice(operatorNode.oscillator, () => {
        if (operatorCleanedUp) {
          return
        }

        operatorCleanedUp = true
        operatorNode.envelope.disconnect()

        for (const routingGain of operatorNode.routingGains) {
          routingGain.disconnect()
        }

        remainingOperators -= 1

        if (remainingOperators === 0) {
          masterGain.disconnect()
        }
      })
    })
  }

  private scheduleSubtractorVoice(
    destination: GainNode,
    instrument: SubtractorInstrument,
    pitch: MidiNote,
    velocity: Velocity,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
  ): void {
    const context = this.requiredSchedulingContext()
    const durationSeconds = Math.max(0.02, requestedDurationSeconds ?? 0.1)
    const oscillatorMix = Math.max(0, Math.min(1, instrument.oscillatorMix))
    const oscillatorLevels = [
      instrument.oscillators[0].level * (1 - oscillatorMix),
      instrument.oscillators[1].level * oscillatorMix,
    ] as const
    const totalLevel = oscillatorLevels.reduce((sum, level) => sum + Math.max(0, level), 0)

    if (totalLevel === 0) {
      return
    }

    const previousMonoVoice = instrument.mono
      ? this.subtractorMonoVoices.get(instrument.id)
      : undefined

    if (previousMonoVoice !== undefined) {
      for (const oscillator of previousMonoVoice.oscillators) {
        try {
          oscillator.stop(whenSeconds)
        }
        catch {
          // A short previous voice may already have ended.
        }
      }
    }

    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    const endSeconds = this.schedulePunchySynthEnvelope(
      envelope.gain,
      instrument.envelope,
      velocity,
      whenSeconds,
      durationSeconds,
    )

    this.scheduleSubtractorFilter(
      filter,
      instrument,
      whenSeconds,
      durationSeconds,
    )

    filter.connect(envelope)
    envelope.connect(destination)

    const monoVoice: SubtractorMonoVoice = {
      oscillators: [],
      pitch,
    }
    const levelNormalization = 1 / Math.max(1, totalLevel)
    let remainingOscillators = instrument.oscillators.length
    let sharedNodesDisconnected = false

    instrument.oscillators.forEach((oscillatorSettings, oscillatorIndex) => {
      const oscillator = context.createOscillator()
      const oscillatorGain = context.createGain()
      const oscillatorPitch = pitch
        + oscillatorSettings.octave * 12
        + oscillatorSettings.semitone
      const previousOscillatorPitch = previousMonoVoice === undefined
        ? oscillatorPitch
        : previousMonoVoice.pitch
          + oscillatorSettings.octave * 12
          + oscillatorSettings.semitone
      const glideSeconds = instrument.mono
        ? Math.min(Math.max(0, instrument.glideSeconds), durationSeconds)
        : 0

      oscillator.type = oscillatorSettings.waveform
      oscillator.frequency.setValueAtTime(
        midiNoteToFrequency(previousOscillatorPitch),
        whenSeconds,
      )

      if (glideSeconds > 0 && previousOscillatorPitch !== oscillatorPitch) {
        oscillator.frequency.exponentialRampToValueAtTime(
          midiNoteToFrequency(oscillatorPitch),
          whenSeconds + glideSeconds,
        )
      }
      else {
        oscillator.frequency.setValueAtTime(
          midiNoteToFrequency(oscillatorPitch),
          whenSeconds,
        )
      }

      oscillator.detune.setValueAtTime(
        oscillatorSettings.detuneCents,
        whenSeconds,
      )
      oscillatorGain.gain.setValueAtTime(
        Math.max(0, oscillatorLevels[oscillatorIndex]) * levelNormalization,
        whenSeconds,
      )

      oscillator.connect(oscillatorGain)
      oscillatorGain.connect(filter)
      oscillator.start(whenSeconds)
      oscillator.stop(endSeconds + 0.01)
      monoVoice.oscillators.push(oscillator)

      let oscillatorCleanedUp = false

      this.registerVoice(oscillator, () => {
        if (oscillatorCleanedUp) {
          return
        }

        oscillatorCleanedUp = true
        oscillator.disconnect()
        oscillatorGain.disconnect()
        remainingOscillators -= 1

        if (remainingOscillators === 0 && !sharedNodesDisconnected) {
          sharedNodesDisconnected = true
          filter.disconnect()
          envelope.disconnect()

          if (this.subtractorMonoVoices.get(instrument.id) === monoVoice) {
            this.subtractorMonoVoices.delete(instrument.id)
          }
        }
      })
    })

    if (instrument.mono) {
      this.subtractorMonoVoices.set(instrument.id, monoVoice)
    }
  }

  private scheduleSubtractorFilter(
    filterNode: BiquadFilterNode,
    instrument: SubtractorInstrument,
    whenSeconds: number,
    durationSeconds: number,
  ): void {
    const context = this.requiredSchedulingContext()
    const cutoffHz = Math.max(
      20,
      Math.min(context.sampleRate / 2, instrument.filter.cutoffHz),
    )
    const transientCutoffHz = Math.min(
      context.sampleRate / 2,
      cutoffHz * (1.5 + Math.max(0, instrument.filter.resonance) * 0.15),
    )
    const settleSeconds = Math.min(
      durationSeconds,
      Math.max(0.01, instrument.envelope.attack + instrument.envelope.decay),
    )

    filterNode.type = instrument.filter.type
    filterNode.Q.setValueAtTime(
      Math.max(0, instrument.filter.resonance),
      whenSeconds,
    )
    filterNode.frequency.setValueAtTime(transientCutoffHz, whenSeconds)
    filterNode.frequency.exponentialRampToValueAtTime(
      cutoffHz,
      whenSeconds + settleSeconds,
    )
  }

  private schedulePunchySynthEnvelope(
    gain: AudioParam,
    envelope: SynthEnvelope,
    velocity: Velocity,
    whenSeconds: number,
    durationSeconds: number,
  ): number {
    const minimumGain = 0.0001
    const peakGain = Math.max(minimumGain, velocity / 127)
    const sustainGain = Math.max(
      minimumGain,
      peakGain * Math.max(0, envelope.sustain),
    )
    const noteOffSeconds = whenSeconds + durationSeconds
    const attack = Math.min(Math.max(0, envelope.attack), durationSeconds)
    const attackEnd = whenSeconds + attack
    const availableDecay = Math.max(0, noteOffSeconds - attackEnd)
    const decay = Math.min(Math.max(0, envelope.decay), availableDecay)
    const decayEnd = attackEnd + decay
    const release = Math.max(0.01, envelope.release)
    const endSeconds = noteOffSeconds + release

    gain.cancelScheduledValues(whenSeconds)
    gain.setValueAtTime(minimumGain, whenSeconds)

    if (attack === 0) {
      gain.setValueAtTime(peakGain, whenSeconds)
    }
    else {
      gain.exponentialRampToValueAtTime(peakGain, attackEnd)
    }

    if (decay > 0) {
      gain.exponentialRampToValueAtTime(sustainGain, decayEnd)
    }

    if (noteOffSeconds > decayEnd) {
      gain.setValueAtTime(decay > 0 ? sustainGain : peakGain, noteOffSeconds)
    }

    gain.exponentialRampToValueAtTime(minimumGain, endSeconds)
    gain.setValueAtTime(0, endSeconds)

    return endSeconds
  }

  private scheduleThorVoice(
    destination: GainNode,
    instrument: ThorInstrument,
    pitch: MidiNote,
    velocity: Velocity,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
  ): void {
    const context = this.requiredSchedulingContext()
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

  private scheduleWavetableVoice(
    destination: GainNode,
    instrument: WavetableInstrument,
    pitch: MidiNote,
    velocity: Velocity,
    whenSeconds: number,
    requestedDurationSeconds: number | undefined,
  ): void {
    const context = this.requiredSchedulingContext()
    const durationSeconds = Math.max(0.02, requestedDurationSeconds ?? 0.1)
    const unison = Math.max(1, Math.min(8, Math.round(instrument.unison)))
    const filter = context.createBiquadFilter()
    const envelope = context.createGain()
    const periodicWave = createWavetablePeriodicWave(
      context,
      instrument.wavetableId,
      instrument.position,
    )
    const endSeconds = this.scheduleSynthEnvelope(
      envelope.gain,
      instrument.envelope,
      velocity,
      whenSeconds,
      durationSeconds,
    )

    filter.type = instrument.filter.type
    filter.frequency.setValueAtTime(
      Math.max(20, Math.min(context.sampleRate / 2, instrument.filter.cutoffHz)),
      whenSeconds,
    )
    filter.Q.setValueAtTime(
      Math.max(0, instrument.filter.resonance),
      whenSeconds,
    )
    filter.connect(envelope)
    envelope.connect(destination)

    let remainingOscillators = unison

    for (let oscillatorIndex = 0; oscillatorIndex < unison; oscillatorIndex += 1) {
      const oscillator = context.createOscillator()
      const oscillatorGain = context.createGain()
      const detunePosition = unison === 1
        ? 0
        : (oscillatorIndex / (unison - 1)) * 2 - 1

      oscillator.setPeriodicWave(periodicWave)
      oscillator.frequency.setValueAtTime(midiNoteToFrequency(pitch), whenSeconds)
      oscillator.detune.setValueAtTime(
        detunePosition * Math.max(0, instrument.detuneCents),
        whenSeconds,
      )
      oscillatorGain.gain.setValueAtTime(1 / unison, whenSeconds)
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
        oscillatorGain.disconnect()
        remainingOscillators -= 1

        if (remainingOscillators === 0) {
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
    const context = this.requiredSchedulingContext()
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

  private requiredContext(): BaseAudioContext {
    if (this.context === undefined) {
      throw new Error('Audio engine has not been initialized')
    }

    return this.context
  }

  private requiredSchedulingContext(): BaseAudioContext {
    const context = this.requiredContext()

    if (isRealtimeAudioContext(context) && context.state !== 'running') {
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
  context: BaseAudioContext | undefined,
): AudioEngineState {
  if (context === undefined) {
    return 'uninitialized'
  }

  if (context.state === 'running' || context.state === 'closed') {
    return context.state
  }

  return 'suspended'
}

function isRealtimeAudioContext(
  context: BaseAudioContext,
): context is AudioContext {
  return typeof AudioContext !== 'undefined' && context instanceof AudioContext
}

function hasSidechainCompressor(workspace: Workspace): boolean {
  return workspace.effects.allIds.some((effectId) => {
    const effect = workspace.effects.byId[effectId]

    return effect?.kind === 'compressor'
      && effect.sidechainSourceMixChannelId !== undefined
  })
}

function getFmOperatorRouting(
  algorithm: SynthAlgorithm,
  operatorCount: number,
): {
  carrierIndices: number[]
  modulationTargets: Array<number | undefined>
} {
  const operatorIndices = Array.from(
    { length: operatorCount },
    (_value, index) => index,
  )

  switch (algorithm) {
    case 'parallel':
      return {
        carrierIndices: operatorIndices,
        modulationTargets: operatorIndices.map(() => undefined),
      }
    case 'threeToOne':
      return {
        carrierIndices: operatorCount === 0 ? [] : [0],
        modulationTargets: operatorIndices.map(index => index === 0 ? undefined : 0),
      }
    case 'twoStacks':
      return {
        carrierIndices: operatorIndices.filter(index => index % 2 === 0),
        modulationTargets: operatorIndices.map(index => (
          index % 2 === 0 ? undefined : index - 1
        )),
      }
    case 'serial':
      return {
        carrierIndices: operatorCount === 0 ? [] : [0],
        modulationTargets: operatorIndices.map(index => (
          index === 0 ? undefined : index - 1
        )),
      }
  }
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
