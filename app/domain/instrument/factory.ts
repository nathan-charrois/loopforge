import type {
  DrumInstrument,
  DrumPieces,
  DrumPieceSound,
  InstrumentId,
  InstrumentSoundId,
  ThorInstrument,
} from './instrument'
import type { SynthEnvelope, SynthFilter, SynthOscillator } from './synth'

export function createThorInstrument(input: {
  id: InstrumentId
  name: string
  soundId: InstrumentSoundId
  oscilators?: SynthOscillator[]
  filter?: SynthFilter
  envelope?: SynthEnvelope
}): ThorInstrument {
  return {
    ...input,
    kind: 'thor',
    oscillators: input.oscilators ?? [
      {
        waveform: 'sine',
        octave: 0,
        semitone: 0,
        detuneCents: 0,
        level: 1,
      },
    ],
    filter: input.filter ?? {
      type: 'lowpass',
      cutoffHz: 2000,
      resonance: 10,
    },
    envelope: input.envelope ?? {
      attack: 0,
      decay: 0,
      sustain: 0,
      release: 0,
    },
  }
}

export function createDrumInstrument(input: {
  id: InstrumentId
  name: string
  pieces?: Partial<DrumPieces>
}): DrumInstrument {
  return {
    id: input.id,
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
