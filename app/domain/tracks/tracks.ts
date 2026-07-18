import type { MixChannelId } from '../mixer'
import type { PatternKind } from '../patterns'
import { TRACK_ROLES } from './constants'

export type TrackId = string
export type TrackRole = typeof TRACK_ROLES[number]
export type InstrumentSoundId = string

export type Track = {
  id: TrackId
  name: string
  role: TrackRole
  accepts: PatternKind[]
  mixChannelId: MixChannelId
  color: string
  instrumentSoundId: InstrumentSoundId
}

export function canTrackAcceptPatternKind(track: Track, patternKind: PatternKind): boolean {
  return track.accepts.includes(patternKind)
}

export function validateTrack(track: Track): string[] {
  const errors: string[] = []

  if (track.accepts.length === 0) {
    errors.push(`Track ${track.id} must accept at least one pattern kind.`)
  }

  if (typeof track.mixChannelId !== 'string' || track.mixChannelId.length === 0) {
    errors.push(`Track ${track.id} must reference a mix channel.`)
  }

  return errors
}
