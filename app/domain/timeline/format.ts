import type { Tick } from '../musicPrimitives'
import {
  getBarLengthTicksAtTick,
  getTicksPerBeat,
  tickToBarBeat,
  type Timeline,
} from './timeline'

export function toTimelineTick(tick: number): Tick {
  return Math.max(0, Math.floor(tick))
}

export function barStartValueToTick(timeline: Timeline, value: string): Tick {
  return (Math.max(1, parseInteger(value)) - 1) * getBarLengthTicksAtTick(timeline, 0)
}

export function barEndValueToTick(timeline: Timeline, value: string): Tick {
  return Math.max(1, parseInteger(value)) * getBarLengthTicksAtTick(timeline, 0)
}

export function barLengthValueToTicks(timeline: Timeline, value: string): number {
  return Math.max(1, parseInteger(value)) * getBarLengthTicksAtTick(timeline, 0)
}

export function formatTickToStartBar(timeline: Timeline, tick: number): string {
  return `${Math.floor(Math.max(0, tick) / getBarLengthTicksAtTick(timeline, 0)) + 1}`
}

export function formatTickToEndBar(timeline: Timeline, tick: number): string {
  return `${Math.max(1, Math.ceil(Math.max(0, tick) / getBarLengthTicksAtTick(timeline, 0)))}`
}

export function formatTickAsBars(timeline: Timeline, tick: number): string {
  const timelineTick = toTimelineTick(tick)
  const primaryMeterEvent = timeline.meterEvents[0]

  if (timeline.meterEvents.length === 1 && primaryMeterEvent?.tick === 0) {
    const ticksPerBeat = getTicksPerBeat(primaryMeterEvent.timeSignature, timeline.ppq)
    const barLengthTicks = primaryMeterEvent.timeSignature.numerator * ticksPerBeat
    const tickInsideBar = timelineTick % barLengthTicks

    return `Bar ${Math.floor(timelineTick / barLengthTicks) + 1}, beat ${Math.floor(tickInsideBar / ticksPerBeat) + 1}`
  }

  const barBeat = tickToBarBeat(timeline, timelineTick)

  return `Bar ${barBeat.bar}, beat ${barBeat.beat}`
}

export function formatTickRangeAsBars(timeline: Timeline, startTick: number, endTick: number): string {
  return `${formatTickAsBars(timeline, startTick)} - ${formatTickAsBars(timeline, endTick)}`
}

export function formatDurationAsBars(timeline: Timeline, lengthTicks: number): string {
  const bars = Math.max(1, Math.round(lengthTicks / getBarLengthTicksAtTick(timeline, 0)))

  return `${bars} ${bars === 1 ? 'bar' : 'bars'}`
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) ? parsed : 0
}
