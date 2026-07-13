import {
  createArrangementBlockDraft,
  createArrangementSectionDraft,
} from './factory'
import { createEmptySelectionState } from './selection'
import { clampPositiveLengthTicks, snapTimelineRange, type TimelineRange } from './snap'
import { createTimelineMoveCommand } from './timelineInteraction'
import {
  type Block,
  clearSelection,
  type Command,
  getSectionEndTick,
  getSmallestGridDivisionTicks,
  type Section,
  type SelectionState,
  type Tick,
  type Timeline,
  type TimelineEventSelection,
} from '~/domain'
import {
  addBlockCommand,
  addSectionCommand,
  moveBlockCommand,
  moveSectionCommand,
  resizeBlockCommand,
  resizeSectionCommand,
  selectBlock,
  selectBlocksInRange,
  selectSectionsInRange,
  type Workspace,
} from '~/store/workspace'

export type DragState
  = | {
    kind: 'drawBlock'
    pointerId: number
    startTick: Tick
    currentTick: Tick
    trackId: string
    startClientX: number
    startClientY: number
  }
  | {
    kind: 'drawSection'
    pointerId: number
    startTick: Tick
    currentTick: Tick
    startClientX: number
    startClientY: number
  }
  | {
    kind: 'marquee'
    pointerId: number
    startTick: Tick
    currentTick: Tick
    startClientX: number
    startClientY: number
  }
  | {
    blockIds: string[]
    kind: 'moveBlock'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
    currentTick: Tick
    currentTrackId?: string
  }
  | {
    block: Block
    currentTick: Tick
    edge: 'left' | 'right'
    kind: 'resizeBlock'
    pointerId: number
    startClientX: number
  }
  | {
    kind: 'moveSection'
    pointerId: number
    section: Section
    startClientX: number
    startTick: Tick
    currentTick: Tick
  }
  | {
    currentTick: Tick
    edge: 'left' | 'right'
    kind: 'resizeSection'
    pointerId: number
    section: Section
    startClientX: number
  }
  | {
    currentTick: Tick
    event: TimelineEventSelection
    kind: 'moveTimelineEvent'
    pointerId: number
    startClientX: number
  }

export type DragCompletion = {
  commands: Command[]
  selection?: SelectionState
  selectedTimelineEvent?: TimelineEventSelection
}

export function completeArrangementDrag(input: {
  dragState: DragState
  endTick: Tick
  movementX: number
  movementY: number
  targetTrackId?: string
  threshold: number
  workspace: Workspace
}): DragCompletion {
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
    const range = createMinimumDrawRange(workspace.timeline, dragState.startTick, endTick)
    const block = createArrangementBlockDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
      trackId: dragState.trackId,
    })

    return {
      commands: [addBlockCommand(block)],
      selection: {
        ...createEmptySelectionState(),
        selectedBlockIds: [block.id],
      },
    }
  }

  if (dragState.kind === 'drawSection') {
    const range = createMinimumDrawRange(workspace.timeline, dragState.startTick, endTick)
    const section = createArrangementSectionDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
    })

    return {
      commands: [addSectionCommand(section)],
      selection: {
        ...createEmptySelectionState(),
        selectedSectionIds: [section.id],
      },
    }
  }

  if (dragState.kind === 'marquee') {
    if (!isPointerDrag(movementX, movementY, threshold)) {
      return {
        commands: [],
        selection: clearSelection(createEmptySelectionState()),
      }
    }

    const range = snapTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const blocks = selectBlocksInRange(workspace, range.startTick, range.startTick + range.lengthTicks)
    const sections = selectSectionsInRange(workspace, range.startTick, range.startTick + range.lengthTicks)

    return {
      commands: [],
      selection: {
        ...createEmptySelectionState(),
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
    return {
      commands: [createTimelineMoveCommand(workspace, dragState.event, endTick)],
      selectedTimelineEvent: {
        ...dragState.event,
        tick: endTick,
      },
    }
  }

  return { commands: [] }
}

export function getDragStartClientX(dragState: DragState): number {
  if ('startClientX' in dragState) {
    return dragState.startClientX
  }

  return 0
}

export function getDragStartClientY(dragState: DragState): number {
  if ('startClientY' in dragState) {
    return dragState.startClientY
  }

  return 0
}

function isPointerDrag(movementX: number, movementY: number, threshold: number): boolean {
  return movementX >= threshold || movementY >= threshold
}

function isCommand(command: Command | undefined): command is Command {
  return command !== undefined
}

function createMinimumDrawRange(timeline: Timeline, startTick: Tick, endTick: Tick): TimelineRange {
  const range = snapTimelineRange(timeline, startTick, endTick)
  const minimumLengthTicks = getSmallestGridDivisionTicks(timeline, range.startTick)

  return {
    ...range,
    lengthTicks: clampPositiveLengthTicks(Math.max(range.lengthTicks, minimumLengthTicks)),
  }
}
