import type { Octave } from '../musicPrimitives'

export const VOICING_TYPES = ['closed', 'open', 'drop2', 'spread'] as const
export type VoicingType = typeof VOICING_TYPES[number]

export const REGISTERS = ['low', 'mid', 'high'] as const
export type Register = typeof REGISTERS[number]

export const DEFAULT_VOICING_OCTAVE: Octave = 4

export const REGISTER_SEMITONE_OFFSETS = {
  high: 5,
  low: -5,
  mid: 0,
} as const satisfies Record<Register, number>
