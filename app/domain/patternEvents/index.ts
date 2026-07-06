import type { ChordSymbol } from '../harmony'
import {
  createPositiveDurationTicks,
  createTick,
  createVelocity,
  DEFAULT_VELOCITY,
  type DurationTicks,
  type MidiNote,
  type Tick,
  type Velocity,
} from '../musicPrimitives'
import { type ChordPlayback, createDefaultChordPlayback } from '../playback'
import { type ChordVoicing, createDefaultChordVoicing } from '../voicing'

export type PatternEventId = string
export type PatternEventKind = 'chord' | 'note' | 'drumHit' | 'automation'
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

export function createChordEvent(input: {
  id: PatternEventId
  timeTick?: Tick
  durationTicks: DurationTicks
  chord: ChordSymbol
  voicing?: Partial<ChordVoicing>
  playback?: Partial<ChordPlayback>
  velocity?: Velocity
}): ChordEvent {
  return {
    chord: input.chord,
    durationTicks: createPositiveDurationTicks(input.durationTicks),
    id: input.id,
    kind: 'chord',
    playback: createDefaultChordPlayback(input.playback),
    timeTick: createTick(input.timeTick ?? 0),
    velocity: createVelocity(input.velocity ?? DEFAULT_VELOCITY),
    voicing: createDefaultChordVoicing(input.voicing),
  }
}

export function createNoteEvent(input: {
  id: PatternEventId
  timeTick?: Tick
  durationTicks: DurationTicks
  pitch: MidiNote
  velocity?: Velocity
}): NoteEvent {
  return {
    durationTicks: createPositiveDurationTicks(input.durationTicks),
    id: input.id,
    kind: 'note',
    pitch: input.pitch,
    timeTick: createTick(input.timeTick ?? 0),
    velocity: createVelocity(input.velocity ?? DEFAULT_VELOCITY),
  }
}

export function createDrumHitEvent(input: {
  id: PatternEventId
  timeTick?: Tick
  kitPiece: DrumKitPiece
  velocity?: Velocity
}): DrumHitEvent {
  return {
    id: input.id,
    kind: 'drumHit',
    kitPiece: input.kitPiece,
    timeTick: createTick(input.timeTick ?? 0),
    velocity: createVelocity(input.velocity ?? DEFAULT_VELOCITY),
  }
}

export function createAutomationEvent(input: {
  id: PatternEventId
  timeTick?: Tick
  parameter: string
  value: AutomationValue
}): AutomationEvent {
  return {
    id: input.id,
    kind: 'automation',
    parameter: input.parameter,
    timeTick: createTick(input.timeTick ?? 0),
    value: input.value,
  }
}

export function isTimedPatternEvent(event: PatternEvent): event is TimedEvent {
  return event.kind === 'chord' || event.kind === 'note'
}

export function getPatternEventEndTick(event: PatternEvent): Tick {
  if (isTimedPatternEvent(event)) {
    return event.timeTick + event.durationTicks
  }

  return event.timeTick
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
