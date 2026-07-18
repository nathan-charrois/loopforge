import type { DrumPiece } from './constants'

export type InstrumentId = string
export type InstrumentSoundId = string

export type Instrument
  = | DrumInstrument
    | MelodicInstrument

export type MelodicInstrument = {
  id: InstrumentId
  kind: 'melodic'
  name: string
  soundId: InstrumentSoundId
}

export type DrumInstrument = {
  id: InstrumentId
  kind: 'drum'
  name: string
  pieces: Partial<Record<DrumPiece, DrumPieceSound>>
}

export type DrumPieceSound = {
  soundId: InstrumentSoundId
  volumeDb: number
  pitchSemitones: number
}
