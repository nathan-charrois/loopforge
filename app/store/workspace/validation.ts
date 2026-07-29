import type { EntityStore } from '../type'
import { selectMixChannel, selectPattern, selectTrack } from './selector'
import type { Workspace } from './type'
import { isMixChannelPan, isMixVolumeDb, type MasterMixChannel, type MixChannel } from '~/domain/mixer'
import { validatePattern } from '~/domain/patterns'
import { validateProject } from '~/domain/project'
import { validateTimeline } from '~/domain/timeline'
import { validateTrack } from '~/domain/tracks'

export function validateWorkspace(workspace: Workspace): string[] {
  const errors: string[] = []

  errors.push(...validateProject(workspace.project))
  errors.push(...validateTimeline(workspace.timeline))
  errors.push(...validateMasterMixChannel(workspace.mixer.master))
  errors.push(...validateEntityStore('mix channel', workspace.mixer.channels))
  errors.push(...validateEntityStore('track', workspace.tracks))
  errors.push(...validateEntityStore('pattern', workspace.patterns))
  errors.push(...validateEntityStore('instruments', workspace.instruments))

  for (const trackId of workspace.tracks.allIds) {
    const track = selectTrack(workspace, trackId)

    if (track !== undefined) {
      errors.push(...validateTrack(track))
    }
  }

  for (const mixChannelId of workspace.mixer.channels.allIds) {
    const mixChannel = selectMixChannel(workspace, mixChannelId)

    if (mixChannel !== undefined) {
      errors.push(...validateMixChannel(mixChannel))
    }
  }

  for (const patternId of workspace.patterns.allIds) {
    const pattern = selectPattern(workspace, patternId)

    if (pattern !== undefined) {
      errors.push(...validatePattern(pattern))
    }
  }

  for (const block of workspace.arrangement.blocks) {
    const track = selectTrack(workspace, block.trackId)
    if (track === undefined) {
      errors.push(`Block ${block.id} references missing track ${block.trackId}.`)
    }

    const pattern = selectPattern(workspace, block.patternId)
    if (pattern === undefined) {
      errors.push(`Block ${block.id} references missing pattern ${block.patternId}.`)
    }

    if (track && pattern) {
      if (track.accepts.includes(pattern.kind) === false) {
        errors.push(`Block ${block.id} references invalid pattern ${block.patternId}.`)
      }
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

export function validateMasterMixChannel(master: MasterMixChannel): string[] {
  return isMixVolumeDb(master.volumeDb)
    ? []
    : ['Master mix channel volumeDb must be finite.']
}

export function validateMixChannel(channel: MixChannel): string[] {
  const errors: string[] = []

  if (typeof channel.id !== 'string' || channel.id.length === 0) {
    errors.push('Mix channel id must not be empty.')
  }

  if (!isMixVolumeDb(channel.volumeDb)) {
    errors.push(`Mix channel ${channel.id} volumeDb must be finite.`)
  }

  if (!isMixChannelPan(channel.pan)) {
    errors.push(`Mix channel ${channel.id} pan must be between -1 and 1.`)
  }

  return errors
}
