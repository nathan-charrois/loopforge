import { addEntity, removeEntity, updateEntity } from '../type'
import {
  selectBlock,
  selectMixChannel,
  selectPattern,
  selectPatternEvent,
  selectPatternIdForEvent,
  selectSection,
  selectTimelineEvent,
  selectTrack,
} from './selector'
import type { Workspace } from './type'
import { validateMixChannel } from './validation'
import {
  type Block,
  type BlockId,
  type BlockPlaybackMode,
  createMixChannel,
  getTimelineEventField,
  type GridDivision,
  type MixChannel,
  type MixChannelId,
  type Mixer,
  type PatternEvent,
  type PatternEventId,
  type PatternId,
  type Section,
  type SectionId,
  sortPatternEventsByTime,
  sortTimelineEventsByTick,
  type Tick,
  type TimelineEvent,
  type TimelineEventId,
  type TrackId,
} from '~/domain'
import type { Pattern } from '~/domain/patterns'
import { touchProject } from '~/domain/project'
import type { Timeline } from '~/domain/timeline'
import type { Track } from '~/domain/tracks'

export function setTimeline(workspace: Workspace, timeline: Timeline): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    timeline,
  }
}

export function addTrack(
  workspace: Workspace,
  track: Track,
  mixChannel: MixChannel = createMixChannel({ id: track.mixChannelId }),
): Workspace {
  if (workspace.tracks.byId[track.id] !== undefined) {
    throw new Error(`Track ${track.id} already exists.`)
  }

  if (mixChannel.id !== track.mixChannelId) {
    throw new Error(`Track ${track.id} must reference mix channel ${mixChannel.id}.`)
  }

  if (workspace.mixer.channels.byId[mixChannel.id] !== undefined) {
    throw new Error(`Mix channel ${mixChannel.id} already exists.`)
  }

  if (workspace.tracks.allIds.some(trackId => (
    workspace.tracks.byId[trackId].mixChannelId === mixChannel.id
  ))) {
    throw new Error(`Mix channel ${mixChannel.id} is already referenced by a track.`)
  }

  const mixChannelErrors = validateMixChannel(mixChannel)

  if (mixChannelErrors.length > 0) {
    throw new Error(mixChannelErrors.join(' '))
  }

  return {
    ...workspace,
    mixer: {
      ...workspace.mixer,
      channels: addEntity(workspace.mixer.channels, mixChannel),
    },
    project: touchProject(workspace.project),
    tracks: addEntity(workspace.tracks, track),
  }
}

export function updateTrack(workspace: Workspace, track: Track): Workspace {
  const currentTrack = requireTrack(workspace, track.id)

  if (currentTrack.mixChannelId !== track.mixChannelId) {
    throw new Error(`Track ${track.id} cannot change its mix channel.`)
  }

  return {
    ...workspace,
    project: touchProject(workspace.project),
    tracks: updateEntity(workspace.tracks, track),
  }
}

export function removeTrack(workspace: Workspace, trackId: string): Workspace {
  const track = requireTrack(workspace, trackId)
  requireMixChannel(workspace, track.mixChannelId)

  return {
    ...workspace,
    mixer: {
      ...workspace.mixer,
      channels: removeEntity(workspace.mixer.channels, track.mixChannelId),
    },
    project: touchProject(workspace.project),
    tracks: removeEntity(workspace.tracks, trackId),
  }
}

export function duplicateTrack(workspace: Workspace, trackId: TrackId): Workspace {
  const track = requireTrack(workspace, trackId)
  const mixChannel = requireMixChannel(workspace, track.mixChannelId)
  const duplicateTrackId = createUniqueId(
    `${track.id}_copy`,
    new Set(workspace.tracks.allIds),
  )
  const duplicateMixChannelId = createUniqueId(
    `${mixChannel.id}_copy`,
    new Set([
      ...workspace.mixer.channels.allIds,
      ...workspace.tracks.allIds.map(currentTrackId => (
        workspace.tracks.byId[currentTrackId].mixChannelId
      )),
    ]),
  )

  return addTrack(
    workspace,
    {
      ...track,
      id: duplicateTrackId,
      mixChannelId: duplicateMixChannelId,
      name: `${track.name} Copy`,
    },
    {
      ...mixChannel,
      id: duplicateMixChannelId,
    },
  )
}

export function updateMixer(workspace: Workspace, mixer: Mixer): Workspace {
  return {
    ...workspace,
    mixer,
    project: touchProject(workspace.project),
  }
}

export function addPattern(workspace: Workspace, pattern: Pattern): Workspace {
  if (workspace.patterns.byId[pattern.id] !== undefined) {
    throw new Error(`Pattern ${pattern.id} already exists.`)
  }

  return {
    ...workspace,
    project: touchProject(workspace.project),
    patterns: addEntity(workspace.patterns, pattern),
  }
}

export function updatePattern(workspace: Workspace, pattern: Pattern): Workspace {
  requirePattern(workspace, pattern.id)

  return {
    ...workspace,
    project: touchProject(workspace.project),
    patterns: updateEntity(workspace.patterns, pattern),
  }
}

export function removePattern(workspace: Workspace, patternId: string): Workspace {
  requirePattern(workspace, patternId)

  return {
    ...workspace,
    project: touchProject(workspace.project),
    patterns: removeEntity(workspace.patterns, patternId),
  }
}

export function addSection(workspace: Workspace, section: Section): Workspace {
  if (workspace.arrangement.sections.some(currentSection => currentSection.id === section.id)) {
    throw new Error(`Section ${section.id} already exists.`)
  }

  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      sections: [...workspace.arrangement.sections, section],
    },
    project: touchProject(workspace.project),
  }
}

export function updateSection(workspace: Workspace, section: Section): Workspace {
  requireSection(workspace, section.id)

  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      sections: workspace.arrangement.sections.map(currentSection => currentSection.id === section.id
        ? section
        : currentSection),
    },
    project: touchProject(workspace.project),
  }
}

export function removeSection(workspace: Workspace, sectionId: string): Workspace {
  requireSection(workspace, sectionId)

  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      sections: workspace.arrangement.sections.filter(section => section.id !== sectionId),
    },
    project: touchProject(workspace.project),
  }
}

export function addBlock(workspace: Workspace, block: Block): Workspace {
  if (workspace.arrangement.blocks.some(currentBlock => currentBlock.id === block.id)) {
    throw new Error(`Block ${block.id} already exists.`)
  }

  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      blocks: [...workspace.arrangement.blocks, block],
    },
    project: touchProject(workspace.project),
  }
}

export function updateBlock(workspace: Workspace, block: Block): Workspace {
  requireBlock(workspace, block.id)

  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      blocks: workspace.arrangement.blocks.map(currentBlock => currentBlock.id === block.id
        ? block
        : currentBlock),
    },
    project: touchProject(workspace.project),
  }
}

export function removeBlock(workspace: Workspace, blockId: string): Workspace {
  requireBlock(workspace, blockId)

  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      blocks: workspace.arrangement.blocks.filter(block => block.id !== blockId),
    },
    project: touchProject(workspace.project),
  }
}

export function deleteBlocks(workspace: Workspace, blockIds: readonly BlockId[]): Workspace {
  return blockIds.reduce(removeBlock, workspace)
}

export function duplicateBlocks(
  workspace: Workspace,
  blockIds: readonly BlockId[],
  offsetTicks: number,
): Workspace {
  const existingIds = new Set(workspace.arrangement.blocks.map(block => block.id))

  return blockIds.reduce((nextWorkspace, blockId, index) => {
    const block = requireBlock(workspace, blockId)
    const id = createUniqueId(`${block.id}_copy`, existingIds)
    existingIds.add(id)

    return addBlock(nextWorkspace, {
      ...block,
      id,
      name: `${block.name} Copy`,
      startTick: Math.max(0, block.startTick + offsetTicks + (index * 120)),
    })
  }, workspace)
}

export function moveBlock(
  workspace: Workspace,
  blockId: BlockId,
  startTick: Tick,
  trackId?: TrackId,
): Workspace {
  const block = requireBlock(workspace, blockId)

  if (trackId !== undefined) {
    requireTrack(workspace, trackId)
  }

  return updateBlock(workspace, {
    ...block,
    startTick: Math.max(0, Math.round(startTick)),
    trackId: trackId ?? block.trackId,
  })
}

export function resizeBlock(
  workspace: Workspace,
  blockId: BlockId,
  startTick: Tick,
  lengthTicks: number,
): Workspace {
  const block = requireBlock(workspace, blockId)

  return updateBlock(workspace, {
    ...block,
    lengthTicks: Math.max(1, Math.round(lengthTicks)),
    startTick: Math.max(0, Math.round(startTick)),
  })
}

export function splitBlock(
  workspace: Workspace,
  blockId: BlockId,
  requestedSplitTick: Tick,
): Workspace {
  const block = requireBlock(workspace, blockId)
  const blockEndTick = block.startTick + block.lengthTicks
  const splitTick = Math.max(
    block.startTick + 1,
    Math.min(blockEndTick - 1, Math.round(requestedSplitTick)),
  )
  const rightBlockId = createUniqueId(
    `${block.id}_split`,
    new Set(workspace.arrangement.blocks.map(currentBlock => currentBlock.id)),
  )
  const leftBlock: Block = {
    ...block,
    lengthTicks: splitTick - block.startTick,
  }
  const rightBlock: Block = {
    ...block,
    id: rightBlockId,
    lengthTicks: blockEndTick - splitTick,
    name: `${block.name} Split`,
    startTick: splitTick,
  }

  return addBlock(updateBlock(workspace, leftBlock), rightBlock)
}

export function renameBlock(workspace: Workspace, blockId: BlockId, name: string): Workspace {
  const block = requireBlock(workspace, blockId)

  return updateBlock(workspace, {
    ...block,
    name: name.trim() || block.name,
  })
}

export function setBlockMuted(workspace: Workspace, blockId: BlockId, muted: boolean): Workspace {
  return updateBlockField(workspace, blockId, { muted })
}

export function setBlockColor(workspace: Workspace, blockId: BlockId, color: string): Workspace {
  return updateBlockField(workspace, blockId, { color })
}

export function setBlockPlaybackMode(
  workspace: Workspace,
  blockId: BlockId,
  playbackMode: BlockPlaybackMode,
): Workspace {
  return updateBlockField(workspace, blockId, { playbackMode })
}

export function assignBlockPattern(
  workspace: Workspace,
  blockId: BlockId,
  patternId: PatternId,
): Workspace {
  requirePattern(workspace, patternId)

  return updateBlockField(workspace, blockId, { patternId })
}

export function moveBlockToTrack(
  workspace: Workspace,
  blockId: BlockId,
  trackId: TrackId,
): Workspace {
  requireTrack(workspace, trackId)

  return updateBlockField(workspace, blockId, { trackId })
}

export function deleteSections(workspace: Workspace, sectionIds: readonly SectionId[]): Workspace {
  return sectionIds.reduce(removeSection, workspace)
}

export function duplicateSections(
  workspace: Workspace,
  sectionIds: readonly SectionId[],
  offsetTicks: number,
): Workspace {
  const existingIds = new Set(workspace.arrangement.sections.map(section => section.id))

  return sectionIds.reduce((nextWorkspace, sectionId, index) => {
    const section = requireSection(workspace, sectionId)
    const id = createUniqueId(`${section.id}_copy`, existingIds)
    existingIds.add(id)

    return addSection(nextWorkspace, {
      ...section,
      id,
      name: `${section.name} Copy`,
      startTick: Math.max(0, section.startTick + offsetTicks + (index * 120)),
    })
  }, workspace)
}

export function moveSection(workspace: Workspace, sectionId: SectionId, startTick: Tick): Workspace {
  const section = requireSection(workspace, sectionId)

  return updateSection(workspace, {
    ...section,
    startTick: Math.max(0, Math.round(startTick)),
  })
}

export function resizeSection(
  workspace: Workspace,
  sectionId: SectionId,
  startTick: Tick,
  lengthTicks: number,
): Workspace {
  const section = requireSection(workspace, sectionId)

  return updateSection(workspace, {
    ...section,
    lengthTicks: Math.max(1, Math.round(lengthTicks)),
    startTick: Math.max(0, Math.round(startTick)),
  })
}

export function splitSection(
  workspace: Workspace,
  sectionId: SectionId,
  requestedSplitTick: Tick,
): Workspace {
  const section = requireSection(workspace, sectionId)
  const sectionEndTick = section.startTick + section.lengthTicks
  const splitTick = Math.max(
    section.startTick + 1,
    Math.min(sectionEndTick - 1, Math.round(requestedSplitTick)),
  )
  const rightSectionId = createUniqueId(
    `${section.id}_split`,
    new Set(workspace.arrangement.sections.map(currentSection => currentSection.id)),
  )
  const leftSection: Section = {
    ...section,
    lengthTicks: splitTick - section.startTick,
  }
  const rightSection: Section = {
    ...section,
    id: rightSectionId,
    lengthTicks: sectionEndTick - splitTick,
    name: `${section.name} Split`,
    startTick: splitTick,
  }

  return addSection(updateSection(workspace, leftSection), rightSection)
}

export function renameSection(workspace: Workspace, sectionId: SectionId, name: string): Workspace {
  const section = requireSection(workspace, sectionId)

  return updateSection(workspace, {
    ...section,
    name: name.trim() || section.name,
  })
}

export function reorderTracks(workspace: Workspace, trackIds: readonly TrackId[]): Workspace {
  const knownIds = new Set(workspace.tracks.allIds)
  const orderedIds = trackIds.filter(trackId => knownIds.has(trackId))
  const remainingIds = workspace.tracks.allIds.filter(trackId => !orderedIds.includes(trackId))

  return {
    ...workspace,
    project: touchProject(workspace.project),
    tracks: {
      ...workspace.tracks,
      allIds: [...orderedIds, ...remainingIds],
    },
  }
}

export function addPatternEvent(
  workspace: Workspace,
  patternId: PatternId,
  event: PatternEvent,
): Workspace {
  const pattern = requirePattern(workspace, patternId)

  if (pattern.events.some(currentEvent => currentEvent.id === event.id)) {
    throw new Error(`Pattern event ${event.id} already exists.`)
  }

  return updatePattern(workspace, {
    ...pattern,
    events: sortPatternEventsByTime([...pattern.events, event]),
  } as Pattern)
}

export function deletePatternEvent(
  workspace: Workspace,
  eventId: PatternEventId,
): Workspace {
  const patternId = selectPatternIdForEvent(workspace, eventId)

  if (patternId === undefined) {
    throw new Error(`Pattern event ${eventId} does not exist.`)
  }

  const pattern = requirePattern(workspace, patternId)

  return updatePattern(workspace, {
    ...pattern,
    events: pattern.events.filter(event => event.id !== eventId),
  } as Pattern)
}

export function deletePatternEvents(
  workspace: Workspace,
  eventIds: readonly PatternEventId[],
): Workspace {
  return eventIds.reduce(deletePatternEvent, workspace)
}

export function updatePatternEvent(
  workspace: Workspace,
  patternId: PatternId,
  event: PatternEvent,
): Workspace {
  const pattern = requirePatternEvent(workspace, patternId, event.id).pattern

  return updatePattern(workspace, {
    ...pattern,
    events: sortPatternEventsByTime(pattern.events.map(currentEvent => (
      currentEvent.id === event.id ? event : currentEvent
    ))),
  } as Pattern)
}

export function addTimelineEvent(workspace: Workspace, event: TimelineEvent): Workspace {
  const field = getTimelineEventField(event)
  const events = workspace.timeline[field]

  if (selectTimelineEvent(workspace, event.id) !== undefined) {
    throw new Error(`Timeline event ${event.id} already exists.`)
  }

  return setTimeline(workspace, {
    ...workspace.timeline,
    [field]: sortTimelineEventsByTick([
      ...events.filter(currentEvent => currentEvent.tick !== event.tick),
      event,
    ]),
  })
}

export function deleteTimelineEvent(
  workspace: Workspace,
  eventId: TimelineEventId,
): Workspace {
  const event = selectTimelineEvent(workspace, eventId)

  if (event === undefined) {
    throw new Error(`Timeline event ${eventId} does not exist.`)
  }

  const field = getTimelineEventField(event)

  return setTimeline(workspace, {
    ...workspace.timeline,
    [field]: workspace.timeline[field].filter(currentEvent => currentEvent.id !== eventId),
  })
}

export function deleteTimelineEvents(
  workspace: Workspace,
  eventIds: readonly TimelineEventId[],
): Workspace {
  return eventIds.reduce(deleteTimelineEvent, workspace)
}

export function updateTimelineEvent(workspace: Workspace, event: TimelineEvent): Workspace {
  const current = selectTimelineEvent(workspace, event.id)

  if (current === undefined) {
    throw new Error(`Timeline event ${event.id} does not exist.`)
  }

  const currentField = getTimelineEventField(current)
  const nextField = getTimelineEventField(event)

  if (currentField !== nextField) {
    throw new Error(`Timeline event ${event.id} cannot change kind.`)
  }

  return setTimeline(workspace, {
    ...workspace.timeline,
    [currentField]: sortTimelineEventsByTick([
      ...workspace.timeline[currentField].filter(currentEvent => (
        currentEvent.id !== event.id && currentEvent.tick !== event.tick
      )),
      event,
    ]),
  })
}

export function setGridDivision(workspace: Workspace, grid: GridDivision): Workspace {
  return setTimeline(workspace, {
    ...workspace.timeline,
    grid,
  })
}

function updateBlockField(
  workspace: Workspace,
  blockId: BlockId,
  fields: Partial<Block>,
): Workspace {
  const block = requireBlock(workspace, blockId)

  return updateBlock(workspace, {
    ...block,
    ...fields,
  })
}

function requireBlock(workspace: Workspace, blockId: BlockId): Block {
  const block = selectBlock(workspace, blockId)

  if (block === undefined) {
    throw new Error(`Block ${blockId} does not exist.`)
  }

  return block
}

function requireSection(workspace: Workspace, sectionId: SectionId): Section {
  const section = selectSection(workspace, sectionId)

  if (section === undefined) {
    throw new Error(`Section ${sectionId} does not exist.`)
  }

  return section
}

function requireTrack(workspace: Workspace, trackId: TrackId): Track {
  const track = selectTrack(workspace, trackId)

  if (track === undefined) {
    throw new Error(`Track ${trackId} does not exist.`)
  }

  return track
}

function requireMixChannel(workspace: Workspace, mixChannelId: MixChannelId): MixChannel {
  const mixChannel = selectMixChannel(workspace, mixChannelId)

  if (mixChannel === undefined) {
    throw new Error(`Mix channel ${mixChannelId} does not exist.`)
  }

  return mixChannel
}

function requirePattern(workspace: Workspace, patternId: PatternId): Pattern {
  const pattern = selectPattern(workspace, patternId)

  if (pattern === undefined) {
    throw new Error(`Pattern ${patternId} does not exist.`)
  }

  return pattern
}

function requirePatternEvent(workspace: Workspace, patternId: PatternId, eventId: PatternEventId): {
  event: PatternEvent
  pattern: Pattern
} {
  const pattern = requirePattern(workspace, patternId)
  const event = selectPatternEvent(workspace, patternId, eventId)

  if (event === undefined) {
    throw new Error(`Pattern event ${eventId} does not exist.`)
  }

  return { event, pattern }
}

function createUniqueId(prefix: string, existingIds: Set<string>): string {
  if (!existingIds.has(prefix)) {
    return prefix
  }

  let index = 2
  let id = `${prefix}_${index}`

  while (existingIds.has(id)) {
    index += 1
    id = `${prefix}_${index}`
  }

  return id
}
