export const PLAYBACK_STYLES = ['block', 'arpeggio'] as const
export type PlaybackStyle = typeof PLAYBACK_STYLES[number]

export const ARPEGGIO_PATTERNS = ['up', 'down', 'upDown', 'random'] as const
export type ArpeggioPattern = typeof ARPEGGIO_PATTERNS[number]

export const STRUM_PATTERNS = ['down', 'up', 'alternate'] as const
export type StrumPattern = typeof STRUM_PATTERNS[number]
