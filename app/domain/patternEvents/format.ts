import { formatChordSymbol } from '../harmony'
import type { PatternEvent } from './patternEvents'

export function formatPatternEvent(event: PatternEvent): string {
  if (event.kind === 'chord') {
    return formatChordSymbol(event.chord)
  }

  if (event.kind === 'note') {
    return `MIDI ${event.pitch}`
  }

  if (event.kind === 'drumHit') {
    return event.piece
  }

  return `${event.parameter}: ${event.value}`
}
