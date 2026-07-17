import type { Key } from '../harmony'
import {
  createDurationTicks,
  createTick,
  type DurationTicks,
  isPositiveDurationTicks,
  type Tick,
} from '../musicPrimitives'
import { GRID_DIVISIONS, PPQ, TIME_SIGNATURE_DENOMINATORS } from './constants'

export type BeatsPerMinute = number
export type TimeSignatureDenominator = typeof TIME_SIGNATURE_DENOMINATORS[number]

export type TimeSignature = {
  numerator: number
  denominator: TimeSignatureDenominator
}

export type TimelineEventId = string

export type TempoEvent = {
  id: TimelineEventId
  tick: Tick
  bpm: BeatsPerMinute
}

export type MeterEvent = {
  id: TimelineEventId
  tick: Tick
  timeSignature: TimeSignature
}

export type KeyEvent = {
  id: TimelineEventId
  tick: Tick
  key: Key
}

export type TimelineEvent = TempoEvent | MeterEvent | KeyEvent

export type TimelineEventField = 'tempoEvents' | 'meterEvents' | 'keyEvents'

export type Timeline = {
  ppq: number
  tempoEvents: TempoEvent[]
  meterEvents: MeterEvent[]
  keyEvents: KeyEvent[]
  grid: GridDivision
}

export type RulerMark = {
  tick: Tick
  kind: 'bar' | 'beat' | 'subdivision'
  label?: string
}

export type BarBeat = {
  bar: number
  beat: number
  tick: Tick
}

export type GridDivision = typeof GRID_DIVISIONS[number]

export function getTempoAtTick(timeline: Timeline, tick: Tick): BeatsPerMinute {
  return getActiveEvent(timeline.tempoEvents, tick, 'tempo').bpm
}

export function getMeterAtTick(timeline: Timeline, tick: Tick): TimeSignature {
  return getActiveEvent(timeline.meterEvents, tick, 'meter').timeSignature
}

export function getKeyAtTick(timeline: Timeline, tick: Tick): Key {
  return getActiveEvent(timeline.keyEvents, tick, 'key').key
}

export function getTicksPerBeat(timeSignature: TimeSignature, ppq = PPQ): DurationTicks {
  return createDurationTicks(ppq * (4 / timeSignature.denominator))
}

export function getBarLengthTicks(timeSignature: TimeSignature, ppq = PPQ): DurationTicks {
  return createDurationTicks(timeSignature.numerator * getTicksPerBeat(timeSignature, ppq))
}

export function getBarLengthTicksAtTick(timeline: Timeline, tick: Tick): DurationTicks {
  return getBarLengthTicks(getMeterAtTick(timeline, tick), timeline.ppq)
}

export function getGridDivisionTicks(
  timeline: Timeline,
  tick: Tick,
  gridDivision = timeline.grid,
): DurationTicks {
  if (gridDivision === 'bar') {
    return getBarLengthTicksAtTick(timeline, tick)
  }

  if (gridDivision === 'beat') {
    return getTicksPerBeat(getMeterAtTick(timeline, tick), timeline.ppq)
  }

  return getFixedGridTicks(timeline.ppq, gridDivision)
}

export function getSmallestGridDivisionTicks(timeline: Timeline, tick: Tick): DurationTicks {
  return GRID_DIVISIONS.reduce(
    (smallestTicks, gridDivision) => Math.min(smallestTicks, getGridDivisionTicks(timeline, tick, gridDivision)),
    Number.POSITIVE_INFINITY,
  )
}

export function getRulerMarks(timeline: Timeline, startTick: Tick, endTick: Tick): RulerMark[] {
  const rangeStartTick = createTick(Math.max(0, Math.floor(startTick)))
  const rangeEndTick = createTick(Math.max(rangeStartTick, Math.floor(endTick)))
  const marksByTick = new Map<Tick, RulerMark>()
  let barStartTick = getBarStartTick(timeline, rangeStartTick)

  while (barStartTick <= rangeEndTick) {
    const barBeat = tickToBarBeat(timeline, barStartTick)
    const meter = getMeterAtTick(timeline, barStartTick)
    const ticksPerBeat = getTicksPerBeat(meter, timeline.ppq)
    const barLengthTicks = getBarLengthTicks(meter, timeline.ppq)
    const gridDivisionTicks = getGridDivisionTicks(timeline, barStartTick, timeline.grid)
    const shouldRenderBeatMarks = timeline.grid === 'beat'
      || (timeline.grid !== 'bar' && gridDivisionTicks <= ticksPerBeat)
    const nextBarStartTick = createTick(barStartTick + barLengthTicks)

    addRulerMark(marksByTick, {
      kind: 'bar',
      label: `${barBeat.bar}`,
      tick: barStartTick,
    })

    if (shouldRenderBeatMarks) {
      for (let beatIndex = 1; beatIndex < meter.numerator; beatIndex += 1) {
        addRulerMark(marksByTick, {
          kind: 'beat',
          tick: createTick(barStartTick + (beatIndex * ticksPerBeat)),
        })
      }
    }

    if (timeline.grid !== 'bar' && timeline.grid !== 'beat') {
      for (
        let subdivisionTick = barStartTick + gridDivisionTicks;
        subdivisionTick < nextBarStartTick;
        subdivisionTick += gridDivisionTicks
      ) {
        addRulerMark(marksByTick, {
          kind: 'subdivision',
          tick: createTick(subdivisionTick),
        })
      }
    }

    barStartTick = nextBarStartTick
  }

  return [...marksByTick.values()]
    .filter(mark => mark.tick >= rangeStartTick && mark.tick <= rangeEndTick)
    .sort((left, right) => left.tick - right.tick)
}

export function tickToBarBeat(timeline: Timeline, tick: Tick): BarBeat {
  const targetTick = createTick(tick)
  const meterEvents = getSortedMeterEvents(timeline)
  let activeMeterEvent = meterEvents[0]
  let segmentStartTick = activeMeterEvent.tick
  let currentBar = 1

  for (let index = 1; index < meterEvents.length && targetTick >= meterEvents[index].tick; index += 1) {
    const nextMeterEvent = meterEvents[index]
    const barLengthTicks = getBarLengthTicks(activeMeterEvent.timeSignature, timeline.ppq)
    const segmentLengthTicks = nextMeterEvent.tick - segmentStartTick
    const completeBarsInSegment = Math.floor(segmentLengthTicks / barLengthTicks)

    currentBar += completeBarsInSegment
    segmentStartTick = nextMeterEvent.tick
    activeMeterEvent = nextMeterEvent
  }

  const barLengthTicks = getBarLengthTicks(activeMeterEvent.timeSignature, timeline.ppq)
  const ticksPerBeat = getTicksPerBeat(activeMeterEvent.timeSignature, timeline.ppq)
  const relativeTick = targetTick - segmentStartTick
  const barsIntoSegment = Math.floor(relativeTick / barLengthTicks)
  const tickInsideBar = relativeTick % barLengthTicks

  return {
    bar: currentBar + barsIntoSegment,
    beat: Math.floor(tickInsideBar / ticksPerBeat) + 1,
    tick: tickInsideBar % ticksPerBeat,
  }
}

export function barBeatToTick(timeline: Timeline, barBeat: BarBeat): Tick {
  if (!Number.isInteger(barBeat.bar) || barBeat.bar < 1) {
    throw new RangeError(`Bar must be a positive integer. Received ${barBeat.bar}.`)
  }

  if (!Number.isInteger(barBeat.beat) || barBeat.beat < 1) {
    throw new RangeError(`Beat must be a positive integer. Received ${barBeat.beat}.`)
  }

  const meterEvents = getSortedMeterEvents(timeline)
  let activeMeterEvent = meterEvents[0]
  let segmentStartTick = activeMeterEvent.tick
  let currentBar = 1

  for (let index = 1; index < meterEvents.length; index += 1) {
    const nextMeterEvent = meterEvents[index]
    const barLengthTicks = getBarLengthTicks(activeMeterEvent.timeSignature, timeline.ppq)
    const segmentLengthTicks = nextMeterEvent.tick - segmentStartTick
    const barsInSegment = Math.floor(segmentLengthTicks / barLengthTicks)

    if (barBeat.bar < currentBar + barsInSegment) {
      break
    }

    currentBar += barsInSegment
    segmentStartTick = nextMeterEvent.tick
    activeMeterEvent = nextMeterEvent
  }

  const ticksPerBeat = getTicksPerBeat(activeMeterEvent.timeSignature, timeline.ppq)

  if (barBeat.beat > activeMeterEvent.timeSignature.numerator) {
    throw new RangeError(
      `Beat ${barBeat.beat} is outside ${activeMeterEvent.timeSignature.numerator}/${activeMeterEvent.timeSignature.denominator}.`,
    )
  }

  if (barBeat.tick < 0 || barBeat.tick >= ticksPerBeat) {
    throw new RangeError(`Beat tick must be between 0 and ${ticksPerBeat - 1}. Received ${barBeat.tick}.`)
  }

  return createTick(
    segmentStartTick
    + ((barBeat.bar - currentBar) * getBarLengthTicks(activeMeterEvent.timeSignature, timeline.ppq))
    + ((barBeat.beat - 1) * ticksPerBeat)
    + barBeat.tick,
  )
}

export function getBarStartTick(timeline: Timeline, tick: Tick): Tick {
  const barBeat = tickToBarBeat(timeline, tick)

  return barBeatToTick(timeline, {
    bar: barBeat.bar,
    beat: 1,
    tick: 0,
  })
}

export function isTempoEvent(event?: TimelineEvent): event is TempoEvent {
  return typeof event !== 'undefined' && 'bpm' in event
}

export function isMeterEvent(event?: TimelineEvent): event is MeterEvent {
  return typeof event !== 'undefined' && 'timeSignature' in event
}

export function isKeyEvent(event?: TimelineEvent): event is KeyEvent {
  return typeof event !== 'undefined' && 'key' in event
}

export function getTimelineEventField(event: TimelineEvent): TimelineEventField {
  if (isTempoEvent(event)) {
    return 'tempoEvents'
  }

  if (isMeterEvent(event)) {
    return 'meterEvents'
  }

  return 'keyEvents'
}

export function sortTimelineEventsByTick<TEvent extends TimelineEvent>(events: readonly TEvent[]): TEvent[] {
  return [...events].sort((left, right) => left.tick - right.tick)
}

export function isBarBoundaryTick(timeline: Timeline, tick: Tick): boolean {
  return getBarStartTick(timeline, tick) === tick
}

export function snapTickToGrid(timeline: Timeline, tick: Tick, gridDivision = timeline.grid): Tick {
  const targetTick = createTick(tick)

  if (gridDivision === 'bar') {
    const currentBarStart = getBarStartTick(timeline, targetTick)
    const nextBarStart = barBeatToTick(timeline, {
      bar: tickToBarBeat(timeline, targetTick).bar + 1,
      beat: 1,
      tick: 0,
    })

    return targetTick - currentBarStart <= nextBarStart - targetTick ? currentBarStart : nextBarStart
  }

  if (gridDivision === 'beat') {
    const meter = getMeterAtTick(timeline, targetTick)
    const ticksPerBeat = getTicksPerBeat(meter, timeline.ppq)
    const barStartTick = getBarStartTick(timeline, targetTick)

    return createTick(barStartTick + (Math.round((targetTick - barStartTick) / ticksPerBeat) * ticksPerBeat))
  }

  const gridTicks = getFixedGridTicks(timeline.ppq, gridDivision)

  return createTick(Math.round(targetTick / gridTicks) * gridTicks)
}

function addRulerMark(marksByTick: Map<Tick, RulerMark>, mark: RulerMark) {
  const currentMark = marksByTick.get(mark.tick)

  if (currentMark === undefined || getRulerMarkPriority(mark.kind) > getRulerMarkPriority(currentMark.kind)) {
    marksByTick.set(mark.tick, mark)
  }
}

function getRulerMarkPriority(kind: RulerMark['kind']): number {
  switch (kind) {
    case 'bar':
      return 3
    case 'beat':
      return 2
    case 'subdivision':
      return 1
  }
}

export function isValidTimeSignature(timeSignature: TimeSignature): boolean {
  return Number.isInteger(timeSignature.numerator)
    && timeSignature.numerator > 0
    && (TIME_SIGNATURE_DENOMINATORS as readonly number[]).includes(timeSignature.denominator)
}

export function validateTimeline(timeline: Timeline): string[] {
  const errors: string[] = []

  if (!isPositiveDurationTicks(timeline.ppq)) {
    errors.push('Timeline PPQ must be a positive integer.')
  }

  errors.push(...validateEvents('tempo', timeline.tempoEvents))
  errors.push(...validateEvents('meter', timeline.meterEvents))
  errors.push(...validateEvents('key', timeline.keyEvents))

  for (const tempoEvent of timeline.tempoEvents) {
    if (tempoEvent.bpm <= 0) {
      errors.push(`Tempo event at ${tempoEvent.tick} must have a positive BPM.`)
    }
  }

  for (const meterEvent of timeline.meterEvents) {
    if (!isValidTimeSignature(meterEvent.timeSignature)) {
      errors.push(`Meter event at ${meterEvent.tick} has an invalid time signature.`)
    }
  }

  errors.push(...validateMeterEventsAtBarBoundaries(timeline))

  return errors
}

function getFixedGridTicks(ppq: number, gridDivision: Exclude<GridDivision, 'bar' | 'beat'>): DurationTicks {
  switch (gridDivision) {
    case 'eighthNote':
      return createDurationTicks(ppq / 2)
    case 'halfNote':
      return createDurationTicks(ppq * 2)
    case 'quarterNote':
      return createDurationTicks(ppq)
    case 'sixteenthNote':
      return createDurationTicks(ppq / 4)
    case 'thirtySecondNote':
      return createDurationTicks(ppq / 8)
  }
}

function getActiveEvent<TEvent extends TimelineEvent>(
  events: readonly TEvent[],
  tick: Tick,
  eventName: string,
): TEvent {
  if (events.length === 0) {
    throw new Error(`Timeline has no ${eventName} events.`)
  }

  const targetTick = createTick(tick)
  const sortedEvents = sortTimelineEventsByTick(events)
  let activeEvent = sortedEvents[0]

  for (const event of sortedEvents) {
    if (event.tick > targetTick) {
      break
    }

    activeEvent = event
  }

  return activeEvent
}

function getSortedMeterEvents(timeline: Timeline): MeterEvent[] {
  if (timeline.meterEvents.length === 0) {
    throw new Error('Timeline has no meter events.')
  }

  return sortTimelineEventsByTick(timeline.meterEvents)
}

function validateEvents(name: string, events: readonly TimelineEvent[]): string[] {
  const errors: string[] = []

  if (events.length === 0) {
    errors.push(`Timeline must have at least one ${name} event.`)

    return errors
  }

  const sortedEvents = sortTimelineEventsByTick(events)

  if (sortedEvents[0].tick !== 0) {
    errors.push(`Timeline first ${name} event must start at tick 0.`)
  }

  for (let index = 1; index < sortedEvents.length; index += 1) {
    if (sortedEvents[index].tick === sortedEvents[index - 1].tick) {
      errors.push(`Timeline has duplicate ${name} events at tick ${sortedEvents[index].tick}.`)
    }
  }

  return errors
}

function validateMeterEventsAtBarBoundaries(timeline: Timeline): string[] {
  const errors: string[] = []
  const meterEvents = getSortedMeterEvents(timeline)
  let activeMeterEvent = meterEvents[0]
  let segmentStartTick = activeMeterEvent.tick

  for (let index = 1; index < meterEvents.length; index += 1) {
    const nextMeterEvent = meterEvents[index]
    const barLengthTicks = getBarLengthTicks(activeMeterEvent.timeSignature, timeline.ppq)

    if ((nextMeterEvent.tick - segmentStartTick) % barLengthTicks !== 0) {
      errors.push(`Meter event at tick ${nextMeterEvent.tick} must start on a bar boundary.`)
    }

    activeMeterEvent = nextMeterEvent
    segmentStartTick = nextMeterEvent.tick
  }

  return errors
}
