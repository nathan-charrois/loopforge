import {
  createAddBlockCommand,
  createAddKeyEventCommand,
  createAddMeterEventCommand,
  createAddPatternCommand,
  createAddPatternEventCommand,
  createAddSectionCommand,
  createAddTempoEventCommand,
  createAddTrackCommand,
  createAssignBlockPatternCommand,
  createDeleteBlockCommand,
  createDeleteKeyEventCommand,
  createDeleteMeterEventCommand,
  createDeletePatternCommand,
  createDeletePatternEventCommand,
  createDeleteSectionCommand,
  createDeleteTempoEventCommand,
  createDeleteTrackCommand,
  createDuplicateBlockCommand,
  createDuplicateSectionCommand,
  createMoveBlockCommand,
  createMoveBlockToTrackCommand,
  createMoveSectionCommand,
  createMoveTimelineEventCommand,
  createRenameBlockCommand,
  createRenameSectionCommand,
  createResizeBlockCommand,
  createResizeSectionCommand,
  createSetBlockColorCommand,
  createSetBlockMutedCommand,
  createSetBlockPlaybackModeCommand,
  createSetGridDivisionCommand,
  createSplitBlockCommand,
  createSplitSectionCommand,
  createUpdateKeyEventCommand,
  createUpdateMeterEventCommand,
  createUpdatePatternCommand,
  createUpdateTempoEventCommand,
  createUpdateTrackCommand,
} from './commands'
import type { Workspace } from './type'
import {
  type Block,
  type BlockId,
  type BlockPlaybackMode,
  getTimelineEventField,
  type GridDivision,
  type KeyEvent,
  type MeterEvent,
  type Pattern,
  type PatternEvent,
  type PatternId,
  type Section,
  type SectionId,
  type TempoEvent,
  type Tick,
  type TimelineEvent,
  type Track,
  type TrackId,
} from '~/domain'
import type { WorkspaceCommand, WorkspaceCommandKind } from '~/store/session'

export function addBlockAction(workspace: Workspace, block: Block): WorkspaceCommand {
  if (workspace.arrangement.blocks.some(currentBlock => currentBlock.id === block.id)) {
    throw new Error(`Block ${block.id} already exists.`)
  }

  return createAddBlockCommand(block)
}

export function deleteBlockAction(workspace: Workspace, blockIds: readonly BlockId[]): WorkspaceCommand {
  const blocks = blockIds.map(blockId => requireBlock(workspace, blockId))

  return createDeleteBlockCommand(
    blocks.map(block => block.id),
    `Delete ${blocks.length} block${blocks.length === 1 ? '' : 's'}`,
  )
}

export function duplicateBlockAction(
  workspace: Workspace,
  blockIds: readonly BlockId[],
  offsetTicks = workspace.timeline.ppq,
): WorkspaceCommand {
  const blocks = blockIds.map(blockId => requireBlock(workspace, blockId))

  return createDuplicateBlockCommand(
    blocks.map(block => block.id),
    offsetTicks,
    `Duplicate ${blocks.length} block${blocks.length === 1 ? '' : 's'}`,
  )
}

export function moveBlockAction(
  workspace: Workspace,
  blockId: BlockId,
  startTick: Tick,
  trackId?: TrackId,
): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)

  if (trackId !== undefined) {
    requireTrack(workspace, trackId)
  }

  return createMoveBlockCommand(blockId, startTick, trackId, `Move block ${block.name}`)
}

export function resizeBlockAction(
  workspace: Workspace,
  blockId: BlockId,
  startTick: Tick,
  lengthTicks: number,
): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  return createResizeBlockCommand(blockId, startTick, lengthTicks, `Resize block ${block.name}`)
}

export function splitBlockAction(
  workspace: Workspace,
  blockId: BlockId,
  requestedSplitTick: Tick,
): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  return createSplitBlockCommand(blockId, requestedSplitTick, `Split block ${block.name}`)
}

export function renameBlockAction(workspace: Workspace, blockId: BlockId, name: string): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  return createRenameBlockCommand(blockId, name, `Rename block ${block.name}`)
}

export function setBlockMutedAction(workspace: Workspace, blockId: BlockId, muted: boolean): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  return createSetBlockMutedCommand(blockId, muted, `${muted ? 'Mute' : 'Unmute'} block ${block.name}`)
}

export function setBlockColorAction(workspace: Workspace, blockId: BlockId, color: string): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  return createSetBlockColorCommand(blockId, color, `Set block color ${block.name}`)
}

export function setBlockPlaybackModeAction(
  workspace: Workspace,
  blockId: BlockId,
  playbackMode: BlockPlaybackMode,
): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  return createSetBlockPlaybackModeCommand(blockId, playbackMode, `Set block playback ${block.name}`)
}

export function assignBlockPatternAction(
  workspace: Workspace,
  blockId: BlockId,
  patternId: PatternId,
): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  requirePattern(workspace, patternId)
  return createAssignBlockPatternCommand(blockId, patternId, `Assign pattern ${block.name}`)
}

export function moveBlockToTrackAction(
  workspace: Workspace,
  blockId: BlockId,
  trackId: TrackId,
): WorkspaceCommand {
  const block = requireBlock(workspace, blockId)
  requireTrack(workspace, trackId)
  return createMoveBlockToTrackCommand(blockId, trackId, `Move block to track ${block.name}`)
}

export function addSectionAction(workspace: Workspace, section: Section): WorkspaceCommand {
  if (workspace.arrangement.sections.some(currentSection => currentSection.id === section.id)) {
    throw new Error(`Section ${section.id} already exists.`)
  }

  return createAddSectionCommand(section)
}

export function deleteSectionAction(workspace: Workspace, sectionIds: readonly SectionId[]): WorkspaceCommand {
  const sections = sectionIds.map(sectionId => requireSection(workspace, sectionId))

  return createDeleteSectionCommand(
    sections.map(section => section.id),
    `Delete ${sections.length} section${sections.length === 1 ? '' : 's'}`,
  )
}

export function duplicateSectionAction(
  workspace: Workspace,
  sectionIds: readonly SectionId[],
  offsetTicks = workspace.timeline.ppq,
): WorkspaceCommand {
  const sections = sectionIds.map(sectionId => requireSection(workspace, sectionId))

  return createDuplicateSectionCommand(
    sections.map(section => section.id),
    offsetTicks,
    `Duplicate ${sections.length} section${sections.length === 1 ? '' : 's'}`,
  )
}

export function moveSectionAction(workspace: Workspace, sectionId: SectionId, startTick: Tick): WorkspaceCommand {
  const section = requireSection(workspace, sectionId)
  return createMoveSectionCommand(sectionId, startTick, `Move section ${section.name}`)
}

export function resizeSectionAction(
  workspace: Workspace,
  sectionId: SectionId,
  startTick: Tick,
  lengthTicks: number,
): WorkspaceCommand {
  const section = requireSection(workspace, sectionId)
  return createResizeSectionCommand(sectionId, startTick, lengthTicks, `Resize section ${section.name}`)
}

export function splitSectionAction(
  workspace: Workspace,
  sectionId: SectionId,
  requestedSplitTick: Tick,
): WorkspaceCommand {
  const section = requireSection(workspace, sectionId)
  return createSplitSectionCommand(sectionId, requestedSplitTick, `Split section ${section.name}`)
}

export function renameSectionAction(workspace: Workspace, sectionId: SectionId, name: string): WorkspaceCommand {
  const section = requireSection(workspace, sectionId)
  return createRenameSectionCommand(sectionId, name, `Rename section ${section.name}`)
}

export function addTrackAction(workspace: Workspace, track: Track): WorkspaceCommand {
  if (workspace.tracks.byId[track.id] !== undefined) {
    throw new Error(`Track ${track.id} already exists.`)
  }

  return createAddTrackCommand(track)
}

export function deleteTrackAction(workspace: Workspace, trackId: TrackId): WorkspaceCommand {
  const track = requireTrack(workspace, trackId)
  return createDeleteTrackCommand(trackId, `Delete track ${track.name}`)
}

export function updateTrackAction(
  workspace: Workspace,
  kind: WorkspaceCommandKind,
  label: string,
  track: Track,
): WorkspaceCommand {
  requireTrack(workspace, track.id)
  return createUpdateTrackCommand(kind, label, track)
}

export function addPatternAction(workspace: Workspace, pattern: Pattern): WorkspaceCommand {
  if (workspace.patterns.byId[pattern.id] !== undefined) {
    throw new Error(`Pattern ${pattern.id} already exists.`)
  }

  return createAddPatternCommand(pattern)
}

export function deletePatternAction(workspace: Workspace, patternId: PatternId): WorkspaceCommand {
  const pattern = requirePattern(workspace, patternId)
  return createDeletePatternCommand(patternId, `Delete pattern ${pattern.name}`)
}

export function updatePatternAction(
  workspace: Workspace,
  kind: WorkspaceCommandKind,
  label: string,
  pattern: Pattern,
): WorkspaceCommand {
  requirePattern(workspace, pattern.id)
  return createUpdatePatternCommand(kind, label, pattern)
}

export function addPatternEventAction(
  workspace: Workspace,
  patternId: PatternId,
  event: PatternEvent,
): WorkspaceCommand {
  const pattern = requirePattern(workspace, patternId)

  if (pattern.events.some(currentEvent => currentEvent.id === event.id)) {
    throw new Error(`Pattern event ${event.id} already exists.`)
  }

  return createAddPatternEventCommand(patternId, event)
}

export function deletePatternEventAction(
  workspace: Workspace,
  patternId: PatternId,
  eventId: string,
): WorkspaceCommand {
  const event = requirePatternEvent(workspace, patternId, eventId)
  return createDeletePatternEventCommand(patternId, eventId, `Delete ${event.kind} event`)
}

export function addTempoEventAction(workspace: Workspace, event: TempoEvent): WorkspaceCommand {
  return createAddTempoEventCommand(event)
}

export function deleteTempoEventAction(workspace: Workspace, tick: Tick): WorkspaceCommand {
  requireTimelineEventAtTick(workspace, 'tempoEvents', tick)
  return createDeleteTempoEventCommand(tick)
}

export function updateTempoEventAction(
  workspace: Workspace,
  previousTick: Tick,
  event: TempoEvent,
): WorkspaceCommand {
  requireTimelineEventAtTick(workspace, 'tempoEvents', previousTick)
  return createUpdateTempoEventCommand(previousTick, event)
}

export function addMeterEventAction(workspace: Workspace, event: MeterEvent): WorkspaceCommand {
  return createAddMeterEventCommand(event)
}

export function deleteMeterEventAction(workspace: Workspace, tick: Tick): WorkspaceCommand {
  requireTimelineEventAtTick(workspace, 'meterEvents', tick)
  return createDeleteMeterEventCommand(tick)
}

export function updateMeterEventAction(
  workspace: Workspace,
  previousTick: Tick,
  event: MeterEvent,
): WorkspaceCommand {
  requireTimelineEventAtTick(workspace, 'meterEvents', previousTick)
  return createUpdateMeterEventCommand(previousTick, event)
}

export function addKeyEventAction(workspace: Workspace, event: KeyEvent): WorkspaceCommand {
  return createAddKeyEventCommand(event)
}

export function deleteKeyEventAction(workspace: Workspace, tick: Tick): WorkspaceCommand {
  requireTimelineEventAtTick(workspace, 'keyEvents', tick)
  return createDeleteKeyEventCommand(tick)
}

export function updateKeyEventAction(
  workspace: Workspace,
  previousTick: Tick,
  event: KeyEvent,
): WorkspaceCommand {
  requireTimelineEventAtTick(workspace, 'keyEvents', previousTick)
  return createUpdateKeyEventCommand(previousTick, event)
}

export function moveTimelineEventAction(
  workspace: Workspace,
  event: TimelineEvent,
  tick: Tick,
): WorkspaceCommand {
  const field = getTimelineEventField(event)
  const currentEvent = workspace.timeline[field].find(candidate => candidate.id === event.id)

  if (currentEvent === undefined) {
    throw new Error(`Timeline event ${event.id} does not exist.`)
  }

  return createMoveTimelineEventCommand(event.id, field, tick)
}

export function setGridDivisionAction(workspace: Workspace, grid: GridDivision): WorkspaceCommand {
  return createSetGridDivisionCommand(grid)
}

function requireBlock(workspace: Workspace, blockId: BlockId): Block {
  const block = workspace.arrangement.blocks.find(currentBlock => currentBlock.id === blockId)

  if (block === undefined) {
    throw new Error(`Block ${blockId} does not exist.`)
  }

  return block
}

function requireSection(workspace: Workspace, sectionId: SectionId): Section {
  const section = workspace.arrangement.sections.find(currentSection => currentSection.id === sectionId)

  if (section === undefined) {
    throw new Error(`Section ${sectionId} does not exist.`)
  }

  return section
}

function requireTrack(workspace: Workspace, trackId: TrackId): Track {
  const track = workspace.tracks.byId[trackId]

  if (track === undefined) {
    throw new Error(`Track ${trackId} does not exist.`)
  }

  return track
}

function requirePattern(workspace: Workspace, patternId: PatternId): Pattern {
  const pattern = workspace.patterns.byId[patternId]

  if (pattern === undefined) {
    throw new Error(`Pattern ${patternId} does not exist.`)
  }

  return pattern
}

function requirePatternEvent(workspace: Workspace, patternId: PatternId, eventId: string): PatternEvent {
  const pattern = requirePattern(workspace, patternId)
  const event = pattern.events.find(currentEvent => currentEvent.id === eventId)

  if (event === undefined) {
    throw new Error(`Pattern event ${eventId} does not exist.`)
  }

  return event
}

function requireTimelineEventAtTick(
  workspace: Workspace,
  field: 'keyEvents' | 'meterEvents' | 'tempoEvents',
  tick: Tick,
): TimelineEvent {
  const event = workspace.timeline[field].find(currentEvent => currentEvent.tick === tick)

  if (event === undefined) {
    throw new Error(`${field} event at tick ${tick} does not exist.`)
  }

  return event
}
