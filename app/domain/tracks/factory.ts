import type { PatternKind } from '../patterns'
import { DEFAULT_ACCEPTS_BY_ROLE, DEFAULT_COLOR_BY_ROLE, DEFAULT_SOUND_BY_ROLE } from './constants'
import type { InstrumentSoundId, Track, TrackId, TrackRole } from './index'

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

export function getPatternKindForTrack(track: Track): PatternKind {
  if (track.accepts.includes('chord')) {
    return 'chord'
  }

  if (track.accepts.includes('drum')) {
    return 'drum'
  }

  if (track.role === 'bass' || track.role === 'melody') {
    return 'note'
  }

  return track.accepts[0] ?? 'note'
}
