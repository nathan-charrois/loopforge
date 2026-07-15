import {
  createArrangementBlockDraft,
  createArrangementSectionDraft,
  createSelectionState,
} from './factory'
import { snapTimelineRange, snapTimelineTick, snapToMinimumTimelineRange } from './snap'
import type {
  ActiveTool,
  ClipboardState,
  DragState,
  InspectorDraft,
  SelectionState,
  TimelineEventDraft,
} from './type'
import {
  type Block,
  type Command,
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
  type Tick,
  type TimelineEvent,
  type TrackId,
} from '~/domain'
import {
  addBlockCommand,
  addKeyEventCommand,
  addMeterEventCommand,
  addSectionCommand,
  addTempoEventCommand,
  deleteBlockCommand,
  deleteKeyEventCommand,
  deleteMeterEventCommand,
  deletePatternEventCommand,
  deleteSectionCommand,
  deleteTempoEventCommand,
  duplicateBlockCommand,
  duplicateSectionCommand,
  moveBlockCommand,
  moveSectionCommand,
  moveTimelineEventCommand,
  renameSectionCommand,
  resizeBlockCommand,
  resizeSectionCommand,
  selectBlock,
  selectBlocksInRange,
  selectPatternIdForEvent,
  selectSectionsInRange,
  selectTimelineEvent,
  selectTimelineEventIds,
  setBlockMutedCommand,
  splitBlockCommand,
  updateBlockSnapshotCommand,
  updateKeyEventCommand,
  updateMeterEventCommand,
  updateTempoEventCommand,
  type Workspace,
} from '~/store/workspace'

export function createDeleteSelectionCommands(input: {
  selection: SelectionState
  workspace: Workspace
}): Command[] {
  const { selection, workspace } = input
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(deleteBlockCommand(workspace, selection.selectedBlockIds))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(deleteSectionCommand(workspace, selection.selectedSectionIds))
  }

  for (const patternEventId of selection.selectedPatternEventIds) {
    const eventContext = selectPatternIdForEvent(workspace, patternEventId)

    if (eventContext !== undefined) {
      commands.push(deletePatternEventCommand(workspace, eventContext, patternEventId))
    }
  }

  for (const timelineEventId of selection.selectedTimelineEventIds) {
    const timelineEvent = selectTimelineEvent(workspace, timelineEventId)

    if (timelineEvent !== undefined) {
      commands.push(...createTimelineEventDeleteCommands({ workspace, timelineEvent }))
    }
  }

  return commands
}

export function createDuplicateSelectionCommands(input: {
  offsetTicks?: number
  selection: SelectionState
  workspace: Workspace
}): Command[] {
  const { offsetTicks = input.workspace.timeline.ppq, selection, workspace } = input
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(duplicateBlockCommand(workspace, selection.selectedBlockIds, offsetTicks))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(duplicateSectionCommand(workspace, selection.selectedSectionIds, offsetTicks))
  }

  return commands
}

export function createPasteClipboardCommands(input: {
  clipboard: ClipboardState
  workspace: Workspace
}): Command[] {
  const { clipboard, workspace } = input

  if (clipboard.blockIds.length === 0) {
    return []
  }

  return [duplicateBlockCommand(workspace, clipboard.blockIds, workspace.timeline.ppq)]
}

export function createBlockToolCommands(input: {
  block: Block
  tick: Tick
  tool: ActiveTool
  workspace: Workspace
}): Command[] {
  const { block, tick, tool, workspace } = input

  if (tool === 'erase') {
    return [deleteBlockCommand(workspace, [block.id])]
  }

  if (tool === 'split') {
    return [splitBlockCommand(workspace, block.id, tick)]
  }

  if (tool === 'mute') {
    return [setBlockMutedCommand(workspace, block.id, !block.muted)]
  }

  return []
}

export function createSectionToolCommands(input: {
  section: Section
  tool: ActiveTool
  workspace: Workspace
}): Command[] {
  const { section, tool, workspace } = input

  if (tool === 'erase') {
    return [deleteSectionCommand(workspace, [section.id])]
  }

  return []
}

export function completeArrangementDrag(input: {
  dragState: DragState
  endTick: Tick
  movementX: number
  movementY: number
  targetTrackId?: TrackId
  threshold: number
  workspace: Workspace
}): {
  commands: Command[]
  selection?: SelectionState
} {
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

    return {
      commands: [addBlockCommand(block)],
      selection: {
        ...createSelectionState(),
        selectedBlockIds: [block.id],
      },
    }
  }

  if (dragState.kind === 'drawSection') {
    const range = snapToMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const section = createArrangementSectionDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
    })

    return {
      commands: [addSectionCommand(section)],
      selection: {
        ...createSelectionState(),
        selectedSectionIds: [section.id],
      },
    }
  }

  if (dragState.kind === 'marquee') {
    if (!isPointerDrag(movementX, movementY, threshold)) {
      return {
        commands: [],
        selection: createSelectionState(),
      }
    }

    const range = snapTimelineRange(workspace.timeline, dragState.startTick, endTick)

    const blocks = selectBlocksInRange(workspace, {
      startTick: range.startTick,
      endTick: range.startTick + range.lengthTicks,
    })

    const sections = selectSectionsInRange(workspace, {
      startTick: range.startTick,
      endTick: range.startTick + range.lengthTicks,
    })

    return {
      commands: [],
      selection: {
        ...createSelectionState(),
        selectedBlockIds: blocks.map(block => block.id),
        selectedSectionIds: sections.map(section => section.id),
      },
    }
  }

  if (!isPointerDrag(movementX, movementY, threshold)) {
    return { commands: [] }
  }

  if (dragState.kind === 'moveBlock') {
    const deltaTicks = endTick - dragState.startTick

    return {
      commands: dragState.blockIds
        .map((blockId) => {
          const block = selectBlock(workspace, blockId)

          if (block === undefined) {
            return undefined
          }

          return moveBlockCommand(
            workspace,
            block.id,
            Math.max(0, block.startTick + deltaTicks),
            targetTrackId ?? block.trackId,
          )
        })
        .filter(isCommand),
    }
  }

  if (dragState.kind === 'resizeBlock') {
    const { block } = dragState

    if (dragState.edge === 'left') {
      const nextStartTick = Math.min(endTick, block.startTick + block.lengthTicks - 1)

      return {
        commands: [resizeBlockCommand(workspace, block.id, nextStartTick, block.startTick + block.lengthTicks - nextStartTick)],
      }
    }

    const nextEndTick = Math.max(endTick, block.startTick + 1)

    return {
      commands: [resizeBlockCommand(workspace, block.id, block.startTick, nextEndTick - block.startTick)],
    }
  }

  if (dragState.kind === 'moveSection') {
    const deltaTicks = endTick - dragState.startTick

    return {
      commands: [moveSectionCommand(workspace, dragState.section.id, Math.max(0, dragState.section.startTick + deltaTicks))],
    }
  }

  if (dragState.kind === 'resizeSection') {
    const { section } = dragState
    const sectionEndTick = getSectionEndTick(section)

    if (dragState.edge === 'left') {
      const nextStartTick = Math.min(endTick, sectionEndTick - 1)

      return {
        commands: [resizeSectionCommand(workspace, section.id, nextStartTick, sectionEndTick - nextStartTick)],
      }
    }

    const nextEndTick = Math.max(endTick, section.startTick + 1)

    return {
      commands: [resizeSectionCommand(workspace, section.id, section.startTick, nextEndTick - section.startTick)],
    }
  }

  if (dragState.kind === 'moveTimelineEvent') {
    const deltaTicks = endTick - dragState.startTick

    return {
      commands: [moveTimelineEventCommand(workspace, dragState.event, Math.max(0, dragState.event.tick + deltaTicks))],
    }
  }

  return { commands: [] }
}

export function createBlockInspectorCommands(input: {
  block: Block
  draft: InspectorDraft
}): Command[] {
  const { block, draft } = input
  const commands: Command[] = []
  let currentBlock = block
  const nextName = draft.blockName.trim() || block.name

  if (nextName !== currentBlock.name) {
    const nextBlock = { ...currentBlock, name: nextName }

    commands.push(updateBlockSnapshotCommand('renameBlock', `Rename block ${currentBlock.name}`, currentBlock, nextBlock))
    currentBlock = nextBlock
  }

  if (draft.blockColor !== currentBlock.color) {
    const nextBlock = { ...currentBlock, color: draft.blockColor }

    commands.push(updateBlockSnapshotCommand('setBlockColor', `Set block color ${currentBlock.name}`, currentBlock, nextBlock))
    currentBlock = nextBlock
  }

  if (draft.blockMuted !== currentBlock.muted) {
    const nextBlock = { ...currentBlock, muted: draft.blockMuted }

    commands.push(updateBlockSnapshotCommand(
      'setBlockMuted',
      `${draft.blockMuted ? 'Mute' : 'Unmute'} block ${currentBlock.name}`,
      currentBlock,
      nextBlock,
    ))
    currentBlock = nextBlock
  }

  if (draft.blockPlaybackMode !== currentBlock.playbackMode) {
    const nextBlock = { ...currentBlock, playbackMode: draft.blockPlaybackMode }

    commands.push(updateBlockSnapshotCommand('setBlockPlaybackMode', `Set block playback ${currentBlock.name}`, currentBlock, nextBlock))
  }

  return commands
}

export function createSectionInspectorCommands(input: {
  draft: InspectorDraft
  section: Section
  workspace: Workspace
}): Command[] {
  const { draft, section, workspace } = input

  return [renameSectionCommand(workspace, section.id, draft.sectionName)]
}

export function createTimelineEventToolCommands(
  workspace: Workspace,
  tool: ActiveTool,
  tick: number,
): Command[] {
  const existingIds = selectTimelineEventIds(workspace)

  if (tool === 'tempo') {
    return [
      addTempoEventCommand(workspace, createTempoEvent({
        id: createDraftEntityId('tempoEvent', existingIds),
        bpm: getTempoAtTick(workspace.timeline, tick),
        tick,
      })),
    ]
  }

  if (tool === 'meter') {
    return [
      addMeterEventCommand(workspace, createMeterEvent({
        id: createDraftEntityId('meterEvent', existingIds),
        timeSignature: getMeterAtTick(workspace.timeline, tick),
        tick,
      })),
    ]
  }

  if (tool === 'key') {
    return [
      addKeyEventCommand(workspace, createKeyEvent({
        id: createDraftEntityId('keyEvent', existingIds),
        key: getKeyAtTick(workspace.timeline, tick),
        tick,
      })),
    ]
  }

  return []
}

export function createTimelineEventDeleteCommands({
  workspace,
  timelineEvent,
}: {
  workspace: Workspace
  timelineEvent: TimelineEvent
}): Command[] {
  if (isTempoEvent(timelineEvent)) {
    return [deleteTempoEventCommand(workspace, timelineEvent.tick)]
  }

  if (isMeterEvent(timelineEvent)) {
    return [deleteMeterEventCommand(workspace, timelineEvent.tick)]
  }

  return [deleteKeyEventCommand(workspace, timelineEvent.tick)]
}

export function createTimelineEventInspectorCommands(input: {
  draft: TimelineEventDraft
  timelineEvent: TimelineEvent
  workspace: Workspace
}): Command[] {
  const { draft, timelineEvent, workspace } = input

  if (isTempoEvent(timelineEvent)) {
    const nextTick = snapTimelineTick(workspace.timeline, draft.tempoTick)

    const tempoEvent = createTempoEvent({
      bpm: draft.tempoBpm,
      id: timelineEvent.id,
      tick: nextTick,
    })

    return [updateTempoEventCommand(workspace, timelineEvent.tick, tempoEvent)]
  }

  if (isMeterEvent(timelineEvent)) {
    const nextTick = snapTimelineTick(workspace.timeline, draft.meterTick, workspace.timeline.grid)

    const meterEvent = createMeterEvent({
      id: timelineEvent.id,
      tick: nextTick,
      timeSignature: {
        denominator: draft.meterDenominator,
        numerator: draft.meterNumerator,
      },
    })

    return [updateMeterEventCommand(workspace, timelineEvent.tick, meterEvent)]
  }

  const nextTick = snapTimelineTick(workspace.timeline, draft.keyTick)

  const keyEvent = createKeyEvent({
    id: timelineEvent.id,
    key: {
      mode: draft.keyMode,
      tonic: draft.keyTonic as Key['tonic'],
    },
    tick: nextTick,
  })

  return [updateKeyEventCommand(workspace, timelineEvent.tick, keyEvent)]
}

function isPointerDrag(movementX: number, movementY: number, threshold: number): boolean {
  return movementX >= threshold || movementY >= threshold
}

function isCommand(command: Command | undefined): command is Command {
  return command !== undefined
}
