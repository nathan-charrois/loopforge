import type { ChordSymbol } from '../harmony'
import type { DrumPiece } from '../instrument'
import {
  createMidiNote,
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
import type {
  AutomationEvent,
  AutomationValue,
  ChordEvent,
  DrumHitEvent,
  NoteEvent,
  PatternEventId,
} from './patternEvents'

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
  pitch?: MidiNote
  velocity?: Velocity
}): NoteEvent {
  return {
    durationTicks: createPositiveDurationTicks(input.durationTicks),
    id: input.id,
    kind: 'note',
    pitch: createMidiNote(input.pitch ?? 60),
    timeTick: createTick(input.timeTick ?? 0),
    velocity: createVelocity(input.velocity ?? DEFAULT_VELOCITY),
  }
}

export function createNoteEvents(
  id: string,
  notes: readonly NoteEvent[],
): NoteEvent[] {
  return notes.map((noteEvent, index) => createNoteEvent({
    ...noteEvent,
    id: `${id}_${index + 1}`,
  }))
}

export function createDrumHitEvent(input: {
  id: PatternEventId
  timeTick?: Tick
  piece: DrumPiece
  velocity?: Velocity
}): DrumHitEvent {
  return {
    id: input.id,
    kind: 'drumHit',
    piece: input.piece,
    timeTick: createTick(input.timeTick ?? 0),
    velocity: createVelocity(input.velocity ?? DEFAULT_VELOCITY),
  }
}

export function createDrumHitEvents(
  id: string,
  hits: readonly DrumHitEvent[],
): DrumHitEvent[] {
  return hits.map((drumHitEvent, index) => createDrumHitEvent({
    ...drumHitEvent,
    id: `${id}_${index + 1}`,
  }))
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

export function createAutomationEvents(
  id: string,
  events: readonly AutomationEvent[],
): AutomationEvent[] {
  return events.map((automationEvent, index) => createAutomationEvent({
    ...automationEvent,
    id: `${id}_${index + 1}`,
  }))
}
