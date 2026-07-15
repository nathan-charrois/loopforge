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
  type TimelineEventId,
  type TimeSignature,
} from './timeline'

export function createDefaultTimeline(): Timeline {
  return createTimeline()
}

export function createTimeline(input: Partial<Timeline> = {}): Timeline {
  return {
    grid: input.grid ?? 'sixteenthNote',
    keyEvents: input.keyEvents ?? [createKeyEvent({ key: createDefaultKey(), tick: 0 })],
    meterEvents: input.meterEvents ?? [createMeterEvent({ tick: 0 })],
    ppq: input.ppq ?? PPQ,
    tempoEvents: input.tempoEvents ?? [createTempoEvent({ bpm: 120, tick: 0 })],
  }
}

export function createTempoEvent(input: {
  id?: TimelineEventId
  tick?: Tick
  bpm: BeatsPerMinute
}): TempoEvent {
  if (input.bpm <= 0) {
    throw new RangeError(`BPM must be greater than 0. Received ${input.bpm}.`)
  }

  const tick = createTick(input.tick ?? 0)

  return {
    bpm: input.bpm,
    id: input.id ?? `tempoEvent_${tick}`,
    tick,
  }
}

export function createMeterEvent(input: {
  id?: TimelineEventId
  tick?: Tick
  timeSignature?: TimeSignature
}): MeterEvent {
  const timeSignature = input.timeSignature ?? { denominator: 4, numerator: 4 }

  if (!isValidTimeSignature(timeSignature)) {
    throw new RangeError(`Invalid time signature ${timeSignature.numerator}/${timeSignature.denominator}.`)
  }

  const tick = createTick(input.tick ?? 0)

  return {
    id: input.id ?? `meterEvent_${tick}`,
    tick,
    timeSignature,
  }
}

export function createKeyEvent(input: { id?: TimelineEventId, tick?: Tick, key: Key }): KeyEvent {
  const tick = createTick(input.tick ?? 0)

  return {
    id: input.id ?? `keyEvent_${tick}`,
    key: input.key,
    tick,
  }
}

export function createDraftEntityId(prefix: string, existingIds: string[]): TimelineEventId {
  const existingIdSet = new Set(existingIds)
  let index = existingIds.length + 1
  let id = `${prefix}_${index}`

  while (existingIdSet.has(id)) {
    index += 1
    id = `${prefix}_${index}`
  }

  return id
}
