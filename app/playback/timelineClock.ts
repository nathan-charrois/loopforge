import { getTempoAtTick, type Tick, type Timeline } from '~/domain'

export type TimelineClock = {
  getSecondsBetweenTicks(startTick: Tick, endTick: Tick): number
  getTickAfterSeconds(startTick: Tick, seconds: number, endTick: Tick): Tick
}

type TempoSegment = {
  startTick: Tick
  bpm: number
}

export function createTimelineClock(timeline: Timeline): TimelineClock {
  assertPositiveNumber(timeline.ppq, 'Timeline PPQ')

  const ppq = timeline.ppq
  const tempoSegments = createTempoSegments(timeline)

  function getSecondsBetweenTicks(startTick: Tick, endTick: Tick): number {
    if (startTick === endTick) {
      return 0
    }

    if (startTick > endTick) {
      return -getSecondsBetweenTicks(endTick, startTick)
    }

    let segmentIndex = findTempoSegmentIndex(tempoSegments, startTick)
    let segmentStartTick = startTick
    let seconds = 0

    while (segmentStartTick < endTick) {
      const segment = tempoSegments[segmentIndex]
      const nextTempoTick = tempoSegments[segmentIndex + 1]?.startTick ?? endTick
      const segmentEndTick = Math.min(endTick, nextTempoTick)

      seconds += ticksToSeconds(segmentEndTick - segmentStartTick, segment.bpm, ppq)
      segmentStartTick = segmentEndTick

      if (segmentStartTick === nextTempoTick && segmentIndex < tempoSegments.length - 1) {
        segmentIndex += 1
      }
    }

    return seconds
  }

  function getTickAfterSeconds(startTick: Tick, seconds: number, endTick: Tick): Tick {
    if (endTick < startTick) {
      throw new Error('End tick must not be before start tick')
    }

    if (seconds <= 0 || startTick === endTick) {
      return startTick
    }

    let segmentIndex = findTempoSegmentIndex(tempoSegments, startTick)
    let segmentStartTick = startTick
    let remainingSeconds = seconds

    while (segmentStartTick < endTick) {
      const segment = tempoSegments[segmentIndex]
      const nextTempoTick = tempoSegments[segmentIndex + 1]?.startTick ?? endTick
      const segmentEndTick = Math.min(endTick, nextTempoTick)
      const segmentSeconds = ticksToSeconds(
        segmentEndTick - segmentStartTick,
        segment.bpm,
        ppq,
      )

      if (remainingSeconds <= segmentSeconds) {
        return segmentStartTick + secondsToTicks(remainingSeconds, segment.bpm, ppq)
      }

      remainingSeconds -= segmentSeconds
      segmentStartTick = segmentEndTick

      if (segmentStartTick === nextTempoTick && segmentIndex < tempoSegments.length - 1) {
        segmentIndex += 1
      }
    }

    return endTick
  }

  return {
    getSecondsBetweenTicks,
    getTickAfterSeconds,
  }
}

function createTempoSegments(timeline: Timeline): TempoSegment[] {
  const tempoByTick = new Map<Tick, number>()
  tempoByTick.set(0, getTempoAtTick(timeline, 0))

  const sortedEvents = [...timeline.tempoEvents].sort((left, right) => left.tick - right.tick)

  for (const event of sortedEvents) {
    assertPositiveNumber(event.bpm, `Tempo at tick ${event.tick}`)
    tempoByTick.set(toTimelineTick(event.tick), event.bpm)
  }

  return [...tempoByTick.entries()]
    .sort(([leftTick], [rightTick]) => leftTick - rightTick)
    .map(([startTick, bpm]) => ({ startTick, bpm }))
}

function findTempoSegmentIndex(segments: readonly TempoSegment[], tick: Tick): number {
  let low = 0
  let high = segments.length

  while (low < high) {
    const middle = Math.floor((low + high) / 2)

    if (segments[middle].startTick <= tick) {
      low = middle + 1
    }
    else {
      high = middle
    }
  }

  return Math.max(0, low - 1)
}

function ticksToSeconds(ticks: number, bpm: number, ppq: number): number {
  return (ticks * 60) / (bpm * ppq)
}

function secondsToTicks(seconds: number, bpm: number, ppq: number): Tick {
  return (seconds * bpm * ppq) / 60
}

function assertPositiveNumber(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive finite number`)
  }
}

function toTimelineTick(tick: number): Tick {
  return Math.max(0, Math.floor(tick))
}
