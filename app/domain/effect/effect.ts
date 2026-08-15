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
  enabled: boolean
  kind: 'eq'
  id: EffectId
  name: string
  lowShelfFrequencyHz: number
  lowShelfGainDb: number
  lowShelfQ: number
  param1FrequencyHz: number
  param1GainDb: number
  param1Q: number
  param2FrequencyHz: number
  param2GainDb: number
  param2Q: number
  highShelfFrequencyHz: number
  highShelfGainDb: number
  highShelfQ: number
}

export type CompressorEffect = {
  enabled: boolean
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
  enabled: boolean
  kind: 'delay'
  id: EffectId
  name: string
  delaySeconds: number
  feedback: number
  wet: number
}

export type ReverbEffect = {
  enabled: boolean
  kind: 'reverb'
  id: EffectId
  name: string
  decaySeconds: number
  preDelaySeconds: number
  wet: number
}
