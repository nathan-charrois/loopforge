import { useMemo } from 'react'

import {
  type Block,
  getBlockEndTick,
  getSectionEndTick,
  type Section,
  type Tick,
  type TimelineEvent,
  type TrackId,
} from '~/domain'
import type { DragState } from '~/store/editor'
import {
  selectBlock,
  type Workspace,
} from '~/store/workspace'

type TickRange = {
  endTick: Tick
  startTick: Tick
}

export function useTrackLaneOverlay(
  drag: DragState | undefined,
  workspace: Workspace,
  trackId: TrackId,
) {
  return useMemo(() => ({
    blockPlaceholders: buildBlockPlaceholders(drag, workspace)
      .filter(block => block.trackId === trackId),
    drawRange: drag?.kind === 'drawBlock' && drag.trackId === trackId
      ? getTickRange(drag)
      : undefined,
    selectionRange: isRowSelected(drag, workspace.tracks.allIds.indexOf(trackId) + 1)
      ? getTickRange(drag)
      : undefined,
  }), [drag, trackId, workspace])
}

export function useSectionLaneOverlay(
  drag: DragState | undefined,
) {
  return useMemo(() => ({
    drawRange: drag?.kind === 'drawSection'
      ? getTickRange(drag)
      : undefined,
    sectionPlaceholders: buildSectionPlaceholders(drag),
    selectionRange: isRowSelected(drag, 0)
      ? getTickRange(drag)
      : undefined,
  }), [drag])
}

export function useTimelineEventOverlay(
  drag: DragState | undefined,
): TimelineEvent | undefined {
  return useMemo(() => buildTimelineEventPlaceholder(drag), [drag])
}

function getTickRange(drag: DragState): TickRange {
  return {
    endTick: drag.currentTick,
    startTick: 'startTick' in drag ? drag.startTick : drag.currentTick,
  }
}

function isRowSelected(
  drag: DragState | undefined,
  row: number,
): drag is Extract<DragState, { kind: 'selectRange' }> {
  if (drag?.kind !== 'selectRange') {
    return false
  }

  const firstRow = Math.min(drag.startRow, drag.currentRow)
  const lastRow = Math.max(drag.startRow, drag.currentRow)
  return row >= firstRow && row <= lastRow
}

function getDeltaTicks(drag: DragState): Tick {
  return 'startTick' in drag ? drag.currentTick - drag.startTick : 0
}

function buildBlockPlaceholders(
  drag: DragState | undefined,
  workspace: Workspace,
): Block[] {
  if (drag?.kind === 'moveBlock') {
    const deltaTicks = getDeltaTicks(drag)

    return drag.blockIds.flatMap((blockId) => {
      const block = selectBlock(workspace, blockId)

      return block === undefined
        ? []
        : [{
            ...block,
            startTick: Math.max(0, block.startTick + deltaTicks),
            trackId: drag.currentTrackId ?? block.trackId,
          }]
    })
  }

  if (drag?.kind === 'resizeBlock') {
    const blockEndTick = getBlockEndTick(drag.block)

    if (drag.edge === 'left') {
      const startTick = Math.min(drag.currentTick, blockEndTick - 1)
      return [{
        ...drag.block,
        lengthTicks: blockEndTick - startTick,
        startTick,
      }]
    }

    const endTick = Math.max(drag.currentTick, drag.block.startTick + 1)
    return [{
      ...drag.block,
      lengthTicks: endTick - drag.block.startTick,
    }]
  }

  return []
}

function buildSectionPlaceholders(
  drag: DragState | undefined,
): Section[] {
  if (drag?.kind === 'moveSection') {
    return [{
      ...drag.section,
      startTick: Math.max(0, drag.section.startTick + getDeltaTicks(drag)),
    }]
  }

  if (drag?.kind === 'resizeSection') {
    const sectionEndTick = getSectionEndTick(drag.section)

    if (drag.edge === 'left') {
      const startTick = Math.min(drag.currentTick, sectionEndTick - 1)
      return [{
        ...drag.section,
        lengthTicks: sectionEndTick - startTick,
        startTick,
      }]
    }

    const endTick = Math.max(drag.currentTick, drag.section.startTick + 1)
    return [{
      ...drag.section,
      lengthTicks: endTick - drag.section.startTick,
    }]
  }

  return []
}

function buildTimelineEventPlaceholder(
  drag: DragState | undefined,
): TimelineEvent | undefined {
  if (drag?.kind !== 'moveTimelineEvent') {
    return undefined
  }

  return {
    ...drag.event,
    tick: Math.max(0, drag.event.tick + getDeltaTicks(drag)),
  }
}
