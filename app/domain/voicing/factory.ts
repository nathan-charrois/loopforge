import type { ChordVoicing } from './voicing'

export function createDefaultChordVoicing(input: Partial<ChordVoicing> = {}): ChordVoicing {
  return {
    inversion: input.inversion ?? 0,
    bassNote: input.bassNote,
    octave: input.octave,
    register: input.register ?? 'mid',
    spread: input.spread ?? 0,
    type: input.type ?? 'closed',
  }
}
