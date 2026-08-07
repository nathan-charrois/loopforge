import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useRef,
  useState,
} from 'react'

import type {
  Block,
  BlockId,
  LoopEvent,
  MidiNote,
  NoteEvent,
  PatternId,
  Section,
  Tick,
  TimelineEvent,
  TrackId,
} from '~/domain'
import {
  completeDragAction,
  type DragState,
  getInitialDrawEndTick,
  getInitialGridDrawEndTick,
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
    kind: 'drawLoop'
  }
  | {
    kind: 'drawPatternEvent'
    pitch: MidiNote
    patternId: PatternId
  }
  | {
    event: NoteEvent
    kind: 'movePatternEvent'
    patternEventPitch: MidiNote
    patternId: PatternId
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
  | {
    event: LoopEvent
    kind: 'moveLoop'
  }
  | {
    edge: 'left' | 'right'
    event: LoopEvent
    kind: 'resizeLoop'
  }

export function useDrag({
  dispatch,
  viewport,
  workspace,
  onUpdateDrag,
}: {
  dispatch: SessionStore['dispatch']
  viewport: ViewportState
  workspace: Workspace
  onUpdateDrag?: (clientX: number) => void
}) {
  const timelineRef = useRef<HTMLDivElement>(null)

  const trackRowsRef = useRef<HTMLDivElement>(null)
  const pitchRowsRef = useRef<HTMLDivElement>(null)

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

  const getPointerPitch = useCallback((clientY: number): MidiNote => {
    if (pitchRowsRef.current === null) {
      return 0
    }

    const rect = pitchRowsRef.current.getBoundingClientRect()
    const pitchRows = pitchRowsRef.current.querySelectorAll<HTMLElement>('[data-midi-note]')

    if (rect.height <= 0 || pitchRows.length === 0) {
      return 0
    }

    const y = Math.max(0, Math.min(rect.height - 1, clientY - rect.top))
    const rowIndex = Math.min(pitchRows.length - 1, Math.floor(y / rect.height * pitchRows.length))
    const midiNote = Number(pitchRows[rowIndex].dataset.midiNote)

    return Number.isNaN(midiNote) ? 0 : midiNote
  }, [])

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
    event: ReactPointerEvent<HTMLElement>,
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
      case 'drawLoop':
        setDragState({
          ...pointer,
          currentTick: getInitialDrawEndTick(workspace.timeline, tick),
          kind: intent.kind,
          startTick: tick,
        })
        return
      case 'drawPatternEvent':
        setDragState({
          ...pointer,
          currentTick: getInitialGridDrawEndTick(workspace.timeline, tick),
          kind: intent.kind,
          startTick: tick,
          patternId: intent.patternId,
          pitch: intent.pitch,
        })
        return
      case 'movePatternEvent':
        setDragState({
          ...pointer,
          currentPitch: intent.patternEventPitch,
          currentTick: tick,
          event: intent.event,
          kind: intent.kind,
          patternId: intent.patternId,
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
        return
      case 'moveLoop':
        setDragState({
          ...pointer,
          currentTick: tick,
          event: intent.event,
          kind: intent.kind,
          startTick: tick,
        })
        return
      case 'resizeLoop':
        setDragState({
          ...pointer,
          currentTick: tick,
          edge: intent.edge,
          event: intent.event,
          kind: intent.kind,
        })
    }
  }, [getPointerTick, workspace.timeline])

  const updateDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (onUpdateDrag && dragState?.pointerId === event.pointerId) {
      onUpdateDrag(event.clientX)
    }

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

      if (current.kind === 'movePatternEvent') {
        return {
          ...current,
          currentPitch: getPointerPitch(event.clientY),
          currentTick,
        }
      }

      return { ...current, currentTick }
    })
  }, [dragState, getPointerPitch, getPointerRow, getPointerTick, getPointerTrackId, onUpdateDrag])

  const cancelDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    setDragState(current => current?.pointerId === event.pointerId ? undefined : current)
  }, [])

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragState === undefined || dragState.pointerId !== event.pointerId) {
      return
    }

    const endTick = getPointerTick(event.clientX)
    let completedState: DragState = dragState

    if (dragState.kind === 'selectRange') {
      completedState = {
        ...dragState,
        currentRow: getPointerRow(event.clientY),
        currentTick: endTick,
      }
    }

    if (dragState.kind === 'movePatternEvent') {
      completedState = {
        ...dragState,
        currentPitch: getPointerPitch(event.clientY),
        currentTick: endTick,
      }
    }

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
  }, [dispatch, getPointerPitch, getPointerRow, getPointerTick, getPointerTrackId, dragState, workspace])

  return {
    cancelDrag,
    finishDrag,
    getPointerPitch,
    getPointerTick,
    pitchRowsRef,
    startDrag,
    dragState,
    timelineRef,
    trackRowsRef,
    updateDrag,
  }
}
