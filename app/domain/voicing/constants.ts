import type { Octave } from '../musicPrimitives'

export const VOICING_TYPES = ['closed', 'open', 'drop2', 'spread'] as const
export type VoicingType = typeof VOICING_TYPES[number]

export const REGISTERS = ['low', 'mid', 'high'] as const
export type Register = typeof REGISTERS[number]

export const REGISTER_BASE_OCTAVES = {
  high: 5,
  low: 2,
  mid: 4,
} as const satisfies Record<Register, Octave>
