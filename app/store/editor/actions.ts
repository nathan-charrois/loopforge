import {
  createCopySelectionCommand,
  createSelectBlockCommand,
  createSelectSectionCommand,
  createSelectTimelineEventCommand,
  createSelectTimelineRangeCommand,
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
  createSelectionState,
} from './factory'
import { snapTimelineTick, snapToMinimumTimelineRange } from './snap'
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
  type Section,
  type SectionId,
  type Tick,
  type TimelineEvent,
  type TimelineEventId,
  type TrackId,
} from '~/domain'
import type { Command, EditorCommand } from '~/store/session'
import {
  addBlockAction,
  addKeyEventAction,
  addMeterEventAction,
  addSectionAction,
  addTempoEventAction,
  deleteBlockAction,
  deleteKeyEventAction,
  deleteMeterEventAction,
  deletePatternEventAction,
  deleteSectionAction,
  deleteTempoEventAction,
  duplicateBlockAction,
  duplicateSectionAction,
  moveBlockAction,
  moveSectionAction,
  moveTimelineEventAction,
  renameBlockAction,
  renameSectionAction,
  resizeBlockAction,
  resizeSectionAction,
  selectBlock,
  selectPatternIdForEvent,
  selectTimelineEvent as selectWorkspaceTimelineEvent,
  selectTimelineEventIds,
  setBlockColorAction,
  setBlockMutedAction,
  setBlockPlaybackModeAction,
  splitBlockAction,
  splitSectionAction,
  updateKeyEventAction,
  updateMeterEventAction,
  updateTempoEventAction,
  type Workspace,
} from '~/store/workspace'

export function selectBlockAction(
  editor: Editor,
  blockId: BlockId,
  additive = false,
): EditorCommand {
  void editor
  return createSelectBlockCommand(blockId, additive)
}

export function selectSectionAction(
  editor: Editor,
  sectionId: SectionId,
  additive = false,
): EditorCommand {
  void editor
  return createSelectSectionCommand(sectionId, additive)
}

export function selectTimelineEventAction(
  editor: Editor,
  timelineEventId: TimelineEventId,
  additive = false,
): EditorCommand {
  void editor
  return createSelectTimelineEventCommand(timelineEventId, additive)
}

export function copySelectionAction(editor: Editor): EditorCommand {
  void editor
  return createCopySelectionCommand()
}

export function setActiveToolAction(editor: Editor, tool: ActiveTool): EditorCommand {
  void editor
  return createSetActiveToolCommand(tool)
}

export function setHoveredChordAction(
  editor: Editor,
  hoveredChord: Editor['hoveredChord'],
): EditorCommand {
  void editor
  return createSetHoveredChordCommand(hoveredChord)
}

export function setClipboardAction(editor: Editor, clipboard: ClipboardState): EditorCommand {
  void editor
  return createSetClipboardCommand(clipboard)
}

export function setFocusedBlockIdAction(editor: Editor, blockId?: BlockId): EditorCommand {
  void editor
  return createSetFocusedBlockIdCommand(blockId)
}

export function setInspectorPanelAction(editor: Editor, panel: InspectorPanel): EditorCommand {
  void editor
  return createSetInspectorCommand(`Open ${panel} inspector`, { open: true, panel })
}

export function closeInspectorAction(editor: Editor): EditorCommand {
  void editor
  return createSetInspectorCommand('Close inspector', createInspectorState())
}

export function setSelectionAction(editor: Editor, selection: SelectionState): EditorCommand {
  void editor
  return createSetSelectionCommand(selection)
}

export function unfocusSelectionAction(editor: Editor): EditorCommand {
  return editor.focusedBlockId === undefined
    ? createSetSelectionCommand(createSelectionState(), 'Clear selection')
    : createSetFocusedBlockIdCommand()
}

export function deleteSelectionAction(editor: Editor, workspace: Workspace): readonly Command[] {
  const { selection } = editor
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(deleteBlockAction(workspace, selection.selectedBlockIds))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(deleteSectionAction(workspace, selection.selectedSectionIds))
  }

  for (const patternEventId of selection.selectedPatternEventIds) {
    const patternId = selectPatternIdForEvent(workspace, patternEventId)

    if (patternId !== undefined) {
      commands.push(deletePatternEventAction(workspace, patternId, patternEventId))
    }
  }

  for (const timelineEventId of selection.selectedTimelineEventIds) {
    const timelineEvent = selectWorkspaceTimelineEvent(workspace, timelineEventId)

    if (timelineEvent !== undefined) {
      commands.push(...deleteTimelineEventAction(workspace, timelineEvent))
    }
  }

  return commands
}

export function duplicateSelectionAction(
  editor: Editor,
  workspace: Workspace,
  offsetTicks = workspace.timeline.ppq,
): readonly Command[] {
  const commands: Command[] = []

  if (editor.selection.selectedBlockIds.length > 0) {
    commands.push(duplicateBlockAction(workspace, editor.selection.selectedBlockIds, offsetTicks))
  }

  if (editor.selection.selectedSectionIds.length > 0) {
    commands.push(duplicateSectionAction(workspace, editor.selection.selectedSectionIds, offsetTicks))
  }

  return commands
}

export function pasteClipboardAction(editor: Editor, workspace: Workspace): readonly Command[] {
  if (editor.clipboard.blockIds.length === 0) {
    return []
  }

  return [duplicateBlockAction(workspace, editor.clipboard.blockIds, workspace.timeline.ppq)]
}

export function applyBlockToolAction(input: {
  block: Block
  tick: Tick
  tool: ActiveTool
  workspace: Workspace
}): readonly Command[] {
  const { block, tick, tool, workspace } = input

  if (tool === 'erase') {
    return [deleteBlockAction(workspace, [block.id])]
  }

  if (tool === 'split') {
    return [splitBlockAction(workspace, block.id, tick)]
  }

  if (tool === 'mute') {
    return [setBlockMutedAction(workspace, block.id, !block.muted)]
  }

  return []
}

export function applySectionToolAction(input: {
  section: Section
  tick: Tick
  tool: ActiveTool
  workspace: Workspace
}): readonly Command[] {
  const { section, tick, tool, workspace } = input

  if (tool === 'erase') {
    return [deleteSectionAction(workspace, [section.id])]
  }

  if (tool === 'split') {
    return [splitSectionAction(workspace, section.id, tick)]
  }

  return []
}

export function completeArrangementDragAction(input: {
  dragState: DragState
  editor: Editor
  endTick: Tick
  movementX: number
  movementY: number
  targetTrackId?: TrackId
  threshold: number
  workspace: Workspace
}): readonly Command[] {
  const {
    dragState,
    editor,
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
      addBlockAction(workspace, block),
      setSelectionAction(editor, {
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
      addSectionAction(workspace, section),
      setSelectionAction(editor, {
        ...createSelectionState(),
        selectedSectionIds: [section.id],
      }),
    ]
  }

  if (dragState.kind === 'marquee') {
    return isPointerDrag(movementX, movementY, threshold)
      ? [createSelectTimelineRangeCommand(dragState.startTick, endTick)]
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
            workspace,
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
        workspace,
        block.id,
        nextStartTick,
        block.startTick + block.lengthTicks - nextStartTick,
      )]
    }

    const nextEndTick = Math.max(endTick, block.startTick + 1)
    return [resizeBlockAction(workspace, block.id, block.startTick, nextEndTick - block.startTick)]
  }

  if (dragState.kind === 'moveSection') {
    const deltaTicks = endTick - dragState.startTick
    return [moveSectionAction(
      workspace,
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
        workspace,
        section.id,
        nextStartTick,
        sectionEndTick - nextStartTick,
      )]
    }

    const nextEndTick = Math.max(endTick, section.startTick + 1)
    return [resizeSectionAction(workspace, section.id, section.startTick, nextEndTick - section.startTick)]
  }

  if (dragState.kind === 'moveTimelineEvent') {
    const deltaTicks = endTick - dragState.startTick
    return [moveTimelineEventAction(
      workspace,
      dragState.event,
      Math.max(0, dragState.event.tick + deltaTicks),
    )]
  }

  return []
}

export function updateBlockFromInspectorAction(input: {
  block: Block
  draft: InspectorDraft
  workspace: Workspace
}): readonly Command[] {
  const { block, draft, workspace } = input
  const commands: Command[] = []
  const name = draft.blockName.trim() || block.name

  if (name !== block.name) {
    commands.push(renameBlockAction(workspace, block.id, name))
  }

  if (draft.blockColor !== block.color) {
    commands.push(setBlockColorAction(workspace, block.id, draft.blockColor))
  }

  if (draft.blockMuted !== block.muted) {
    commands.push(setBlockMutedAction(workspace, block.id, draft.blockMuted))
  }

  if (draft.blockPlaybackMode !== block.playbackMode) {
    commands.push(setBlockPlaybackModeAction(workspace, block.id, draft.blockPlaybackMode))
  }

  return commands
}

export function updateSectionFromInspectorAction(input: {
  draft: InspectorDraft
  section: Section
  workspace: Workspace
}): readonly Command[] {
  return [renameSectionAction(input.workspace, input.section.id, input.draft.sectionName)]
}

export function applyTimelineEventToolAction(
  workspace: Workspace,
  tool: ActiveTool,
  tick: Tick,
): readonly Command[] {
  const existingIds = selectTimelineEventIds(workspace)

  if (tool === 'tempo') {
    return [addTempoEventAction(workspace, createTempoEvent({
      id: createDraftEntityId('tempoEvent', existingIds),
      bpm: getTempoAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  if (tool === 'meter') {
    return [addMeterEventAction(workspace, createMeterEvent({
      id: createDraftEntityId('meterEvent', existingIds),
      timeSignature: getMeterAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  if (tool === 'key') {
    return [addKeyEventAction(workspace, createKeyEvent({
      id: createDraftEntityId('keyEvent', existingIds),
      key: getKeyAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  return []
}

export function deleteTimelineEventAction(
  workspace: Workspace,
  timelineEvent: TimelineEvent,
): readonly Command[] {
  if (isTempoEvent(timelineEvent)) {
    return [deleteTempoEventAction(workspace, timelineEvent.tick)]
  }

  if (isMeterEvent(timelineEvent)) {
    return [deleteMeterEventAction(workspace, timelineEvent.tick)]
  }

  return [deleteKeyEventAction(workspace, timelineEvent.tick)]
}

export function updateTimelineEventFromInspectorAction(input: {
  draft: TimelineEventDraft
  timelineEvent: TimelineEvent
  workspace: Workspace
}): readonly Command[] {
  const { draft, timelineEvent, workspace } = input

  if (isTempoEvent(timelineEvent)) {
    return [updateTempoEventAction(workspace, timelineEvent.tick, createTempoEvent({
      bpm: draft.tempoBpm,
      id: timelineEvent.id,
      tick: snapTimelineTick(workspace.timeline, draft.tempoTick),
    }))]
  }

  if (isMeterEvent(timelineEvent)) {
    return [updateMeterEventAction(workspace, timelineEvent.tick, createMeterEvent({
      id: timelineEvent.id,
      tick: snapTimelineTick(workspace.timeline, draft.meterTick, workspace.timeline.grid),
      timeSignature: {
        denominator: draft.meterDenominator,
        numerator: draft.meterNumerator,
      },
    }))]
  }

  return [updateKeyEventAction(workspace, timelineEvent.tick, createKeyEvent({
    id: timelineEvent.id,
    key: {
      mode: draft.keyMode,
      tonic: draft.keyTonic as Key['tonic'],
    },
    tick: snapTimelineTick(workspace.timeline, draft.keyTick),
  }))]
}

function isPointerDrag(movementX: number, movementY: number, threshold: number): boolean {
  return movementX >= threshold || movementY >= threshold
}
