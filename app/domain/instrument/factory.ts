import type {
  DrumInstrument,
  DrumPieceSound,
  InstrumentId,
  InstrumentSoundId,
  MelodicInstrument,
} from './instrument'

export function createMelodicInstrument(input: {
  id: InstrumentId
  name: string
  soundId: InstrumentSoundId
}): MelodicInstrument {
  return {
    ...input,
    kind: 'melodic',
  }
}

export function createDrumInstrument(input: {
  id: InstrumentId
  name: string
  pieces?: DrumInstrument['pieces']
}): DrumInstrument {
  return {
    id: input.id,
    kind: 'drum',
    name: input.name,
    pieces: input.pieces ?? {},
  }
}

export function createDrumPieceSound(input: {
  soundId: InstrumentSoundId
  pitchSemitones?: number
  volumeDb?: number
}): DrumPieceSound {
  return {
    pitchSemitones: input.pitchSemitones ?? 0,
    soundId: input.soundId,
    volumeDb: input.volumeDb ?? 0,
  }
}
