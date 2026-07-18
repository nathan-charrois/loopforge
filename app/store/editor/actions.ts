import {
  createCopySelectionCommand,
  createSelectBlockCommand,
  createSelectMixChannelCommand,
  createSelectSectionCommand,
  createSelectTimelineEventCommand,
  createSelectTrackCommand,
  createSetActiveToolCommand,
  createSetClipboardCommand,
  createSetFocusedBlockIdCommand,
  createSetHoveredChordCommand,
  createSetInspectorCommand,
  createSetSelectionCommand,
} from './commands'
import {
  createArrangementBlockDraft,
  createArrangementSectionDraft,
  createInspectorState,
  createRangeSelectionState,
  createSelectionState,
} from './factory'
import { snapToMinimumTimelineRange } from './snap'
import type {
  ActiveTool,
  ClipboardState,
  DragState,
  Editor,
  InspectorDraft,
  InspectorPanel,
  SelectionState,
  TimelineEventDraft,
} from './type'
import {
  type Block,
  type BlockId,
  createDraftEntityId,
  createKeyEvent,
  createMeterEvent,
  createTempoEvent,
  getKeyAtTick,
  getMeterAtTick,
  getSectionEndTick,
  getTempoAtTick,
  isMeterEvent,
  isTempoEvent,
  type Key,
  type MixChannel,
  type MixChannelId,
  type Section,
  type SectionId,
  type Tick,
  type TimelineEvent,
  type TimelineEventId,
  type Track,
  type TrackId,
} from '~/domain'
import type { Command, EditorCommand } from '~/store/session'
import {
  addBlockAction,
  addSectionAction,
  addTimelineEventAction,
  deleteBlockAction,
  deletePatternEventAction,
  deleteSectionAction,
  deleteTimelineEventAction,
  duplicateBlockAction,
  duplicateSectionAction,
  moveBlockAction,
  moveSectionAction,
  resizeBlockAction,
  resizeSectionAction,
  selectBlock,
  selectTimelineEventIds,
  splitBlockAction,
  splitSectionAction,
  updateBlockAction,
  updateMixChannelAction,
  updateSectionAction,
  updateTimelineEventAction,
  updateTrackAction,
  type Workspace,
} from '~/store/workspace'

export function selectBlockAction(
  blockId: BlockId,
  additive = false,
): EditorCommand {
  return createSelectBlockCommand(blockId, additive)
}

export function selectMixChannelAction(
  mixChannelId: MixChannelId,
  additive = false,
): EditorCommand {
  return createSelectMixChannelCommand(mixChannelId, additive)
}

export function selectSectionAction(
  sectionId: SectionId,
  additive = false,
): EditorCommand {
  return createSelectSectionCommand(sectionId, additive)
}

export function selectTimelineEventAction(
  timelineEventId: TimelineEventId,
  additive = false,
): EditorCommand {
  return createSelectTimelineEventCommand(timelineEventId, additive)
}

export function selectTrackAction(
  trackId: TrackId,
  additive = false,
): EditorCommand {
  return createSelectTrackCommand(trackId, additive)
}

export function copySelectionAction(): EditorCommand {
  return createCopySelectionCommand()
}

export function setActiveToolAction(tool: ActiveTool): EditorCommand {
  return createSetActiveToolCommand(tool)
}

export function setHoveredChordAction(
  hoveredChord: Editor['hoveredChord'],
): EditorCommand {
  return createSetHoveredChordCommand(hoveredChord)
}

export function setClipboardAction(clipboard: ClipboardState): EditorCommand {
  return createSetClipboardCommand(clipboard)
}

export function setFocusedBlockIdAction(blockId?: BlockId): EditorCommand {
  return createSetFocusedBlockIdCommand(blockId)
}

export function setInspectorPanelAction(panel: InspectorPanel): EditorCommand {
  return createSetInspectorCommand(`Open ${panel} inspector`, { open: true, panel })
}

export function closeInspectorAction(): EditorCommand {
  return createSetInspectorCommand('Close inspector', createInspectorState())
}

export function setSelectionAction(selection: SelectionState): EditorCommand {
  return createSetSelectionCommand(selection)
}

export function unfocusSelectionAction(focusedBlockId?: BlockId): EditorCommand {
  return focusedBlockId === undefined
    ? createSetSelectionCommand(createSelectionState(), 'Clear selection')
    : createSetFocusedBlockIdCommand()
}

export function deleteSelectionAction(selection: SelectionState): readonly Command[] {
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(deleteBlockAction(selection.selectedBlockIds))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(deleteSectionAction(selection.selectedSectionIds))
  }

  if (selection.selectedPatternEventIds.length > 0) {
    commands.push(deletePatternEventAction(selection.selectedPatternEventIds))
  }

  if (selection.selectedTimelineEventIds.length > 0) {
    commands.push(deleteTimelineEventAction(selection.selectedTimelineEventIds))
  }

  return commands
}

export function duplicateSelectionAction(
  selection: SelectionState,
  offsetTicks: number,
): readonly Command[] {
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(duplicateBlockAction(selection.selectedBlockIds, offsetTicks))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(duplicateSectionAction(selection.selectedSectionIds, offsetTicks))
  }

  return commands
}

export function pasteClipboardAction(clipboard: ClipboardState, offsetTicks: number): readonly Command[] {
  if (clipboard.blockIds.length === 0) {
    return []
  }

  return [duplicateBlockAction(clipboard.blockIds, offsetTicks)]
}

export function applyBlockToolAction(input: {
  block: Block
  tick: Tick
  tool: ActiveTool
}): readonly Command[] {
  const { block, tick, tool } = input

  if (tool === 'erase') {
    return [deleteBlockAction([block.id])]
  }

  if (tool === 'split') {
    return [splitBlockAction(block.id, tick)]
  }

  if (tool === 'mute') {
    return [updateBlockAction({ ...block, muted: !block.muted })]
  }

  return []
}

export function applySectionToolAction(input: {
  section: Section
  tick: Tick
  tool: ActiveTool
}): readonly Command[] {
  const { section, tick, tool } = input

  if (tool === 'erase') {
    return [deleteSectionAction([section.id])]
  }

  if (tool === 'split') {
    return [splitSectionAction(section.id, tick)]
  }

  return []
}

export function completeDragAction(input: {
  dragState: DragState
  endTick: Tick
  movementX: number
  movementY: number
  targetTrackId?: TrackId
  threshold: number
  workspace: Workspace
}): readonly Command[] {
  const {
    dragState,
    endTick,
    movementX,
    movementY,
    targetTrackId,
    threshold,
    workspace,
  } = input

  if (dragState.kind === 'drawBlock') {
    const range = snapToMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const block = createArrangementBlockDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
      trackId: dragState.trackId,
    })

    return [
      addBlockAction(block),
      setSelectionAction({
        ...createSelectionState(),
        selectedBlockIds: [block.id],
      }),
    ]
  }

  if (dragState.kind === 'drawSection') {
    const range = snapToMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const section = createArrangementSectionDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
    })

    return [
      addSectionAction(section),
      setSelectionAction({
        ...createSelectionState(),
        selectedSectionIds: [section.id],
      }),
    ]
  }

  if (dragState.kind === 'selectRange') {
    return isPointerDrag(movementX, movementY, threshold)
      ? [createSetSelectionCommand(createRangeSelectionState(
          workspace,
          dragState.startTick,
          endTick,
          dragState.startRow,
          dragState.currentRow,
        ), 'Select range')]
      : [createSetSelectionCommand(createSelectionState(), 'Clear selection')]
  }

  if (!isPointerDrag(movementX, movementY, threshold)) {
    return []
  }

  if (dragState.kind === 'moveBlock') {
    const deltaTicks = endTick - dragState.startTick

    return dragState.blockIds.flatMap((blockId) => {
      const block = selectBlock(workspace, blockId)

      return block === undefined
        ? []
        : [moveBlockAction(
            block.id,
            Math.max(0, block.startTick + deltaTicks),
            targetTrackId ?? block.trackId,
          )]
    })
  }

  if (dragState.kind === 'resizeBlock') {
    const { block } = dragState

    if (dragState.edge === 'left') {
      const nextStartTick = Math.min(endTick, block.startTick + block.lengthTicks - 1)
      return [resizeBlockAction(
        block.id,
        nextStartTick,
        block.startTick + block.lengthTicks - nextStartTick,
      )]
    }

    const nextEndTick = Math.max(endTick, block.startTick + 1)
    return [resizeBlockAction(block.id, block.startTick, nextEndTick - block.startTick)]
  }

  if (dragState.kind === 'moveSection') {
    const deltaTicks = endTick - dragState.startTick
    return [moveSectionAction(
      dragState.section.id,
      Math.max(0, dragState.section.startTick + deltaTicks),
    )]
  }

  if (dragState.kind === 'resizeSection') {
    const { section } = dragState
    const sectionEndTick = getSectionEndTick(section)

    if (dragState.edge === 'left') {
      const nextStartTick = Math.min(endTick, sectionEndTick - 1)
      return [resizeSectionAction(
        section.id,
        nextStartTick,
        sectionEndTick - nextStartTick,
      )]
    }

    const nextEndTick = Math.max(endTick, section.startTick + 1)
    return [resizeSectionAction(section.id, section.startTick, nextEndTick - section.startTick)]
  }

  if (dragState.kind === 'moveTimelineEvent') {
    const deltaTicks = endTick - dragState.startTick
    return [updateTimelineEventAction({
      ...dragState.event,
      tick: Math.max(0, dragState.event.tick + deltaTicks),
    })]
  }

  return []
}

export function updateBlockFromInspectorAction(input: {
  block: Block
  draft: InspectorDraft
}): Command {
  const { block, draft } = input

  return updateBlockAction({
    ...block,
    color: draft.blockColor,
    muted: draft.blockMuted,
    name: draft.blockName.trim() || block.name,
    playbackMode: draft.blockPlaybackMode,
  })
}

export function updateSectionFromInspectorAction(input: {
  draft: InspectorDraft
  section: Section
}): Command {
  return updateSectionAction({
    ...input.section,
    name: input.draft.sectionName.trim() || input.section.name,
  })
}

export function updateTrackFromInspectorAction(input: {
  draft: InspectorDraft
  track: Track
}): Command {
  return updateTrackAction({
    ...input.track,
    accepts: [...input.draft.trackAccepts],
    color: input.draft.trackColor,
    name: input.draft.trackName.trim() || input.track.name,
    role: input.draft.trackRole,
  })
}

export function updateMixChannelFromInspectorAction(input: {
  draft: InspectorDraft
  mixChannel: MixChannel
}): Command {
  return updateMixChannelAction({
    ...input.mixChannel,
    muted: input.draft.mixChannelMuted,
    pan: input.draft.mixChannelPan,
    soloed: input.draft.mixChannelSoloed,
    volumeDb: input.draft.mixChannelVolumeDb,
  })
}

export function applyTimelineEventToolAction(
  workspace: Workspace,
  tool: ActiveTool,
  tick: Tick,
): readonly Command[] {
  const existingIds = selectTimelineEventIds(workspace)

  if (tool === 'tempo') {
    return [addTimelineEventAction(createTempoEvent({
      id: createDraftEntityId('tempoEvent', existingIds),
      bpm: getTempoAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  if (tool === 'meter') {
    return [addTimelineEventAction(createMeterEvent({
      id: createDraftEntityId('meterEvent', existingIds),
      timeSignature: getMeterAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  if (tool === 'key') {
    return [addTimelineEventAction(createKeyEvent({
      id: createDraftEntityId('keyEvent', existingIds),
      key: getKeyAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  return []
}

export function updateTimelineEventFromInspectorAction(input: {
  draft: TimelineEventDraft
  timelineEvent: TimelineEvent
}): Command {
  const { draft, timelineEvent } = input

  if (isTempoEvent(timelineEvent)) {
    return updateTimelineEventAction(createTempoEvent({
      bpm: draft.tempoBpm,
      id: timelineEvent.id,
      tick: draft.tempoTick,
    }))
  }

  if (isMeterEvent(timelineEvent)) {
    return updateTimelineEventAction(createMeterEvent({
      id: timelineEvent.id,
      tick: draft.meterTick,
      timeSignature: {
        denominator: draft.meterDenominator,
        numerator: draft.meterNumerator,
      },
    }))
  }

  return updateTimelineEventAction(createKeyEvent({
    id: timelineEvent.id,
    key: {
      mode: draft.keyMode,
      tonic: draft.keyTonic as Key['tonic'],
    },
    tick: draft.keyTick,
  }))
}

function isPointerDrag(movementX: number, movementY: number, threshold: number): boolean {
  return movementX >= threshold || movementY >= threshold
}
