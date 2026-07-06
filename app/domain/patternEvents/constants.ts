export const PATTERN_EVENT_KINDS = ['chord', 'note', 'drumHit', 'automation'] as const
export type PatternEventKind = typeof PATTERN_EVENT_KINDS[number]
