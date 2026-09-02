import type { EffectId } from '../effect'
import type { DrumPiece, INSTRUMENT_KINDS } from './constants'
import type { SynthAlgorithm, SynthEnvelope, SynthFilter, SynthOperator, SynthOscillator } from './synth'

export type InstrumentId = string
export type InstrumentSoundId = string

export type Instrument
  = | DrumInstrument
    | SubtractorInstrument
    | ThorInstrument
    | FmInstrument
    | WavetableInstrument

export type InstrumentKind = typeof INSTRUMENT_KINDS[number]

export type SubtractorInstrument = {
  kind: 'subtractor'
  id: InstrumentId
  soundId: InstrumentSoundId
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
  soundId: InstrumentSoundId
  name: string
  effectIds: EffectId[]
  oscillators: SynthOscillator[]
  filter: SynthFilter
  envelope: SynthEnvelope
}

export type FmInstrument = {
  kind: 'fm'
  id: InstrumentId
  name: string
  effectIds: EffectId[]
  algorithm: SynthAlgorithm
  operators: SynthOperator[]
}

export type WavetableInstrument = {
  kind: 'wavetable'
  id: InstrumentId
  name: string
  effectIds: EffectId[]
  wavetableId: string
  position: number
  unison: number
  detuneCents: number
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
  soundId: InstrumentSoundId
  durationSeconds?: number
  volumeDb: number
  pitchSemitones: number
}
