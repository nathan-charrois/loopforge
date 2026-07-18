import { type ChordQuality, createChordSymbol } from '../harmony'
import type { DrumPiece } from '../instrument'
import { createPositiveDurationTicks, type DurationTicks, type PitchClass } from '../musicPrimitives'
import {
  createAutomationEvent,
  createChordEvent,
  createDrumHitEvent,
  createNoteEvent,
  type PatternEvent,
  sortPatternEventsByTime,
} from '../patternEvents'
import {
  type AutomationPattern,
  type ChordPattern,
  type DrumPattern,
  eventMatchesPatternKind,
  type NotePattern,
  type Pattern,
  type PatternId,
  type PatternKind,
  type PatternMetadata,
} from './patterns'

export type CreatePatternInput = {
  id: PatternId
  kind: PatternKind
  name?: string
  lengthTicks: DurationTicks
  events?: PatternEvent[]
  metadata?: PatternMetadata
}

export function createPattern(input: CreatePatternInput): Pattern {
  const events = sortPatternEventsByTime(input.events ?? [])

  if (!events.every(event => eventMatchesPatternKind(event, input.kind))) {
    throw new Error(`Pattern ${input.id} contains events that do not match kind ${input.kind}.`)
  }

  const pattern = {
    events,
    id: input.id,
    kind: input.kind,
    lengthTicks: createPositiveDurationTicks(input.lengthTicks),
    metadata: input.metadata ?? {},
    name: input.name ?? 'Untitled Pattern',
  }

  switch (input.kind) {
    case 'automation':
      return pattern as AutomationPattern
    case 'chord':
      return pattern as ChordPattern
    case 'drum':
      return pattern as DrumPattern
    case 'note':
      return pattern as NotePattern
  }
}

export function createEmptyPattern(input: Omit<CreatePatternInput, 'events'>): Pattern {
  return createPattern({
    ...input,
    events: [],
  })
}

export function createSeedPatternEvents(
  patternKind: PatternKind,
  lengthTicks: number,
  options: {
    chordQuality: ChordQuality
    chordRoot: PitchClass
    drumPiece: DrumPiece
    notePitch: number
  },
): PatternEvent[] {
  const halfLengthTicks = Math.max(120, Math.floor(lengthTicks / 2))

  switch (patternKind) {
    case 'automation':
      return [
        createAutomationEvent({
          id: 'event_automation_1',
          parameter: 'filterCutoff',
          timeTick: 0,
          value: 0.65,
        }),
      ]
    case 'chord':
      return [
        createChordEvent({
          chord: createChordSymbol({
            extensions: ['7'],
            quality: options.chordQuality,
            root: options.chordRoot,
          }),
          durationTicks: halfLengthTicks,
          id: 'event_chord_1',
          timeTick: 0,
          velocity: 96,
        }),
        createChordEvent({
          chord: createChordSymbol({
            quality: 'major',
            root: ((options.chordRoot + 5) % 12) as PitchClass,
          }),
          durationTicks: Math.max(120, lengthTicks - halfLengthTicks),
          id: 'event_chord_2',
          timeTick: halfLengthTicks,
          velocity: 88,
        }),
      ]
    case 'drum':
      return [
        createDrumHitEvent({
          id: 'event_drum_1',
          piece: options.drumPiece,
          timeTick: 0,
          velocity: 112,
        }),
        createDrumHitEvent({
          id: 'event_drum_2',
          piece: 'snare',
          timeTick: halfLengthTicks,
          velocity: 98,
        }),
      ]
    case 'note':
      return [
        createNoteEvent({
          durationTicks: halfLengthTicks,
          id: 'event_note_1',
          pitch: options.notePitch,
          timeTick: 0,
          velocity: 96,
        }),
        createNoteEvent({
          durationTicks: Math.max(120, lengthTicks - halfLengthTicks),
          id: 'event_note_2',
          pitch: options.notePitch + 7,
          timeTick: halfLengthTicks,
          velocity: 88,
        }),
      ]
  }
}
