import {
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
import {
  HugeiconsIcon,
} from '@hugeicons/react'
import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'

import {
  BLACK_PITCH_CLASSES,
  PANEL_KEY_COUNT,
  PANEL_MAX_MIDI_NOTE,
  PANEL_MIN_MIDI_NOTE,
  PANEL_OCTAVE_COUNT,
  PANEL_OCTAVE_START,
  PANEL_PIANO_WIDTH,
  PANEL_ROLL_HEIGHT,
  PANEL_ROW_HEIGHT,
  PANEL_RULER_HEIGHT,
  PANEL_VIEWPORT_HEIGHT,
} from './constants'
import { PatternPanelRuler } from './PatternPanelRuler'
import { PatternPanelToolButton } from './PatternPanelToolButton'
import { PatternPanelVelocityRow } from './PatternPanelVelocity'
import {
  Piano,
} from '~/components/Piano/Piano'
import {
  usePlaybackEngine,
} from '~/components/Providers/PlaybackProvider'
import {
  type Block,
  getNoteNameForPitchClass,
  getOctaveForMidiNote,
  getPatternEventDurationTicks,
  getRulerMarks,
  getVoicedNotesFromPatternEvent,
  MAX_VELOCITY,
  type MidiNote,
  type NoteEvent,
  type NotePattern,
  type PatternEvent,
  type PatternEventId,
  pitchClassFromMidiNote,
  type RulerMark,
  type Timeline,
} from '~/domain'
import {
  useDrag,
} from '~/hooks/useDrag'
import {
  usePatternEventOverlay,
} from '~/hooks/useDragOverlay'
import {
  useTransportPlayhead,
} from '~/hooks/useTransport'
import {
  useViewport,
} from '~/hooks/useViewport'
import {
  createPatternPlayheadMap,
} from '~/playback/playhead'
import type {
  ActivePatternPanelTool,
  DragState,
  PatternEventDraft,
} from '~/store/editor'
import type {
  Dispatch,
} from '~/store/session'
import {
  type Workspace,
} from '~/store/workspace'

type PatternPanelNote = {
  event: NoteEvent
  midiNote: MidiNote
}

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
  pattern: NotePattern
}

export const NotePatternPanel = memo(function NotePatternPanel({
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

  const pianoRollRef = useRef<HTMLDivElement>(null)
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
    finishDrag,
    getPointerPitch,
    pitchRowsRef,
    startDrag,
    timelineRef,
    updateDrag,
  } = useDrag({
    dispatch,
    viewport,
    workspace,
  })

  const notes = useMemo(
    () => createPatternPanelNotes(pattern),
    [pattern],
  )

  const rulerMarks = useMemo(
    () => getRulerMarks(timeline, 0, pattern.lengthTicks),
    [pattern.lengthTicks, timeline],
  )

  const timelineWidth = pattern.lengthTicks * viewport.pixelsPerTick

  useLayoutEffect(() => {
    const scrollElement = scrollRef.current

    if (scrollElement === null) {
      return
    }

    const fitPattern = () => handleViewportFit(pattern.lengthTicks)
    const resizeObserver = new ResizeObserver(fitPattern)

    fitPattern()
    resizeObserver.observe(scrollElement)

    return () => resizeObserver.disconnect()
  }, [handleViewportFit, pattern.id, pattern.lengthTicks])

  const playheadProps = useTransportPlayhead(
    playbackEngine,
    viewport.pixelsPerTick,
    pianoRollRef,
    createPatternPlayheadMap(
      focusedBlock,
      pattern.lengthTicks,
    ),
  )

  const syncScroll = useCallback(() => {
    const scrollElement = scrollRef.current
    const pianoRoll = pianoRollRef.current
    const velocityTimeline = velocityTimelineRef.current

    if (scrollElement === null) {
      return
    }

    if (pianoRoll !== null) {
      pianoRoll.style.transform = `translateY(${-scrollElement.scrollTop}px)`
    }

    if (velocityTimeline !== null) {
      velocityTimeline.style.transform = `translateX(${-scrollElement.scrollLeft}px)`
    }
  }, [])

  useEffect(() => {
    const scrollElement = scrollRef.current

    if (scrollElement !== null) {
      scrollElement.scrollLeft = 0
      scrollElement.scrollTop = Math.max(
        0,
        ((PANEL_MAX_MIDI_NOTE - 72) * PANEL_ROW_HEIGHT)
        - (PANEL_VIEWPORT_HEIGHT / 2),
      )
      syncScroll()
    }
  }, [pattern.id, syncScroll])

  useEffect(() => {
    syncScroll()
  }, [viewport.pixelsPerTick, syncScroll])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) {
      return
    }

    handleViewportWheel(event)
  }, [handleViewportWheel])

  const handlePatternRollPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    patternId: NotePattern['id'],
  ) => {
    if (event.button !== 0 || tool !== 'draw') {
      return
    }

    startDrag(event, {
      kind: 'drawNotePatternEvent',
      patternId,
      pitch: getPointerPitch(event.clientY),
    })
  }, [getPointerPitch, startDrag, tool])

  const handleMoveNotePatternEvent = useCallback((
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: NoteEvent,
  ) => {
    if (event.button !== 0) {
      return
    }

    startDrag(event, {
      event: patternEvent,
      kind: 'moveNotePatternEvent',
      pitch: getPointerPitch(event.clientY),
      patternId: pattern.id,
    })
  }, [getPointerPitch, pattern.id, startDrag])

  const handlePatternRollPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    updateDrag(event)
  }, [updateDrag])

  const handlePatternRollPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    finishDrag(event)
  }, [finishDrag])

  return (
    <Paper withBorder p={0} style={{ overflow: 'hidden' }} mb="sm">
      <Stack gap="md" p="md">
        <Group justify="space-between" align="center">
          <Group gap={4}>
            <PatternPanelToolButton
              active={tool === 'draw'}
              disabled={pattern.kind !== 'note'}
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
                aria-label="Zoom pattern panel out"
                size="lg"
                variant="light"
                onClick={() => handleZoomBy(0.8)}
              >
                <HugeiconsIcon icon={ZoomOutAreaIcon} size={19} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom in">
              <ActionIcon
                aria-label="Zoom pattern panel in"
                size="lg"
                variant="light"
                onClick={() => handleZoomBy(1.25)}
              >
                <HugeiconsIcon icon={ZoomInAreaIcon} size={19} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {pattern.kind !== 'note' && pattern.kind !== 'chord' && (
          <Text c="dimmed" size="xs">
            Piano roll drawing is available for note patterns.
          </Text>
        )}

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
              <Text c="dimmed" fw={700} size="10px">KEYS</Text>
            </Box>
            <Box
              style={{
                overflow: 'hidden',
                position: 'relative',
                zIndex: 4,
              }}
            >
              <Box
                ref={pianoRollRef}
                style={{
                  height: PANEL_ROLL_HEIGHT,
                  transform: 'translateY(0)',
                  willChange: 'transform',
                }}
              >
                <Piano
                  hasBassNote={
                    selectedPatternEvent?.kind === 'chord'
                    && selectedPatternEvent.voicing.bassNote !== undefined
                  }
                  octaveCount={PANEL_OCTAVE_COUNT}
                  orientation="vertical"
                  startOctave={PANEL_OCTAVE_START}
                  voicedNotes={selectedPatternEvent === undefined
                    ? []
                    : getVoicedNotesFromPatternEvent(selectedPatternEvent)}
                />
              </Box>
            </Box>
          </Box>
          <Box
            ref={scrollRef}
            aria-label="Pattern panel for timeline"
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
                background: 'var(--mantine-color-gray-0)',
                display: 'grid',
                gridTemplateRows: `${PANEL_RULER_HEIGHT}px ${PANEL_ROLL_HEIGHT}px`,
                width: timelineWidth,
              }}
            >
              <PatternPanelRuler
                marks={rulerMarks}
                pixelsPerTick={viewport.pixelsPerTick}
                timelineWidth={timelineWidth}
              />
              <PatternPanelRoll
                marks={rulerMarks}
                notes={notes}
                pattern={pattern}
                pitchRowsRef={pitchRowsRef}
                playheadRef={playheadProps.ref}
                pixelsPerTick={viewport.pixelsPerTick}
                selectedPatternEventIds={selectedPatternEventIds}
                timelineWidth={timelineWidth}
                tool={tool}
                drag={dragState}
                onDeletePatternEvent={onDeletePatternEvent}
                onMoveNotePatternEvent={handleMoveNotePatternEvent}
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

const PatternPanelRoll = memo(function PatternPanelRoll({
  tool,
  marks,
  notes,
  pattern,
  pitchRowsRef,
  playheadRef,
  pixelsPerTick,
  selectedPatternEventIds,
  timelineWidth,
  drag,
  onDeletePatternEvent,
  onMoveNotePatternEvent,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelectPatternEvent,
}: {
  tool: ActivePatternPanelTool
  marks: RulerMark[]
  notes: PatternPanelNote[]
  pattern: NotePattern
  pitchRowsRef: RefObject<HTMLDivElement | null>
  playheadRef: RefObject<HTMLDivElement | null>
  pixelsPerTick: number
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  drag?: DragState
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onMoveNotePatternEvent: (
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: NoteEvent,
  ) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, patternId: NotePattern['id']) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
}) {
  const dragOverlay = usePatternEventOverlay(drag, pattern)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, event.clientX - rect.left)

    if (x >= pattern.lengthTicks * pixelsPerTick) {
      return
    }

    onPointerDown(event, pattern.id)
  }, [onPointerDown, pattern.id, pattern.lengthTicks, pixelsPerTick])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove(event)
  }, [onPointerMove])

  const handlePointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerCancel(event)
  }, [onPointerCancel])

  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerUp(event)
  }, [onPointerUp])

  return (
    <Box
      ref={pitchRowsRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerCancel={handlePointerCancel}
      onPointerUp={handlePointerUp}
      style={{
        background: 'var(--mantine-color-gray-0)',
        cursor: tool === 'draw' && pattern.kind === 'note' ? 'crosshair' : 'default',
        height: PANEL_ROLL_HEIGHT,
        position: 'relative',
        width: timelineWidth,
        userSelect: 'none',
      }}
    >
      <PatternPanelPitchRows />
      <PatternPanelGridLines
        marks={marks}
        pixelsPerTick={pixelsPerTick}
      />
      {dragOverlay?.drawRange !== undefined && dragOverlay.pitch !== undefined && (
        <Box
          aria-label={`New ${formatMidiNote(dragOverlay.pitch)} note`}
          style={{
            background: 'color-mix(in srgb, var(--mantine-color-blue-6) 60%, transparent)',
            border: '1px dashed var(--mantine-color-blue-2)',
            borderRadius: 3,
            height: PANEL_ROW_HEIGHT - 2,
            left: Math.min(
              dragOverlay.drawRange.startTick,
              dragOverlay.drawRange.endTick,
            ) * pixelsPerTick,
            pointerEvents: 'none',
            position: 'absolute',
            top: ((PANEL_MAX_MIDI_NOTE - dragOverlay.pitch) * PANEL_ROW_HEIGHT) + 1,
            width: Math.max(
              8,
              Math.abs(
                dragOverlay.drawRange.endTick
                - dragOverlay.drawRange.startTick,
              ) * pixelsPerTick,
            ),
            zIndex: 3,
          }}
        />
      )}
      {notes.map(({ event, midiNote }) => {
        const movingEvent = dragOverlay.patternEventPlaceholder?.id === event.id
          && dragOverlay.patternEventPlaceholder.kind === 'note'
          ? dragOverlay.patternEventPlaceholder
          : undefined
        const renderedEvent = movingEvent ?? event
        const renderedMidiNote = movingEvent?.pitch ?? midiNote
        const selected = selectedPatternEventIds?.includes(event.id)
        const width = Math.max(
          8,
          getPatternEventDurationTicks(renderedEvent) * pixelsPerTick,
        )

        return (
          <Box
            key={`${event.id}-${midiNote}`}
            component="button"
            type="button"
            aria-label={`${formatMidiNote(renderedMidiNote)} at tick ${renderedEvent.timeTick}`}
            onPointerDown={(pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
              pointerEvent.stopPropagation()

              if (tool === 'delete') {
                onDeletePatternEvent(event.id)
                return
              }

              if (tool === 'select') {
                onSelectPatternEvent(event.id, pointerEvent.shiftKey)
                onMoveNotePatternEvent(pointerEvent, event)
              }
            }}
            style={{
              alignItems: 'center',
              background: 'var(--mantine-color-blue-6)',
              border: selected
                ? '2px solid var(--mantine-color-blue-1)'
                : '1px solid var(--mantine-color-blue-8)',
              borderRadius: 3,
              color: 'white',
              cursor: movingEvent === undefined ? 'pointer' : 'grabbing',
              display: 'flex',
              height: PANEL_ROW_HEIGHT - 2,
              left: renderedEvent.timeTick * pixelsPerTick,
              opacity: getPatternEventOpacity(renderedEvent),
              overflow: 'hidden',
              paddingInline: 4,
              position: 'absolute',
              top: ((PANEL_MAX_MIDI_NOTE - renderedMidiNote) * PANEL_ROW_HEIGHT) + 1,
              width,
              zIndex: selected ? 3 : 2,
            }}
          >
            {width >= 42 && (
              <Text fw={700} size="10px" truncate>
                {formatMidiNote(renderedMidiNote)}
              </Text>
            )}
          </Box>
        )
      })}
      <Box
        ref={playheadRef}
        aria-label="Pattern panel playhead"
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

const PatternPanelPitchRows = memo(function PatternPanelPitchRows() {
  return (
    <>
      {Array.from({ length: PANEL_KEY_COUNT }, (_, rowIndex) => {
        const midiNote = PANEL_MAX_MIDI_NOTE - rowIndex
        const pitchClass = pitchClassFromMidiNote(midiNote)

        return (
          <Box
            key={midiNote}
            aria-hidden
            data-midi-note={midiNote}
            style={{
              background: BLACK_PITCH_CLASSES.has(pitchClass)
                ? 'var(--mantine-color-gray-2)'
                : 'var(--mantine-color-white)',
              borderBottom: '1px solid var(--mantine-color-gray-3)',
              height: PANEL_ROW_HEIGHT,
              left: 0,
              position: 'absolute',
              right: 0,
              top: rowIndex * PANEL_ROW_HEIGHT,
            }}
          />
        )
      })}
    </>
  )
})

const PatternPanelGridLines = memo(function PatternPanelGridLines({
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

function createPatternPanelNotes(pattern: NotePattern): PatternPanelNote[] {
  return pattern.events.flatMap(event => (
    getVoicedNotesFromPatternEvent(event)
      .filter(note => (
        note.midiNote >= PANEL_MIN_MIDI_NOTE
        && note.midiNote <= PANEL_MAX_MIDI_NOTE
      ))
      .map(note => ({
        event,
        midiNote: note.midiNote,
      }))
  ))
}

function getPatternEventOpacity(patternEvent: PatternEvent): number {
  if (patternEvent.kind === 'automation') {
    return 1
  }

  return 0.2 + (patternEvent.velocity / MAX_VELOCITY * 0.8)
}

function formatMidiNote(midiNote: MidiNote): string {
  return `${getNoteNameForPitchClass(pitchClassFromMidiNote(midiNote))}${getOctaveForMidiNote(midiNote)}`
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
