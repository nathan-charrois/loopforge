import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  Block,
  BlockId,
  Section,
  Tick,
  TimelineEvent,
  TrackId,
} from '~/domain'
import {
  completeDragAction,
  type DragState,
  getInitialDrawEndTick,
  snapTimelineTick,
  type ViewportState,
  xToTick,
} from '~/store/editor'
import type { SessionStore } from '~/store/session'
import type { Workspace } from '~/store/workspace'

const POINTER_DRAG_THRESHOLD = 4

type DragIntent
  = | {
    kind: 'drawBlock'
    trackId: TrackId
  }
  | {
    kind: 'drawSection'
  }
  | {
    kind: 'selectRange'
    row: number
  }
  | {
    blockIds: BlockId[]
    kind: 'moveBlock'
    trackId: TrackId
  }
  | {
    block: Block
    edge: 'left' | 'right'
    kind: 'resizeBlock'
  }
  | {
    kind: 'moveSection'
    section: Section
  }
  | {
    edge: 'left' | 'right'
    kind: 'resizeSection'
    section: Section
  }
  | {
    event: TimelineEvent
    kind: 'moveTimelineEvent'
  }

export function useDrag({
  dispatch,
  viewport,
  workspace,
}: {
  dispatch: SessionStore['dispatch']
  viewport: ViewportState
  workspace: Workspace
}) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const trackRowsRef = useRef<HTMLDivElement>(null)

  const [dragState, setDragState] = useState<DragState | undefined>()

  const getPointerTick = useCallback((clientX: number): Tick => {
    if (timelineRef.current === null) {
      return 0
    }

    const rect = timelineRef.current.getBoundingClientRect()
    const rawTick = xToTick(viewport.pixelsPerTick, Math.max(0, clientX - rect.left))
    return snapTimelineTick(workspace.timeline, rawTick)
  }, [viewport.pixelsPerTick, workspace.timeline])

  const getPointerTrackId = useCallback((clientY: number): TrackId | undefined => {
    if (trackRowsRef.current === null) {
      return undefined
    }

    const rect = trackRowsRef.current.getBoundingClientRect()
    const trackIndex = Math.floor((clientY - rect.top) / viewport.laneHeight)
    return workspace.tracks.allIds[trackIndex]
  }, [viewport.laneHeight, workspace.tracks.allIds])

  const getPointerRow = useCallback((clientY: number): number => {
    if (trackRowsRef.current === null || workspace.tracks.allIds.length === 0) {
      return 0
    }

    const rect = trackRowsRef.current.getBoundingClientRect()

    if (clientY < rect.top) {
      return 0
    }

    return Math.min(
      workspace.tracks.allIds.length,
      Math.max(1, Math.floor((clientY - rect.top) / viewport.laneHeight) + 1),
    )
  }, [viewport.laneHeight, workspace.tracks.allIds])

  const startDrag = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    intent: DragIntent,
  ) => {
    const tick = getPointerTick(event.clientX)
    const pointer = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
    }

    event.currentTarget.setPointerCapture(event.pointerId)

    switch (intent.kind) {
      case 'drawBlock':
        setDragState({
          ...pointer,
          currentTick: getInitialDrawEndTick(workspace.timeline, tick),
          kind: intent.kind,
          startTick: tick,
          trackId: intent.trackId,
        })
        return
      case 'drawSection':
        setDragState({
          ...pointer,
          currentTick: getInitialDrawEndTick(workspace.timeline, tick),
          kind: intent.kind,
          startTick: tick,
        })
        return
      case 'selectRange':
        setDragState({
          ...pointer,
          currentRow: intent.row,
          currentTick: tick,
          kind: intent.kind,
          startRow: intent.row,
          startTick: tick,
        })
        return
      case 'moveBlock':
        setDragState({
          ...pointer,
          blockIds: intent.blockIds,
          currentTick: tick,
          currentTrackId: intent.trackId,
          kind: intent.kind,
          startTick: tick,
        })
        return
      case 'resizeBlock':
        setDragState({
          ...pointer,
          block: intent.block,
          currentTick: tick,
          edge: intent.edge,
          kind: intent.kind,
        })
        return
      case 'moveSection':
        setDragState({
          ...pointer,
          currentTick: tick,
          kind: intent.kind,
          section: intent.section,
          startTick: tick,
        })
        return
      case 'resizeSection':
        setDragState({
          ...pointer,
          currentTick: tick,
          edge: intent.edge,
          kind: intent.kind,
          section: intent.section,
        })
        return
      case 'moveTimelineEvent':
        setDragState({
          ...pointer,
          currentTick: tick,
          event: intent.event,
          kind: intent.kind,
          startTick: tick,
        })
    }
  }, [getPointerTick, workspace.timeline])

  const updateDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setDragState((current) => {
      if (current === undefined || current.pointerId !== event.pointerId) {
        return current
      }

      const currentTick = getPointerTick(event.clientX)

      if (current.kind === 'selectRange') {
        return {
          ...current,
          currentRow: getPointerRow(event.clientY),
          currentTick,
        }
      }

      if (current.kind === 'moveBlock') {
        return {
          ...current,
          currentTick,
          currentTrackId: getPointerTrackId(event.clientY),
        }
      }

      return { ...current, currentTick }
    })
  }, [getPointerRow, getPointerTick, getPointerTrackId])

  const cancelDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setDragState(current => current?.pointerId === event.pointerId ? undefined : current)
  }, [])

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragState === undefined || dragState.pointerId !== event.pointerId) {
      return
    }

    const endTick = getPointerTick(event.clientX)
    const completedState: DragState = dragState.kind === 'selectRange'
      ? {
          ...dragState,
          currentRow: getPointerRow(event.clientY),
          currentTick: endTick,
        }
      : dragState

    dispatch(completeDragAction({
      dragState: completedState,
      endTick,
      movementX: Math.abs(event.clientX - dragState.startClientX),
      movementY: Math.abs(event.clientY - dragState.startClientY),
      targetTrackId: getPointerTrackId(event.clientY),
      threshold: POINTER_DRAG_THRESHOLD,
      workspace,
    }))

    setDragState(undefined)
  }, [dispatch, getPointerRow, getPointerTick, getPointerTrackId, dragState, workspace])

  return {
    cancelDrag,
    finishDrag,
    getPointerTick,
    startDrag,
    dragState,
    timelineRef,
    trackRowsRef,
    updateDrag,
  }
}
