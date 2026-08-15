export type EffectId = string

export const EFFECT_KINDS = [
  'eq',
  'compressor',
  'delay',
  'reverb',
] as const

export type EffectKind = typeof EFFECT_KINDS[number]

export type Effect
  = | CompressorEffect
    | DelayEffect
    | EqEffect
    | ReverbEffect

export type EqEffect = {
  kind: 'eq'
  id: EffectId
  name: string
  lowFrequencyHz: number
  lowGainDb: number
  midFrequencyHz: number
  midGainDb: number
  midQ: number
  highFrequencyHz: number
  highGainDb: number
}

export type CompressorEffect = {
  kind: 'compressor'
  id: EffectId
  name: string
  thresholdDb: number
  kneeDb: number
  ratio: number
  attackSeconds: number
  releaseSeconds: number
}

export type DelayEffect = {
  kind: 'delay'
  id: EffectId
  name: string
  delaySeconds: number
  feedback: number
  wet: number
}

export type ReverbEffect = {
  kind: 'reverb'
  id: EffectId
  name: string
  decaySeconds: number
  preDelaySeconds: number
  wet: number
}
