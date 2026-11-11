import type { DurationTicks } from '../musicPrimitives'
import {
  type AutomationEvent,
  type ChordEvent,
  type DrumHitEvent,
  isPatternEventWithinLength,
  type NoteEvent,
  type PatternEvent,
  type PatternEventId,
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

export function moveChordEvent(
  pattern: ChordPattern,
  eventId: PatternEventId,
  targetIndex: number,
): ChordPattern {
  const sourceIndex = pattern.events.findIndex(event => event.id === eventId)
  const index = Math.max(0, Math.min(pattern.events.length - 1, Math.round(targetIndex)))

  if (sourceIndex < 0 || sourceIndex === index || pattern.events.length > pattern.lengthTicks) {
    return pattern
  }

  const events = [...pattern.events]
  const [event] = events.splice(sourceIndex, 1)
  events.splice(index, 0, event)

  return {
    ...pattern,
    events: events.map((event, index) => {
      const timeTick = Math.floor(index * pattern.lengthTicks / events.length)
      const endTick = Math.floor((index + 1) * pattern.lengthTicks / events.length)

      return { ...event, timeTick, durationTicks: endTick - timeTick }
    }),
  }
}

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
