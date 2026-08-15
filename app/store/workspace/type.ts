import type { EntityStore } from '../type'
import type {
  Arrangement,
  Effect,
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
  effects: EntityStore<Effect>
}

export const isWorkspace = (
  value: unknown,
): value is Partial<Workspace> => {
  if (value === null) {
    return false
  }

  return typeof value === 'object' && 'project' in value
}
