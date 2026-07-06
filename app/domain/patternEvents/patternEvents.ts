import type { ChordSymbol } from '../harmony'
import {
  type DurationTicks,
  type MidiNote,
  type Tick,
  type Velocity,
} from '../musicPrimitives'
import type { ChordPlayback } from '../playback'
import type { ChordVoicing } from '../voicing'

export type PatternEventId = string
export type DrumKitPiece = string
export type AutomationValue = boolean | number | string

export type BasePatternEvent = {
  id: PatternEventId
  timeTick: Tick
}

export type ChordEvent = BasePatternEvent & {
  kind: 'chord'
  durationTicks: DurationTicks
  chord: ChordSymbol
  voicing: ChordVoicing
  playback: ChordPlayback
  velocity: Velocity
}

export type NoteEvent = BasePatternEvent & {
  kind: 'note'
  durationTicks: DurationTicks
  pitch: MidiNote
  velocity: Velocity
}

export type DrumHitEvent = BasePatternEvent & {
  kind: 'drumHit'
  kitPiece: DrumKitPiece
  velocity: Velocity
}

export type AutomationEvent = BasePatternEvent & {
  kind: 'automation'
  parameter: string
  value: AutomationValue
}

export type PatternEvent = ChordEvent | NoteEvent | DrumHitEvent | AutomationEvent

type TimedEvent = ChordEvent | NoteEvent

export function isTimedPatternEvent(event: PatternEvent): event is TimedEvent {
  return event.kind === 'chord' || event.kind === 'note'
}

export function getPatternEventEndTick(event: PatternEvent): Tick {
  if (isTimedPatternEvent(event)) {
    return event.timeTick + event.durationTicks
  }

  return event.timeTick
}

export function getScheduledEventDurationTicks(event: PatternEvent, maxDurationTicks: number): number {
  if (!isTimedPatternEvent(event)) {
    return 0
  }

  return Math.max(0, Math.min(getPatternEventEndTick(event) - event.timeTick, maxDurationTicks))
}

export function isPatternEventWithinLength(event: PatternEvent, lengthTicks: DurationTicks): boolean {
  return event.timeTick >= 0 && getPatternEventEndTick(event) <= lengthTicks
}

export function sortPatternEventsByTime<TEvent extends PatternEvent>(events: readonly TEvent[]): TEvent[] {
  return [...events].sort((left, right) => {
    if (left.timeTick !== right.timeTick) {
      return left.timeTick - right.timeTick
    }

    return left.id.localeCompare(right.id)
  })
}
