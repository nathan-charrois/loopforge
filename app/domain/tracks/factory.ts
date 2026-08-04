import { createMixChannelIdForTrack, type MixChannelId } from '../mixer'
import { DEFAULT_ACCEPTS_BY_ROLE, DEFAULT_TRACK_COLOR } from './constants'
import type { Track, TrackId, TrackRole } from './index'
import { createInstrumentIdForTrack, type InstrumentId } from '~/domain/instrument'
import type { PatternKind } from '~/domain/patterns'

export function createTrack(input: {
  id: TrackId
  name: string
  role: TrackRole
  accepts?: PatternKind[]
  mixChannelId?: MixChannelId
  color?: string
  instrumentId?: InstrumentId
}): Track {
  return {
    accepts: input.accepts ?? [...DEFAULT_ACCEPTS_BY_ROLE[input.role]],
    color: input.color ?? DEFAULT_TRACK_COLOR,
    id: input.id,
    instrumentId: input.instrumentId ?? createInstrumentIdForTrack(input.id),
    mixChannelId: input.mixChannelId ?? createMixChannelIdForTrack(input.id),
    name: input.name,
    role: input.role,
  }
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
