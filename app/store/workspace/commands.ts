import {
  addBlock,
  addPattern,
  addPatternEvent,
  addSection,
  addTimelineEvent,
  addTrack,
  deleteBlocks,
  deletePatternEvents,
  deleteSections,
  deleteTimelineEvents,
  duplicateBlocks,
  duplicateSections,
  duplicateTrack,
  moveBlock,
  moveSection,
  removeMixChannels,
  removePattern,
  removeTracks,
  reorderTracks,
  resizeBlock,
  resizeSection,
  setGridDivision,
  splitBlock,
  splitSection,
  updateBlock,
  updateMixChannel,
  updateMixer,
  updatePattern,
  updatePatternEvent,
  updateSection,
  updateTimelineEvent,
  updateTrack,
} from './operations'
import type { Workspace } from './type'
import {
  type Block,
  type BlockId,
  createMixChannel,
  type GridDivision,
  type MasterMixChannel,
  type MixChannel,
  type MixChannelId,
  type Pattern,
  type PatternEvent,
  type PatternEventId,
  type PatternId,
  type Section,
  type SectionId,
  type Tick,
  type TimelineEvent,
  type TimelineEventId,
  type Track,
  type TrackId,
} from '~/domain'
import type {
  CommandPayload,
  JsonValue,
  WorkspaceCommand,
  WorkspaceCommandKind,
} from '~/store/session/command'

let workspaceCommandSequence = 1

export function applyWorkspaceCommand(
  workspace: Workspace,
  command: WorkspaceCommand,
): Workspace {
  const { payload } = command

  switch (command.kind) {
    case 'addBlock': {
      const block = getPayloadObject<Block>(payload, 'block')
      return block === undefined ? workspace : addBlock(workspace, block)
    }
    case 'deleteBlock':
      return deleteBlocks(workspace, getPayloadStringArray(payload, 'blockIds'))
    case 'duplicateBlock':
      return duplicateBlocks(
        workspace,
        getPayloadStringArray(payload, 'blockIds'),
        getPayloadNumber(payload, 'offsetTicks') ?? workspace.timeline.ppq,
      )
    case 'moveBlock': {
      const blockId = getPayloadString(payload, 'blockId')
      const startTick = getPayloadNumber(payload, 'startTick')

      return blockId === undefined || startTick === undefined
        ? workspace
        : moveBlock(workspace, blockId, startTick, getPayloadString(payload, 'trackId'))
    }
    case 'resizeBlock': {
      const blockId = getPayloadString(payload, 'blockId')
      const startTick = getPayloadNumber(payload, 'startTick')
      const lengthTicks = getPayloadNumber(payload, 'lengthTicks')

      return blockId === undefined || startTick === undefined || lengthTicks === undefined
        ? workspace
        : resizeBlock(workspace, blockId, startTick, lengthTicks)
    }
    case 'splitBlock': {
      const blockId = getPayloadString(payload, 'blockId')
      const splitTick = getPayloadNumber(payload, 'splitTick')

      return blockId === undefined || splitTick === undefined
        ? workspace
        : splitBlock(workspace, blockId, splitTick)
    }
    case 'updateBlock': {
      const block = getPayloadObject<Block>(payload, 'block')
      return block === undefined ? workspace : updateBlock(workspace, block)
    }
    case 'addSection': {
      const section = getPayloadObject<Section>(payload, 'section')
      return section === undefined ? workspace : addSection(workspace, section)
    }
    case 'deleteSection':
      return deleteSections(workspace, getPayloadStringArray(payload, 'sectionIds'))
    case 'duplicateSection':
      return duplicateSections(
        workspace,
        getPayloadStringArray(payload, 'sectionIds'),
        getPayloadNumber(payload, 'offsetTicks') ?? workspace.timeline.ppq,
      )
    case 'moveSection': {
      const sectionId = getPayloadString(payload, 'sectionId')
      const startTick = getPayloadNumber(payload, 'startTick')
      return sectionId === undefined || startTick === undefined
        ? workspace
        : moveSection(workspace, sectionId, startTick)
    }
    case 'resizeSection': {
      const sectionId = getPayloadString(payload, 'sectionId')
      const startTick = getPayloadNumber(payload, 'startTick')
      const lengthTicks = getPayloadNumber(payload, 'lengthTicks')
      return sectionId === undefined || startTick === undefined || lengthTicks === undefined
        ? workspace
        : resizeSection(workspace, sectionId, startTick, lengthTicks)
    }
    case 'splitSection': {
      const sectionId = getPayloadString(payload, 'sectionId')
      const splitTick = getPayloadNumber(payload, 'splitTick')
      return sectionId === undefined || splitTick === undefined
        ? workspace
        : splitSection(workspace, sectionId, splitTick)
    }
    case 'updateSection': {
      const section = getPayloadObject<Section>(payload, 'section')
      return section === undefined ? workspace : updateSection(workspace, section)
    }
    case 'addTrack': {
      const track = getPayloadObject<Track>(payload, 'track')
      const mixChannel = getPayloadObject<MixChannel>(payload, 'mixChannel')
      return track === undefined || mixChannel === undefined
        ? workspace
        : addTrack(workspace, track, mixChannel)
    }
    case 'deleteTrack':
      return removeTracks(workspace, getPayloadStringArray(payload, 'trackIds'))
    case 'duplicateTrack': {
      const trackId = getPayloadString(payload, 'trackId')
      return trackId === undefined ? workspace : duplicateTrack(workspace, trackId)
    }
    case 'updateTrack': {
      const track = getPayloadObject<Track>(payload, 'track')
      return track === undefined ? workspace : updateTrack(workspace, track)
    }
    case 'reorderTrack':
      return reorderTracks(workspace, getPayloadStringArray(payload, 'trackIds'))
    case 'deleteMixChannel':
      return removeMixChannels(workspace, getPayloadStringArray(payload, 'mixChannelIds'))
    case 'updateMixChannel': {
      const mixChannel = getPayloadObject<MixChannel>(payload, 'mixChannel')
      return mixChannel === undefined ? workspace : updateMixChannel(workspace, mixChannel)
    }
    case 'updateMixer': {
      const update = getPayloadObject<Partial<MasterMixChannel>>(payload, 'update')
      return update === undefined ? workspace : updateMixer(workspace, update)
    }
    case 'addPattern': {
      const pattern = getPayloadObject<Pattern>(payload, 'pattern')
      return pattern === undefined ? workspace : addPattern(workspace, pattern)
    }
    case 'deletePattern': {
      const patternId = getPayloadString(payload, 'patternId')
      return patternId === undefined ? workspace : removePattern(workspace, patternId)
    }
    case 'updatePattern': {
      const pattern = getPayloadObject<Pattern>(payload, 'pattern')
      return pattern === undefined ? workspace : updatePattern(workspace, pattern)
    }
    case 'addPatternEvent': {
      const patternId = getPayloadString(payload, 'patternId')
      const event = getPayloadObject<PatternEvent>(payload, 'event')
      return patternId === undefined || event === undefined
        ? workspace
        : addPatternEvent(workspace, patternId, event)
    }
    case 'deletePatternEvent':
      return deletePatternEvents(workspace, getPayloadStringArray(payload, 'eventIds'))
    case 'updatePatternEvent': {
      const patternId = getPayloadString(payload, 'patternId')
      const event = getPayloadObject<PatternEvent>(payload, 'event')
      return patternId === undefined || event === undefined
        ? workspace
        : updatePatternEvent(workspace, patternId, event)
    }
    case 'addTimelineEvent': {
      const event = getPayloadObject<TimelineEvent>(payload, 'event')
      return event === undefined ? workspace : addTimelineEvent(workspace, event)
    }
    case 'deleteTimelineEvent':
      return deleteTimelineEvents(workspace, getPayloadStringArray(payload, 'eventIds'))
    case 'updateTimelineEvent': {
      const event = getPayloadObject<TimelineEvent>(payload, 'event')
      return event === undefined ? workspace : updateTimelineEvent(workspace, event)
    }
    case 'setGridDivision': {
      const grid = getPayloadString(payload, 'grid') as GridDivision | undefined
      return grid === undefined ? workspace : setGridDivision(workspace, grid)
    }
  }
}

export function createAddBlockCommand(block: Block): WorkspaceCommand {
  return createWorkspaceCommandRecord('addBlock', `Add block ${block.name}`, { block: toJsonValue(block) })
}

export function createDeleteBlockCommand(blockIds: readonly BlockId[]): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'deleteBlock',
    `Delete ${blockIds.length} block${blockIds.length === 1 ? '' : 's'}`,
    { blockIds: [...blockIds] },
  )
}

export function createDuplicateBlockCommand(
  blockIds: readonly BlockId[],
  offsetTicks: number,
): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'duplicateBlock',
    `Duplicate ${blockIds.length} block${blockIds.length === 1 ? '' : 's'}`,
    { blockIds: [...blockIds], offsetTicks },
  )
}

export function createMoveBlockCommand(
  blockId: BlockId,
  startTick: Tick,
  trackId?: TrackId,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('moveBlock', 'Move block', {
    blockId,
    startTick,
    ...(trackId === undefined ? {} : { trackId }),
  })
}

export function createResizeBlockCommand(
  blockId: BlockId,
  startTick: Tick,
  lengthTicks: number,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('resizeBlock', 'Resize block', { blockId, lengthTicks, startTick })
}

export function createSplitBlockCommand(blockId: BlockId, splitTick: Tick): WorkspaceCommand {
  return createWorkspaceCommandRecord('splitBlock', 'Split block', { blockId, splitTick })
}

export function createUpdateBlockCommand(block: Block): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateBlock', `Update block ${block.name}`, { block: toJsonValue(block) })
}

export function createAddSectionCommand(section: Section): WorkspaceCommand {
  return createWorkspaceCommandRecord('addSection', `Add section ${section.name}`, { section: toJsonValue(section) })
}

export function createDeleteSectionCommand(sectionIds: readonly SectionId[]): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'deleteSection',
    `Delete ${sectionIds.length} section${sectionIds.length === 1 ? '' : 's'}`,
    { sectionIds: [...sectionIds] },
  )
}

export function createDuplicateSectionCommand(
  sectionIds: readonly SectionId[],
  offsetTicks: number,
): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'duplicateSection',
    `Duplicate ${sectionIds.length} section${sectionIds.length === 1 ? '' : 's'}`,
    { offsetTicks, sectionIds: [...sectionIds] },
  )
}

export function createMoveSectionCommand(sectionId: SectionId, startTick: Tick): WorkspaceCommand {
  return createWorkspaceCommandRecord('moveSection', 'Move section', { sectionId, startTick })
}

export function createResizeSectionCommand(
  sectionId: SectionId,
  startTick: Tick,
  lengthTicks: number,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('resizeSection', 'Resize section', { lengthTicks, sectionId, startTick })
}

export function createSplitSectionCommand(sectionId: SectionId, splitTick: Tick): WorkspaceCommand {
  return createWorkspaceCommandRecord('splitSection', 'Split section', { sectionId, splitTick })
}

export function createUpdateSectionCommand(section: Section): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateSection', `Update section ${section.name}`, {
    section: toJsonValue(section),
  })
}

export function createAddTrackCommand(
  track: Track,
  mixChannel: MixChannel = createMixChannel({ id: track.mixChannelId }),
): WorkspaceCommand {
  return createWorkspaceCommandRecord('addTrack', `Add track ${track.name}`, {
    mixChannel: toJsonValue(mixChannel),
    track: toJsonValue(track),
  })
}

export function createDeleteTrackCommand(trackIds: readonly TrackId[]): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'deleteTrack',
    `Delete ${trackIds.length} track${trackIds.length === 1 ? '' : 's'}`,
    { trackIds: [...trackIds] },
  )
}

export function createDuplicateTrackCommand(trackId: TrackId): WorkspaceCommand {
  return createWorkspaceCommandRecord('duplicateTrack', 'Duplicate track', { trackId })
}

export function createUpdateTrackCommand(track: Track): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateTrack', `Update track ${track.name}`, { track: toJsonValue(track) })
}

export function createReorderTrackCommand(trackIds: readonly TrackId[]): WorkspaceCommand {
  return createWorkspaceCommandRecord('reorderTrack', 'Reorder tracks', { trackIds: [...trackIds] })
}

export function createDeleteMixChannelCommand(
  mixChannelIds: readonly MixChannelId[],
): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'deleteMixChannel',
    `Delete ${mixChannelIds.length} mix channel${mixChannelIds.length === 1 ? '' : 's'}`,
    { mixChannelIds: [...mixChannelIds] },
  )
}

export function createUpdateMixChannelCommand(mixChannel: MixChannel): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateMixChannel', 'Update mix channel', {
    mixChannel: toJsonValue(mixChannel),
  })
}

export function createUpdateMixerCommand(
  update: Partial<MasterMixChannel>,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateMixer', 'Update mixer', {
    update: toJsonValue(update),
  })
}

export function createAddPatternCommand(pattern: Pattern): WorkspaceCommand {
  return createWorkspaceCommandRecord('addPattern', `Add pattern ${pattern.name}`, { pattern: toJsonValue(pattern) })
}

export function createDeletePatternCommand(patternId: PatternId): WorkspaceCommand {
  return createWorkspaceCommandRecord('deletePattern', 'Delete pattern', { patternId })
}

export function createUpdatePatternCommand(pattern: Partial<Pattern>): WorkspaceCommand {
  return createWorkspaceCommandRecord('updatePattern', `Update pattern ${pattern.name}`, {
    pattern: toJsonValue(pattern),
  })
}

export function createAddPatternEventCommand(patternId: PatternId, event: PatternEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('addPatternEvent', `Add ${event.kind} event`, {
    event: toJsonValue(event),
    patternId,
  })
}

export function createDeletePatternEventCommand(eventIds: readonly PatternEventId[]): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'deletePatternEvent',
    `Delete ${eventIds.length} pattern event${eventIds.length === 1 ? '' : 's'}`,
    { eventIds: [...eventIds] },
  )
}

export function createUpdatePatternEventCommand(
  patternId: PatternId,
  event: PatternEvent,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('updatePatternEvent', `Update ${event.kind} event`, {
    event: toJsonValue(event),
    patternId,
  })
}

export function createAddTimelineEventCommand(event: TimelineEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('addTimelineEvent', 'Add timeline event', {
    event: toJsonValue(event),
  })
}

export function createDeleteTimelineEventCommand(eventIds: readonly TimelineEventId[]): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'deleteTimelineEvent',
    `Delete ${eventIds.length} timeline event${eventIds.length === 1 ? '' : 's'}`,
    { eventIds: [...eventIds] },
  )
}

export function createUpdateTimelineEventCommand(event: TimelineEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateTimelineEvent', 'Update timeline event', {
    event: toJsonValue(event),
  })
}

export function createSetGridDivisionCommand(grid: GridDivision): WorkspaceCommand {
  return createWorkspaceCommandRecord('setGridDivision', `Set grid ${grid}`, { grid })
}

function createWorkspaceCommandRecord(
  kind: WorkspaceCommandKind,
  label: string,
  payload: CommandPayload,
): WorkspaceCommand {
  const sequence = workspaceCommandSequence
  workspaceCommandSequence += 1

  return {
    createdAt: new Date().toISOString(),
    id: `workspace_command_${sequence}`,
    kind,
    label,
    payload,
    target: 'workspace',
  }
}

function getPayloadObject<TValue>(payload: CommandPayload, key: string): TValue | undefined {
  const value = payload[key]

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }

  return value as TValue
}

function getPayloadStringArray(payload: CommandPayload, key: string): string[] {
  const value = payload[key]

  return Array.isArray(value)
    ? value.filter(item => typeof item === 'string')
    : []
}

function getPayloadString(payload: CommandPayload, key: string): string | undefined {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function getPayloadNumber(payload: CommandPayload, key: string): number | undefined {
  const value = payload[key]
  return typeof value === 'number' ? value : undefined
}

function toJsonValue<TValue>(value: TValue): JsonValue {
  return value as JsonValue
}
