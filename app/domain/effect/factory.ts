import type { Effect, EffectId, EffectKind } from './effect'

export function createEffect(input: {
  enabled?: boolean
  id: EffectId
  kind: EffectKind
  name: string
}): Effect {
  switch (input.kind) {
    case 'eq':
      return {
        enabled: input.enabled ?? true,
        highFrequencyHz: 8000,
        highGainDb: 0,
        id: input.id,
        kind: 'eq',
        lowFrequencyHz: 200,
        lowGainDb: 0,
        midFrequencyHz: 1000,
        midGainDb: 0,
        midQ: 1,
        name: input.name,
      }
    case 'compressor':
      return {
        attackSeconds: 0.003,
        enabled: input.enabled ?? true,
        id: input.id,
        kneeDb: 30,
        kind: 'compressor',
        name: input.name,
        ratio: 12,
        releaseSeconds: 0.25,
        thresholdDb: -24,
      }
    case 'delay':
      return {
        delaySeconds: 0.25,
        enabled: input.enabled ?? true,
        feedback: 0.35,
        id: input.id,
        kind: 'delay',
        name: input.name,
        wet: 0.25,
      }
    case 'reverb':
      return {
        decaySeconds: 1.5,
        enabled: input.enabled ?? true,
        id: input.id,
        kind: 'reverb',
        name: input.name,
        preDelaySeconds: 0.02,
        wet: 0.25,
      }
  }
}
