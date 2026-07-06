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
  muted: boolean
  soloed: boolean
  volume: number
  color: string
  instrumentSoundId: InstrumentSoundId
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
