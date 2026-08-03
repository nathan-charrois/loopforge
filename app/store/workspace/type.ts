import type { EntityStore } from '../type'
import type {
  Arrangement,
  Instrument,
  Mixer,
  Pattern,
  Project,
  Timeline,
  Track,
} from '~/domain'

export type Workspace = {
  mixer: Mixer
  project: Project
  timeline: Timeline
  arrangement: Arrangement
  tracks: EntityStore<Track>
  patterns: EntityStore<Pattern>
  instruments: EntityStore<Instrument>
}

export const isWorkspace = (
  value: unknown,
): value is Partial<Workspace> => {
  if (value === null) {
    return false
  }

  return typeof value === 'object' && 'project' in value
}
