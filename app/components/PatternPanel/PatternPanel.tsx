import {
  memo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
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
  NumberInput,
  Slider,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'

import {
  ErrorBoundary,
} from '../ErrorBoundary/ErrorBoundary'
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
  type Pattern,
  type PatternEvent,
  type PatternEventId,
  pitchClassFromMidiNote,
  type RulerMark,
  type Timeline,
  type Velocity,
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
  selectBlock,
  selectPatternForBlock,
  type Workspace,
} from '~/store/workspace'

type PatternPanelNote = {
  event: PatternEvent
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
}

export const PatternPanel = memo(function PatternPanel(props: Props) {
  if (props.focusedBlockId === undefined) {
    return null
  }

  const focusedBlock = selectBlock(props.workspace, props.focusedBlockId)
  if (focusedBlock === undefined) {
    return null
  }

  const pattern = selectPatternForBlock(props.workspace, focusedBlock)
  if (pattern === undefined) {
    return null
  }

  return (
    <ErrorBoundary>
      <PatternPanelContent
        focusedBlock={focusedBlock}
        pattern={pattern}
        {...props}
      />
    </ErrorBoundary>
  )
})

type ContentProps = Props & {
  focusedBlock: Block
  pattern: Pattern
}

const PatternPanelContent = memo(function PatternPanelContent({
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
}: ContentProps) {
  const playbackEngine = usePlaybackEngine()

  const pianoRollRef = useRef<HTMLDivElement>(null)
  const velocityTimelineRef = useRef<HTMLDivElement>(null)

  const {
    viewport,
    scrollRef,
    handleViewportResize,
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

    const fitPattern = () => handleViewportResize(pattern.lengthTicks)
    const resizeObserver = new ResizeObserver(fitPattern)

    fitPattern()
    resizeObserver.observe(scrollElement)

    return () => resizeObserver.disconnect()
  }, [handleViewportResize, pattern.id, pattern.lengthTicks])

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
    patternId: Pattern['id'],
  ) => {
    if (event.button !== 0 || tool !== 'draw') {
      return
    }

    startDrag(event, {
      kind: 'drawPatternEvent',
      patternId,
      pitch: getPointerPitch(event.clientY),
    })
  }, [getPointerPitch, startDrag, tool])

  const handleMovePatternEvent = useCallback((
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: PatternEvent,
  ) => {
    if (event.button !== 0 || patternEvent.kind !== 'note') {
      return
    }

    startDrag(event, {
      event: patternEvent,
      kind: 'movePatternEvent',
      patternEventPitch: getPointerPitch(event.clientY),
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
    <Stack
      gap="md"
      p="md"
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
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
              onMovePatternEvent={handleMovePatternEvent}
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
  )
})

const PatternPanelToolButton = memo(function PatternPanelToolButton({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean
  disabled?: boolean
  icon: typeof CursorIcon
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip label={label}>
      <ActionIcon
        aria-label={label}
        aria-pressed={active}
        color={active ? 'blue' : 'gray'}
        disabled={disabled}
        size="lg"
        variant={active ? 'filled' : 'light'}
        onClick={onClick}
      >
        <HugeiconsIcon icon={icon} size={17} />
      </ActionIcon>
    </Tooltip>
  )
})

const PatternPanelRuler = memo(function PatternPanelRuler({
  marks,
  pixelsPerTick,
  timelineWidth,
}: {
  marks: RulerMark[]
  pixelsPerTick: number
  timelineWidth: number
}) {
  return (
    <Box
      style={{
        background: 'var(--mantine-color-white)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        height: PANEL_RULER_HEIGHT,
        position: 'sticky',
        top: 0,
        width: timelineWidth,
        zIndex: 5,
      }}
    >
      {marks.filter(mark => mark.kind === 'bar').map(mark => (
        <Text
          key={`${mark.kind}-${mark.tick}`}
          c="dark.7"
          fw={700}
          size="10px"
          style={{
            left: (mark.tick * pixelsPerTick) + 5,
            lineHeight: `${PANEL_RULER_HEIGHT}px`,
            position: 'absolute',
            whiteSpace: 'nowrap',
          }}
        >
          {mark.label}
        </Text>
      ))}
    </Box>
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
  onMovePatternEvent,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelectPatternEvent,
}: {
  tool: ActivePatternPanelTool
  marks: RulerMark[]
  notes: PatternPanelNote[]
  pattern: Pattern
  pitchRowsRef: RefObject<HTMLDivElement | null>
  playheadRef: RefObject<HTMLDivElement | null>
  pixelsPerTick: number
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  drag?: DragState
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onMovePatternEvent: (event: ReactPointerEvent<HTMLButtonElement>, patternEvent: PatternEvent) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, patternId: Pattern['id']) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
}) {
  const dragOverlay = usePatternEventOverlay(drag, pattern)

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (pattern.kind !== 'note') {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, event.clientX - rect.left)

    if (x >= pattern.lengthTicks * pixelsPerTick) {
      return
    }

    onPointerDown(event, pattern.id)
  }, [onPointerDown, pattern.id, pattern.kind, pattern.lengthTicks, pixelsPerTick])

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
                onMovePatternEvent(pointerEvent, event)
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

const PatternPanelVelocityRow = memo(function PatternPanelVelocityRow({
  tool,
  pattern,
  pixelsPerTick,
  selectedPatternEvent,
  selectedPatternEventIds,
  timelineWidth,
  velocityTimelineRef,
  onDeletePatternEvent,
  onSelectPatternEvent,
  onUpdatePatternEventDraft,
}: {
  tool: ActivePatternPanelTool
  pattern: Pattern
  pixelsPerTick: number
  selectedPatternEvent?: PatternEvent
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  velocityTimelineRef: RefObject<HTMLDivElement | null>
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
  onUpdatePatternEventDraft: (patternEvent: PatternEvent, patternEventDraft: Partial<PatternEventDraft>) => void
}) {
  const selectedVelocityEvent = selectedPatternEvent !== undefined
    && selectedPatternEvent.kind !== 'automation'
    ? selectedPatternEvent
    : undefined
  const [velocity, setVelocity] = useState<Velocity>(
    selectedVelocityEvent?.velocity ?? 0,
  )

  useEffect(() => {
    setVelocity(selectedVelocityEvent?.velocity ?? 0)
  }, [selectedVelocityEvent?.id, selectedVelocityEvent?.velocity])

  const commitVelocity = useCallback((nextVelocity: number) => {
    if (selectedVelocityEvent === undefined) {
      return
    }

    const clampedVelocity = Math.min(
      MAX_VELOCITY,
      Math.max(0, Math.round(nextVelocity)),
    )

    setVelocity(clampedVelocity)
    onUpdatePatternEventDraft(selectedVelocityEvent, {
      patternEventVelocity: clampedVelocity,
    })
  }, [onUpdatePatternEventDraft, selectedVelocityEvent])

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-sm)',
        display: 'grid',
        gridTemplateColumns: `${PANEL_PIANO_WIDTH}px minmax(0, 1fr)`,
        minHeight: 104,
        overflow: 'hidden',
      }}
    >
      <Stack
        gap={6}
        p="xs"
        style={{
          borderRight: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Text fw={700} size="xs">Velocity</Text>
        <NumberInput
          aria-label="Selected note velocity"
          disabled={selectedVelocityEvent === undefined}
          max={MAX_VELOCITY}
          min={0}
          size="xs"
          value={velocity}
          onBlur={() => commitVelocity(velocity)}
          onChange={value => setVelocity(Number(value) || 0)}
        />
        <Slider
          label={null}
          max={MAX_VELOCITY}
          min={0}
          size="xs"
          disabled={selectedVelocityEvent === undefined}
          value={velocity}
          onChange={setVelocity}
          onChangeEnd={commitVelocity}
        />
      </Stack>
      <Box
        pos="relative"
        style={{
          background: 'var(--mantine-color-gray-0)',
          overflow: 'hidden',
        }}
      >
        <Box
          ref={velocityTimelineRef}
          style={{
            height: 102,
            position: 'relative',
            transform: 'translateX(0)',
            width: timelineWidth,
            willChange: 'transform',
          }}
        >
          {pattern.events.filter(
            (patternEvent): patternEvent is Extract<PatternEvent, { velocity: Velocity }> => (
              patternEvent.kind !== 'automation'
            ),
          ).map((patternEvent) => {
            const selected = selectedPatternEventIds?.includes(patternEvent.id)
            const height = Math.max(4, patternEvent.velocity / MAX_VELOCITY * 72)

            return (
              <Box
                key={patternEvent.id}
                component="button"
                type="button"
                aria-label={`Velocity ${patternEvent.velocity}`}
                onPointerDown={(pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
                  pointerEvent.stopPropagation()

                  if (tool === 'delete') {
                    onDeletePatternEvent(patternEvent.id)
                    return
                  }

                  onSelectPatternEvent(patternEvent.id, pointerEvent.shiftKey)
                }}
                style={{
                  background: selected
                    ? 'var(--mantine-color-blue-5)'
                    : 'var(--mantine-color-blue-3)',
                  border: 0,
                  borderRadius: '2px 2px 0 0',
                  bottom: 12,
                  cursor: 'pointer',
                  height,
                  left: patternEvent.timeTick * pixelsPerTick,
                  opacity: getPatternEventOpacity(patternEvent),
                  padding: 0,
                  position: 'absolute',
                  width: selected ? 7 : 5,
                }}
              />
            )
          })}
        </Box>
      </Box>
    </Box>
  )
})

function createPatternPanelNotes(pattern: Pattern): PatternPanelNote[] {
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
