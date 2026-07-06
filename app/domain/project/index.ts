import { type Arrangement, createDefaultArrangement } from '../arrangement'
import { type Pattern, type PatternId, validatePattern } from '../patterns'
import { createDefaultTimeline, type Timeline, validateTimeline } from '../timeline'
import { createDefaultTracks, type Track, type TrackId, validateTrack } from '../tracks'

export type ProjectId = string

export type ProjectMetadata = {
  description?: string
  tags: string[]
}

export type ProjectVersion = {
  schemaVersion: number
  revision: number
}

export type Project = {
  id: ProjectId
  name: string
  createdAt: string
  updatedAt: string
  timeline: Timeline
  arrangement: Arrangement
  tracks: Track[]
  patterns: Pattern[]
  version: ProjectVersion
  metadata: ProjectMetadata
}

export function createProjectMetadata(input: Partial<ProjectMetadata> = {}): ProjectMetadata {
  return {
    description: input.description,
    tags: input.tags ?? [],
  }
}

export function createProjectVersion(input: Partial<ProjectVersion> = {}): ProjectVersion {
  return {
    revision: input.revision ?? 1,
    schemaVersion: input.schemaVersion ?? 1,
  }
}

export function createBlankProject(input: Partial<Project> = {}): Project {
  const createdAt = input.createdAt ?? '1970-01-01T00:00:00.000Z'

  return {
    arrangement: input.arrangement ?? createDefaultArrangement(),
    createdAt,
    id: input.id ?? 'project_draft',
    metadata: input.metadata ?? createProjectMetadata(),
    name: input.name ?? 'Untitled Project',
    patterns: input.patterns ?? [],
    timeline: input.timeline ?? createDefaultTimeline(),
    tracks: input.tracks ?? createDefaultTracks(),
    updatedAt: input.updatedAt ?? createdAt,
    version: input.version ?? createProjectVersion(),
  }
}

export function validateProject(project: Project): string[] {
  const errors: string[] = []
  const trackIds = new Set(project.tracks.map(track => track.id))
  const patternIds = new Set(project.patterns.map(pattern => pattern.id))

  errors.push(...validateTimeline(project.timeline))

  for (const track of project.tracks) {
    errors.push(...validateTrack(track))
  }

  for (const pattern of project.patterns) {
    errors.push(...validatePattern(pattern))
  }

  for (const block of project.arrangement.blocks) {
    if (!trackIds.has(block.trackId)) {
      errors.push(`Block ${block.id} references missing track ${block.trackId}.`)
    }

    if (!patternIds.has(block.patternId)) {
      errors.push(`Block ${block.id} references missing pattern ${block.patternId}.`)
    }
  }

  return errors
}

export function getProjectTrack(project: Project, trackId: TrackId): Track | undefined {
  return project.tracks.find(track => track.id === trackId)
}

export function getProjectPattern(project: Project, patternId: PatternId): Pattern | undefined {
  return project.patterns.find(pattern => pattern.id === patternId)
}
