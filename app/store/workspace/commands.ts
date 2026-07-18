import {
  addBlock,
  addKeyEvent,
  addMeterEvent,
  addPattern,
  addPatternEvent,
  addSection,
  addTempoEvent,
  addTrack,
  assignBlockPattern,
  deleteBlocks,
  deleteKeyEvent,
  deleteMeterEvent,
  deletePatternEvent,
  deleteSections,
  deleteTempoEvent,
  duplicateBlocks,
  duplicateSections,
  moveBlock,
  moveBlockToTrack,
  moveSection,
  moveTimelineEvent,
  removePattern,
  removeTrack,
  renameBlock,
  renameSection,
  reorderTracks,
  resizeBlock,
  resizeSection,
  setBlockColor,
  setBlockMuted,
  setBlockPlaybackMode,
  setGridDivision,
  splitBlock,
  splitSection,
  updateKeyEvent,
  updateMeterEvent,
  updatePattern,
  updatePatternEvent,
  updateTempoEvent,
  updateTrack,
} from './operations'
import type { Workspace } from './type'
import type {
  Block,
  BlockId,
  BlockPlaybackMode,
  GridDivision,
  KeyEvent,
  MeterEvent,
  Pattern,
  PatternEvent,
  PatternId,
  Section,
  SectionId,
  TempoEvent,
  Tick,
  TimelineEventField,
  Track,
  TrackId,
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
    case 'renameBlock': {
      const blockId = getPayloadString(payload, 'blockId')
      const name = getPayloadString(payload, 'name')
      return blockId === undefined || name === undefined ? workspace : renameBlock(workspace, blockId, name)
    }
    case 'setBlockMuted': {
      const blockId = getPayloadString(payload, 'blockId')
      const muted = getPayloadBoolean(payload, 'muted')
      return blockId === undefined || muted === undefined ? workspace : setBlockMuted(workspace, blockId, muted)
    }
    case 'setBlockColor': {
      const blockId = getPayloadString(payload, 'blockId')
      const color = getPayloadString(payload, 'color')
      return blockId === undefined || color === undefined ? workspace : setBlockColor(workspace, blockId, color)
    }
    case 'setBlockPlaybackMode': {
      const blockId = getPayloadString(payload, 'blockId')
      const playbackMode = getPayloadString(payload, 'playbackMode') as BlockPlaybackMode | undefined
      return blockId === undefined || playbackMode === undefined
        ? workspace
        : setBlockPlaybackMode(workspace, blockId, playbackMode)
    }
    case 'assignBlockPattern': {
      const blockId = getPayloadString(payload, 'blockId')
      const patternId = getPayloadString(payload, 'patternId')
      return blockId === undefined || patternId === undefined
        ? workspace
        : assignBlockPattern(workspace, blockId, patternId)
    }
    case 'moveBlockToTrack': {
      const blockId = getPayloadString(payload, 'blockId')
      const trackId = getPayloadString(payload, 'trackId')
      return blockId === undefined || trackId === undefined
        ? workspace
        : moveBlockToTrack(workspace, blockId, trackId)
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
    case 'renameSection': {
      const sectionId = getPayloadString(payload, 'sectionId')
      const name = getPayloadString(payload, 'name')
      return sectionId === undefined || name === undefined
        ? workspace
        : renameSection(workspace, sectionId, name)
    }
    case 'addTrack': {
      const track = getPayloadObject<Track>(payload, 'track')
      return track === undefined ? workspace : addTrack(workspace, track)
    }
    case 'deleteTrack': {
      const trackId = getPayloadString(payload, 'trackId')
      return trackId === undefined ? workspace : removeTrack(workspace, trackId)
    }
    case 'renameTrack':
    case 'setTrackMuted':
    case 'setTrackSoloed':
    case 'setTrackVolume':
    case 'setTrackColor':
    case 'setTrackInstrument': {
      const track = getPayloadObject<Track>(payload, 'track')
      return track === undefined ? workspace : updateTrack(workspace, track)
    }
    case 'reorderTrack':
      return reorderTracks(workspace, getPayloadStringArray(payload, 'trackIds'))
    case 'addPattern':
    case 'duplicatePattern': {
      const pattern = getPayloadObject<Pattern>(payload, 'pattern')
      return pattern === undefined ? workspace : addPattern(workspace, pattern)
    }
    case 'deletePattern': {
      const patternId = getPayloadString(payload, 'patternId')
      return patternId === undefined ? workspace : removePattern(workspace, patternId)
    }
    case 'renamePattern': {
      const pattern = getPayloadObject<Pattern>(payload, 'pattern')
      return pattern === undefined ? workspace : updatePattern(workspace, pattern)
    }
    case 'addPatternEvent':
    case 'duplicatePatternEvent': {
      const patternId = getPayloadString(payload, 'patternId')
      const event = getPayloadObject<PatternEvent>(payload, 'event')
      return patternId === undefined || event === undefined
        ? workspace
        : addPatternEvent(workspace, patternId, event)
    }
    case 'deletePatternEvent': {
      const patternId = getPayloadString(payload, 'patternId')
      const eventId = getPayloadString(payload, 'eventId')
      return patternId === undefined || eventId === undefined
        ? workspace
        : deletePatternEvent(workspace, patternId, eventId)
    }
    case 'movePatternEvent':
    case 'resizePatternEvent':
    case 'updatePatternEvent': {
      const patternId = getPayloadString(payload, 'patternId')
      const event = getPayloadObject<PatternEvent>(payload, 'event')
      return patternId === undefined || event === undefined
        ? workspace
        : updatePatternEvent(workspace, patternId, event)
    }
    case 'addTempoEvent': {
      const event = getPayloadObject<TempoEvent>(payload, 'event')
      return event === undefined ? workspace : addTempoEvent(workspace, event)
    }
    case 'deleteTempoEvent': {
      const tick = getPayloadNumber(payload, 'tick')
      return tick === undefined ? workspace : deleteTempoEvent(workspace, tick)
    }
    case 'updateTempoEvent': {
      const previousTick = getPayloadNumber(payload, 'previousTick')
      const event = getPayloadObject<TempoEvent>(payload, 'event')
      return previousTick === undefined || event === undefined
        ? workspace
        : updateTempoEvent(workspace, previousTick, event)
    }
    case 'addMeterEvent': {
      const event = getPayloadObject<MeterEvent>(payload, 'event')
      return event === undefined ? workspace : addMeterEvent(workspace, event)
    }
    case 'deleteMeterEvent': {
      const tick = getPayloadNumber(payload, 'tick')
      return tick === undefined ? workspace : deleteMeterEvent(workspace, tick)
    }
    case 'updateMeterEvent': {
      const previousTick = getPayloadNumber(payload, 'previousTick')
      const event = getPayloadObject<MeterEvent>(payload, 'event')
      return previousTick === undefined || event === undefined
        ? workspace
        : updateMeterEvent(workspace, previousTick, event)
    }
    case 'addKeyEvent': {
      const event = getPayloadObject<KeyEvent>(payload, 'event')
      return event === undefined ? workspace : addKeyEvent(workspace, event)
    }
    case 'deleteKeyEvent': {
      const tick = getPayloadNumber(payload, 'tick')
      return tick === undefined ? workspace : deleteKeyEvent(workspace, tick)
    }
    case 'updateKeyEvent': {
      const previousTick = getPayloadNumber(payload, 'previousTick')
      const event = getPayloadObject<KeyEvent>(payload, 'event')
      return previousTick === undefined || event === undefined
        ? workspace
        : updateKeyEvent(workspace, previousTick, event)
    }
    case 'moveTimelineEvent': {
      const eventId = getPayloadString(payload, 'eventId')
      const field = getPayloadString(payload, 'field') as TimelineEventField | undefined
      const tick = getPayloadNumber(payload, 'tick')
      return eventId === undefined || field === undefined || tick === undefined
        ? workspace
        : moveTimelineEvent(workspace, eventId, field, tick)
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

export function createDeleteBlockCommand(blockIds: readonly BlockId[], label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('deleteBlock', label, { blockIds: [...blockIds] })
}

export function createDuplicateBlockCommand(
  blockIds: readonly BlockId[],
  offsetTicks: number,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('duplicateBlock', label, { blockIds: [...blockIds], offsetTicks })
}

export function createMoveBlockCommand(
  blockId: BlockId,
  startTick: Tick,
  trackId: TrackId | undefined,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('moveBlock', label, {
    blockId,
    startTick,
    ...(trackId === undefined ? {} : { trackId }),
  })
}

export function createResizeBlockCommand(
  blockId: BlockId,
  startTick: Tick,
  lengthTicks: number,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('resizeBlock', label, { blockId, lengthTicks, startTick })
}

export function createSplitBlockCommand(blockId: BlockId, splitTick: Tick, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('splitBlock', label, { blockId, splitTick })
}

export function createRenameBlockCommand(blockId: BlockId, name: string, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('renameBlock', label, { blockId, name })
}

export function createSetBlockMutedCommand(blockId: BlockId, muted: boolean, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('setBlockMuted', label, { blockId, muted })
}

export function createSetBlockColorCommand(blockId: BlockId, color: string, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('setBlockColor', label, { blockId, color })
}

export function createSetBlockPlaybackModeCommand(
  blockId: BlockId,
  playbackMode: BlockPlaybackMode,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('setBlockPlaybackMode', label, { blockId, playbackMode })
}

export function createAssignBlockPatternCommand(
  blockId: BlockId,
  patternId: PatternId,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('assignBlockPattern', label, { blockId, patternId })
}

export function createMoveBlockToTrackCommand(
  blockId: BlockId,
  trackId: TrackId,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('moveBlockToTrack', label, { blockId, trackId })
}

export function createAddSectionCommand(section: Section): WorkspaceCommand {
  return createWorkspaceCommandRecord('addSection', `Add section ${section.name}`, { section: toJsonValue(section) })
}

export function createDeleteSectionCommand(sectionIds: readonly SectionId[], label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('deleteSection', label, { sectionIds: [...sectionIds] })
}

export function createDuplicateSectionCommand(
  sectionIds: readonly SectionId[],
  offsetTicks: number,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('duplicateSection', label, { offsetTicks, sectionIds: [...sectionIds] })
}

export function createMoveSectionCommand(sectionId: SectionId, startTick: Tick, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('moveSection', label, { sectionId, startTick })
}

export function createResizeSectionCommand(
  sectionId: SectionId,
  startTick: Tick,
  lengthTicks: number,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('resizeSection', label, { lengthTicks, sectionId, startTick })
}

export function createSplitSectionCommand(sectionId: SectionId, splitTick: Tick, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('splitSection', label, { sectionId, splitTick })
}

export function createRenameSectionCommand(sectionId: SectionId, name: string, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('renameSection', label, { name, sectionId })
}

export function createAddTempoEventCommand(event: TempoEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('addTempoEvent', `Add tempo ${event.bpm}`, { event: toJsonValue(event) })
}

export function createDeleteTempoEventCommand(tick: Tick): WorkspaceCommand {
  return createWorkspaceCommandRecord('deleteTempoEvent', 'Delete tempo event', { tick })
}

export function createUpdateTempoEventCommand(previousTick: Tick, event: TempoEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateTempoEvent', `Update tempo ${event.bpm}`, {
    event: toJsonValue(event),
    previousTick,
  })
}

export function createAddMeterEventCommand(event: MeterEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'addMeterEvent',
    `Add meter ${event.timeSignature.numerator}/${event.timeSignature.denominator}`,
    { event: toJsonValue(event) },
  )
}

export function createDeleteMeterEventCommand(tick: Tick): WorkspaceCommand {
  return createWorkspaceCommandRecord('deleteMeterEvent', 'Delete meter event', { tick })
}

export function createUpdateMeterEventCommand(previousTick: Tick, event: MeterEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord(
    'updateMeterEvent',
    `Update meter ${event.timeSignature.numerator}/${event.timeSignature.denominator}`,
    { event: toJsonValue(event), previousTick },
  )
}

export function createAddKeyEventCommand(event: KeyEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('addKeyEvent', 'Add key event', { event: toJsonValue(event) })
}

export function createDeleteKeyEventCommand(tick: Tick): WorkspaceCommand {
  return createWorkspaceCommandRecord('deleteKeyEvent', 'Delete key event', { tick })
}

export function createUpdateKeyEventCommand(previousTick: Tick, event: KeyEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('updateKeyEvent', 'Update key event', {
    event: toJsonValue(event),
    previousTick,
  })
}

export function createMoveTimelineEventCommand(
  eventId: string,
  field: TimelineEventField,
  tick: Tick,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('moveTimelineEvent', 'Move timeline event', { eventId, field, tick })
}

export function createSetGridDivisionCommand(grid: GridDivision): WorkspaceCommand {
  return createWorkspaceCommandRecord('setGridDivision', `Set grid ${grid}`, { grid })
}

export function createAddTrackCommand(track: Track): WorkspaceCommand {
  return createWorkspaceCommandRecord('addTrack', `Add track ${track.name}`, { track: toJsonValue(track) })
}

export function createDeleteTrackCommand(trackId: TrackId, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('deleteTrack', label, { trackId })
}

export function createUpdateTrackCommand(
  kind: WorkspaceCommandKind,
  label: string,
  track: Track,
): WorkspaceCommand {
  return createWorkspaceCommandRecord(kind, label, { track: toJsonValue(track) })
}

export function createAddPatternCommand(pattern: Pattern): WorkspaceCommand {
  return createWorkspaceCommandRecord('addPattern', `Add pattern ${pattern.name}`, { pattern: toJsonValue(pattern) })
}

export function createDeletePatternCommand(patternId: PatternId, label: string): WorkspaceCommand {
  return createWorkspaceCommandRecord('deletePattern', label, { patternId })
}

export function createUpdatePatternCommand(
  kind: WorkspaceCommandKind,
  label: string,
  pattern: Pattern,
): WorkspaceCommand {
  return createWorkspaceCommandRecord(kind, label, { pattern: toJsonValue(pattern) })
}

export function createAddPatternEventCommand(patternId: PatternId, event: PatternEvent): WorkspaceCommand {
  return createWorkspaceCommandRecord('addPatternEvent', `Add ${event.kind} event`, {
    event: toJsonValue(event),
    patternId,
  })
}

export function createDeletePatternEventCommand(
  patternId: PatternId,
  eventId: string,
  label: string,
): WorkspaceCommand {
  return createWorkspaceCommandRecord('deletePatternEvent', label, { eventId, patternId })
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

function getPayloadBoolean(payload: CommandPayload, key: string): boolean | undefined {
  const value = payload[key]
  return typeof value === 'boolean' ? value : undefined
}

function toJsonValue<TValue>(value: TValue): JsonValue {
  return value as JsonValue
}
