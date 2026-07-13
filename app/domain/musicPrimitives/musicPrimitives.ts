import {
  MAX_MIDI_NOTE,
  MAX_VELOCITY,
  MIN_MIDI_NOTE,
  MIN_VELOCITY,
  NOTE_NAME_TO_PITCH_CLASS,
  type NoteName,
  type PitchClass,
} from './constants'

export type Tick = number

export type DurationTicks = number

export type MidiNote = number
export type Octave = number
export type Interval = number
export type Velocity = number

export function isInteger(value: number): boolean {
  return Number.isInteger(value)
}

export function isTick(value: number): value is Tick {
  return isInteger(value) && value >= 0
}

export function isTickInRange(leftStart: Tick, leftEnd: Tick, rightStart: Tick, rightEnd: Tick): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
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

export function clampVelocity(value: number): Velocity {
  return Math.min(MAX_VELOCITY, Math.max(MIN_VELOCITY, Math.round(value)))
}

export function normalizePitchClass(value: number): PitchClass {
  return (((Math.round(value) % 12) + 12) % 12) as PitchClass
}

export function transposePitchClass(pitchClass: PitchClass, interval: Interval): PitchClass {
  return normalizePitchClass(pitchClass + interval)
}

export function pitchClassFromMidiNote(midiNote: MidiNote): PitchClass {
  return normalizePitchClass(midiNote)
}

export function getOctaveForMidiNote(midiNote: MidiNote): Octave {
  return Math.floor(midiNote / 12) - 1
}
