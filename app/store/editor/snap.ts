import {
  createPositiveDurationTicks,
  createTick,
  type DurationTicks,
  getGridDivisionTicks,
  getSmallestGridDivisionTicks,
  type GridDivision,
  snapTickToGrid,
  type Tick,
  type Timeline,
} from '~/domain'

export type TimelineRange = {
  startTick: Tick
  lengthTicks: DurationTicks
}

export function clampTimelineTick(tick: number): Tick {
  return createTick(Math.max(0, Math.round(tick)))
}

export function clampPositiveLengthTicks(lengthTicks: number): DurationTicks {
  return createPositiveDurationTicks(Math.max(1, Math.round(lengthTicks)))
}

export function createPositiveTimelineRange(startTick: number, endTick: number): TimelineRange {
  const start = clampTimelineTick(Math.min(startTick, endTick))
  const end = clampTimelineTick(Math.max(startTick, endTick))

  return {
    lengthTicks: clampPositiveLengthTicks(end - start),
    startTick: start,
  }
}

export function snapTimelineTick(
  timeline: Timeline,
  tick: number,
  gridDivision: GridDivision = timeline.grid,
): Tick {
  return createTick(Math.max(0, snapTickToGrid(timeline, clampTimelineTick(tick), gridDivision)))
}

export function snapTimelineRange(
  timeline: Timeline,
  startTick: number,
  endTick: number,
  gridDivision: GridDivision = timeline.grid,
): TimelineRange {
  const start = snapTimelineTick(timeline, Math.min(startTick, endTick), gridDivision)
  const end = snapTimelineTick(timeline, Math.max(startTick, endTick), gridDivision)

  return {
    lengthTicks: clampPositiveLengthTicks(end - start),
    startTick: start,
  }
}

export function snapToMinimumTimelineRange(timeline: Timeline, startTick: Tick, endTick: Tick): TimelineRange {
  const range = snapTimelineRange(timeline, startTick, endTick)
  const minimumLengthTicks = getSmallestGridDivisionTicks(timeline, range.startTick)

  return {
    ...range,
    lengthTicks: clampPositiveLengthTicks(Math.max(range.lengthTicks, minimumLengthTicks)),
  }
}

export function snapToGridMinimumTimelineRange(timeline: Timeline, startTick: Tick, endTick: Tick): TimelineRange {
  const range = snapTimelineRange(timeline, startTick, endTick)
  const minimumLengthTicks = getGridDivisionTicks(timeline, range.startTick)

  return {
    ...range,
    lengthTicks: clampPositiveLengthTicks(Math.max(range.lengthTicks, minimumLengthTicks)),
  }
}

export function getInitialDrawEndTick(timeline: Timeline, startTick: Tick): Tick {
  return createTick(startTick + getSmallestGridDivisionTicks(timeline, startTick))
}

export function getInitialGridDrawEndTick(timeline: Timeline, startTick: Tick): Tick {
  return createTick(startTick + getGridDivisionTicks(timeline, startTick))
}
