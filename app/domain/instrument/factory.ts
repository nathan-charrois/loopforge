import { type Track } from '../tracks'
import type {
  DrumInstrument,
  DrumPieces,
  DrumPieceSound,
  Instrument,
  InstrumentId,
  InstrumentSoundId,
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
    oscillators: input.oscilators ?? [createSynthOscillator()],
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

export function createInstrumentIdForTrack(trackId: string): InstrumentId {
  return `instrument_${trackId}`
}
