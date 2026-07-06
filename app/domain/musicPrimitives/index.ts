export type Tick = number
export type DurationTicks = number
export type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
export type MidiNote = number
export type Octave = number
export type Interval = number
export type Velocity = number

export const MIN_MIDI_NOTE = 0
export const MAX_MIDI_NOTE = 127
export const MIN_VELOCITY = 0
export const MAX_VELOCITY = 127
export const DEFAULT_VELOCITY = 96

export const PITCH_CLASSES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const

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

export function isInteger(value: number): boolean {
  return Number.isInteger(value)
}

export function isTick(value: number): value is Tick {
  return isInteger(value) && value >= 0
}

export function isDurationTicks(value: number): value is DurationTicks {
  return isInteger(value) && value >= 0
}

export function isPositiveDurationTicks(value: number): value is DurationTicks {
  return isDurationTicks(value) && value > 0
}

export function isPitchClass(value: number): value is PitchClass {
  return isInteger(value) && value >= 0 && value <= 11
}

export function isMidiNote(value: number): value is MidiNote {
  return isInteger(value) && value >= MIN_MIDI_NOTE && value <= MAX_MIDI_NOTE
}

export function isVelocity(value: number): value is Velocity {
  return isInteger(value) && value >= MIN_VELOCITY && value <= MAX_VELOCITY
}

export function isNoteName(value: string): value is NoteName {
  return Object.prototype.hasOwnProperty.call(NOTE_NAME_TO_PITCH_CLASS, value)
}

export function createTick(value: number): Tick {
  if (!isTick(value)) {
    throw new RangeError(`Tick must be a non-negative integer. Received ${value}.`)
  }

  return value
}

export function createDurationTicks(value: number): DurationTicks {
  if (!isDurationTicks(value)) {
    throw new RangeError(`Duration ticks must be a non-negative integer. Received ${value}.`)
  }

  return value
}

export function createPositiveDurationTicks(value: number): DurationTicks {
  if (!isPositiveDurationTicks(value)) {
    throw new RangeError(`Duration ticks must be a positive integer. Received ${value}.`)
  }

  return value
}

export function createPitchClass(value: number): PitchClass {
  if (!isPitchClass(value)) {
    throw new RangeError(`Pitch class must be an integer from 0 to 11. Received ${value}.`)
  }

  return value
}

export function createMidiNote(value: number): MidiNote {
  if (!isMidiNote(value)) {
    throw new RangeError(`MIDI note must be an integer from 0 to 127. Received ${value}.`)
  }

  return value
}

export function createVelocity(value: number): Velocity {
  if (!isVelocity(value)) {
    throw new RangeError(`Velocity must be an integer from 0 to 127. Received ${value}.`)
  }

  return value
}

export function clampVelocity(value: number): Velocity {
  return Math.min(MAX_VELOCITY, Math.max(MIN_VELOCITY, Math.round(value)))
}

export function normalizePitchClass(value: number): PitchClass {
  return (((Math.round(value) % 12) + 12) % 12) as PitchClass
}

export function transposePitchClass(pitchClass: PitchClass, interval: Interval): PitchClass {
  return normalizePitchClass(pitchClass + interval)
}

export function getPitchClassForNoteName(noteName: NoteName): PitchClass {
  return NOTE_NAME_TO_PITCH_CLASS[noteName]
}

export function getNoteNameForPitchClass(pitchClass: PitchClass): NoteName {
  return PITCH_CLASS_TO_NOTE_NAME[pitchClass]
}

export function pitchClassFromMidiNote(midiNote: MidiNote): PitchClass {
  return normalizePitchClass(midiNote)
}

export function getOctaveForMidiNote(midiNote: MidiNote): Octave {
  return Math.floor(midiNote / 12) - 1
}

export function midiNoteFromPitchClass(pitchClass: PitchClass, octave: Octave): MidiNote {
  return createMidiNote((octave + 1) * 12 + pitchClass)
}
