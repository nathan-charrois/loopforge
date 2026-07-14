import {
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { flushSync } from 'react-dom'
import { type MetaArgs } from 'react-router'
import {
  Cancel01Icon,
  Copy01Icon,
  CursorPointer01Icon,
  CursorRectangleSelection01Icon,
  Delete01Icon,
  EraserIcon,
  FocusPointIcon,
  GridIcon,
  HandGripIcon,
  Key01Icon,
  MagnetIcon,
  MoveIcon,
  MusicNote01Icon,
  MuteIcon,
  PaintBrush01Icon,
  PencilEdit01Icon,
  Redo03Icon,
  Resize01Icon,
  RulerIcon,
  ScissorIcon,
  TimeSetting01Icon,
  Undo03Icon,
  ViewIcon,
  VolumeHighIcon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  ColorInput,
  Divider,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'

import { DebugNav } from './DebugNav'
import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'
import { useCommandHistory } from '~/components/Providers/CommandHistoryProvider'
import { useEditorState } from '~/components/Providers/EditorStateProvider'
import {
  type Block,
  BLOCK_PLAYBACK_MODES,
  type BlockPlaybackMode,
  type Command,
  formatPatternEvent,
  formatTickAsBars,
  formatTickRangeAsBars,
  getBlockEndTick,
  getRulerMarks,
  getSectionEndTick,
  GRID_DIVISIONS,
  type GridDivision,
  isKeyEvent,
  isMeterEvent,
  isTempoEvent,
  type Key,
  MODES,
  type RulerMark,
  type Section,
  type Tick,
  TIME_SIGNATURE_DENOMINATORS,
  type TimelineEvent,
  type TimeSignatureDenominator,
  type Track,
} from '~/domain'
import {
  ACTIVE_TOOLS,
  type ActiveTool,
  addBlockToSelection,
  addPatternEventToSelection,
  addSectionToSelection,
  completeArrangementDrag,
  copySelectionToClipboard,
  createArrangementDebugWorkspace,
  createBlockInspectorCommands,
  createBlockToolCommands,
  createDefaultViewportState,
  createDeleteSelectedEntitiesCommands,
  createDuplicateSelectionCommands,
  createEmptyInspectorDraft,
  createPasteClipboardCommands,
  createSectionInspectorCommands,
  createSectionToolCommands,
  createSelectionState,
  createTimelineDeleteCommand,
  createTimelineEventUpdateCommands,
  createTimelineMarkerAddCommand,
  type DragState,
  getBlockDragPreviews,
  getDragStartClientX,
  getDragStartClientY,
  getInitialDrawEndTick,
  getSectionDragPreviews,
  hasAnySelection,
  type InspectorDraft,
  selectFirstSelectedBlock,
  selectFirstSelectedSection,
  type SelectionState,
  snapTimelineTick,
  tickToX,
  updateInspectorDraftFromSelection,
  updateInspectorDraftFromTimelineEvent,
  type ViewportState,
  xToTick,
  zoomViewport,
} from '~/store/editor'
import {
  executeCommand,
  redoCommand,
  selectBlocksForTrack,
  selectPattern,
  selectPatterns,
  selectTimelineEvents,
  selectTracks,
  selectWorkspaceEndTick,
  setGridDivisionCommand,
  undoCommand,
  validateWorkspace,
  type Workspace,
} from '~/store/workspace'
import { parseNumber } from '~/utils/number'
import type { PlaybackTrigger, ScheduledPlaybackEvent } from '~/utils/schedule'

const TRACK_LABEL_WIDTH = 168
const TIMELINE_PADDING_TICKS = 7680
const MIN_BLOCK_WIDTH = 18
const MIN_SECTION_WIDTH = 18
const MIN_PREVIEW_WIDTH = 6
const BLOCK_TOP = 14
const TIMELINE_MARKER_TOP = 10
const POINTER_DRAG_THRESHOLD = 4
const HANDLE_WIDTH = 8
const WHEEL_ZOOM_SENSITIVITY = 0.0008
const ROOT_OPTIONS = Array.from({ length: 12 }, (_, value) => ({
  label: `${value}`,
  value: `${value}`,
}))

const TOOLBAR_TOOLS = ACTIVE_TOOLS.map(tool => ({
  icon: getToolIcon(tool),
  label: getToolLabel(tool),
  tool,
}))

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Arrangement' },
  ]
}

export default function Arrangement() {
  return (
    <AppProvider>
      <ArrangementDebugContent />
    </AppProvider>
  )
}

function ArrangementDebugContent() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const timelineGridRef = useRef<HTMLDivElement>(null)
  const trackRowsRef = useRef<HTMLDivElement>(null)

  const { editorState, setActiveTool, setEditorState } = useEditorState()
  const { canRedo, canUndo, commandHistory, setCommandHistory } = useCommandHistory()

  const [workspace, setWorkspace] = useState<Workspace>(() => createArrangementDebugWorkspace())
  const [viewport, setViewport] = useState<ViewportState>(() => createDefaultViewportState())

  const [focusedBlockId, setFocusedBlockId] = useState<string | undefined>(undefined)
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | undefined>(undefined)
  const [dragState, setDragState] = useState<DragState | undefined>(undefined)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined)
  const [inspectorDraft, setInspectorDraft] = useState<InspectorDraft>(() => createEmptyInspectorDraft())

  const tracks = useMemo(() => selectTracks(workspace), [workspace])
  const patterns = useMemo(() => selectPatterns(workspace), [workspace])
  const selectedBlock = useMemo(() => selectFirstSelectedBlock(editorState, workspace), [editorState, workspace])
  const selectedSection = useMemo(() => selectFirstSelectedSection(editorState, workspace), [editorState, workspace])

  const projectEndTick = selectWorkspaceEndTick(workspace)
  const timelineEndTick = projectEndTick + TIMELINE_PADDING_TICKS
  const timelineWidth = Math.max(980, Math.ceil(tickToX(viewport, timelineEndTick)))

  const rulerMarks = useMemo(
    () => getRulerMarks(workspace.timeline, 0, timelineEndTick),
    [timelineEndTick, workspace.timeline],
  )
  const workspaceErrors = useMemo(() => validateWorkspace(workspace), [workspace])

  useEffect(() => {
    setInspectorDraft(currentDraft => updateInspectorDraftFromSelection(
      currentDraft,
      selectedBlock,
      selectedSection,
    ))
  }, [selectedBlock, selectedSection])

  useEffect(() => {
    if (selectedTimelineEvent === undefined) {
      return
    }

    setInspectorDraft(currentDraft => updateInspectorDraftFromTimelineEvent(
      currentDraft,
      selectedTimelineEvent,
    ))
  }, [selectedTimelineEvent])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        if (event.key !== 'Escape') {
          return
        }
      }

      const modifierPressed = event.metaKey || event.ctrlKey

      if (event.key === 'Escape') {
        event.preventDefault()

        if (focusedBlockId !== undefined) {
          setFocusedBlockId(undefined)
          return
        }

        setSelectedTimelineEvent(undefined)
        updateSelection(() => createSelectionState())
        return
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && hasAnySelection(editorState)) {
        event.preventDefault()
        deleteSelectedEntities()
        return
      }

      if (modifierPressed && event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        handleRedo()
        return
      }

      if (modifierPressed && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        handleUndo()
        return
      }

      if (modifierPressed && event.key.toLowerCase() === 'y') {
        event.preventDefault()
        handleRedo()
        return
      }

      if (modifierPressed && event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelectedBlocks()
        return
      }

      if (modifierPressed && event.key.toLowerCase() === 'c') {
        event.preventDefault()
        copySelection()
        return
      }

      if (modifierPressed && event.key.toLowerCase() === 'v') {
        event.preventDefault()
        pasteClipboard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandHistory, editorState.selection, focusedBlockId, workspace])

  function runEditorCommands(commands: Command[]) {
    if (commands.length === 0) {
      return
    }

    try {
      let nextWorkspace = workspace
      let nextHistory = commandHistory

      for (const command of commands) {
        const result = executeCommand(nextWorkspace, nextHistory, command)
        nextWorkspace = result.workspace
        nextHistory = result.history
      }

      setWorkspace(nextWorkspace)
      setCommandHistory(nextHistory)
      setErrorMessage(undefined)
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  function handleUndo() {
    const result = undoCommand(workspace, commandHistory)

    setWorkspace(result.workspace)
    setCommandHistory(result.history)
  }

  function handleRedo() {
    const result = redoCommand(workspace, commandHistory)

    setWorkspace(result.workspace)
    setCommandHistory(result.history)
  }

  function updateSelection(updater: (selection: SelectionState) => SelectionState) {
    setEditorState(currentState => ({
      ...currentState,
      selection: updater(currentState.selection),
    }))
  }

  function selectEditorBlock(blockId: string, additive: boolean) {
    setSelectedTimelineEvent(undefined)
    setEditorState(currentState => addBlockToSelection(currentState, blockId, additive))
  }

  function selectEditorSection(sectionId: string, additive: boolean) {
    setSelectedTimelineEvent(undefined)
    setEditorState(currentState => addSectionToSelection(currentState, sectionId, additive))
  }

  function selectPatternEvent(patternEventId: string, additive: boolean) {
    setEditorState(currentState => addPatternEventToSelection(currentState, patternEventId, additive, focusedBlockId))
  }

  function copySelection() {
    setEditorState(currentState => ({
      ...currentState,
      clipboard: copySelectionToClipboard(currentState),
    }))
  }

  function pasteClipboard() {
    runEditorCommands(createPasteClipboardCommands({
      clipboard: editorState.clipboard,
      workspace,
    }))
  }

  function duplicateSelectedBlocks() {
    runEditorCommands(createDuplicateSelectionCommands({
      selection: editorState.selection,
      workspace,
    }))
  }

  function deleteSelectedEntities() {
    runEditorCommands(createDeleteSelectedEntitiesCommands({
      selection: editorState.selection,
      workspace,
    }))
    updateSelection(() => createSelectionState())
  }

  function getTickFromClientX(clientX: number, shouldSnap = true): Tick {
    if (timelineGridRef.current === null) {
      return 0
    }

    const rect = timelineGridRef.current.getBoundingClientRect()
    const rawTick = xToTick(viewport, Math.max(0, clientX - rect.left))

    return shouldSnap
      ? snapTimelineTick(workspace.timeline, rawTick)
      : rawTick
  }

  function getTrackIdFromClientY(clientY: number): string | undefined {
    if (trackRowsRef.current === null) {
      return undefined
    }

    const rect = trackRowsRef.current.getBoundingClientRect()
    const trackIndex = Math.floor((clientY - rect.top) / viewport.laneHeight)

    return tracks[trackIndex]?.id
  }

  function handleRulerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const tick = getTickFromClientX(event.clientX)
    const command = createTimelineMarkerAddCommand(workspace, editorState.activeTool, tick)

    if (command !== undefined) {
      runEditorCommands([command])
    }
  }

  function handleSectionLanePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return
    }

    const tick = getTickFromClientX(event.clientX)

    if (editorState.activeTool === 'drawSection') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        currentTick: getInitialDrawEndTick(workspace.timeline, tick),
        kind: 'drawSection',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTick: tick,
      })
      return
    }

    if (editorState.activeTool === 'marquee' || editorState.activeTool === 'select') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        currentTick: tick,
        kind: 'marquee',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTick: tick,
      })
    }
  }

  function handleTrackLanePointerDown(event: ReactPointerEvent<HTMLDivElement>, trackId: string) {
    if (event.button !== 0) {
      return
    }

    const tick = getTickFromClientX(event.clientX)

    if (editorState.activeTool === 'drawBlock') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        currentTick: getInitialDrawEndTick(workspace.timeline, tick),
        kind: 'drawBlock',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTick: tick,
        trackId,
      })
      return
    }

    if (editorState.activeTool === 'marquee' || editorState.activeTool === 'select') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        currentTick: tick,
        kind: 'marquee',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTick: tick,
      })
    }
  }

  function handleTimelinePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState === undefined || dragState.pointerId !== event.pointerId) {
      return
    }

    if (
      dragState.kind === 'drawBlock'
      || dragState.kind === 'drawSection'
      || dragState.kind === 'marquee'
      || dragState.kind === 'moveBlock'
      || dragState.kind === 'resizeBlock'
      || dragState.kind === 'moveSection'
      || dragState.kind === 'resizeSection'
      || dragState.kind === 'moveTimelineEvent'
    ) {
      setDragState({
        ...dragState,
        currentTick: getTickFromClientX(event.clientX),
        ...(dragState.kind === 'moveBlock'
          ? { currentTrackId: getTrackIdFromClientY(event.clientY) }
          : {}),
      })
    }
  }

  function handleTimelinePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragState === undefined || dragState.pointerId !== event.pointerId) {
      return
    }

    const endTick = getTickFromClientX(event.clientX)
    const movementX = Math.abs(event.clientX - getDragStartClientX(dragState))
    const movementY = Math.abs(event.clientY - getDragStartClientY(dragState))

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const result = completeArrangementDrag({
      dragState,
      endTick,
      movementX,
      movementY,
      targetTrackId: getTrackIdFromClientY(event.clientY),
      threshold: POINTER_DRAG_THRESHOLD,
      workspace,
    })

    runEditorCommands(result.commands)

    if (result.selection !== undefined) {
      updateSelection(() => result.selection as SelectionState)

      if (dragState.kind === 'marquee') {
        setSelectedTimelineEvent(undefined)
      }
    }

    if (result.selectedTimelineEvent !== undefined) {
      setSelectedTimelineEvent(result.selectedTimelineEvent)
    }

    setDragState(undefined)
  }

  function handleBlockPointerDown(event: ReactPointerEvent<HTMLDivElement>, block: Block) {
    event.stopPropagation()

    const toolCommands = createBlockToolCommands({
      block,
      tick: getTickFromClientX(event.clientX),
      tool: editorState.activeTool,
      workspace,
    })

    if (toolCommands.length > 0) {
      runEditorCommands(toolCommands)
      return
    }

    selectEditorBlock(block.id, event.shiftKey)

    if (editorState.activeTool === 'select' || editorState.activeTool === 'move') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        blockIds: editorState.selection.selectedBlockIds.includes(block.id)
          ? editorState.selection.selectedBlockIds
          : [block.id],
        currentTick: getTickFromClientX(event.clientX),
        currentTrackId: block.trackId,
        kind: 'moveBlock',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startTick: getTickFromClientX(event.clientX),
      })
    }
  }

  function handleBlockResizePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    block: Block,
    edge: 'left' | 'right',
  ) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    selectEditorBlock(block.id, event.shiftKey)
    setDragState({
      block,
      currentTick: getTickFromClientX(event.clientX),
      edge,
      kind: 'resizeBlock',
      pointerId: event.pointerId,
      startClientX: event.clientX,
    })
  }

  function handleSectionPointerDown(event: ReactPointerEvent<HTMLDivElement>, section: Section) {
    event.stopPropagation()

    const toolCommands = createSectionToolCommands({
      section,
      tool: editorState.activeTool,
      workspace,
    })

    if (toolCommands.length > 0) {
      runEditorCommands(toolCommands)
      return
    }

    selectEditorSection(section.id, event.shiftKey)

    if (editorState.activeTool === 'select' || editorState.activeTool === 'move') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        currentTick: getTickFromClientX(event.clientX),
        kind: 'moveSection',
        pointerId: event.pointerId,
        section,
        startClientX: event.clientX,
        startTick: getTickFromClientX(event.clientX),
      })
    }
  }

  function handleSectionResizePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    section: Section,
    edge: 'left' | 'right',
  ) {
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    selectEditorSection(section.id, event.shiftKey)
    setDragState({
      currentTick: getTickFromClientX(event.clientX),
      edge,
      kind: 'resizeSection',
      pointerId: event.pointerId,
      section,
      startClientX: event.clientX,
    })
  }

  function handleTimelineEventPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    timelineEvent: TimelineEvent,
  ) {
    event.stopPropagation()

    if (editorState.activeTool === 'erase') {
      runEditorCommands([createTimelineDeleteCommand(workspace, timelineEvent)])
      setSelectedTimelineEvent(undefined)
      return
    }

    setSelectedTimelineEvent(timelineEvent)
    updateSelection(() => createSelectionState())

    if (editorState.activeTool === 'select' || editorState.activeTool === 'move') {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragState({
        currentTick: getTickFromClientX(event.clientX),
        event: timelineEvent,
        kind: 'moveTimelineEvent',
        pointerId: event.pointerId,
        startClientX: event.clientX,
      })
    }
  }

  function updateSelectedBlockFromInspector() {
    if (selectedBlock === undefined) {
      return
    }

    runEditorCommands(createBlockInspectorCommands({
      block: selectedBlock,
      draft: inspectorDraft,
    }))
  }

  function updateSelectedSectionFromInspector() {
    if (selectedSection === undefined) {
      return
    }

    runEditorCommands(createSectionInspectorCommands({
      draft: inspectorDraft,
      section: selectedSection,
      workspace,
    }))
  }

  function updateSelectedTimelineEventFromInspector() {
    if (selectedTimelineEvent === undefined) {
      return
    }

    const result = createTimelineEventUpdateCommands({
      draft: inspectorDraft,
      timelineEvent: selectedTimelineEvent,
      workspace,
    })

    runEditorCommands(result.commands)
    setSelectedTimelineEvent(result.selectedTimelineEvent)
  }

  function deleteSelectedTimelineEvent() {
    if (selectedTimelineEvent === undefined) {
      return
    }

    runEditorCommands([createTimelineDeleteCommand(workspace, selectedTimelineEvent)])
    setSelectedTimelineEvent(undefined)
  }

  function zoomBy(multiplier: number) {
    const scrollElement = scrollRef.current

    if (scrollElement === null) {
      return
    }

    zoomViewportAt(scrollElement, scrollElement.clientWidth / 2, multiplier)
  }

  function handleViewportWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (event.deltaY === 0) {
      return
    }

    event.preventDefault()

    const scrollElement = event.currentTarget
    const rect = scrollElement.getBoundingClientRect()
    const anchorPixel = event.clientX - rect.left
    const deltaY = getWheelDeltaPixels(event)
    const zoomMultiplier = Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY)

    zoomViewportAt(scrollElement, anchorPixel, zoomMultiplier)
  }

  function zoomViewportAt(scrollElement: HTMLDivElement, anchorPixel: number, multiplier: number) {
    const scrollX = scrollElement.scrollLeft
    let nextScrollX = scrollX

    flushSync(() => {
      setViewport((currentViewport) => {
        const nextViewport = zoomViewport({
          ...currentViewport,
          scrollX,
        }, {
          anchorX: anchorPixel,
          multiplier,
        })

        nextScrollX = nextViewport.scrollX

        return nextViewport
      })
    })

    scrollElement.scrollLeft = nextScrollX
  }

  return (
    <AppLayout>
      <Stack gap="md" py="lg">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={1}>Arrangement Debug</Title>
            <DebugNav />
          </Box>
          <Group gap="xs">
            <Badge color={workspaceErrors.length === 0 ? 'green' : 'red'} variant="light">
              {workspaceErrors.length === 0 ? 'valid' : `${workspaceErrors.length} errors`}
            </Badge>
            <Badge color="gray" variant="light">
              {commandHistory.undoStack.length}
              {' '}
              commands
            </Badge>
          </Group>
        </Group>

        {errorMessage !== undefined && (
          <Paper withBorder radius="sm" p="sm" bg="red.0">
            <Text c="red" size="sm" fw={600}>{errorMessage}</Text>
          </Paper>
        )}

        <Toolbar
          activeTool={editorState.activeTool}
          canRedo={canRedo}
          canUndo={canUndo}
          focusedBlockId={focusedBlockId}
          grid={workspace.timeline.grid}
          onClearFocus={() => setFocusedBlockId(undefined)}
          onDuplicate={duplicateSelectedBlocks}
          onRedo={handleRedo}
          onSetGrid={grid => runEditorCommands([setGridDivisionCommand(workspace, grid)])}
          onSetTool={setActiveTool}
          onUndo={handleUndo}
          onZoomIn={() => zoomBy(1.25)}
          onZoomOut={() => zoomBy(0.8)}
        />

        <SimpleGrid cols={{ base: 1, lg: 4 }} spacing="md">
          <Paper withBorder radius="sm" p={0} style={{ gridColumn: 'span 3', overflow: 'hidden' }}>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: `${TRACK_LABEL_WIDTH}px minmax(0, 1fr)`,
              }}
            >
              <TimelineLabelColumn
                focusedBlockId={focusedBlockId}
                tracks={tracks}
                viewport={viewport}
              />
              <Box
                ref={scrollRef}
                onPointerCancel={handleTimelinePointerEnd}
                onPointerMove={handleTimelinePointerMove}
                onPointerUp={handleTimelinePointerEnd}
                onWheel={handleViewportWheel}
                style={{
                  minWidth: 0,
                  overflow: 'auto',
                  paddingBottom: 8,
                  position: 'relative',
                }}
              >
                <Box
                  ref={timelineGridRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: timelineWidth,
                  }}
                />
                <TimelineRuler
                  dragState={dragState}
                  selectedTimelineEvent={selectedTimelineEvent}
                  timelineWidth={timelineWidth}
                  viewport={viewport}
                  workspace={workspace}
                  marks={rulerMarks}
                  onMarkerPointerDown={handleTimelineEventPointerDown}
                  onRulerPointerDown={handleRulerPointerDown}
                />
                <SectionLane
                  dragState={dragState}
                  focusedBlockId={focusedBlockId}
                  marks={rulerMarks}
                  selectedSectionIds={editorState.selection.selectedSectionIds}
                  timelineWidth={timelineWidth}
                  viewport={viewport}
                  workspace={workspace}
                  onEmptyDoubleClick={() => setFocusedBlockId(undefined)}
                  onPointerDown={handleSectionLanePointerDown}
                  onResizePointerDown={handleSectionResizePointerDown}
                  onSectionPointerDown={handleSectionPointerDown}
                />
                <Box ref={trackRowsRef}>
                  {tracks.map(track => (
                    <TrackLane
                      key={track.id}
                      dragState={dragState}
                      focusedBlockId={focusedBlockId}
                      hoveredBlockId={hoveredBlockId}
                      marks={rulerMarks}
                      selectedBlockIds={editorState.selection.selectedBlockIds}
                      selectedPatternEventIds={editorState.selection.selectedPatternEventIds}
                      timelineWidth={timelineWidth}
                      track={track}
                      viewport={viewport}
                      workspace={workspace}
                      onBlockDoubleClick={blockId => setFocusedBlockId(blockId)}
                      onBlockPointerDown={handleBlockPointerDown}
                      onBlockResizePointerDown={handleBlockResizePointerDown}
                      onEmptyDoubleClick={() => setFocusedBlockId(undefined)}
                      onPatternEventClick={selectPatternEvent}
                      onPointerDown={handleTrackLanePointerDown}
                      onSetHoveredBlock={setHoveredBlockId}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Paper>

          <InspectorPanel
            commandHistory={commandHistory.undoStack}
            draft={inspectorDraft}
            focusedBlockId={focusedBlockId}
            patterns={patterns}
            selectedBlock={selectedBlock}
            selectedSection={selectedSection}
            selectedTimelineEvent={selectedTimelineEvent}
            selection={editorState.selection}
            setDraft={setInspectorDraft}
            workspace={workspace}
            workspaceErrors={workspaceErrors}
            onDeleteSelected={deleteSelectedEntities}
            onDeleteTimelineEvent={deleteSelectedTimelineEvent}
            onUpdateBlock={updateSelectedBlockFromInspector}
            onUpdateSection={updateSelectedSectionFromInspector}
            onUpdateTimelineEvent={updateSelectedTimelineEventFromInspector}
          />
        </SimpleGrid>
      </Stack>
    </AppLayout>
  )
}

function Toolbar({
  activeTool,
  canRedo,
  canUndo,
  focusedBlockId,
  grid,
  onClearFocus,
  onDuplicate,
  onRedo,
  onSetGrid,
  onSetTool,
  onUndo,
  onZoomIn,
  onZoomOut,
}: {
  activeTool: ActiveTool
  canRedo: boolean
  canUndo: boolean
  focusedBlockId?: string
  grid: GridDivision
  onClearFocus: () => void
  onDuplicate: () => void
  onRedo: () => void
  onSetGrid: (grid: GridDivision) => void
  onSetTool: (tool: ActiveTool) => void
  onUndo: () => void
  onZoomIn: () => void
  onZoomOut: () => void
}) {
  return (
    <Paper withBorder radius="sm" p="xs">
      <Group justify="space-between" gap="xs">
        <Group gap={4}>
          {TOOLBAR_TOOLS.map(item => (
            <Tooltip key={item.tool} label={item.label}>
              <ActionIcon
                aria-label={item.label}
                color={activeTool === item.tool ? 'blue' : 'gray'}
                size="lg"
                variant={activeTool === item.tool ? 'filled' : 'light'}
                onClick={() => onSetTool(item.tool)}
              >
                <HugeiconsIcon icon={item.icon} size={18} />
              </ActionIcon>
            </Tooltip>
          ))}
        </Group>

        <Group gap="xs">
          <Tooltip label="Undo">
            <ActionIcon aria-label="Undo" disabled={!canUndo} size="lg" variant="light" onClick={onUndo}>
              <HugeiconsIcon icon={Undo03Icon} size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Redo">
            <ActionIcon aria-label="Redo" disabled={!canRedo} size="lg" variant="light" onClick={onRedo}>
              <HugeiconsIcon icon={Redo03Icon} size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Duplicate">
            <ActionIcon aria-label="Duplicate" size="lg" variant="light" onClick={onDuplicate}>
              <HugeiconsIcon icon={Copy01Icon} size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom out">
            <ActionIcon aria-label="Zoom out" size="lg" variant="light" onClick={onZoomOut}>
              <HugeiconsIcon icon={ZoomOutAreaIcon} size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Zoom in">
            <ActionIcon aria-label="Zoom in" size="lg" variant="light" onClick={onZoomIn}>
              <HugeiconsIcon icon={ZoomInAreaIcon} size={18} />
            </ActionIcon>
          </Tooltip>
          {focusedBlockId !== undefined && (
            <Tooltip label="Close focus">
              <ActionIcon aria-label="Close focus" color="yellow" size="lg" variant="light" onClick={onClearFocus}>
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </ActionIcon>
            </Tooltip>
          )}
          <Select
            allowDeselect={false}
            aria-label="Grid"
            data={GRID_DIVISIONS.map(value => ({ label: value, value }))}
            leftSection={<HugeiconsIcon icon={GridIcon} size={16} />}
            size="xs"
            value={grid}
            w={170}
            onChange={value => onSetGrid((value ?? grid) as GridDivision)}
          />
        </Group>
      </Group>
    </Paper>
  )
}

function TimelineLabelColumn({
  focusedBlockId,
  tracks,
  viewport,
}: {
  focusedBlockId?: string
  tracks: Track[]
  viewport: ViewportState
}) {
  return (
    <Box
      style={{
        background: 'white',
        borderRight: '1px solid var(--mantine-color-gray-3)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <StaticTimelineLabel height={viewport.rulerHeight}>
        <Group gap={6}>
          <HugeiconsIcon icon={RulerIcon} size={18} />
          <Text fw={700} size="sm">Timeline</Text>
        </Group>
      </StaticTimelineLabel>
      <StaticTimelineLabel height={viewport.sectionLaneHeight} opacity={focusedBlockId === undefined ? 1 : 0.4}>
        <Text fw={700} size="sm">Sections</Text>
      </StaticTimelineLabel>
      {tracks.map(track => (
        <StaticTimelineLabel key={track.id} height={viewport.laneHeight}>
          <Stack gap={1}>
            <Text fw={700} size="sm" truncate>{track.name}</Text>
            <Group gap={4}>
              <Badge size="xs" variant="light">{track.role}</Badge>
              {track.muted && <Badge color="gray" size="xs">muted</Badge>}
              {track.soloed && <Badge color="yellow" size="xs">solo</Badge>}
            </Group>
          </Stack>
        </StaticTimelineLabel>
      ))}
    </Box>
  )
}

function StaticTimelineLabel({
  children,
  height,
  opacity = 1,
}: {
  children: ReactNode
  height: number
  opacity?: number
}) {
  return (
    <Box
      style={{
        alignItems: 'center',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        display: 'flex',
        height,
        opacity,
        paddingInline: 12,
      }}
    >
      {children}
    </Box>
  )
}

function TimelineRuler({
  dragState,
  marks,
  onMarkerPointerDown,
  onRulerPointerDown,
  selectedTimelineEvent,
  timelineWidth,
  viewport,
  workspace,
}: {
  dragState?: DragState
  marks: RulerMark[]
  onMarkerPointerDown: (event: ReactPointerEvent<HTMLDivElement>, timelineEvent: TimelineEvent) => void
  onRulerPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  selectedTimelineEvent?: TimelineEvent
  timelineWidth: number
  viewport: ViewportState
  workspace: Workspace
}) {
  const timelineEvents = selectTimelineEvents(workspace)

  return (
    <Box
      onPointerDown={onRulerPointerDown}
      style={{
        background: 'var(--mantine-color-gray-0)',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        height: viewport.rulerHeight,
        position: 'relative',
        width: timelineWidth,
      }}
    >
      {marks.map(mark => (
        <Box
          key={`${mark.kind}:${mark.tick}`}
          style={{
            borderLeft: getRulerBorder(mark),
            height: mark.kind === 'bar' ? '100%' : mark.kind === 'beat' ? '70%' : '42%',
            left: tickToX(viewport, mark.tick),
            position: 'absolute',
            top: 0,
          }}
        >
          {mark.label !== undefined && (
            <Text c="dimmed" size="xs" style={{ paddingLeft: 5 }}>
              {mark.label}
            </Text>
          )}
        </Box>
      ))}

      {timelineEvents.map(timelineEvent => (
        <TimelineEventMarker
          key={getTimelineEventKey(timelineEvent)}
          color={getTimelineEventMarkerColor(timelineEvent)}
          icon={getTimelineEventMarkerIcon(timelineEvent)}
          isSelected={selectedTimelineEvent !== undefined && isSameTimelineEvent(selectedTimelineEvent, timelineEvent)}
          label={getTimelineEventMarkerLabel(timelineEvent)}
          left={tickToX(viewport, timelineEvent.tick)}
          top={getTimelineEventMarkerTop(timelineEvent)}
          onPointerDown={pointerEvent => onMarkerPointerDown(pointerEvent, timelineEvent)}
        />
      ))}
      {dragState?.kind === 'moveTimelineEvent' && (
        <TimelineEventMarker
          color={getTimelineEventMarkerColor(dragState.event)}
          icon={getTimelineEventMarkerIcon(dragState.event)}
          isPreview
          isSelected={false}
          label={getTimelineEventMarkerLabel(dragState.event)}
          left={tickToX(viewport, dragState.currentTick)}
          top={getTimelineEventMarkerTop(dragState.event)}
        />
      )}
    </Box>
  )
}

function TimelineEventMarker({
  color,
  icon,
  isSelected,
  isPreview = false,
  label,
  left,
  top,
  onPointerDown,
}: {
  color: string
  icon: typeof TimeSetting01Icon
  isPreview?: boolean
  isSelected: boolean
  label: string
  left: number
  top: number
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  return (
    <Box
      onPointerDown={onPointerDown}
      style={{
        alignItems: 'center',
        background: `var(--mantine-color-${color}-0)`,
        border: `1px solid var(--mantine-color-${color}-5)`,
        borderRadius: 4,
        color: `var(--mantine-color-${color}-9)`,
        cursor: 'grab',
        display: 'flex',
        gap: 3,
        height: 20,
        left: Math.max(0, left - 4),
        minWidth: 34,
        opacity: isPreview ? 0.52 : 1,
        outline: isSelected ? '2px solid var(--mantine-color-yellow-5)' : undefined,
        paddingInline: 4,
        pointerEvents: isPreview ? 'none' : undefined,
        position: 'absolute',
        top,
        zIndex: isSelected ? 8 : isPreview ? 7 : 5,
      }}
    >
      <HugeiconsIcon icon={icon} size={12} />
      <Text fw={700} size="10px">{label}</Text>
    </Box>
  )
}

function TimelineGridLines({
  marks,
  viewport,
}: {
  marks: RulerMark[]
  viewport: ViewportState
}) {
  return (
    <>
      {marks.map(mark => (
        <Box
          key={`${mark.kind}:${mark.tick}`}
          style={{
            borderLeft: getGridLineBorder(mark),
            bottom: 0,
            left: tickToX(viewport, mark.tick),
            opacity: mark.kind === 'bar' ? 0.7 : mark.kind === 'beat' ? 0.55 : 0.4,
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            zIndex: 0,
          }}
        />
      ))}
    </>
  )
}

function SectionLane({
  dragState,
  focusedBlockId,
  marks,
  onEmptyDoubleClick,
  onPointerDown,
  onResizePointerDown,
  onSectionPointerDown,
  selectedSectionIds,
  timelineWidth,
  viewport,
  workspace,
}: {
  dragState?: DragState
  focusedBlockId?: string
  marks: RulerMark[]
  onEmptyDoubleClick: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>, section: Section, edge: 'left' | 'right') => void
  onSectionPointerDown: (event: ReactPointerEvent<HTMLDivElement>, section: Section) => void
  selectedSectionIds: string[]
  timelineWidth: number
  viewport: ViewportState
  workspace: Workspace
}) {
  const sectionDragPreviews = getSectionDragPreviews(dragState)

  return (
    <Box
      onDoubleClick={onEmptyDoubleClick}
      onPointerDown={onPointerDown}
      style={{
        background: 'var(--mantine-color-gray-0)',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        height: viewport.sectionLaneHeight,
        opacity: focusedBlockId === undefined ? 1 : 0.4,
        position: 'relative',
        width: timelineWidth,
      }}
    >
      <TimelineGridLines marks={marks} viewport={viewport} />
      {workspace.arrangement.sections.map(section => (
        <Box
          key={section.id}
          onPointerDown={event => onSectionPointerDown(event, section)}
          title={`${section.name}: ${formatTickRangeAsBars(workspace.timeline, section.startTick, getSectionEndTick(section))}`}
          style={{
            alignItems: 'center',
            background: 'var(--mantine-color-gray-1)',
            border: '1px solid var(--mantine-color-gray-4)',
            borderRadius: 4,
            cursor: 'grab',
            display: 'flex',
            height: 28,
            left: tickToX(viewport, section.startTick),
            outline: selectedSectionIds.includes(section.id) ? '2px solid var(--mantine-color-blue-6)' : undefined,
            overflow: 'hidden',
            paddingInline: 7,
            position: 'absolute',
            top: 8,
            width: Math.max(MIN_SECTION_WIDTH, tickToX(viewport, section.lengthTicks)),
          }}
        >
          <ResizeHandle edge="left" onPointerDown={event => onResizePointerDown(event, section, 'left')} />
          <Text fw={700} size="xs" truncate>{section.name}</Text>
          <ResizeHandle edge="right" onPointerDown={event => onResizePointerDown(event, section, 'right')} />
        </Box>
      ))}
      {dragState?.kind === 'drawSection' && (
        <DragPreview
          color="gray"
          startTick={dragState.startTick}
          endTick={dragState.currentTick}
          viewport={viewport}
        />
      )}
      {sectionDragPreviews.map(section => (
        <RangePlaceholder
          key={`section-preview:${section.id}`}
          color="yellow"
          height={28}
          label={section.name}
          lengthTicks={section.lengthTicks}
          startTick={section.startTick}
          top={8}
          viewport={viewport}
        />
      ))}
    </Box>
  )
}

function TrackLane({
  dragState,
  focusedBlockId,
  hoveredBlockId,
  marks,
  onBlockDoubleClick,
  onBlockPointerDown,
  onBlockResizePointerDown,
  onEmptyDoubleClick,
  onPatternEventClick,
  onPointerDown,
  onSetHoveredBlock,
  selectedBlockIds,
  selectedPatternEventIds,
  timelineWidth,
  track,
  viewport,
  workspace,
}: {
  dragState?: DragState
  focusedBlockId?: string
  hoveredBlockId?: string
  marks: RulerMark[]
  onBlockDoubleClick: (blockId: string) => void
  onBlockPointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block) => void
  onBlockResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block, edge: 'left' | 'right') => void
  onEmptyDoubleClick: () => void
  onPatternEventClick: (patternEventId: string, additive: boolean) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, trackId: string) => void
  onSetHoveredBlock: (blockId: string | undefined) => void
  selectedBlockIds: string[]
  selectedPatternEventIds: string[]
  timelineWidth: number
  track: Track
  viewport: ViewportState
  workspace: Workspace
}) {
  const blocks = selectBlocksForTrack(workspace, track.id)
  const blockDragPreviews = getBlockDragPreviews(workspace, dragState)
    .filter(block => block.trackId === track.id)

  return (
    <Box
      onDoubleClick={onEmptyDoubleClick}
      onPointerDown={event => onPointerDown(event, track.id)}
      style={{
        background: 'var(--mantine-color-gray-0)',
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        height: viewport.laneHeight,
        position: 'relative',
        width: timelineWidth,
      }}
    >
      <TimelineGridLines marks={marks} viewport={viewport} />
      {blocks.map(block => (
        <BlockView
          key={block.id}
          block={block}
          focusedBlockId={focusedBlockId}
          hovered={hoveredBlockId === block.id}
          pattern={selectPattern(workspace, block.patternId)}
          selected={selectedBlockIds.includes(block.id)}
          selectedPatternEventIds={selectedPatternEventIds}
          viewport={viewport}
          workspace={workspace}
          onDoubleClick={onBlockDoubleClick}
          onPatternEventClick={onPatternEventClick}
          onPointerDown={onBlockPointerDown}
          onResizePointerDown={onBlockResizePointerDown}
          onSetHoveredBlock={onSetHoveredBlock}
        />
      ))}
      {dragState?.kind === 'drawBlock' && dragState.trackId === track.id && (
        <DragPreview
          color="blue"
          startTick={dragState.startTick}
          endTick={dragState.currentTick}
          viewport={viewport}
        />
      )}
      {dragState?.kind === 'marquee' && (
        <DragPreview
          color="yellow"
          startTick={dragState.startTick}
          endTick={dragState.currentTick}
          viewport={viewport}
        />
      )}
      {blockDragPreviews.map(block => (
        <RangePlaceholder
          key={`block-preview:${block.id}:${block.trackId}`}
          color="yellow"
          height={42}
          label={block.name}
          lengthTicks={block.lengthTicks}
          startTick={block.startTick}
          top={BLOCK_TOP}
          viewport={viewport}
        />
      ))}
    </Box>
  )
}

function BlockView({
  block,
  focusedBlockId,
  hovered,
  onDoubleClick,
  onPointerDown,
  onResizePointerDown,
  onSetHoveredBlock,
  pattern,
  selected,
  viewport,
  workspace,
}: {
  block: Block
  focusedBlockId?: string
  hovered: boolean
  onDoubleClick: (blockId: string) => void
  onPatternEventClick: (patternEventId: string, additive: boolean) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block, edge: 'left' | 'right') => void
  onSetHoveredBlock: (blockId: string | undefined) => void
  pattern?: ReturnType<typeof selectPattern>
  selected: boolean
  selectedPatternEventIds: string[]
  viewport: ViewportState
  workspace: Workspace
}) {
  const isFocused = focusedBlockId === block.id
  const dimmedByFocus = focusedBlockId !== undefined && !isFocused

  return (
    <Box
      onDoubleClick={(event) => {
        event.stopPropagation()
        onDoubleClick(block.id)
      }}
      onMouseEnter={() => onSetHoveredBlock(block.id)}
      onMouseLeave={() => onSetHoveredBlock(undefined)}
      onPointerDown={event => onPointerDown(event, block)}
      title={`${block.name}: ${formatTickRangeAsBars(workspace.timeline, block.startTick, getBlockEndTick(block))}`}
      style={{
        background: block.muted ? 'var(--mantine-color-gray-5)' : block.color,
        border: '1px solid rgba(0, 0, 0, 0.24)',
        borderRadius: 5,
        boxShadow: isFocused ? '0 0 0 2px var(--mantine-color-yellow-5)' : hovered ? '0 0 0 2px var(--mantine-color-gray-5)' : undefined,
        color: 'white',
        cursor: 'grab',
        height: isFocused ? 56 : 42,
        left: tickToX(viewport, block.startTick),
        opacity: dimmedByFocus ? 0.22 : block.muted ? 0.58 : 0.96,
        outline: selected ? '2px solid var(--mantine-color-blue-2)' : undefined,
        overflow: 'hidden',
        padding: '5px 8px',
        position: 'absolute',
        top: BLOCK_TOP,
        width: Math.max(MIN_BLOCK_WIDTH, tickToX(viewport, block.lengthTicks)),
        zIndex: isFocused ? 7 : selected ? 4 : 2,
      }}
    >
      <ResizeHandle edge="left" onPointerDown={event => onResizePointerDown(event, block, 'left')} />
      <Group justify="space-between" gap={6} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Text fw={800} size="xs" truncate>{block.name}</Text>
          <Text size="10px" truncate>{pattern?.name ?? block.patternId}</Text>
        </Box>
        <Badge color={block.muted ? 'gray' : 'dark'} size="xs" variant="filled">
          {block.playbackMode}
        </Badge>
      </Group>
      <ResizeHandle edge="right" onPointerDown={event => onResizePointerDown(event, block, 'right')} />
      {focusedBlockId === block.id && (
        <FocusedBlockOverlay
          block={block}
        />
      )}
    </Box>
  )
}

function FocusedBlockOverlay({
  block,

}: {
  block: Block
}) {
  return (
    <Box
      style={{
        background: 'rgba(255, 255, 255, 0.14)',
        borderRadius: 3,
        bottom: 4,
        left: 6,
        overflow: 'hidden',
        position: 'absolute',
        right: 6,
        top: 24,
      }}
    >
      <Box
        style={{
          background: 'rgba(255, 235, 59, 0.82)',
          borderRadius: 2,
          bottom: 3,
          cursor: 'pointer',
          left: 1,
          minWidth: 3,
          position: 'absolute',
          top: 3,
          width: 22,
          height: 10,
        }}
      >
        <Text size="xs">{block.id}</Text>
      </Box>
    </Box>
  )
}

function InspectorPanel({
  commandHistory,
  draft,
  focusedBlockId,
  focusedPlaybackView,
  onDeleteSelected,
  onDeleteTimelineEvent,
  onUpdateBlock,
  onUpdateSection,
  onUpdateTimelineEvent,
  patterns,
  selectedBlock,
  selectedSection,
  selectedTimelineEvent,
  selection,
  setDraft,
  workspace,
  workspaceErrors,
}: {
  commandHistory: Command[]
  draft: InspectorDraft
  focusedBlockId?: string
  focusedPlaybackView?: { events: ScheduledPlaybackEvent[], triggers: PlaybackTrigger[] }
  onDeleteSelected: () => void
  onDeleteTimelineEvent: () => void
  onUpdateBlock: () => void
  onUpdateSection: () => void
  onUpdateTimelineEvent: () => void
  patterns: ReturnType<typeof selectPatterns>
  selectedBlock?: Block
  selectedSection?: Section
  selectedTimelineEvent?: TimelineEvent
  selection: SelectionState
  setDraft: (updater: (draft: InspectorDraft) => InspectorDraft) => void
  workspace: Workspace
  workspaceErrors: string[]
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} size="h3">Inspector</Title>
          <Badge color="gray" variant="light">
            {selection.selectedBlockIds.length + selection.selectedSectionIds.length + selection.selectedPatternEventIds.length}
            {' '}
            selected
          </Badge>
        </Group>

        {selectedBlock !== undefined && (
          <Stack gap="sm">
            <Text fw={700} size="sm">Block</Text>
            <TextInput
              label="Name"
              size="xs"
              value={draft.blockName}
              onChange={(event) => {
                const { value } = event.currentTarget

                setDraft(currentDraft => ({ ...currentDraft, blockName: value }))
              }}
            />
            <ColorInput
              label="Color"
              size="xs"
              value={draft.blockColor}
              onChange={value => setDraft(currentDraft => ({ ...currentDraft, blockColor: value }))}
            />
            <Select
              allowDeselect={false}
              data={BLOCK_PLAYBACK_MODES.map(value => ({ label: value, value }))}
              label="Playback"
              size="xs"
              value={draft.blockPlaybackMode}
              onChange={value => setDraft(currentDraft => ({
                ...currentDraft,
                blockPlaybackMode: (value ?? currentDraft.blockPlaybackMode) as BlockPlaybackMode,
              }))}
            />
            <Switch
              checked={draft.blockMuted}
              label="Muted"
              size="xs"
              onChange={(event) => {
                const { checked } = event.currentTarget

                setDraft(currentDraft => ({ ...currentDraft, blockMuted: checked }))
              }}
            />
            <Button size="xs" onClick={onUpdateBlock}>Apply Block</Button>
          </Stack>
        )}

        {selectedSection !== undefined && (
          <Stack gap="sm">
            <Divider />
            <Text fw={700} size="sm">Section</Text>
            <TextInput
              label="Name"
              size="xs"
              value={draft.sectionName}
              onChange={(event) => {
                const { value } = event.currentTarget

                setDraft(currentDraft => ({ ...currentDraft, sectionName: value }))
              }}
            />
            <Button size="xs" onClick={onUpdateSection}>Apply Section</Button>
          </Stack>
        )}

        {selectedTimelineEvent !== undefined && (
          <TimelineEventInspector
            draft={draft}
            event={selectedTimelineEvent}
            setDraft={setDraft}
            workspace={workspace}
            onDelete={onDeleteTimelineEvent}
            onUpdate={onUpdateTimelineEvent}
          />
        )}

        {focusedBlockId !== undefined && focusedPlaybackView !== undefined && (
          <FocusedBlockPanel focusedBlockId={focusedBlockId} playbackView={focusedPlaybackView} />
        )}

        <Divider />
        <Group gap="xs">
          <Button
            color="red"
            leftSection={<HugeiconsIcon icon={Delete01Icon} size={14} />}
            size="xs"
            variant="light"
            onClick={onDeleteSelected}
          >
            Delete Selected
          </Button>
        </Group>

        <StatsGrid
          items={[
            ['Tracks', workspace.tracks.allIds.length],
            ['Patterns', patterns.length],
            ['Sections', workspace.arrangement.sections.length],
            ['Blocks', workspace.arrangement.blocks.length],
          ]}
        />

        {workspaceErrors.length > 0 && (
          <Stack gap={3}>
            {workspaceErrors.map(error => (
              <Text key={error} c="red" size="xs">{error}</Text>
            ))}
          </Stack>
        )}

        <Divider />
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={700} size="sm">Command History</Text>
            <Badge color="gray" size="sm" variant="light">{commandHistory.length}</Badge>
          </Group>
          <Stack gap={4} mah={180} style={{ overflow: 'auto' }}>
            {commandHistory.slice().reverse().map(command => (
              <Paper key={command.id} withBorder radius="sm" p={6}>
                <Text fw={700} size="xs">{command.label}</Text>
                <Text c="dimmed" size="10px">{command.kind}</Text>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
}

function TimelineEventInspector({
  draft,
  event,
  onDelete,
  onUpdate,
  setDraft,
  workspace,
}: {
  draft: InspectorDraft
  event: TimelineEvent
  onDelete: () => void
  onUpdate: () => void
  setDraft: (updater: (draft: InspectorDraft) => InspectorDraft) => void
  workspace: Workspace
}) {
  return (
    <Stack gap="sm">
      <Divider />
      <Text fw={700} size="sm">Timeline Event</Text>
      {isTempoEvent(event) && (
        <>
          <NumberInput
            label="Tick"
            min={0}
            size="xs"
            value={draft.tempoTick}
            onChange={value => setDraft(currentDraft => ({ ...currentDraft, tempoTick: parseNumber(value.toString(), currentDraft.tempoTick) }))}
          />
          <NumberInput
            label="BPM"
            min={1}
            size="xs"
            value={draft.tempoBpm}
            onChange={value => setDraft(currentDraft => ({ ...currentDraft, tempoBpm: parseNumber(value.toString(), currentDraft.tempoBpm) }))}
          />
        </>
      )}
      {isMeterEvent(event) && (
        <>
          <NumberInput
            label="Tick"
            min={0}
            size="xs"
            value={draft.meterTick}
            onChange={value => setDraft(currentDraft => ({ ...currentDraft, meterTick: parseNumber(value.toString(), currentDraft.meterTick) }))}
          />
          <NumberInput
            label="Numerator"
            min={1}
            size="xs"
            value={draft.meterNumerator}
            onChange={value => setDraft(currentDraft => ({ ...currentDraft, meterNumerator: parseNumber(value.toString(), currentDraft.meterNumerator) }))}
          />
          <Select
            allowDeselect={false}
            data={TIME_SIGNATURE_DENOMINATORS.map(value => ({ label: `${value}`, value: `${value}` }))}
            label="Denominator"
            size="xs"
            value={`${draft.meterDenominator}`}
            onChange={value => setDraft(currentDraft => ({
              ...currentDraft,
              meterDenominator: Number.parseInt(value ?? `${currentDraft.meterDenominator}`, 10) as TimeSignatureDenominator,
            }))}
          />
        </>
      )}
      {isKeyEvent(event) && (
        <>
          <NumberInput
            label="Tick"
            min={0}
            size="xs"
            value={draft.keyTick}
            onChange={value => setDraft(currentDraft => ({ ...currentDraft, keyTick: parseNumber(value.toString(), currentDraft.keyTick) }))}
          />
          <Select
            allowDeselect={false}
            data={ROOT_OPTIONS}
            label="Tonic"
            size="xs"
            value={`${draft.keyTonic}`}
            onChange={value => setDraft(currentDraft => ({
              ...currentDraft,
              keyTonic: Number.parseInt(value ?? `${currentDraft.keyTonic}`, 10),
            }))}
          />
          <Select
            allowDeselect={false}
            data={MODES.map(value => ({ label: value, value }))}
            label="Mode"
            size="xs"
            value={draft.keyMode}
            onChange={value => setDraft(currentDraft => ({
              ...currentDraft,
              keyMode: (value ?? currentDraft.keyMode) as Key['mode'],
            }))}
          />
        </>
      )}
      <Text c="dimmed" size="xs">
        {formatTickAsBars(workspace.timeline, event.tick)}
      </Text>
      <Group gap="xs">
        <Button size="xs" onClick={onUpdate}>Apply Event</Button>
        <Button color="red" size="xs" variant="light" onClick={onDelete}>Delete Event</Button>
      </Group>
    </Stack>
  )
}

function FocusedBlockPanel({
  focusedBlockId,
  playbackView,
}: {
  focusedBlockId: string
  playbackView: { events: ScheduledPlaybackEvent[], triggers: PlaybackTrigger[] }
}) {
  return (
    <Stack gap="xs">
      <Divider />
      <Group justify="space-between">
        <Text fw={700} size="sm">Focused Block</Text>
        <Badge color="yellow" variant="light">{focusedBlockId}</Badge>
      </Group>
      <StatsGrid
        items={[
          ['Events', playbackView.events.length],
          ['Triggers', playbackView.triggers.length],
        ]}
      />
      <Stack gap={4} mah={160} style={{ overflow: 'auto' }}>
        {playbackView.events.slice(0, 12).map(event => (
          <Paper key={event.id} withBorder radius="sm" p={6}>
            <Text fw={700} size="xs">{formatPatternEvent(event.event)}</Text>
            <Text c="dimmed" size="10px">
              {event.startTick}
              {' '}
              +
              {event.durationTicks}
              {' '}
              ticks
            </Text>
          </Paper>
        ))}
      </Stack>
    </Stack>
  )
}

function ResizeHandle({
  edge,
  onPointerDown,
}: {
  edge: 'left' | 'right'
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  return (
    <Box
      onPointerDown={onPointerDown}
      style={{
        bottom: 0,
        cursor: 'ew-resize',
        left: edge === 'left' ? 0 : undefined,
        position: 'absolute',
        right: edge === 'right' ? 0 : undefined,
        top: 0,
        width: HANDLE_WIDTH,
      }}
    />
  )
}

function DragPreview({
  color,
  endTick,
  startTick,
  viewport,
}: {
  color: string
  endTick: Tick
  startTick: Tick
  viewport: ViewportState
}) {
  const leftTick = Math.min(startTick, endTick)
  const lengthTicks = Math.max(1, Math.abs(endTick - startTick))

  return (
    <Box
      style={{
        background: `var(--mantine-color-${color}-2)`,
        border: `1px solid var(--mantine-color-${color}-6)`,
        borderRadius: 4,
        bottom: 8,
        left: tickToX(viewport, leftTick),
        opacity: 0.55,
        pointerEvents: 'none',
        position: 'absolute',
        top: 8,
        width: Math.max(MIN_PREVIEW_WIDTH, tickToX(viewport, lengthTicks)),
        zIndex: 8,
      }}
    />
  )
}

function RangePlaceholder({
  color,
  height,
  label,
  lengthTicks,
  startTick,
  top,
  viewport,
}: {
  color: string
  height: number
  label: string
  lengthTicks: number
  startTick: Tick
  top: number
  viewport: ViewportState
}) {
  return (
    <Box
      style={{
        alignItems: 'center',
        background: `var(--mantine-color-${color}-1)`,
        border: `1px dashed var(--mantine-color-${color}-7)`,
        borderRadius: 4,
        color: `var(--mantine-color-${color}-9)`,
        display: 'flex',
        height,
        left: tickToX(viewport, startTick),
        opacity: 0.72,
        overflow: 'hidden',
        paddingInline: 6,
        pointerEvents: 'none',
        position: 'absolute',
        top,
        width: Math.max(MIN_PREVIEW_WIDTH, tickToX(viewport, lengthTicks)),
        zIndex: 9,
      }}
    >
      <Text fw={700} size="10px" truncate>{label}</Text>
    </Box>
  )
}

function StatsGrid({ items }: { items: Array<[string, number]> }) {
  return (
    <SimpleGrid cols={items.length}>
      {items.map(([label, value]) => (
        <Paper key={label} withBorder radius="sm" p={6}>
          <Text c="dimmed" size="10px">{label}</Text>
          <Text fw={800} size="sm">{value}</Text>
        </Paper>
      ))}
    </SimpleGrid>
  )
}

function getToolIcon(tool: ActiveTool) {
  switch (tool) {
    case 'audition':
      return VolumeHighIcon
    case 'drawBlock':
      return PencilEdit01Icon
    case 'drawPatternEvent':
      return MusicNote01Icon
    case 'drawSection':
      return PaintBrush01Icon
    case 'erase':
      return EraserIcon
    case 'hand':
      return HandGripIcon
    case 'key':
      return Key01Icon
    case 'loopRange':
      return FocusPointIcon
    case 'marquee':
      return CursorRectangleSelection01Icon
    case 'meter':
      return MagnetIcon
    case 'move':
      return MoveIcon
    case 'mute':
      return MuteIcon
    case 'resize':
      return Resize01Icon
    case 'select':
      return CursorPointer01Icon
    case 'split':
      return ScissorIcon
    case 'tempo':
      return TimeSetting01Icon
    case 'zoom':
      return ViewIcon
  }
}

function getRulerBorder(mark: RulerMark): string {
  switch (mark.kind) {
    case 'bar':
      return '1px solid var(--mantine-color-gray-8)'
    case 'beat':
      return '1px solid var(--mantine-color-gray-6)'
    case 'subdivision':
      return '1px solid var(--mantine-color-gray-4)'
  }
}

function getGridLineBorder(mark: RulerMark): string {
  switch (mark.kind) {
    case 'bar':
      return '1px solid var(--mantine-color-gray-6)'
    case 'beat':
      return '1px solid var(--mantine-color-gray-5)'
    case 'subdivision':
      return '1px solid var(--mantine-color-gray-4)'
  }
}

function getTimelineEventKey(event: TimelineEvent): string {
  if (isTempoEvent(event)) {
    return `tempo:${event.tick}`
  }

  if (isMeterEvent(event)) {
    return `meter:${event.tick}`
  }

  return `key:${event.tick}`
}

function getTimelineEventMarkerLabel(event: TimelineEvent): string {
  if (isTempoEvent(event)) {
    return `${event.bpm}`
  }

  if (isMeterEvent(event)) {
    return `${event.timeSignature.numerator}/${event.timeSignature.denominator}`
  }

  return `${event.key.tonic}`
}

function getTimelineEventMarkerColor(event: TimelineEvent): string {
  if (isTempoEvent(event)) {
    return 'red'
  }

  if (isMeterEvent(event)) {
    return 'blue'
  }

  return 'green'
}

function getTimelineEventMarkerIcon(event: TimelineEvent): typeof TimeSetting01Icon {
  if (isTempoEvent(event)) {
    return TimeSetting01Icon
  }

  if (isMeterEvent(event)) {
    return MagnetIcon
  }

  return Key01Icon
}

function getTimelineEventMarkerTop(event: TimelineEvent): number {
  if (isTempoEvent(event)) {
    return (TIMELINE_MARKER_TOP * 5) + 10
  }

  if (isMeterEvent(event)) {
    return (TIMELINE_MARKER_TOP * 3) + 8
  }

  return TIMELINE_MARKER_TOP + 6
}

function isSameTimelineEvent(left: TimelineEvent, right: TimelineEvent): boolean {
  if (left.tick !== right.tick) {
    return false
  }

  if (isTempoEvent(left)) {
    return isTempoEvent(right)
  }

  if (isMeterEvent(left)) {
    return isMeterEvent(right)
  }

  return isKeyEvent(right)
}

function getWheelDeltaPixels(event: ReactWheelEvent<HTMLDivElement>): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * event.currentTarget.clientHeight
  }

  return event.deltaY
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
}
function getToolLabel(tool: ActiveTool): string {
  switch (tool) {
    case 'audition':
      return 'Audition'
    case 'drawBlock':
      return 'Draw block'
    case 'drawPatternEvent':
      return 'Draw pattern event'
    case 'drawSection':
      return 'Draw section'
    case 'erase':
      return 'Erase'
    case 'hand':
      return 'Hand'
    case 'key':
      return 'Key'
    case 'loopRange':
      return 'Loop range'
    case 'marquee':
      return 'Marquee'
    case 'meter':
      return 'Meter'
    case 'move':
      return 'Move'
    case 'mute':
      return 'Mute'
    case 'resize':
      return 'Resize'
    case 'select':
      return 'Select'
    case 'split':
      return 'Split'
    case 'tempo':
      return 'Tempo'
    case 'zoom':
      return 'Zoom'
  }
}
