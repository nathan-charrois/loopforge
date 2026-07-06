import { createDefaultKey, type Key } from '../harmony'
import { createTick, type Tick } from '../musicPrimitives'
import { PPQ } from './constants'
import {
  type BeatsPerMinute,
  isValidTimeSignature,
  type KeyEvent,
  type MeterEvent,
  type TempoEvent,
  type Timeline,
  type TimelineEvent,
  type TimeSignature,
} from './timeline'

export function createDefaultTimeline(): Timeline {
  return createTimeline()
}

export function createTimeline(input: Partial<Timeline> = {}): Timeline {
  return {
    grid: input.grid ?? 'sixteenthNote',
    keyEvents: sortEventsByTick(input.keyEvents ?? [createKeyEvent({ key: createDefaultKey(), tick: 0 })]),
    meterEvents: sortEventsByTick(input.meterEvents ?? [createMeterEvent({ tick: 0 })]),
    ppq: input.ppq ?? PPQ,
    tempoEvents: sortEventsByTick(input.tempoEvents ?? [createTempoEvent({ bpm: 120, tick: 0 })]),
  }
}

export function createTempoEvent(input: { tick?: Tick, bpm: BeatsPerMinute }): TempoEvent {
  if (input.bpm <= 0) {
    throw new RangeError(`BPM must be greater than 0. Received ${input.bpm}.`)
  }

  return {
    bpm: input.bpm,
    tick: createTick(input.tick ?? 0),
  }
}

export function createMeterEvent(input: {
  tick?: Tick
  timeSignature?: TimeSignature
}): MeterEvent {
  const timeSignature = input.timeSignature ?? { denominator: 4, numerator: 4 }

  if (!isValidTimeSignature(timeSignature)) {
    throw new RangeError(`Invalid time signature ${timeSignature.numerator}/${timeSignature.denominator}.`)
  }

  return {
    tick: createTick(input.tick ?? 0),
    timeSignature,
  }
}

export function createKeyEvent(input: { tick?: Tick, key: Key }): KeyEvent {
  return {
    key: input.key,
    tick: createTick(input.tick ?? 0),
  }
}

function sortEventsByTick<TEvent extends TimelineEvent>(events: readonly TEvent[]): TEvent[] {
  return [...events].sort((left, right) => left.tick - right.tick)
}
