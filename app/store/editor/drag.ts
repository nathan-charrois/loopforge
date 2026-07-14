import type { DragState } from './type'
import {
  type Block,
  getBlockEndTick,
  getSectionEndTick,
  type Section,
  type Tick,
} from '~/domain'
import { selectBlock, type Workspace } from '~/store/workspace'

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

export function getDragDeltaTicks(dragState: DragState): Tick {
  if ('startTick' in dragState) {
    return dragState.currentTick - dragState.startTick
  }

  return 0
}

export function getDragTargetTrackId(dragState: DragState): string | undefined {
  if (dragState.kind === 'drawBlock') {
    return dragState.trackId
  }

  if (dragState.kind === 'moveBlock') {
    return dragState.currentTrackId
  }

  if (dragState.kind === 'resizeBlock') {
    return dragState.block.trackId
  }

  return undefined
}

export function getBlockDragPreviews(workspace: Workspace, dragState?: DragState): Block[] {
  if (dragState?.kind === 'moveBlock') {
    const deltaTicks = getDragDeltaTicks(dragState)

    return dragState.blockIds.flatMap((blockId) => {
      const block = selectBlock(workspace, blockId)

      if (!block) {
        return []
      }

      return [{
        ...block,
        startTick: Math.max(0, block.startTick + deltaTicks),
        trackId: dragState.currentTrackId ?? block.id,
      }]
    })
  }

  if (dragState?.kind === 'resizeBlock') {
    const blockEndTick = getBlockEndTick(dragState.block)

    if (dragState.edge === 'left') {
      const startTick = Math.min(dragState.currentTick, blockEndTick - 1)

      return [{
        ...dragState.block,
        lengthTicks: blockEndTick - startTick,
        startTick,
      }]
    }

    const endTick = Math.max(dragState.currentTick, dragState.block.startTick + 1)

    return [{
      ...dragState.block,
      lengthTicks: endTick - dragState.block.startTick,
    }]
  }

  return []
}

export function getSectionDragPreviews(dragState?: DragState): Section[] {
  if (dragState?.kind === 'moveSection') {
    const deltaTicks = getDragDeltaTicks(dragState)

    return [{
      ...dragState.section,
      startTick: Math.max(0, dragState.section.startTick + deltaTicks),
    }]
  }

  if (dragState?.kind === 'resizeSection') {
    const sectionEndTick = getSectionEndTick(dragState.section)

    if (dragState.edge === 'left') {
      const startTick = Math.min(dragState.currentTick, sectionEndTick - 1)

      return [{
        ...dragState.section,
        lengthTicks: sectionEndTick - startTick,
        startTick,
      }]
    }

    const endTick = Math.max(dragState.currentTick, dragState.section.startTick + 1)

    return [{
      ...dragState.section,
      lengthTicks: endTick - dragState.section.startTick,
    }]
  }

  return []
}
