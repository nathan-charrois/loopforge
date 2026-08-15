import type { EffectId } from '../effect'
import type { DrumPiece } from './constants'
import type { SynthEnvelope, SynthFilter, SynthOscillator } from './synth'

export type InstrumentId = string
export type InstrumentSoundId = string

export type Instrument
  = | DrumInstrument
    | SubtractorInstrument
    | ThorInstrument

export type SubtractorInstrument = {
  kind: 'subtractor'
  id: InstrumentId
  name: string
  effectIds: EffectId[]
  oscillators: [
    SynthOscillator,
    SynthOscillator,
  ]
  oscillatorMix: number
  filter: SynthFilter
  envelope: SynthEnvelope
  glideSeconds: number
  mono: boolean
}

export type ThorInstrument = {
  kind: 'thor'
  id: InstrumentId
  name: string
  effectIds: EffectId[]
  soundId: InstrumentSoundId
  oscillators: SynthOscillator[]
  filter: SynthFilter
  envelope: SynthEnvelope
}

export type DrumInstrument = {
  kind: 'drum'
  id: InstrumentId
  name: string
  effectIds: EffectId[]
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
