import type { PitchClass } from './constants'
import type { DurationTicks, MidiNote, Octave, Tick, Velocity } from './musicPrimitives'
import {
  isDurationTicks,
  isMidiNote,
  isPitchClass,
  isPositiveDurationTicks,
  isTick,
  isVelocity,
} from './musicPrimitives'

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

export function midiNoteFromPitchClass(pitchClass: PitchClass, octave: Octave): MidiNote {
  return createMidiNote((octave + 1) * 12 + pitchClass)
}
