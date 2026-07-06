import type { PatternKind } from '../patterns'

export type TrackId = string
export type TrackRole = 'chords' | 'bass' | 'melody' | 'drums'
export type InstrumentSoundId = string

export type Track = {
  id: TrackId
  name: string
  role: TrackRole
  accepts: PatternKind[]
  muted: boolean
  soloed: boolean
  volume: number
  color: string
  instrumentSoundId: InstrumentSoundId
}

const DEFAULT_ACCEPTS_BY_ROLE = {
  bass: ['note'],
  chords: ['chord'],
  drums: ['drum'],
  melody: ['note'],
} as const satisfies Record<TrackRole, readonly PatternKind[]>

const DEFAULT_SOUND_BY_ROLE = {
  bass: 'bass.default',
  chords: 'keys.default',
  drums: 'drums.default',
  melody: 'lead.default',
} as const satisfies Record<TrackRole, InstrumentSoundId>

const DEFAULT_COLOR_BY_ROLE = {
  bass: '#2f80ed',
  chords: '#9b51e0',
  drums: '#f2994a',
  melody: '#27ae60',
} as const satisfies Record<TrackRole, string>

export function createTrack(input: {
  id: TrackId
  name: string
  role: TrackRole
  accepts?: PatternKind[]
  muted?: boolean
  soloed?: boolean
  volume?: number
  color?: string
  instrumentSoundId?: InstrumentSoundId
}): Track {
  return {
    accepts: input.accepts ?? [...DEFAULT_ACCEPTS_BY_ROLE[input.role]],
    color: input.color ?? DEFAULT_COLOR_BY_ROLE[input.role],
    id: input.id,
    instrumentSoundId: input.instrumentSoundId ?? DEFAULT_SOUND_BY_ROLE[input.role],
    muted: input.muted ?? false,
    name: input.name,
    role: input.role,
    soloed: input.soloed ?? false,
    volume: input.volume ?? 0.85,
  }
}

export function createDefaultTracks(): Track[] {
  return [
    createTrack({ id: 'track_chords', name: 'Chords', role: 'chords' }),
    createTrack({ id: 'track_bass', name: 'Bass', role: 'bass' }),
    createTrack({ id: 'track_melody', name: 'Melody', role: 'melody' }),
    createTrack({ id: 'track_drums', name: 'Drums', role: 'drums' }),
  ]
}

export function canTrackAcceptPatternKind(track: Track, patternKind: PatternKind): boolean {
  return track.accepts.includes(patternKind)
}

export function isTrackVolume(value: number): boolean {
  return value >= 0 && value <= 1
}

export function validateTrack(track: Track): string[] {
  const errors: string[] = []

  if (track.accepts.length === 0) {
    errors.push(`Track ${track.id} must accept at least one pattern kind.`)
  }

  if (!isTrackVolume(track.volume)) {
    errors.push(`Track ${track.id} volume must be between 0 and 1.`)
  }

  return errors
}
