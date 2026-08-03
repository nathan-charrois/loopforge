import type { DrumPiece } from './constants'
import type { SynthEnvelope, SynthFilter, SynthOscillator } from './synth'

export type InstrumentId = string
export type InstrumentSoundId = string

export type Instrument
  = | DrumInstrument
    | ThorInstrument

export type ThorInstrument = {
  kind: 'thor'
  id: InstrumentId
  name: string
  soundId: InstrumentSoundId
  oscillators: SynthOscillator[]
  filter: SynthFilter
  envelope: SynthEnvelope
}

export type DrumInstrument = {
  kind: 'drum'
  id: InstrumentId
  name: string
  pieces: Partial<DrumPieces>
}

export type DrumPieces = Record<
  DrumPiece,
  DrumPieceSound
>

export type DrumPieceSound = {
  durationSeconds?: number
  soundId: InstrumentSoundId
  volumeDb: number
  pitchSemitones: number
}
