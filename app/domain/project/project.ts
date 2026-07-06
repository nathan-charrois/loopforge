import { type Arrangement, getBlockEndTick } from '../arrangement'
import type { Tick } from '../musicPrimitives'
import { type Pattern, type PatternId, validatePattern } from '../patterns'
import { type Timeline, validateTimeline } from '../timeline'
import { type Track, type TrackId, validateTrack } from '../tracks'

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

export function getProjectEndTick(project: Project): Tick {
  const sectionEndTicks = project.arrangement.sections.map(section => section.startTick + section.lengthTicks)
  const blockEndTicks = project.arrangement.blocks.map(getBlockEndTick)

  return Math.max(0, ...sectionEndTicks, ...blockEndTicks)
}

export function getHighestBlockEndTick(project: Project): Tick {
  return project.arrangement.blocks.reduce((latestEndTick, block) => Math.max(latestEndTick, getBlockEndTick(block)), 0)
}
