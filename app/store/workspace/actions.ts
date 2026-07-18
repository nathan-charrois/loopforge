import {
  createAddBlockCommand,
  createAddPatternCommand,
  createAddPatternEventCommand,
  createAddSectionCommand,
  createAddTimelineEventCommand,
  createAddTrackCommand,
  createDeleteBlockCommand,
  createDeletePatternCommand,
  createDeletePatternEventCommand,
  createDeleteSectionCommand,
  createDeleteTimelineEventCommand,
  createDeleteTrackCommand,
  createDuplicateBlockCommand,
  createDuplicateSectionCommand,
  createDuplicateTrackCommand,
  createMoveBlockCommand,
  createMoveSectionCommand,
  createReorderTrackCommand,
  createResizeBlockCommand,
  createResizeSectionCommand,
  createSetGridDivisionCommand,
  createSplitBlockCommand,
  createSplitSectionCommand,
  createUpdateBlockCommand,
  createUpdateMixChannelCommand,
  createUpdateMixerCommand,
  createUpdatePatternCommand,
  createUpdatePatternEventCommand,
  createUpdateSectionCommand,
  createUpdateTimelineEventCommand,
  createUpdateTrackCommand,
} from './commands'
import type {
  Block,
  BlockId,
  GridDivision,
  MixChannel,
  Mixer,
  Pattern,
  PatternEvent,
  PatternEventId,
  PatternId,
  Section,
  SectionId,
  Tick,
  TimelineEvent,
  TimelineEventId,
  Track,
  TrackId,
} from '~/domain'
import type { WorkspaceCommand } from '~/store/session'

export function addBlockAction(block: Block): WorkspaceCommand {
  return createAddBlockCommand(block)
}

export function deleteBlockAction(blockIds: readonly BlockId[]): WorkspaceCommand {
  return createDeleteBlockCommand(blockIds)
}

export function duplicateBlockAction(
  blockIds: readonly BlockId[],
  offsetTicks: number,
): WorkspaceCommand {
  return createDuplicateBlockCommand(blockIds, offsetTicks)
}

export function moveBlockAction(
  blockId: BlockId,
  startTick: Tick,
  trackId?: TrackId,
): WorkspaceCommand {
  return createMoveBlockCommand(blockId, startTick, trackId)
}

export function resizeBlockAction(
  blockId: BlockId,
  startTick: Tick,
  lengthTicks: number,
): WorkspaceCommand {
  return createResizeBlockCommand(blockId, startTick, lengthTicks)
}

export function splitBlockAction(blockId: BlockId, requestedSplitTick: Tick): WorkspaceCommand {
  return createSplitBlockCommand(blockId, requestedSplitTick)
}

export function updateBlockAction(block: Block): WorkspaceCommand {
  return createUpdateBlockCommand(block)
}

export function addSectionAction(section: Section): WorkspaceCommand {
  return createAddSectionCommand(section)
}

export function deleteSectionAction(sectionIds: readonly SectionId[]): WorkspaceCommand {
  return createDeleteSectionCommand(sectionIds)
}

export function duplicateSectionAction(
  sectionIds: readonly SectionId[],
  offsetTicks: number,
): WorkspaceCommand {
  return createDuplicateSectionCommand(sectionIds, offsetTicks)
}

export function moveSectionAction(sectionId: SectionId, startTick: Tick): WorkspaceCommand {
  return createMoveSectionCommand(sectionId, startTick)
}

export function resizeSectionAction(
  sectionId: SectionId,
  startTick: Tick,
  lengthTicks: number,
): WorkspaceCommand {
  return createResizeSectionCommand(sectionId, startTick, lengthTicks)
}

export function splitSectionAction(sectionId: SectionId, requestedSplitTick: Tick): WorkspaceCommand {
  return createSplitSectionCommand(sectionId, requestedSplitTick)
}

export function updateSectionAction(section: Section): WorkspaceCommand {
  return createUpdateSectionCommand(section)
}

export function addTrackAction(track: Track, mixChannel?: MixChannel): WorkspaceCommand {
  return createAddTrackCommand(track, mixChannel)
}

export function deleteTrackAction(trackId: TrackId): WorkspaceCommand {
  return createDeleteTrackCommand(trackId)
}

export function duplicateTrackAction(trackId: TrackId): WorkspaceCommand {
  return createDuplicateTrackCommand(trackId)
}

export function updateTrackAction(track: Track): WorkspaceCommand {
  return createUpdateTrackCommand(track)
}

export function reorderTrackAction(trackIds: readonly TrackId[]): WorkspaceCommand {
  return createReorderTrackCommand(trackIds)
}

export function updateMixChannelAction(mixChannel: MixChannel): WorkspaceCommand {
  return createUpdateMixChannelCommand(mixChannel)
}

export function updateMixerAction(mixer: Mixer): WorkspaceCommand {
  return createUpdateMixerCommand(mixer)
}

export function addPatternAction(pattern: Pattern): WorkspaceCommand {
  return createAddPatternCommand(pattern)
}

export function deletePatternAction(patternId: PatternId): WorkspaceCommand {
  return createDeletePatternCommand(patternId)
}

export function updatePatternAction(pattern: Pattern): WorkspaceCommand {
  return createUpdatePatternCommand(pattern)
}

export function addPatternEventAction(patternId: PatternId, event: PatternEvent): WorkspaceCommand {
  return createAddPatternEventCommand(patternId, event)
}

export function deletePatternEventAction(patternEventIds: PatternEventId[]): WorkspaceCommand {
  return createDeletePatternEventCommand(patternEventIds)
}

export function updatePatternEventAction(patternId: PatternId, event: PatternEvent): WorkspaceCommand {
  return createUpdatePatternEventCommand(patternId, event)
}

export function addTimelineEventAction(event: TimelineEvent): WorkspaceCommand {
  return createAddTimelineEventCommand(event)
}

export function deleteTimelineEventAction(eventIds: readonly TimelineEventId[]): WorkspaceCommand {
  return createDeleteTimelineEventCommand(eventIds)
}

export function updateTimelineEventAction(event: TimelineEvent): WorkspaceCommand {
  return createUpdateTimelineEventCommand(event)
}

export function setGridDivisionAction(grid: GridDivision): WorkspaceCommand {
  return createSetGridDivisionCommand(grid)
}
