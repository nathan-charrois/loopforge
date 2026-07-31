import {
  memo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
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
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  NumberInput,
  Slider,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core'

import ErrorBoundary from '../ErrorBoundary/ErrorBoundary'
import { Piano } from './piano'
import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import {
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
  PITCH_CLASSES,
  type PitchClass,
  pitchClassFromMidiNote,
  type RulerMark,
  type Timeline,
  type Velocity,
} from '~/domain'
import { useTransportPlayhead } from '~/hooks/useTransport'
import { useViewport } from '~/hooks/useViewport'
import { createPatternPlayheadMap } from '~/playback/playhead'
import type { ActivePatternPanelTool, PatternEventDraft } from '~/store/editor'
import { selectBlock, type Workspace } from '~/store/workspace'

const PANEL_OCTAVE_START = 2
const PANEL_OCTAVE_COUNT = 5
const PANEL_KEY_COUNT = PANEL_OCTAVE_COUNT * PITCH_CLASSES.length

const PANEL_MIN_MIDI_NOTE = (PANEL_OCTAVE_START + 1) * PITCH_CLASSES.length
const PANEL_MAX_MIDI_NOTE = PANEL_MIN_MIDI_NOTE + PANEL_KEY_COUNT - 1

const PANEL_RULER_HEIGHT = 34
const PANEL_ROW_HEIGHT = 16
const PANEL_ROLL_HEIGHT = PANEL_KEY_COUNT * PANEL_ROW_HEIGHT
const PANEL_VIEWPORT_HEIGHT = 440

const PANEL_PIANO_WIDTH = 88
const PANEL_TIMELINE_WIDTH = 840

const BLACK_PITCH_CLASSES = new Set<PitchClass>([1, 3, 6, 8, 10])

type PatternPanelNote = {
  event: PatternEvent
  midiNote: MidiNote
}

type Props = {
  workspace: Workspace
  tool: ActivePatternPanelTool
  timeline: Timeline
  focusedBlockId?: string
  selectedPattern?: Pattern
  selectedPatternEvent?: PatternEvent
  selectedPatternEventIds?: PatternEventId[]
  onCreatePattern: () => void
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onPatternRollPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPatternRollPointerDown: (event: ReactPointerEvent<HTMLDivElement>, patternId: Pattern['id'], pitch: MidiNote) => void
  onPatternRollPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPatternRollPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
  onSetActiveTool: (tool: ActivePatternPanelTool) => void
  onUpdatePatternEventDraft: (patternEvent: PatternEvent, patternEventDraft: Partial<PatternEventDraft>) => void
}

export const PatternPanel = memo(function PatternPanel(props: Props) {
  if (props.focusedBlockId === undefined) {
    return
  }

  return (
    <ErrorBoundary>
      <PatternPanelContent {...props} />
    </ErrorBoundary>
  )
})

const PatternPanelContent = memo(function PatternPanel({
  workspace,
  tool,
  timeline,
  focusedBlockId,
  selectedPattern,
  selectedPatternEvent,
  selectedPatternEventIds,
  onCreatePattern,
  onDeletePatternEvent,
  onPatternRollPointerCancel,
  onPatternRollPointerDown,
  onPatternRollPointerMove,
  onPatternRollPointerUp,
  onSelectPatternEvent,
  onSetActiveTool,
  onUpdatePatternEventDraft,
}: Props) {
  const playbackEngine = usePlaybackEngine()

  const pianoRollRef = useRef<HTMLDivElement>(null)
  const velocityTimelineRef = useRef<HTMLDivElement>(null)

  const focusedBlock = selectBlock(workspace, focusedBlockId ?? '')
  if (focusedBlock === undefined) {
    throw new Error('...')
  }

  const {
    viewport,
    scrollRef,
    handleViewportWheel,
    handleZoomBy,
  } = useViewport()

  const notes = useMemo(
    () => createPatternPanelNotes(selectedPattern),
    [selectedPattern],
  )

  const rulerMarks = useMemo(
    () => getRulerMarks(timeline, 0, selectedPattern?.lengthTicks ?? 0),
    [selectedPattern, timeline],
  )

  const timelineWidth = useMemo(
    () => selectedPattern === undefined ? PANEL_TIMELINE_WIDTH : Math.max(PANEL_TIMELINE_WIDTH, Math.ceil(selectedPattern.lengthTicks * viewport.pixelsPerTick)),
    [selectedPattern, viewport],
  )

  const playheadProps = useTransportPlayhead(
    playbackEngine,
    viewport.pixelsPerTick,
    pianoRollRef,
    createPatternPlayheadMap(
      focusedBlock,
      selectedPattern?.lengthTicks ?? 0,
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
  }, [selectedPattern?.id, syncScroll])

  useEffect(() => {
    syncScroll()
  }, [viewport.pixelsPerTick, syncScroll])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) {
      return
    }

    handleViewportWheel(event)
  }, [handleViewportWheel])

  return (
    <Stack
      gap="sm"
      p="md"
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <Title order={2} size="h3">Pattern</Title>
          <Badge variant="light">{selectedPattern?.name}</Badge>
        </Group>
        <Text c="dimmed" size="xs">
          Ctrl/⌘ + wheel to zoom
        </Text>
      </Group>

      {selectedPattern === undefined && (
        <PatternPanelEmptyState onCreatePattern={onCreatePattern} />
      )}

      {selectedPattern !== undefined && (
        <>
          <Group justify="space-between" align="center">
            <Group gap={4}>
              <PatternPanelToolButton
                active={tool === 'draw'}
                disabled={selectedPattern.kind !== 'note'}
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
              <Badge color="gray" variant="light">
                Snap:
                {' '}
                {timeline.grid}
              </Badge>
              <Tooltip label="Zoom out">
                <ActionIcon
                  aria-label="Zoom pattern panel out"
                  size="sm"
                  variant="subtle"
                  onClick={() => handleZoomBy(0.8)}
                >
                  <HugeiconsIcon icon={ZoomOutAreaIcon} size={15} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="Zoom in">
                <ActionIcon
                  aria-label="Zoom pattern panel in"
                  size="sm"
                  variant="subtle"
                  onClick={() => handleZoomBy(1.25)}
                >
                  <HugeiconsIcon icon={ZoomInAreaIcon} size={15} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {selectedPattern.kind !== 'note' && selectedPattern.kind !== 'chord' && (
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
                minWidth: 0,
                overflow: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              <Box
                style={{
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
                  pattern={selectedPattern}
                  playheadRef={playheadProps.ref}
                  pixelsPerTick={viewport.pixelsPerTick}
                  selectedPatternEventIds={selectedPatternEventIds}
                  timelineWidth={timelineWidth}
                  tool={tool}
                  onDeletePatternEvent={onDeletePatternEvent}
                  onPointerCancel={onPatternRollPointerCancel}
                  onPointerDown={onPatternRollPointerDown}
                  onPointerMove={onPatternRollPointerMove}
                  onPointerUp={onPatternRollPointerUp}
                  onSelectPatternEvent={onSelectPatternEvent}
                />
              </Box>
            </Box>
          </Box>

          <PatternPanelVelocityRow
            pattern={selectedPattern}
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
        </>
      )}
    </Stack>
  )
})

const PatternPanelEmptyState = memo(function PatternPanelEmptyState({
  onCreatePattern,
}: {
  onCreatePattern: () => void
}) {
  return (
    <Box
      style={{
        alignItems: 'center',
        border: '1px dashed var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-sm)',
        display: 'flex',
        height: 220,
        justifyContent: 'center',
      }}
    >
      <Stack align="center" gap="xs">
        <Text c="dimmed" size="sm">Create a pattern to start editing.</Text>
        <Button size="xs" onClick={onCreatePattern}>Create Pattern</Button>
      </Stack>
    </Box>
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
        background: 'var(--mantine-color-body)',
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
          c="dimmed"
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
  playheadRef,
  pixelsPerTick,
  selectedPatternEventIds,
  timelineWidth,
  onDeletePatternEvent,
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
  playheadRef: RefObject<HTMLDivElement | null>
  pixelsPerTick: number
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onPointerCancel: (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => void
  onPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    patternId: Pattern['id'],
    pitch: MidiNote,
  ) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
}) {
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (pattern.kind !== 'note') {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, event.clientX - rect.left)
    const y = Math.max(0, Math.min(PANEL_ROLL_HEIGHT - 1, event.clientY - rect.top))

    if (x >= pattern.lengthTicks * pixelsPerTick) {
      return
    }

    const pitch = (PANEL_MAX_MIDI_NOTE - Math.floor(y / PANEL_ROW_HEIGHT)) as MidiNote

    onPointerDown(event, pattern.id, pitch)
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerCancel={handlePointerCancel}
      onPointerUp={handlePointerUp}
      style={{
        cursor: tool === 'draw' && pattern.kind === 'note' ? 'crosshair' : 'default',
        height: PANEL_ROLL_HEIGHT,
        position: 'relative',
        width: timelineWidth,
      }}
    >
      <PatternPanelPitchRows />
      <PatternPanelGridLines
        marks={marks}
        pixelsPerTick={pixelsPerTick}
      />
      {notes.map(({ event, midiNote }) => {
        const selected = selectedPatternEventIds?.includes(event.id)
        const width = Math.max(
          8,
          getPatternEventDurationTicks(event) * pixelsPerTick,
        )

        return (
          <Box
            key={`${event.id}-${midiNote}`}
            component="button"
            type="button"
            aria-label={`${formatMidiNote(midiNote)} at tick ${event.timeTick}`}
            onPointerDown={(pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
              pointerEvent.stopPropagation()

              if (tool === 'delete') {
                onDeletePatternEvent(event.id)
                return
              }

              if (tool === 'select') {
                onSelectPatternEvent(event.id, pointerEvent.shiftKey)
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
              cursor: 'pointer',
              display: 'flex',
              height: PANEL_ROW_HEIGHT - 2,
              left: event.timeTick * pixelsPerTick,
              opacity: getPatternEventOpacity(event),
              overflow: 'hidden',
              paddingInline: 4,
              position: 'absolute',
              top: ((PANEL_MAX_MIDI_NOTE - midiNote) * PANEL_ROW_HEIGHT) + 1,
              width,
              zIndex: selected ? 3 : 2,
            }}
          >
            {width >= 42 && (
              <Text fw={700} size="10px" truncate>
                {formatMidiNote(midiNote)}
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
            style={{
              background: BLACK_PITCH_CLASSES.has(pitchClass)
                ? 'color-mix(in srgb, var(--mantine-color-dark-8) 72%, transparent)'
                : 'color-mix(in srgb, var(--mantine-color-dark-6) 52%, transparent)',
              borderBottom: '1px solid color-mix(in srgb, var(--mantine-color-gray-6) 24%, transparent)',
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
      <Box pos="relative" style={{ overflow: 'hidden' }}>
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

function createPatternPanelNotes(pattern?: Pattern): PatternPanelNote[] {
  if (pattern === undefined) {
    return []
  }

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
      return 'var(--mantine-color-gray-4)'
    case 'beat':
      return 'var(--mantine-color-gray-5)'
    case 'subdivision':
      return 'var(--mantine-color-gray-6)'
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
