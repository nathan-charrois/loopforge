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
import type {
  AutomationEvent,
  AutomationValue,
  ChordEvent,
  DrumHitEvent,
  DrumKitPiece,
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
