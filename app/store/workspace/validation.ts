import type { EntityStore } from '../type'
import { selectPattern, selectTrack } from './selector'
import type { Workspace } from './type'
import { validatePattern } from '~/domain/patterns'
import { validateProject } from '~/domain/project'
import { validateTimeline } from '~/domain/timeline'
import { validateTrack } from '~/domain/tracks'

export function validateWorkspace(workspace: Workspace): string[] {
  const errors: string[] = []

  errors.push(...validateProject(workspace.project))
  errors.push(...validateTimeline(workspace.timeline))
  errors.push(...validateEntityStore('track', workspace.tracks))
  errors.push(...validateEntityStore('pattern', workspace.patterns))

  for (const trackId of workspace.tracks.allIds) {
    const track = selectTrack(workspace, trackId)

    if (track !== undefined) {
      errors.push(...validateTrack(track))
    }
  }

  for (const patternId of workspace.patterns.allIds) {
    const pattern = selectPattern(workspace, patternId)

    if (pattern !== undefined) {
      errors.push(...validatePattern(pattern))
    }
  }

  for (const block of workspace.arrangement.blocks) {
    if (selectTrack(workspace, block.trackId) === undefined) {
      errors.push(`Block ${block.id} references missing track ${block.trackId}.`)
    }

    if (selectPattern(workspace, block.patternId) === undefined) {
      errors.push(`Block ${block.id} references missing pattern ${block.patternId}.`)
    }
  }

  return errors
}

export function validateEntityStore<TEntity>(label: string, store: EntityStore<TEntity>): string[] {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const entityId of store.allIds) {
    if (ids.has(entityId)) {
      errors.push(`Duplicate ${label} id ${entityId}.`)
    }

    ids.add(entityId)

    if (store.byId[entityId] === undefined) {
      errors.push(`${label} id ${entityId} is missing from byId.`)
    }
  }

  for (const entityId of Object.keys(store.byId)) {
    if (!ids.has(entityId)) {
      errors.push(`${label} ${entityId} is missing from allIds.`)
    }
  }

  return errors
}
