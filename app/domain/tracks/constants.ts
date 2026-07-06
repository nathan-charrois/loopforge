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

export const DEFAULT_COLOR_BY_ROLE = {
  bass: '#2f80ed',
  chords: '#9b51e0',
  drums: '#f2994a',
  melody: '#27ae60',
} as const satisfies Record<TrackRole, string>
