import type { DurationTicks } from '../musicPrimitives'
import {
  type AutomationEvent,
  type ChordEvent,
  type DrumHitEvent,
  isPatternEventWithinLength,
  type NoteEvent,
  type PatternEvent,
} from '../patternEvents'
import { PATTERN_KINDS } from './constants'

export type PatternId = string
export type PatternKind = typeof PATTERN_KINDS[number]
export type PatternMetadata = Record<string, boolean | null | number | string>

type BasePattern<TKind extends PatternKind, TEvent extends PatternEvent> = {
  id: PatternId
  kind: TKind
  name: string
  lengthTicks: DurationTicks
  events: TEvent[]
  metadata: PatternMetadata
}

export type ChordPattern = BasePattern<'chord', ChordEvent>
export type NotePattern = BasePattern<'note', NoteEvent>
export type DrumPattern = BasePattern<'drum', DrumHitEvent>
export type AutomationPattern = BasePattern<'automation', AutomationEvent>
export type Pattern = ChordPattern | NotePattern | DrumPattern | AutomationPattern

export function validatePattern(pattern: Pattern): string[] {
  const errors: string[] = []

  if (pattern.lengthTicks <= 0) {
    errors.push(`Pattern ${pattern.id} must have a positive length.`)
  }

  for (const event of pattern.events) {
    if (!eventMatchesPatternKind(event, pattern.kind)) {
      errors.push(`Pattern ${pattern.id} contains a ${event.kind} event.`)
    }

    if (!isPatternEventWithinLength(event, pattern.lengthTicks)) {
      errors.push(`Pattern ${pattern.id} contains event ${event.id} outside its length.`)
    }
  }

  return errors
}

export function getPatternEventKind(patternKind: PatternKind): PatternEvent['kind'] {
  switch (patternKind) {
    case 'automation':
      return 'automation'
    case 'chord':
      return 'chord'
    case 'drum':
      return 'drumHit'
    case 'note':
      return 'note'
  }
}

export function eventMatchesPatternKind(event: PatternEvent, patternKind: PatternKind): boolean {
  return event.kind === getPatternEventKind(patternKind)
}
