import type { EntityStore } from '../type'
import type { Arrangement, Pattern, Project, Timeline, Track } from '~/domain'

export type Workspace = {
  project: Project
  timeline: Timeline
  arrangement: Arrangement
  tracks: EntityStore<Track>
  patterns: EntityStore<Pattern>
}
