import type { PatternKind } from '../patterns'
import type { InstrumentSoundId, TrackRole } from './index'

export const TRACK_ROLES = ['chords', 'bass', 'melody', 'drums'] as const

export const DEFAULT_ACCEPTS_BY_ROLE = {
  bass: ['note'],
  chords: ['chord'],
  drums: ['drum'],
  melody: ['note'],
} as const satisfies Record<TrackRole, readonly PatternKind[]>

export const DEFAULT_SOUND_BY_ROLE = {
  bass: 'bass.default',
  chords: 'keys.default',
  drums: 'drums.default',
  melody: 'lead.default',
} as const satisfies Record<TrackRole, InstrumentSoundId>

export const DEFAULT_TRACK_COLOR = '#eee9df'
