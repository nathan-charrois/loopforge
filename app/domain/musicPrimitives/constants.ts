export const MIN_MIDI_NOTE = 0
export const MAX_MIDI_NOTE = 127
export const MIN_VELOCITY = 0
export const MAX_VELOCITY = 127
export const DEFAULT_VELOCITY = 96

export const PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type PitchClass = typeof PITCH_CLASSES[number]

export const NOTE_NAME_TO_PITCH_CLASS = {
  'C': 0,
  'C#': 1,
  'Db': 1,
  'D': 2,
  'D#': 3,
  'Eb': 3,
  'E': 4,
  'F': 5,
  'F#': 6,
  'Gb': 6,
  'G': 7,
  'G#': 8,
  'Ab': 8,
  'A': 9,
  'A#': 10,
  'Bb': 10,
  'B': 11,
} as const satisfies Record<string, PitchClass>

export type NoteName = keyof typeof NOTE_NAME_TO_PITCH_CLASS

export const NOTE_NAMES = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
] as const satisfies readonly NoteName[]

export const PITCH_CLASS_TO_NOTE_NAME = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const satisfies readonly NoteName[]
