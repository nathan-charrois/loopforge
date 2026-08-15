import {
  forwardRef,
  memo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import {
  CursorIcon,
  Delete01Icon,
  PencilEdit01Icon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'

import { usePlaybackEngine } from '../Providers/PlaybackProvider'
import {
  PANEL_PIANO_WIDTH,
  PANEL_RULER_HEIGHT,
  PANEL_VIEWPORT_HEIGHT,
} from './constants'
import { PatternPanelRuler } from './PatternPanelRuler'
import { PatternPanelToolButton } from './PatternPanelToolButton'
import { PatternPanelVelocityRow } from './PatternPanelVelocity'
import {
  type Block,
  DRUM_PIECES,
  type DrumHitEvent,
  type DrumPattern,
  type DrumPiece,
  getRulerMarks,
  MAX_VELOCITY,
  type PatternEvent,
  type PatternEventId,
  type RulerMark,
  type Timeline,
} from '~/domain'
import { useDrag } from '~/hooks/useDrag'
import { usePatternEventOverlay } from '~/hooks/useDragOverlay'
import { useTransportPlayhead } from '~/hooks/useTransport'
import { useViewport } from '~/hooks/useViewport'
import { createPatternPlayheadMap } from '~/playback/playhead'
import type {
  ActivePatternPanelTool,
  DragState,
  PatternEventDraft,
} from '~/store/editor'
import type { Dispatch } from '~/store/session'
import type { Workspace } from '~/store/workspace'

const DRUM_PIECE_ROWS = [...Object.values(DRUM_PIECES)].reverse()
const PANEL_DRUM_GRID_HEIGHT = PANEL_VIEWPORT_HEIGHT - PANEL_RULER_HEIGHT
const PANEL_DRUM_ROW_HEIGHT = PANEL_DRUM_GRID_HEIGHT / DRUM_PIECE_ROWS.length

type Props = {
  dispatch: Dispatch
  workspace: Workspace
  tool: ActivePatternPanelTool
  timeline: Timeline
  focusedBlockId?: string
  selectedPatternEvent?: PatternEvent
  selectedPatternEventIds?: PatternEventId[]
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
  onSetActiveTool: (tool: ActivePatternPanelTool) => void
  onUpdatePatternEventDraft: (patternEvent: PatternEvent, patternEventDraft: Partial<PatternEventDraft>) => void
  focusedBlock: Block
  pattern: DrumPattern
}

export const DrumPatternPanel = memo(function DrumPatternPanel({
  dispatch,
  workspace,
  tool,
  timeline,
  focusedBlock,
  pattern,
  selectedPatternEvent,
  selectedPatternEventIds,
  onDeletePatternEvent,
  onSelectPatternEvent,
  onSetActiveTool,
  onUpdatePatternEventDraft,
}: Props) {
  const playbackEngine = usePlaybackEngine()

  const drumLabelsRef = useRef<HTMLDivElement>(null)
  const velocityTimelineRef = useRef<HTMLDivElement>(null)

  const {
    viewport,
    scrollRef,
    handleViewportFit,
    handleViewportWheel,
    handleZoomBy,
  } = useViewport()

  const {
    cancelDrag,
    dragState,
    drumPieceRowsRef,
    finishDrag,
    getPointerDrumPiece,
    startDrag,
    timelineRef,
    updateDrag,
  } = useDrag({
    dispatch,
    pixelsPerTick: viewport.pixelsPerTick,
    workspace,
  })

  const timelineWidth = pattern.lengthTicks * viewport.pixelsPerTick

  const rulerMarks = useMemo(
    () => getRulerMarks(timeline, 0, pattern.lengthTicks),
    [pattern.lengthTicks, timeline],
  )

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current

    if (scrollElement === null) {
      return
    }

    const fitPattern = () => {
      handleViewportFit(pattern.lengthTicks)
    }

    const resizeObserver = new ResizeObserver(fitPattern)

    fitPattern()
    resizeObserver.observe(scrollElement)

    return () => resizeObserver.disconnect()
  }, [
    handleViewportFit,
    pattern.id,
    pattern.lengthTicks,
  ])

  const playheadProps = useTransportPlayhead(
    playbackEngine,
    viewport.pixelsPerTick,
    timelineRef,
    createPatternPlayheadMap(
      focusedBlock,
      pattern.lengthTicks,
    ),
  )

  const syncScroll = useCallback(() => {
    const scrollElement = scrollRef.current
    const drumLabels = drumLabelsRef.current
    const velocityTimeline
      = velocityTimelineRef.current

    if (scrollElement === null) {
      return
    }

    if (drumLabels !== null) {
      drumLabels.style.transform = `translateY(${-scrollElement.scrollTop}px)`
    }

    if (velocityTimeline !== null) {
      velocityTimeline.style.transform = `translateX(${-scrollElement.scrollLeft}px)`
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current

    if (scrollElement !== null) {
      scrollElement.scrollLeft = 0
      scrollElement.scrollTop = 0
      syncScroll()
    }
  }, [pattern.id, syncScroll])

  useEffect(() => {
    syncScroll()
  }, [viewport.pixelsPerTick, syncScroll])

  const handleWheel = useCallback((
    event: ReactWheelEvent<HTMLDivElement>,
  ) => {
    if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) {
      return
    }

    handleViewportWheel(event)
  }, [handleViewportWheel])

  const handlePatternRollPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    patternId: DrumPattern['id'],
  ) => {
    if (event.button !== 0 || tool !== 'draw') {
      return
    }

    startDrag(event, {
      kind: 'drawDrumPatternEvent',
      patternId,
      piece: getPointerDrumPiece(event.clientY),
    })
  }, [getPointerDrumPiece, startDrag, tool])

  const handleMoveDrumPatternEvent = useCallback((
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: DrumHitEvent,
  ) => {
    if (event.button !== 0) {
      return
    }

    startDrag(event, {
      event: patternEvent,
      kind: 'moveDrumPatternEvent',
      piece: getPointerDrumPiece(event.clientY),
      patternId: pattern.id,
    })
  }, [getPointerDrumPiece, pattern.id, startDrag])

  const handlePatternRollPointerMove = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    updateDrag(event)
  }, [updateDrag])

  const handlePatternRollPointerUp = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    finishDrag(event)
  }, [finishDrag])

  return (
    <Paper
      withBorder
      p={0}
      mb="sm"
      style={{ overflow: 'hidden' }}
    >
      <Stack gap="md" p="md">
        <Group justify="space-between" align="center">
          <Group gap={4}>
            <PatternPanelToolButton
              active={tool === 'draw'}
              icon={PencilEdit01Icon}
              label="Draw tool"
              onClick={() => onSetActiveTool('draw')}
            />
            <PatternPanelToolButton
              active={tool === 'select'}
              icon={CursorIcon}
              label="Select tool"
              onClick={() => onSetActiveTool('select')}
            />
            <PatternPanelToolButton
              active={tool === 'delete'}
              icon={Delete01Icon}
              label="Delete tool"
              onClick={() => onSetActiveTool('delete')}
            />
          </Group>
          <Group gap="xs">
            <Tooltip label="Zoom out">
              <ActionIcon
                aria-label="Zoom drum pattern panel out"
                size="lg"
                variant="light"
                onClick={() => handleZoomBy(0.8)}
              >
                <HugeiconsIcon icon={ZoomOutAreaIcon} size={19} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom in">
              <ActionIcon
                aria-label="Zoom drum pattern panel in"
                size="lg"
                variant="light"
                onClick={() => handleZoomBy(1.25)}
              >
                <HugeiconsIcon icon={ZoomInAreaIcon} size={19} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
        <Box
          style={{
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: 'var(--mantine-radius-sm)',
            display: 'grid',
            gridTemplateColumns: `${PANEL_PIANO_WIDTH}px minmax(0, 1fr)`,
            height: PANEL_VIEWPORT_HEIGHT,
            overflow: 'hidden',
          }}
        >
          <DrumPieceLabels
            ref={drumLabelsRef}
            pieces={DRUM_PIECE_ROWS}
          />
          <Box
            ref={scrollRef}
            aria-label="Drum pattern panel for timeline"
            onScroll={syncScroll}
            onWheel={handleWheel}
            style={{
              background: 'var(--mantine-color-gray-0)',
              minWidth: 0,
              overflow: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            <Box
              ref={timelineRef}
              style={{
                display: 'grid',
                gridTemplateRows: `${PANEL_RULER_HEIGHT}px ${PANEL_DRUM_GRID_HEIGHT}px`,
                width: timelineWidth,
              }}
            >
              <PatternPanelRuler
                marks={rulerMarks}
                pixelsPerTick={viewport.pixelsPerTick}
                timelineWidth={timelineWidth}
              />

              <DrumPatternRoll
                drag={dragState}
                drumPieceRowsRef={drumPieceRowsRef}
                pattern={pattern}
                marks={rulerMarks}
                pixelsPerTick={viewport.pixelsPerTick}
                timelineWidth={timelineWidth}
                playheadRef={playheadProps.ref}
                selectedPatternEventIds={selectedPatternEventIds}
                tool={tool}
                onDeletePatternEvent={onDeletePatternEvent}
                onMoveDrumPatternEvent={handleMoveDrumPatternEvent}
                onPointerCancel={cancelDrag}
                onPointerDown={handlePatternRollPointerDown}
                onPointerMove={handlePatternRollPointerMove}
                onPointerUp={handlePatternRollPointerUp}
                onSelectPatternEvent={onSelectPatternEvent}
              />
            </Box>
          </Box>
        </Box>
        <PatternPanelVelocityRow
          pattern={pattern}
          pixelsPerTick={viewport.pixelsPerTick}
          selectedPatternEvent={selectedPatternEvent}
          selectedPatternEventIds={selectedPatternEventIds}
          timelineWidth={timelineWidth}
          tool={tool}
          velocityTimelineRef={velocityTimelineRef}
          onDeletePatternEvent={onDeletePatternEvent}
          onSelectPatternEvent={onSelectPatternEvent}
          onUpdatePatternEventDraft={onUpdatePatternEventDraft}
        />
      </Stack>
    </Paper>
  )
})

const DrumPatternRoll = memo(function DrumPatternRoll({
  drag,
  drumPieceRowsRef,
  marks,
  pattern,
  playheadRef,
  pixelsPerTick,
  selectedPatternEventIds,
  timelineWidth,
  tool,
  onDeletePatternEvent,
  onMoveDrumPatternEvent,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelectPatternEvent,
}: {
  drag?: DragState
  drumPieceRowsRef: RefObject<HTMLDivElement | null>
  marks: RulerMark[]
  pattern: DrumPattern
  playheadRef: RefObject<HTMLDivElement | null>
  pixelsPerTick: number
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  tool: ActivePatternPanelTool
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onMoveDrumPatternEvent: (
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: DrumHitEvent,
  ) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, patternId: DrumPattern['id']) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
}) {
  const dragOverlay = usePatternEventOverlay(drag, pattern)

  const handlePointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, event.clientX - rect.left)

    if (x >= pattern.lengthTicks * pixelsPerTick) {
      return
    }

    onPointerDown(event, pattern.id)
  }, [onPointerDown, pattern.id, pattern.lengthTicks, pixelsPerTick])

  return (
    <Box
      ref={drumPieceRowsRef}
      onPointerCancel={onPointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        background: 'var(--mantine-color-gray-0)',
        cursor: tool === 'draw' ? 'crosshair' : 'default',
        height: PANEL_DRUM_GRID_HEIGHT,
        position: 'relative',
        userSelect: 'none',
        width: timelineWidth,
      }}
    >
      <DrumPatternRows />
      <DrumPatternGridLines
        marks={marks}
        pixelsPerTick={pixelsPerTick}
      />
      {dragOverlay.drawRange !== undefined && dragOverlay.piece !== undefined && (
        <Box
          aria-label={`New ${getDrumPieceLabel(dragOverlay.piece)} hit`}
          style={{
            background: 'color-mix(in srgb, var(--mantine-color-orange-6) 60%, transparent)',
            border: '1px dashed var(--mantine-color-orange-2)',
            borderRadius: 3,
            height: PANEL_DRUM_ROW_HEIGHT - 8,
            left: Math.min(
              dragOverlay.drawRange.startTick,
              dragOverlay.drawRange.endTick,
            ) * pixelsPerTick,
            pointerEvents: 'none',
            position: 'absolute',
            top: (getDrumPieceRowIndex(dragOverlay.piece) * PANEL_DRUM_ROW_HEIGHT) + 4,
            width: 16,
            zIndex: 3,
          }}
        />
      )}
      {pattern.events.map((patternEvent) => {
        const movingEvent = dragOverlay.patternEventPlaceholder?.id === patternEvent.id
          && dragOverlay.patternEventPlaceholder.kind === 'drumHit'
          ? dragOverlay.patternEventPlaceholder
          : undefined
        const renderedEvent = movingEvent ?? patternEvent
        const selected = selectedPatternEventIds?.includes(patternEvent.id)

        return (
          <Box
            key={patternEvent.id}
            component="button"
            type="button"
            aria-label={`${getDrumPieceLabel(renderedEvent.piece)} at tick ${renderedEvent.timeTick}`}
            onPointerDown={(pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
              pointerEvent.stopPropagation()

              if (tool === 'delete') {
                onDeletePatternEvent(patternEvent.id)
                return
              }

              if (tool === 'select') {
                onSelectPatternEvent(patternEvent.id, pointerEvent.shiftKey)
                onMoveDrumPatternEvent(pointerEvent, patternEvent)
              }
            }}
            style={{
              background: 'var(--mantine-color-orange-6)',
              border: selected
                ? '2px solid var(--mantine-color-orange-1)'
                : '1px solid var(--mantine-color-orange-8)',
              borderRadius: 3,
              cursor: movingEvent === undefined ? 'pointer' : 'grabbing',
              height: PANEL_DRUM_ROW_HEIGHT - 8,
              left: renderedEvent.timeTick * pixelsPerTick,
              opacity: getPatternEventOpacity(renderedEvent),
              padding: 0,
              position: 'absolute',
              top: (getDrumPieceRowIndex(renderedEvent.piece) * PANEL_DRUM_ROW_HEIGHT) + 4,
              width: 16,
              zIndex: selected ? 3 : 2,
            }}
          />
        )
      })}
      <Box
        ref={playheadRef}
        aria-label="Drum pattern panel playhead"
        style={{
          background: 'var(--mantine-color-red-6)',
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          visibility: 'hidden',
          width: 2,
          zIndex: 4,
        }}
      />
    </Box>
  )
})

const DrumPatternRows = memo(function DrumPatternRows() {
  return (
    <>
      {DRUM_PIECE_ROWS.map((piece, rowIndex) => (
        <Box
          key={piece}
          aria-hidden
          data-drum-piece={piece}
          style={{
            background: rowIndex % 2 === 0
              ? 'var(--mantine-color-white)'
              : 'var(--mantine-color-gray-1)',
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            height: PANEL_DRUM_ROW_HEIGHT,
            left: 0,
            position: 'absolute',
            right: 0,
            top: rowIndex * PANEL_DRUM_ROW_HEIGHT,
          }}
        />
      ))}
    </>
  )
})

const DrumPatternGridLines = memo(function DrumPatternGridLines({
  marks,
  pixelsPerTick,
}: {
  marks: RulerMark[]
  pixelsPerTick: number
}) {
  return (
    <>
      {marks.map(mark => (
        <Box
          key={`${mark.kind}-${mark.tick}`}
          aria-hidden
          style={{
            background: getGridLineColor(mark.kind),
            bottom: 0,
            left: mark.tick * pixelsPerTick,
            opacity: getGridLineOpacity(mark.kind),
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            width: 1,
            zIndex: 1,
          }}
        />
      ))}
    </>
  )
})

export const DrumPieceLabels = forwardRef<
  HTMLDivElement,
  { pieces: readonly DrumPiece[] }
>(function DrumPieceLabels({
  pieces,
}, ref) {
  return (
    <Box
      style={{
        borderRight: '1px solid var(--mantine-color-default-border)',
        display: 'grid',
        gridTemplateRows: `${PANEL_RULER_HEIGHT}px minmax(0, 1fr)`,
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          alignItems: 'center',
          background: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
          display: 'flex',
          justifyContent: 'center',
          zIndex: 6,
        }}
      >
        <Text c="dimmed" fw={700} size="10px">
          DRUMS
        </Text>
      </Box>
      <Box
        style={{
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box
          ref={ref}
          style={{
            height: PANEL_DRUM_GRID_HEIGHT,
            transform: 'translateY(0)',
            willChange: 'transform',
          }}
        >
          {pieces.map(piece => (
            <Box
              key={piece}
              style={{
                alignItems: 'center',
                borderBottom: '1px solid var(--mantine-color-default-border)',
                display: 'flex',
                height: PANEL_DRUM_ROW_HEIGHT,
                paddingInline: 10,
              }}
            >
              <Text fw={500} size="xs" truncate>
                {getDrumPieceLabel(piece)}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
})

export function getDrumPieceLabel(
  piece: DrumPiece,
): string {
  switch (piece) {
    case 'kick':
      return 'Kick'
    case 'snare':
      return 'Snare'
    case 'clap':
      return 'Clap'
    case 'closedHat':
      return 'Closed Hat'
    case 'openHat':
      return 'Open Hat'
    case 'lowTom':
      return 'Low Tom'
    case 'midTom':
      return 'Mid Tom'
    case 'highTom':
      return 'High Tom'
    case 'crash':
      return 'Crash'
    case 'ride':
      return 'Ride'
  }
}

function getDrumPieceRowIndex(piece: DrumPiece): number {
  return DRUM_PIECE_ROWS.indexOf(piece)
}

function getPatternEventOpacity(patternEvent: PatternEvent): number {
  if (patternEvent.kind === 'automation') {
    return 1
  }

  return 0.2 + (patternEvent.velocity / MAX_VELOCITY * 0.8)
}

function getGridLineColor(kind: RulerMark['kind']): string {
  switch (kind) {
    case 'bar':
      return 'var(--mantine-color-gray-5)'
    case 'beat':
      return 'var(--mantine-color-gray-4)'
    case 'subdivision':
      return 'var(--mantine-color-gray-3)'
  }
}

function getGridLineOpacity(kind: RulerMark['kind']): number {
  switch (kind) {
    case 'bar':
      return 0.8
    case 'beat':
      return 0.5
    case 'subdivision':
      return 0.25
  }
}
