import type { EffectId } from '../effect'
import { type Track } from '../tracks'
import type {
  DrumInstrument,
  DrumPieces,
  DrumPieceSound,
  Instrument,
  InstrumentId,
  InstrumentSoundId,
  SubtractorInstrument,
  ThorInstrument,
} from './instrument'
import type { SynthEnvelope, SynthFilter, SynthOscillator } from './synth'

export function createInstrument({
  id,
  track,
}: {
  id: InstrumentId
  track: Track
}): Instrument {
  const name = `${track.name} Instrument`

  if (track.role === 'drums') {
    return createDrumInstrument({
      id,
      name,
    })
  }

  return createThorInstrument({
    id,
    name,
    soundId: track.role,
  })
}

export function createSynthOscillator(
  input: Partial<SynthOscillator> = {},
): SynthOscillator {
  return {
    detuneCents: input.detuneCents ?? 0,
    level: input.level ?? 1,
    octave: input.octave ?? 0,
    semitone: input.semitone ?? 0,
    waveform: input.waveform ?? 'sine',
  }
}

export function createSynthEnvelope(
  input: Partial<SynthEnvelope> = {},
): SynthEnvelope {
  return {
    attack: input.attack ?? 0,
    decay: input.decay ?? 0,
    sustain: input.sustain ?? 0,
    release: input.release ?? 0,
  }
}

export function createSynthFilter(
  input: Partial<SynthFilter> = {},
): SynthFilter {
  return {
    type: input.type ?? 'lowpass',
    cutoffHz: input.cutoffHz ?? 2000,
    resonance: input.resonance ?? 10,
  }
}

export function createThorInstrument(input: {
  id: InstrumentId
  soundId?: InstrumentSoundId
  name: string
  effectIds?: EffectId[]
  oscillators?: SynthOscillator[]
  filter?: SynthFilter
  envelope?: SynthEnvelope
}): ThorInstrument {
  return {
    ...input,
    id: input.id,
    soundId: input.soundId ?? 'default',
    effectIds: input.effectIds ?? [],
    kind: 'thor',
    oscillators: input.oscillators ?? [createSynthOscillator()],
    filter: createSynthFilter(input.filter),
    envelope: createSynthEnvelope(input.envelope),
  }
}

export function createSubtractorInstrument(input: {
  id: InstrumentId
  soundId?: InstrumentSoundId
  name: string
  effectIds?: EffectId[]
  oscillators?: [SynthOscillator, SynthOscillator]
  oscillatorMix?: number
  filter?: SynthFilter
  envelope?: SynthEnvelope
  glideSeconds?: number
  mono?: boolean
}): SubtractorInstrument {
  return {
    effectIds: input.effectIds ?? [],
    envelope: input.envelope ?? {
      attack: 0.005,
      decay: 0.2,
      release: 0.15,
      sustain: 0.65,
    },
    filter: input.filter ?? {
      cutoffHz: 1200,
      resonance: 4,
      type: 'lowpass',
    },
    glideSeconds: Math.max(0, input.glideSeconds ?? 0),
    id: input.id,
    soundId: input.soundId ?? 'default',
    kind: 'subtractor',
    mono: input.mono ?? false,
    name: input.name.trim(),
    oscillatorMix: Math.max(0, Math.min(1, input.oscillatorMix ?? 0.5)),
    oscillators: input.oscillators ?? [
      createSynthOscillator({ waveform: 'sawtooth' }),
      createSynthOscillator({ detuneCents: 7, waveform: 'square' }),
    ],
  }
}

export function createDrumInstrument(input: {
  id: InstrumentId
  name: string
  effectIds?: EffectId[]
  pieces?: Partial<DrumPieces>
}): DrumInstrument {
  return {
    id: input.id,
    effectIds: input.effectIds ?? [],
    kind: 'drum',
    name: input.name,
    pieces: input.pieces ?? {},
  }
}

export function createDrumPieceSound(input: {
  durationSeconds?: number
  soundId: InstrumentSoundId
  pitchSemitones?: number
  volumeDb?: number
}): DrumPieceSound {
  return {
    durationSeconds: input.durationSeconds,
    pitchSemitones: input.pitchSemitones ?? 0,
    soundId: input.soundId,
    volumeDb: input.volumeDb ?? 0,
  }
}

export function createInstrumentIdForTrack(trackId: string): InstrumentId {
  return `instrument_${trackId}`
}
