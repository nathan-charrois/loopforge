import { useMemo } from 'react'

import {
  type Block,
  type DrumHitEvent,
  type DrumPiece,
  getBlockEndTick,
  getLoopEventEndTick,
  getSectionEndTick,
  type LoopEvent,
  type MidiNote,
  type NoteEvent,
  type Pattern,
  type Section,
  type Tick,
  type TimelineEvent,
  type TrackId,
} from '~/domain'
import type { DragState } from '~/store/editor'

type TickRange = {
  endTick: Tick
  startTick: Tick
}

export function useTrackLaneOverlay(
  drag: DragState | undefined,
  blocks: readonly Block[],
  trackIds: readonly TrackId[],
  trackId: TrackId,
) {
  return useMemo(() => ({
    blockPlaceholders: buildBlockPlaceholders(drag, blocks)
      .filter(block => block.trackId === trackId),
    drawRange: drag?.kind === 'drawBlock' && drag.trackId === trackId
      ? getTickRange(drag)
      : undefined,
    selectionRange: isRowSelected(drag, trackIds.indexOf(trackId) + 1)
      ? getTickRange(drag)
      : undefined,
  }), [blocks, drag, trackId, trackIds])
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

export function useLoopLaneOverlay(
  drag: DragState | undefined,
): {
  drawRange?: TickRange
  loopPlaceholder?: LoopEvent
} {
  return useMemo(() => ({
    drawRange: drag?.kind === 'drawLoop'
      ? getTickRange(drag)
      : undefined,
    loopPlaceholder: buildLoopPlaceholder(drag),
  }), [drag])
}

export function usePatternEventOverlay(
  drag: DragState | undefined,
  pattern: Pattern,
) {
  return useMemo(() => ({
    drawRange: buildPatternEventDrawRange(drag, pattern),
    patternEventPlaceholder: buildPatternEventPlaceholder(drag, pattern),
    piece: buildPatternEventPiece(drag, pattern),
    pitch: buildPatternEventPitch(drag, pattern),
  }), [drag, pattern])
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
  blocks: readonly Block[],
): Block[] {
  if (drag?.kind === 'moveBlock') {
    const deltaTicks = getDeltaTicks(drag)

    return drag.blockIds.flatMap((blockId) => {
      const block = blocks.find(candidate => candidate.id === blockId)

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

function buildPatternEventPlaceholder(
  drag: DragState | undefined,
  pattern: Pattern,
): DrumHitEvent | NoteEvent | undefined {
  if (drag?.kind === 'moveNotePatternEvent' && drag.patternId === pattern.id) {
    const maxTimeTick = Math.max(0, pattern.lengthTicks - drag.event.durationTicks)

    return {
      ...drag.event,
      pitch: drag.currentPitch,
      timeTick: Math.min(
        maxTimeTick,
        Math.max(0, drag.event.timeTick + getDeltaTicks(drag)),
      ),
    }
  }

  if (drag?.kind === 'moveDrumPatternEvent' && drag.patternId === pattern.id) {
    return {
      ...drag.event,
      piece: drag.currentPiece,
      timeTick: Math.min(
        pattern.lengthTicks - 1,
        Math.max(0, drag.event.timeTick + getDeltaTicks(drag)),
      ),
    }
  }

  if (drag?.kind === 'resizeNotePatternEvent' && drag.patternId === pattern.id) {
    const currentEndTick = drag.event.timeTick + drag.event.durationTicks

    if (drag.edge === 'left') {
      const timeTick = Math.max(0, Math.min(drag.currentTick, currentEndTick - 1))

      return {
        ...drag.event,
        durationTicks: currentEndTick - timeTick,
        timeTick,
      }
    }

    const endTick = Math.min(
      pattern.lengthTicks,
      Math.max(drag.currentTick, drag.event.timeTick + 1),
    )

    return {
      ...drag.event,
      durationTicks: endTick - drag.event.timeTick,
    }
  }

  return undefined
}

function buildPatternEventDrawRange(
  drag: DragState | undefined,
  pattern: Pattern,
): TickRange | undefined {
  const isDrawKind = drag?.kind === 'drawDrumPatternEvent' || drag?.kind === 'drawNotePatternEvent'

  if (isDrawKind && drag.patternId === pattern.id) {
    return getTickRange(drag)
  }

  return undefined
}

function buildPatternEventPiece(
  drag: DragState | undefined,
  pattern: Pattern,
): DrumPiece | undefined {
  if (drag?.kind !== 'drawDrumPatternEvent' || drag.patternId !== pattern.id) {
    return undefined
  }

  return drag.piece
}

function buildPatternEventPitch(
  drag: DragState | undefined,
  pattern: Pattern,
): MidiNote | undefined {
  if (drag?.kind !== 'drawNotePatternEvent' || drag.patternId !== pattern.id) {
    return undefined
  }

  return drag.pitch
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

function buildLoopPlaceholder(
  drag: DragState | undefined,
): LoopEvent | undefined {
  if (drag?.kind === 'moveLoop') {
    return {
      ...drag.event,
      tick: Math.max(0, drag.event.tick + getDeltaTicks(drag)),
    }
  }

  if (drag?.kind !== 'resizeLoop') {
    return undefined
  }

  const endTick = getLoopEventEndTick(drag.event)

  if (drag.edge === 'left') {
    const tick = Math.min(drag.currentTick, endTick - 1)

    return {
      ...drag.event,
      lengthTicks: endTick - tick,
      tick,
    }
  }

  return {
    ...drag.event,
    lengthTicks: Math.max(1, drag.currentTick - drag.event.tick),
  }
}
