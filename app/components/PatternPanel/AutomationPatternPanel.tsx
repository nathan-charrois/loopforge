import {
  memo,
  type PointerEvent as ReactPointerEvent,
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
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'

import {
  PANEL_PIANO_WIDTH,
  PANEL_RULER_HEIGHT,
  PANEL_VIEWPORT_HEIGHT,
} from './constants'
import { PatternPanelRuler } from './PatternPanelRuler'
import { PatternPanelToolButton } from './PatternPanelToolButton'
import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import {
  type AutomationEvent,
  type AutomationPattern,
  type AutomationValue,
  type Block,
  formatPatternEvent,
  getRulerMarks,
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

const AUTOMATION_ROW_HEIGHT = 56
const AUTOMATION_PARAMETER_DEFAULT_VALUES = {
  filterCutoff: 0.5,
  pan: 0,
  volumeDb: -6,
} as const satisfies Record<string, AutomationValue>
const AUTOMATION_PARAMETERS = Object.keys(AUTOMATION_PARAMETER_DEFAULT_VALUES)

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
  onUpdatePatternEventDraft: (
    patternEvent: PatternEvent,
    patternEventDraft: Partial<PatternEventDraft>,
  ) => void
  focusedBlock: Block
  pattern: AutomationPattern
}

export const AutomationPatternPanel = memo(function AutomationPatternPanel({
  dispatch,
  focusedBlock,
  onDeletePatternEvent,
  onSelectPatternEvent,
  onSetActiveTool,
  onUpdatePatternEventDraft,
  pattern,
  selectedPatternEvent,
  selectedPatternEventIds,
  timeline,
  tool,
  workspace,
}: Props) {
  const playbackEngine = usePlaybackEngine()
  const parameterLabelsRef = useRef<HTMLDivElement>(null)

  const {
    viewport,
    scrollRef,
    handleViewportFit,
    handleViewportWheel,
    handleZoomBy,
  } = useViewport()

  const {
    automationParameterRowsRef,
    cancelDrag,
    dragState,
    finishDrag,
    getPointerTick,
    startDrag,
    timelineRef,
    updateDrag,
  } = useDrag({
    dispatch,
    pixelsPerTick: viewport.pixelsPerTick,
    workspace,
  })

  const parameters = useMemo(
    () => getAutomationParameters(pattern),
    [pattern],
  )
  const rulerMarks = useMemo(
    () => getRulerMarks(timeline, 0, pattern.lengthTicks),
    [pattern.lengthTicks, timeline],
  )
  const selectedAutomationEvent = selectedPatternEvent?.kind === 'automation'
    && pattern.events.some(event => event.id === selectedPatternEvent.id)
    ? selectedPatternEvent
    : undefined
  const rowCount = parameters.length
  const rollHeight = rowCount * AUTOMATION_ROW_HEIGHT
  const panelHeight = Math.min(
    PANEL_VIEWPORT_HEIGHT,
    PANEL_RULER_HEIGHT + rollHeight,
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
    timelineRef,
    createPatternPlayheadMap(focusedBlock, pattern.lengthTicks),
  )

  const syncScroll = useCallback(() => {
    const scrollElement = scrollRef.current
    const parameterLabels = parameterLabelsRef.current

    if (scrollElement !== null && parameterLabels !== null) {
      parameterLabels.style.transform = `translateY(${-scrollElement.scrollTop}px)`
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

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) {
      return
    }

    handleViewportWheel(event)
  }, [handleViewportWheel])

  const handlePatternRollPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    parameter: string,
  ) => {
    if (event.button !== 0 || tool !== 'draw') {
      return
    }

    startDrag(event, {
      kind: 'drawAutomationPatternEvent',
      parameter,
      patternId: pattern.id,
      value: getAutomationDrawValue(
        pattern,
        parameter,
        getPointerTick(event.clientX),
      ),
    })
  }, [getPointerTick, pattern, startDrag, tool])

  const handlePatternRollPointerMove = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    updateDrag(event)
  }, [updateDrag])

  const handleMoveAutomationPatternEvent = useCallback((
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: AutomationEvent,
  ) => {
    if (event.button !== 0) {
      return
    }

    startDrag(event, {
      event: patternEvent,
      kind: 'moveAutomationPatternEvent',
      parameter: patternEvent.parameter,
      patternId: pattern.id,
    })
  }, [pattern.id, startDrag])

  const handlePatternRollPointerUp = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    finishDrag(event)
  }, [finishDrag])

  const updateParameter = useCallback((parameter: string) => {
    if (selectedAutomationEvent === undefined) {
      return
    }

    onUpdatePatternEventDraft(selectedAutomationEvent, {
      patternEventParameter: parameter,
    })
  }, [onUpdatePatternEventDraft, selectedAutomationEvent])

  const updateValue = useCallback((value: AutomationValue) => {
    if (selectedAutomationEvent === undefined) {
      return
    }

    onUpdatePatternEventDraft(selectedAutomationEvent, {
      patternEventValue: value,
    })
  }, [onUpdatePatternEventDraft, selectedAutomationEvent])

  return (
    <Paper withBorder p={0} style={{ overflow: 'hidden' }} mb="sm">
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
                aria-label="Zoom automation pattern panel out"
                size="lg"
                variant="light"
                onClick={() => handleZoomBy(0.8)}
              >
                <HugeiconsIcon icon={ZoomOutAreaIcon} size={19} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Zoom in">
              <ActionIcon
                aria-label="Zoom automation pattern panel in"
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
            height: panelHeight,
            overflow: 'hidden',
          }}
        >
          <AutomationParameterLabels
            ref={parameterLabelsRef}
            parameters={parameters}
            rowCount={rowCount}
          />
          <Box
            ref={scrollRef}
            aria-label="Automation pattern panel for timeline"
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
                gridTemplateRows: `${PANEL_RULER_HEIGHT}px ${rollHeight}px`,
                width: timelineWidth,
              }}
            >
              <PatternPanelRuler
                marks={rulerMarks}
                pixelsPerTick={viewport.pixelsPerTick}
                timelineWidth={timelineWidth}
              />
              <AutomationPatternRoll
                automationParameterRowsRef={automationParameterRowsRef}
                drag={dragState}
                marks={rulerMarks}
                parameters={parameters}
                pattern={pattern}
                playheadRef={playheadProps.ref}
                pixelsPerTick={viewport.pixelsPerTick}
                rollHeight={rollHeight}
                selectedPatternEventIds={selectedPatternEventIds}
                timelineWidth={timelineWidth}
                tool={tool}
                onDeletePatternEvent={onDeletePatternEvent}
                onMoveAutomationPatternEvent={handleMoveAutomationPatternEvent}
                onPointerCancel={cancelDrag}
                onPointerDown={handlePatternRollPointerDown}
                onPointerMove={handlePatternRollPointerMove}
                onPointerUp={handlePatternRollPointerUp}
                onSelectPatternEvent={onSelectPatternEvent}
              />
            </Box>
          </Box>
        </Box>

        {pattern.events.length === 0 && (
          <Text c="dimmed" size="xs">
            Choose Draw and click a parameter lane to add the first event.
          </Text>
        )}

        {selectedAutomationEvent !== undefined && (
          <AutomationEventControls
            event={selectedAutomationEvent}
            onUpdateParameter={updateParameter}
            onUpdateValue={updateValue}
          />
        )}
      </Stack>
    </Paper>
  )
})

const AutomationParameterLabels = memo(function AutomationParameterLabels({
  parameters,
  rowCount,
  ref,
}: {
  parameters: string[]
  rowCount: number
  ref: React.Ref<HTMLDivElement>
}) {
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
        <Text c="dimmed" fw={700} size="10px">PARAM</Text>
      </Box>
      <Box style={{ overflow: 'hidden', position: 'relative' }}>
        <Box
          ref={ref}
          style={{
            height: rowCount * AUTOMATION_ROW_HEIGHT,
            transform: 'translateY(0)',
            willChange: 'transform',
          }}
        >
          {Array.from({ length: rowCount }, (_, index) => (
            <Box
              key={parameters[index] ?? `empty-${index}`}
              style={{
                alignItems: 'center',
                borderBottom: '1px solid var(--mantine-color-default-border)',
                display: 'flex',
                height: AUTOMATION_ROW_HEIGHT,
                paddingInline: 8,
              }}
            >
              <Text fw={500} size="xs" truncate>
                {parameters[index] ?? (index === 0 ? 'Automation' : '')}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
})

const AutomationPatternRoll = memo(function AutomationPatternRoll({
  automationParameterRowsRef,
  drag,
  marks,
  parameters,
  pattern,
  playheadRef,
  pixelsPerTick,
  rollHeight,
  selectedPatternEventIds,
  timelineWidth,
  tool,
  onDeletePatternEvent,
  onMoveAutomationPatternEvent,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelectPatternEvent,
}: {
  automationParameterRowsRef: React.Ref<HTMLDivElement>
  drag?: DragState
  marks: RulerMark[]
  parameters: string[]
  pattern: AutomationPattern
  playheadRef: React.Ref<HTMLDivElement>
  pixelsPerTick: number
  rollHeight: number
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  tool: ActivePatternPanelTool
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onMoveAutomationPatternEvent: (
    event: ReactPointerEvent<HTMLButtonElement>,
    patternEvent: AutomationEvent,
  ) => void
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerDown: (
    event: ReactPointerEvent<HTMLDivElement>,
    parameter: string,
  ) => void
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

    const rowIndex = Math.min(
      parameters.length - 1,
      Math.max(0, Math.floor((event.clientY - rect.top) / AUTOMATION_ROW_HEIGHT)),
    )
    const parameter = parameters[rowIndex]

    if (parameter !== undefined) {
      onPointerDown(event, parameter)
    }
  }, [onPointerDown, parameters, pattern.lengthTicks, pixelsPerTick])

  return (
    <Box
      ref={automationParameterRowsRef}
      onPointerCancel={onPointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        background: 'var(--mantine-color-gray-0)',
        cursor: tool === 'draw' ? 'crosshair' : 'default',
        height: rollHeight,
        position: 'relative',
        userSelect: 'none',
        width: timelineWidth,
      }}
    >
      {Array.from({ length: rollHeight / AUTOMATION_ROW_HEIGHT }, (_, rowIndex) => (
        <Box
          key={parameters[rowIndex] ?? `empty-${rowIndex}`}
          aria-hidden
          data-automation-parameter={parameters[rowIndex]}
          style={{
            background: rowIndex % 2 === 0
              ? 'var(--mantine-color-white)'
              : 'var(--mantine-color-gray-0)',
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            height: AUTOMATION_ROW_HEIGHT,
            left: 0,
            position: 'absolute',
            right: 0,
            top: rowIndex * AUTOMATION_ROW_HEIGHT,
          }}
        />
      ))}
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
      {dragOverlay.drawRange !== undefined
        && dragOverlay.parameter !== undefined
        && dragOverlay.value !== undefined && (
        <Box
          aria-label={`New ${dragOverlay.parameter} automation at ${formatAutomationValue(dragOverlay.value)}`}
          style={{
            alignItems: 'center',
            background: 'color-mix(in srgb, var(--mantine-color-teal-6) 60%, transparent)',
            border: '1px dashed var(--mantine-color-teal-2)',
            borderRadius: 4,
            color: 'white',
            display: 'flex',
            height: 28,
            left: Math.min(
              Math.min(
                dragOverlay.drawRange.startTick,
                dragOverlay.drawRange.endTick,
              ) * pixelsPerTick,
              Math.max(0, timelineWidth - 16),
            ),
            minWidth: 16,
            paddingInline: 6,
            pointerEvents: 'none',
            position: 'absolute',
            top: (
              Math.max(0, parameters.indexOf(dragOverlay.parameter))
              * AUTOMATION_ROW_HEIGHT
            ) + 14,
            zIndex: 3,
          }}
        >
          <Text fw={700} size="10px" truncate>
            {formatAutomationValue(dragOverlay.value)}
          </Text>
        </Box>
      )}
      {pattern.events.map((event) => {
        const movingEvent = dragOverlay.patternEventPlaceholder?.id === event.id
          && dragOverlay.patternEventPlaceholder.kind === 'automation'
          ? dragOverlay.patternEventPlaceholder
          : undefined
        const renderedEvent = movingEvent ?? event
        const selected = selectedPatternEventIds?.includes(event.id) ?? false
        const rowIndex = Math.max(0, parameters.indexOf(renderedEvent.parameter))

        return (
          <Box
            key={event.id}
            component="button"
            type="button"
            aria-label={`${formatPatternEvent(renderedEvent)} at tick ${renderedEvent.timeTick}`}
            onPointerDown={(pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
              pointerEvent.stopPropagation()

              if (tool === 'delete') {
                onDeletePatternEvent(event.id)
                return
              }

              if (tool === 'select') {
                onSelectPatternEvent(event.id, pointerEvent.shiftKey)
                onMoveAutomationPatternEvent(pointerEvent, event)
              }
            }}
            style={{
              alignItems: 'center',
              background: selected
                ? 'var(--mantine-color-teal-7)'
                : 'var(--mantine-color-teal-6)',
              border: selected
                ? '2px solid var(--mantine-color-teal-1)'
                : '1px solid var(--mantine-color-teal-8)',
              borderRadius: 4,
              color: 'white',
              cursor: movingEvent === undefined ? 'pointer' : 'grabbing',
              display: 'flex',
              height: 28,
              left: Math.min(
                renderedEvent.timeTick * pixelsPerTick,
                Math.max(0, timelineWidth - 16),
              ),
              maxWidth: 180,
              minWidth: 16,
              overflow: 'hidden',
              paddingInline: 6,
              position: 'absolute',
              top: (rowIndex * AUTOMATION_ROW_HEIGHT) + 14,
              zIndex: selected ? 3 : 2,
            }}
          >
            <Text fw={700} size="10px" truncate>
              {formatAutomationValue(renderedEvent.value)}
            </Text>
          </Box>
        )
      })}
      <Box
        ref={playheadRef}
        aria-label="Automation pattern panel playhead"
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

const AutomationEventControls = memo(function AutomationEventControls({
  event,
  onUpdateParameter,
  onUpdateValue,
}: {
  event: AutomationEvent
  onUpdateParameter: (parameter: string) => void
  onUpdateValue: (value: AutomationValue) => void
}) {
  return (
    <Paper withBorder p="sm" radius="sm">
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={700} size="sm">Selected automation event</Text>
          <Text c="dimmed" size="xs">
            Tick
            {' '}
            {event.timeTick}
          </Text>
        </Group>
        <Group align="flex-end" grow>
          <TextInput
            label="Parameter"
            size="xs"
            value={event.parameter}
            onChange={inputEvent => onUpdateParameter(inputEvent.currentTarget.value)}
          />
          <AutomationValueInput
            value={event.value}
            onChange={onUpdateValue}
          />
        </Group>
        <Text c="dimmed" size="xs">
          Automation changes are discrete. Use Inspector to edit the event tick.
        </Text>
      </Stack>
    </Paper>
  )
})

const AutomationValueInput = memo(function AutomationValueInput({
  onChange,
  value,
}: {
  onChange: (value: AutomationValue) => void
  value: AutomationValue
}) {
  if (typeof value === 'boolean') {
    return (
      <Switch
        checked={value}
        label="Value"
        size="sm"
        onChange={event => onChange(event.currentTarget.checked)}
      />
    )
  }

  if (typeof value === 'number') {
    return (
      <NumberInput
        allowDecimal
        label="Value"
        size="xs"
        value={value}
        onChange={(nextValue) => {
          if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
            onChange(nextValue)
          }
        }}
      />
    )
  }

  return (
    <TextInput
      label="Value"
      size="xs"
      value={value}
      onChange={event => onChange(event.currentTarget.value)}
    />
  )
})

function getAutomationParameters(pattern: AutomationPattern): string[] {
  const customParameters = Array.from(new Set(
    pattern.events
      .map(event => event.parameter)
      .filter(parameter => !AUTOMATION_PARAMETERS.includes(parameter)),
  )).sort((left, right) => left.localeCompare(right))

  return [...AUTOMATION_PARAMETERS, ...customParameters]
}

function getAutomationDrawValue(
  pattern: AutomationPattern,
  parameter: string,
  timeTick: number,
): AutomationValue {
  let precedingEvent: AutomationEvent | undefined

  for (const event of pattern.events) {
    if (
      event.parameter === parameter
      && event.timeTick <= timeTick
      && (
        precedingEvent === undefined
        || event.timeTick > precedingEvent.timeTick
      )
    ) {
      precedingEvent = event
    }
  }

  if (precedingEvent !== undefined) {
    return precedingEvent.value
  }

  const matchingEvent = pattern.events.find(event => event.parameter === parameter)

  if (matchingEvent !== undefined) {
    return matchingEvent.value
  }

  return AUTOMATION_PARAMETER_DEFAULT_VALUES[
    parameter as keyof typeof AUTOMATION_PARAMETER_DEFAULT_VALUES
  ] ?? 0
}

function formatAutomationValue(value: AutomationValue): string {
  return typeof value === 'string' ? `“${value}”` : String(value)
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
