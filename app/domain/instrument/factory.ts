import type { EffectId } from '../effect'
import { type Track } from '../tracks'
import type {
  DrumInstrument,
  DrumPieces,
  DrumPieceSound,
  FmInstrument,
  Instrument,
  InstrumentId,
  InstrumentSoundId,
  SubtractorInstrument,
  ThorInstrument,
  WavetableInstrument,
} from './instrument'
import type {
  SynthAlgorithm,
  SynthEnvelope,
  SynthFilter,
  SynthOperator,
  SynthOscillator,
} from './synth'

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

export function createSynthOperator(input: {
  envelope?: Partial<SynthEnvelope>
  detuneCents?: number
  feedback?: number
  level?: number
  ratio?: number
} = {}): SynthOperator {
  return {
    detuneCents: input.detuneCents ?? 0,
    envelope: createSynthEnvelope(input.envelope ?? {
      attack: 0.01,
      decay: 0.25,
      release: 0.2,
      sustain: 0.65,
    }),
    feedback: Math.max(0, input.feedback ?? 0),
    level: Math.max(0, input.level ?? 1),
    ratio: Math.max(0.01, input.ratio ?? 1),
  }
}

export function createFmInstrument(input: {
  id: InstrumentId
  name: string
  effectIds?: EffectId[]
  algorithm?: SynthAlgorithm
  operators?: SynthOperator[]
}): FmInstrument {
  return {
    algorithm: input.algorithm ?? 'serial',
    effectIds: input.effectIds ?? [],
    id: input.id,
    kind: 'fm',
    name: input.name.trim(),
    operators: (input.operators ?? [
      createSynthOperator(),
      createSynthOperator({
        envelope: { attack: 0.005, decay: 0.3, release: 0.15, sustain: 0.2 },
        level: 1.5,
        ratio: 2,
      }),
      createSynthOperator({
        envelope: { attack: 0.005, decay: 0.2, release: 0.1, sustain: 0.1 },
        level: 0.75,
        ratio: 3,
      }),
      createSynthOperator({
        envelope: { attack: 0.005, decay: 0.15, release: 0.08, sustain: 0 },
        level: 0.4,
        ratio: 4,
      }),
    ]).map(createSynthOperator),
  }
}

export function createWavetableInstrument(input: {
  id: InstrumentId
  name: string
  effectIds?: EffectId[]
  wavetableId?: string
  position?: number
  unison?: number
  detuneCents?: number
  filter?: SynthFilter
  envelope?: SynthEnvelope
}): WavetableInstrument {
  return {
    detuneCents: Math.max(0, input.detuneCents ?? 12),
    effectIds: input.effectIds ?? [],
    envelope: createSynthEnvelope(input.envelope ?? {
      attack: 0.01,
      decay: 0.2,
      release: 0.2,
      sustain: 0.7,
    }),
    filter: createSynthFilter(input.filter ?? {
      cutoffHz: 4000,
      resonance: 1,
      type: 'lowpass',
    }),
    id: input.id,
    kind: 'wavetable',
    name: input.name.trim(),
    position: Math.max(0, Math.min(1, input.position ?? 0)),
    unison: Math.max(1, Math.min(8, Math.round(input.unison ?? 1))),
    wavetableId: input.wavetableId ?? 'basic',
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
