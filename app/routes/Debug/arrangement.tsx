import {
  memo,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { type MetaArgs } from 'react-router'
import {
  Cancel01Icon,
  Copy01Icon,
  CursorIcon,
  Delete01Icon,
  EraserIcon,
  GridIcon,
  HoldIcon,
  Key01Icon,
  MagnetIcon,
  MoveIcon,
  MuteIcon,
  PaintBrush01Icon,
  PauseIcon,
  PencilEdit01Icon,
  PlayIcon,
  Redo03Icon,
  Resize01Icon,
  ScissorIcon,
  StopIcon,
  TimeSetting01Icon,
  Undo03Icon,
  ZoomInAreaIcon,
  ZoomOutAreaIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ActionIcon,
  AngleSlider,
  Badge,
  Box,
  Button,
  ColorInput,
  ColorSwatch,
  Divider,
  Group,
  MultiSelect,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core'

import { AppLayout } from '~/components/AppLayout/AppLayout'
import { AppMenu } from '~/components/AppLayout/AppMenu'
import { PatternPanel } from '~/components/PatternPanel/PatternPanel'
import AppProvider from '~/components/Providers/AppProvider'
import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import { useSession } from '~/components/Providers/SessionProvider'
import {
  type Block,
  BLOCK_PLAYBACK_MODES,
  type BlockPlaybackMode,
  CHORD_ALTERATIONS,
  CHORD_EXTENSIONS,
  CHORD_PLAYBACK_RECIPE_IDS,
  CHORD_PLAYBACK_RECIPES,
  CHORD_PLAYBACK_STYLES,
  CHORD_QUALITIES,
  createSynthOscillator,
  DEFAULT_TRACK_COLOR,
  DRUM_PIECES,
  type DrumPiece,
  formatTickAsBars,
  formatTickRangeAsBars,
  getBlockEndTick,
  getNoteNameForPitchClass,
  getRulerMarks,
  getSectionEndTick,
  GRID_DIVISIONS,
  type GridDivision,
  type Instrument,
  type InstrumentId,
  isKeyEvent,
  isMeterEvent,
  isTempoEvent,
  type Key,
  type MasterMixChannel,
  MAX_MIX_CHANNEL_PAN,
  MIN_MIX_CHANNEL_PAN,
  type MixChannel,
  type MixChannelId,
  MODES,
  type Pattern,
  PATTERN_EVENT_KINDS,
  PATTERN_KINDS,
  type PatternEvent,
  type PatternEventId,
  type PatternId,
  type PatternKind,
  PITCH_CLASSES,
  pitchClassFromMidiNote,
  REGISTERS,
  type RulerMark,
  type Section,
  type SectionId,
  type Tick,
  TIME_SIGNATURE_DENOMINATORS,
  type TimelineEvent,
  type TimelineEventId,
  type TimeSignatureDenominator,
  type Track,
  TRACK_ROLES,
  type TrackId,
  type TrackRole,
  VOICING_TYPES,
} from '~/domain'
import type { SynthOscillator } from '~/domain/instrument/synth'
import { useAnimationFrameThrottle } from '~/hooks/useAnimationFrameThrottle'
import { useBlockStack } from '~/hooks/useBlockStack'
import { useDrag } from '~/hooks/useDrag'
import {
  useSectionLaneOverlay,
  useTimelineEventOverlay,
  useTrackLaneOverlay,
} from '~/hooks/useDragOverlay'
import { useKeyboardShortcuts } from '~/hooks/useKeyboardShortcuts'
import { useSessionProject } from '~/hooks/useSessionProject'
import {
  useTransportPlayhead,
  useTransportStatus,
} from '~/hooks/useTransport'
import { useViewport } from '~/hooks/useViewport'
import type { PlaybackEngine } from '~/playback/playback'
import {
  ACTIVE_TOOLS,
  type ActivePatternPanelTool,
  type ActiveTool,
  applyBlockToolAction,
  applySectionToolAction,
  applyTimelineEventToolAction,
  copySelectionAction,
  createArrangementTrackDraft,
  createInspectorDraft,
  deleteSelectionAction,
  type DragState,
  duplicateSelectionAction,
  type InspectorDraft,
  pasteClipboardAction,
  type PatternEventDraft,
  selectBlockAction,
  selectFirstSelectedBlock,
  selectFirstSelectedInstrument,
  selectFirstSelectedMixChannel,
  selectFirstSelectedPattern,
  selectFirstSelectedPatternEvent,
  selectFirstSelectedSection,
  selectFirstSelectedTimelineEvent,
  selectFirstSelectedTrack,
  selectInstrumentAction,
  type SelectionState,
  selectMixChannelAction,
  selectPatternAction,
  selectPatternEventAction,
  selectSectionAction,
  selectTimelineEventAction,
  selectTrackAction,
  setActivePatternPanelToolAction,
  setActiveToolAction,
  setFocusedBlockIdAction,
  tickToX,
  unfocusSelectionAction,
  updateBlockFromInspectorAction,
  updateInspectorDraftFromSelection,
  updateInstrumentFromInspectorAction,
  updateMixChannelFromInspectorAction,
  updatePatternEventFromDraftAction,
  updatePatternEventFromInspectorAction,
  updatePatternFromInspectorAction,
  updateSectionFromInspectorAction,
  updateTimelineEventFromInspectorAction,
  updateTrackFromInspectorAction,
  type ViewportState,
} from '~/store/editor'
import type { CommandHistoryEntry } from '~/store/session'
import {
  addTrackAction,
  deletePatternEventAction,
  deleteTimelineEventAction,
  selectBlocksForTrack,
  selectInstrument,
  selectMixChannel,
  selectPattern,
  selectPatterns,
  selectTimelineEvents,
  selectTracks,
  selectWorkspaceEndTick,
  setGridDivisionAction,
  updateMixChannelAction,
  updateMixerAction,
  validateWorkspace,
  type Workspace,
} from '~/store/workspace'
import { parseNumber } from '~/utils/number'

const TRACK_LABEL_WIDTH = 128
const INSTRUMENT_COLUMN_WIDTH = 148
const MIX_CHANNEL_COLUMN_WIDTH = 73
const TIMELINE_PADDING_TICKS = 7680
const MIN_BLOCK_WIDTH = 2
const MIN_SECTION_WIDTH = 2
const MIN_OVERLAY_WIDTH = 2
const BLOCK_TOP = 14
const BLOCK_HEIGHT = 42
const TIMELINE_MARKER_TOP = 10
const HANDLE_WIDTH = 10
const ANGLE_SLIDER_MAX = 359
const MIN_MIX_CHANNEL_VOLUME_DB = -20
const MAX_MIX_CHANNEL_VOLUME_DB = 20
const MAX_SYNTH_ENVELOPE_VALUE = 3
const SYNTH_OSCILLATOR_WAVEFORMS: SynthOscillator['waveform'][] = [
  'sine',
  'triangle',
  'sawtooth',
  'square',
]

const HOVER_BOX_SHADOWS = {
  entity: '0 0 0 3px var(--mantine-color-gray-5)',
  label: 'inset 0 0 0 1px var(--mantine-color-gray-4)',
  marker: '0 0 0 2px var(--mantine-color-gray-5)',
} as const

const SELECTED_STYLES = {
  border: '2px solid var(--mantine-color-blue-6)',
  outline: '2px solid var(--mantine-color-blue-6)',
  shadow: 'inset 0 0 0 1px var(--mantine-color-blue-5)',
} as const

const TRACK_COLOR_PALETTE = [
  DEFAULT_TRACK_COLOR,
  '#868e96',
  '#fa5252',
  '#fd7e14',
  '#fab005',
  '#40c057',
  '#12b886',
  '#15aabf',
  '#4c6ef5',
  '#7950f2',
] as const
const ROOT_OPTIONS = Array.from({ length: 12 }, (_, value) => ({
  label: `${value}`,
  value: `${value}`,
}))
const NONE_OPTION_VALUE = 'none'
const PITCH_CLASS_OPTIONS = PITCH_CLASSES.map(value => ({
  label: `${getNoteNameForPitchClass(value)} (${value})`,
  value: `${value}`,
}))
const OPTIONAL_PITCH_CLASS_OPTIONS = [
  { label: 'None', value: NONE_OPTION_VALUE },
  ...PITCH_CLASS_OPTIONS,
]
const CHORD_PLAYBACK_RECIPE_OPTIONS = CHORD_PLAYBACK_RECIPE_IDS.map(value => ({
  label: CHORD_PLAYBACK_RECIPES[value].name,
  value,
}))

const TOOLBAR_SECTION_KEYS: ActiveTool[] = ['drawBlock', 'drawSection', 'tempo', 'meter', 'key']

const TOOLBAR_SECTION_LEFT = ACTIVE_TOOLS.filter(tool => !TOOLBAR_SECTION_KEYS.includes(tool)).map(tool => ({
  icon: getToolIcon(tool),
  label: getToolLabel(tool),
  tool,
}))

const TOOLBAR_SECTION_RIGHT = ACTIVE_TOOLS.filter(tool => TOOLBAR_SECTION_KEYS.includes(tool)).map(tool => ({
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
  const {
    canRedo,
    canUndo,
    commandHistory,
    dispatch,
    editor,
    redo,
    undo,
    workspace,
  } = useSession()

  const playbackEngine = usePlaybackEngine()

  const {
    viewport,
    scrollRef,
    handleViewportWheel,
    handleZoomBy,
  } = useViewport()

  const {
    cancelDrag,
    finishDrag,
    startDrag,
    dragState,
    updateDrag,
    timelineRef,
    trackRowsRef,
    getPointerTick,
  } = useDrag({
    dispatch,
    viewport,
    workspace,
  })

  const [inspectorDraft, setInspectorDraft] = useState<InspectorDraft>(() => createInspectorDraft())

  const [hoveredBlockId, setHoveredBlockId] = useState<string | undefined>(undefined)
  const [hoveredInstrumentId, setHoveredInstrumentId] = useState<InstrumentId | undefined>(undefined)
  const [hoveredMixChannelId, setHoveredMixChannelId] = useState<MixChannelId | undefined>(undefined)
  const [hoveredSectionId, setHoveredSectionId] = useState<SectionId | undefined>(undefined)
  const [hoveredTimelineEventId, setHoveredTimelineEventId] = useState<string | undefined>(undefined)
  const [hoveredTrackId, setHoveredTrackId] = useState<TrackId | undefined>(undefined)

  const tracks = useMemo(() => selectTracks(workspace), [workspace])
  const patterns = useMemo(() => selectPatterns(workspace), [workspace])
  const selectedBlock = useMemo(() => selectFirstSelectedBlock(editor, workspace), [editor, workspace])
  const selectedInstrument = useMemo(() => selectFirstSelectedInstrument(editor, workspace), [editor, workspace])
  const selectedMixChannel = useMemo(() => selectFirstSelectedMixChannel(editor, workspace), [editor, workspace])
  const selectedPattern = useMemo(() => selectFirstSelectedPattern(editor, workspace), [editor, workspace])
  const selectedPatternEvent = useMemo(() => selectFirstSelectedPatternEvent(editor, workspace), [editor, workspace])
  const selectedSection = useMemo(() => selectFirstSelectedSection(editor, workspace), [editor, workspace])
  const selectedTimelineEvent = useMemo(() => selectFirstSelectedTimelineEvent(editor, workspace), [editor, workspace])
  const selectedTrack = useMemo(() => selectFirstSelectedTrack(editor, workspace), [editor, workspace])

  const timelineEndTick = useMemo(
    () => selectWorkspaceEndTick(workspace) + TIMELINE_PADDING_TICKS,
    [workspace],
  )

  const timelineWidth = useMemo(
    () => Math.max(980, Math.ceil(tickToX(viewport.pixelsPerTick, timelineEndTick))),
    [viewport.pixelsPerTick, timelineEndTick],
  )

  const timelineHeight = useMemo(
    () => tracks.length * viewport.laneHeight,
    [tracks.length, viewport.laneHeight],
  )

  const rulerMarks = useMemo(
    () => getRulerMarks(workspace.timeline, 0, timelineEndTick),
    [timelineEndTick, workspace.timeline],
  )

  const workspaceErrors = useMemo(
    () => validateWorkspace(workspace),
    [workspace],
  )

  useEffect(() => {
    setInspectorDraft(currentDraft => updateInspectorDraftFromSelection(
      currentDraft,
      selectedTrack,
      selectedInstrument,
      selectedMixChannel,
      selectedBlock,
      selectedPattern,
      selectedPatternEvent,
      selectedSection,
      selectedTimelineEvent,
    ))
  }, [
    selectedBlock,
    selectedInstrument,
    selectedMixChannel,
    selectedPattern,
    selectedPatternEvent,
    selectedSection,
    selectedTimelineEvent,
    selectedTrack,
  ])

  const handleRulerPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const tick = getPointerTick(event.clientX)
    playbackEngine.seek(tick)

    const commands = applyTimelineEventToolAction(
      workspace,
      editor.activeTool,
      tick,
    )

    if (commands.length > 0) {
      dispatch(commands)
    }
  }, [dispatch, editor.activeTool, getPointerTick, playbackEngine, workspace])

  const handleSectionLanePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return
    }

    if (editor.activeTool === 'drawSection') {
      startDrag(event, { kind: 'drawSection' })
      return
    }

    if (editor.activeTool === 'select') {
      startDrag(event, { kind: 'selectRange', row: 0 })
    }
  }, [editor.activeTool, startDrag])

  const handleTrackLanePointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    trackId: string,
  ) => {
    if (event.button !== 0) {
      return
    }

    if (editor.activeTool === 'drawBlock') {
      startDrag(event, { kind: 'drawBlock', trackId })
      return
    }

    if (editor.activeTool === 'select') {
      startDrag(event, {
        kind: 'selectRange',
        row: workspace.tracks.allIds.indexOf(trackId) + 1,
      })
    }
  }, [editor.activeTool, startDrag, workspace.tracks.allIds])

  const handleBlockPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    block: Block,
  ) => {
    event.stopPropagation()

    const commands = applyBlockToolAction({
      block,
      tick: getPointerTick(event.clientX),
      tool: editor.activeTool,
    })

    if (commands.length > 0) {
      dispatch(commands)
      return
    }

    dispatch(selectBlockAction(block.id, event.shiftKey))

    if (editor.activeTool === 'select' || editor.activeTool === 'move') {
      startDrag(event, {
        blockIds: editor.selection.selectedBlockIds.includes(block.id)
          ? editor.selection.selectedBlockIds
          : [block.id],
        kind: 'moveBlock',
        trackId: block.trackId,
      })
    }
  }, [dispatch, editor.activeTool, editor.selection.selectedBlockIds, getPointerTick, startDrag])

  const handleBlockResizePointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    block: Block,
    edge: 'left' | 'right',
  ) => {
    event.stopPropagation()
    dispatch(selectBlockAction(block.id, event.shiftKey))
    startDrag(event, { block, edge, kind: 'resizeBlock' })
  }, [dispatch, startDrag])

  const handleSectionPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    section: Section,
  ) => {
    event.stopPropagation()

    const commands = applySectionToolAction({
      section,
      tick: getPointerTick(event.clientX),
      tool: editor.activeTool,
    })

    if (commands.length > 0) {
      dispatch(commands)
      return
    }

    dispatch(selectSectionAction(section.id, event.shiftKey))

    if (editor.activeTool === 'select' || editor.activeTool === 'move') {
      startDrag(event, { kind: 'moveSection', section })
    }
  }, [dispatch, editor.activeTool, getPointerTick, startDrag])

  const handleSectionResizePointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    section: Section,
    edge: 'left' | 'right',
  ) => {
    event.stopPropagation()
    dispatch(selectSectionAction(section.id, event.shiftKey))
    startDrag(event, { edge, kind: 'resizeSection', section })
  }, [dispatch, startDrag])

  const handleTimelineEventPointerDown = useCallback((
    event: ReactPointerEvent<HTMLDivElement>,
    timelineEvent: TimelineEvent,
  ) => {
    event.stopPropagation()

    if (editor.activeTool === 'erase') {
      dispatch(deleteTimelineEventAction([timelineEvent.id]))
      return
    }

    dispatch(selectTimelineEventAction(timelineEvent.id, event.shiftKey))

    if (editor.activeTool === 'select' || editor.activeTool === 'move') {
      startDrag(event, { event: timelineEvent, kind: 'moveTimelineEvent' })
    }
  }, [dispatch, editor.activeTool, startDrag])

  const handleTimelineLabelPointerDown = useCallback((
    event: ReactMouseEvent<HTMLDivElement>,
    trackId: TrackId,
  ) => {
    event.stopPropagation()

    dispatch(selectTrackAction(trackId, event.shiftKey))
  }, [dispatch])

  const handleClickInstrument = useCallback((
    event: ReactMouseEvent<HTMLDivElement>,
    instrumentId: InstrumentId,
  ) => {
    event.stopPropagation()
    dispatch(selectInstrumentAction(instrumentId, event.shiftKey))
  }, [dispatch])

  const handleClickMixChannel = useCallback((
    event: ReactMouseEvent<HTMLDivElement>,
    mixChannelId: MixChannelId,
  ) => {
    event.stopPropagation()
    dispatch(selectMixChannelAction(mixChannelId, event.shiftKey))
  }, [dispatch])

  const handlePatternClick = useCallback((
    event: ReactMouseEvent<HTMLButtonElement>,
    patternId: PatternId,
  ) => {
    event.stopPropagation()
    dispatch(selectPatternAction(patternId, event.shiftKey))
  }, [dispatch])

  const handlePatternEventClick = useCallback((
    event: ReactMouseEvent<HTMLButtonElement>,
    patternEventId: PatternEventId,
  ) => {
    event.stopPropagation()
    dispatch(selectPatternEventAction(patternEventId, event.shiftKey))
  }, [dispatch])

  const handleSelectPatternEvent = useCallback((patternEventId: PatternEventId, additive: boolean) => {
    dispatch(selectPatternEventAction(patternEventId, additive))
  }, [dispatch])

  const handleDeletePatternEvent = useCallback((patternEventId: PatternEventId) => {
    dispatch(deletePatternEventAction([patternEventId]))
  }, [dispatch])

  const handleUpdatePatternEventDraft = useCallback((
    patternEvent: PatternEvent,
    patternEventDraft: Partial<PatternEventDraft>,
  ) => {
    dispatch(updatePatternEventFromDraftAction({
      draft: patternEventDraft,
      patternEvent,
      workspace,
    }) ?? [])
  }, [dispatch])

  const handleClickMixChannelMute = useCallback((
    event: ReactMouseEvent<HTMLButtonElement>,
    mixChannel: MixChannel,
  ) => {
    event.stopPropagation()
    dispatch(updateMixChannelAction({ ...mixChannel, muted: !mixChannel.muted }))
  }, [dispatch])

  const handleClickMixChannelSolo = useCallback((
    event: ReactMouseEvent<HTMLButtonElement>,
    mixChannel: MixChannel,
  ) => {
    event.stopPropagation()
    dispatch(updateMixChannelAction({ ...mixChannel, soloed: !mixChannel.soloed }))
  }, [dispatch])

  const handleMasterMixChannelVolumeChange = useAnimationFrameThrottle((volumeDb: number) => {
    dispatch(updateMixerAction({
      volumeDb,
    }))
  })

  const handleMasterMixChannelMute = useCallback(() => {
    dispatch(updateMixerAction({
      muted: !workspace.mixer.master.muted,
    }))
  }, [dispatch, workspace.mixer.master.muted])

  const handleAddTrack = useCallback(() => {
    dispatch(
      addTrackAction(
        createArrangementTrackDraft(workspace),
      ),
    )
  }, [dispatch, workspace])

  const handleCopy = useCallback(() => {
    dispatch(copySelectionAction())
  }, [dispatch])

  const setActiveTool = useCallback((tool: ActiveTool) => {
    dispatch(setActiveToolAction(tool))
  }, [dispatch])

  const handleSetActivePatternPanelTool = useCallback((tool: ActivePatternPanelTool) => {
    dispatch(setActivePatternPanelToolAction(tool))
  }, [dispatch])

  const handlePaste = useCallback(() => {
    dispatch(pasteClipboardAction(editor.clipboard, workspace.timeline.ppq))
  }, [editor.clipboard, dispatch, workspace.timeline.ppq])

  const duplicateSelection = useCallback(() => {
    dispatch(duplicateSelectionAction(editor.selection, workspace.timeline.ppq))
  }, [editor.selection, dispatch, workspace.timeline.ppq])

  const deleteSelection = useCallback(() => {
    dispatch(deleteSelectionAction(editor.selection))
  }, [editor.selection, dispatch])

  const updateGridDivision = useCallback((grid: GridDivision) => {
    dispatch(setGridDivisionAction(
      grid,
    ))
  }, [dispatch])

  const handleBlockCloseFocus = useCallback(() => {
    dispatch(setFocusedBlockIdAction())
  }, [dispatch])

  const handleBlockDoubleClick = useCallback((blockId: string) => {
    dispatch(setFocusedBlockIdAction(
      blockId,
    ))
  }, [dispatch])

  const handleToolbarZoomIn = useCallback(() => {
    handleZoomBy(1.25)
  }, [handleZoomBy])

  const handleToolbarZoomOut = useCallback(() => {
    handleZoomBy(0.8)
  }, [handleZoomBy])

  const updateSelectedBlockFromInspector = useCallback(() => {
    if (selectedBlock === undefined) {
      return
    }

    dispatch(updateBlockFromInspectorAction({
      block: selectedBlock,
      draft: inspectorDraft,
    }))
  }, [inspectorDraft, dispatch, selectedBlock])

  const updateSelectedSectionFromInspector = useCallback(() => {
    if (selectedSection === undefined) {
      return
    }

    dispatch(updateSectionFromInspectorAction({
      draft: inspectorDraft,
      section: selectedSection,
    }))
  }, [inspectorDraft, dispatch, selectedSection])

  const updateSelectedTimelineEventFromInspector = useCallback(() => {
    if (selectedTimelineEvent === undefined) {
      return
    }

    dispatch(updateTimelineEventFromInspectorAction({
      draft: inspectorDraft,
      timelineEvent: selectedTimelineEvent,
    }))
  }, [inspectorDraft, dispatch, selectedTimelineEvent])

  const updateSelectedTrackFromInspector = useCallback(() => {
    if (selectedTrack === undefined) {
      return
    }

    dispatch(updateTrackFromInspectorAction({
      draft: inspectorDraft,
      track: selectedTrack,
    }))
  }, [dispatch, inspectorDraft, selectedTrack])

  const updateSelectedInstrumentFromInspector = useCallback(() => {
    if (selectedInstrument === undefined) {
      return
    }

    dispatch(updateInstrumentFromInspectorAction({
      draft: inspectorDraft,
      instrument: selectedInstrument,
    }))
  }, [dispatch, inspectorDraft, selectedInstrument])

  const updateSelectedMixChannelFromInspector = useCallback(() => {
    if (selectedMixChannel === undefined) {
      return
    }

    dispatch(updateMixChannelFromInspectorAction({
      draft: inspectorDraft,
      mixChannel: selectedMixChannel,
    }))
  }, [dispatch, inspectorDraft, selectedMixChannel])

  const updateSelectedPatternFromInspector = useCallback(() => {
    if (selectedPattern === undefined) {
      return
    }

    dispatch(updatePatternFromInspectorAction({
      draft: inspectorDraft,
      pattern: selectedPattern,
    }))
  }, [dispatch, inspectorDraft, selectedPattern])

  const updateSelectedPatternEventFromInspector = useCallback(() => {
    if (selectedPatternEvent === undefined) {
      return
    }

    dispatch(updatePatternEventFromInspectorAction({
      draft: inspectorDraft,
      patternEvent: selectedPatternEvent,
      workspace,
    }) ?? [])
  }, [dispatch, inspectorDraft, selectedPatternEvent, workspace])

  const unfocusSelection = useCallback(() => {
    dispatch(unfocusSelectionAction(editor.focusedBlockId))
  }, [dispatch, editor.focusedBlockId])

  useKeyboardShortcuts({
    onDelete: deleteSelection,
    onDuplicate: duplicateSelection,
    onEscape: unfocusSelection,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onRedo: redo,
    onUndo: undo,
  })

  const {
    handleNew,
    handleOpen,
    handleOpenDemo,
    handleSave,
  } = useSessionProject()

  return (
    <AppLayout>
      <Stack gap="md" py="lg">
        <Group justify="space-between" align="flex-start">
          <AppMenu
            onNewProject={handleNew}
            onOpenProject={handleOpen}
            onOpenProjectDemo={handleOpenDemo}
            onSaveProject={handleSave}
            onUndoCommand={undo}
            onRedoCommand={redo}
            onPasteCommand={handlePaste}
            onCopyCommand={handleCopy}
          />
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
        <Toolbar
          playbackEngine={playbackEngine}
          activeTool={editor.activeTool}
          canRedo={canRedo}
          canUndo={canUndo}
          focusedBlockId={editor.focusedBlockId}
          grid={workspace.timeline.grid}
          onCloseFocus={handleBlockCloseFocus}
          onDuplicate={duplicateSelection}
          onRedo={redo}
          onUndo={undo}
          onSetGrid={updateGridDivision}
          onSetTool={setActiveTool}
          onZoomIn={handleToolbarZoomIn}
          onZoomOut={handleToolbarZoomOut}
        />
        <SimpleGrid cols={{ base: 2, lg: 8 }} spacing="md">
          <Paper withBorder radius="sm" p={0} style={{ gridColumn: 'span 6', overflow: 'hidden' }}>
            <Box
              style={{
                display: 'grid',
                gridTemplateColumns: `${TRACK_LABEL_WIDTH}px ${INSTRUMENT_COLUMN_WIDTH}px ${MIX_CHANNEL_COLUMN_WIDTH}px minmax(0, 1fr)`,
              }}
            >
              <TimelineLabelColumn
                focusedBlockId={editor.focusedBlockId}
                hoveredTrackId={hoveredTrackId}
                selectedTrackIds={editor.selection.selectedTrackIds}
                tracks={tracks}
                viewport={viewport}
                onClickTrackLabel={handleTimelineLabelPointerDown}
                onSetHoveredTrack={setHoveredTrackId}
              />
              <TimelineInstrumentColumn
                hoveredInstrumentId={hoveredInstrumentId}
                selectedInstrumentIds={editor.selection.selectedInstrumentIds}
                tracks={tracks}
                viewport={viewport}
                workspace={workspace}
                onClick={handleClickInstrument}
                onSetHoveredInstrument={setHoveredInstrumentId}
              />
              <TimelineMixChannelColumn
                hoveredMixChannelId={hoveredMixChannelId}
                selectedMixChannelIds={editor.selection.selectedMixChannelIds}
                tracks={tracks}
                viewport={viewport}
                workspace={workspace}
                onClick={handleClickMixChannel}
                onClickMute={handleClickMixChannelMute}
                onClickSolo={handleClickMixChannelSolo}
                onSetHoveredMixChannel={setHoveredMixChannelId}
              />
              <Box
                ref={scrollRef}
                onPointerCancel={cancelDrag}
                onPointerMove={updateDrag}
                onPointerUp={finishDrag}
                onWheel={handleViewportWheel}
                style={{
                  minWidth: 0,
                  overflow: 'auto',
                  paddingBottom: 8,
                  position: 'relative',
                }}
              >
                <Box
                  ref={timelineRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: timelineWidth,
                  }}
                />
                <TimelineRuler
                  drag={dragState}
                  hoveredTimelineEventId={hoveredTimelineEventId}
                  selectedTimelineEventIds={editor.selection.selectedTimelineEventIds}
                  timelineWidth={timelineWidth}
                  viewport={viewport}
                  workspace={workspace}
                  marks={rulerMarks}
                  onMarkerPointerEnter={setHoveredTimelineEventId}
                  onMarkerPointerDown={handleTimelineEventPointerDown}
                  onRulerPointerDown={handleRulerPointerDown}
                />
                <SectionLane
                  drag={dragState}
                  focusedBlockId={editor.focusedBlockId}
                  hoveredSectionId={hoveredSectionId}
                  marks={rulerMarks}
                  selectedSectionIds={editor.selection.selectedSectionIds}
                  timelineWidth={timelineWidth}
                  viewport={viewport}
                  workspace={workspace}
                  onEmptyDoubleClick={handleBlockCloseFocus}
                  onPointerDown={handleSectionLanePointerDown}
                  onResizePointerDown={handleSectionResizePointerDown}
                  onSectionPointerDown={handleSectionPointerDown}
                  onSetHoveredSection={setHoveredSectionId}
                />
                <Box ref={trackRowsRef} pos="relative">
                  {tracks.map(track => (
                    <TrackLane
                      key={track.id}
                      drag={dragState}
                      focusedBlockId={editor.focusedBlockId}
                      hoveredBlockId={hoveredBlockId}
                      selectedBlockIds={editor.selection.selectedBlockIds}
                      selectedPatternEventIds={editor.selection.selectedPatternEventIds}
                      selectedPatternIds={editor.selection.selectedPatternIds}
                      timelineWidth={timelineWidth}
                      track={track}
                      viewport={viewport}
                      workspace={workspace}
                      onBlockDoubleClick={handleBlockDoubleClick}
                      onBlockPointerDown={handleBlockPointerDown}
                      onBlockResizePointerDown={handleBlockResizePointerDown}
                      onEmptyDoubleClick={handleBlockCloseFocus}
                      onPointerDown={handleTrackLanePointerDown}
                      onPatternClick={handlePatternClick}
                      onPatternEventClick={handlePatternEventClick}
                      onSetHoveredBlock={setHoveredBlockId}
                    />
                  ))}
                  <TimelineGridLines
                    height={timelineHeight}
                    marks={rulerMarks}
                    timelineWidth={timelineWidth}
                    viewport={viewport}
                  />
                </Box>
                <TimelinePlayhead
                  playbackEngine={playbackEngine}
                  timelineRef={timelineRef}
                  viewport={viewport}
                />
              </Box>
            </Box>
            <PatternPanel
              dispatch={dispatch}
              workspace={workspace}
              tool={editor.activePatternPanelTool}
              timeline={workspace.timeline}
              focusedBlockId={editor.focusedBlockId}
              selectedPatternEvent={selectedPatternEvent}
              selectedPatternEventIds={editor.selection.selectedPatternEventIds}
              onDeletePatternEvent={handleDeletePatternEvent}
              onSelectPatternEvent={handleSelectPatternEvent}
              onSetActiveTool={handleSetActivePatternPanelTool}
              onUpdatePatternEventDraft={handleUpdatePatternEventDraft}
            />
          </Paper>
          <Stack gap="md" style={{ gridColumn: 'span 2', overflow: 'hidden' }}>
            <Paper withBorder radius="sm" p="md">
              <MasterMixChannelControls
                master={workspace.mixer.master}
                onToggleMuted={handleMasterMixChannelMute}
                onVolumeChange={handleMasterMixChannelVolumeChange}
              />
            </Paper>
            <InspectorPanel
              commandHistory={commandHistory.undoStack}
              draft={inspectorDraft}
              patterns={patterns}
              selectedBlock={selectedBlock}
              selectedInstrument={selectedInstrument}
              selectedMixChannel={selectedMixChannel}
              selectedPattern={selectedPattern}
              selectedPatternEvent={selectedPatternEvent}
              selectedSection={selectedSection}
              selectedTimelineEvent={selectedTimelineEvent}
              selectedTrack={selectedTrack}
              selection={editor.selection}
              setDraft={setInspectorDraft}
              workspace={workspace}
              workspaceErrors={workspaceErrors}
              onDeleteSelected={deleteSelection}
              onUpdateBlock={updateSelectedBlockFromInspector}
              onUpdateInstrument={updateSelectedInstrumentFromInspector}
              onUpdateMixChannel={updateSelectedMixChannelFromInspector}
              onUpdatePattern={updateSelectedPatternFromInspector}
              onUpdatePatternEvent={updateSelectedPatternEventFromInspector}
              onUpdateSection={updateSelectedSectionFromInspector}
              onUpdateTimelineEvent={updateSelectedTimelineEventFromInspector}
              onUpdateTrack={updateSelectedTrackFromInspector}
            />
          </Stack>
        </SimpleGrid>
        <Paper withBorder radius="sm" p="md">
          <Button size="xs" onClick={handleAddTrack}>Add Track</Button>
        </Paper>
      </Stack>
    </AppLayout>
  )
}

const Toolbar = memo(function Toolbar({
  playbackEngine,
  activeTool,
  canRedo,
  canUndo,
  focusedBlockId,
  grid,
  onCloseFocus,
  onDuplicate,
  onRedo,
  onSetGrid,
  onSetTool,
  onUndo,
  onZoomIn,
  onZoomOut,
}: {
  playbackEngine: PlaybackEngine
  activeTool: ActiveTool
  canRedo: boolean
  canUndo: boolean
  focusedBlockId?: string
  grid: GridDivision
  onCloseFocus: () => void
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
        <PlaybackControls playbackEngine={playbackEngine} />
        <Group gap={4}>
          {TOOLBAR_SECTION_LEFT.map(item => (
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
        <Group gap={4}>
          {TOOLBAR_SECTION_RIGHT.map(item => (
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
              <ActionIcon aria-label="Close focus" color="yellow" size="lg" variant="light" onClick={onCloseFocus}>
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
})

const PlaybackControls = memo(function PlaybackControls({
  playbackEngine,
}: {
  playbackEngine: PlaybackEngine
}) {
  const status = useTransportStatus(playbackEngine)

  return (
    <Group gap={4}>
      <Tooltip label="Play">
        <ActionIcon
          aria-label="Play"
          color="green"
          disabled={status === 'playing'}
          size="lg"
          variant={status === 'playing' ? 'filled' : 'light'}
          onClick={() => playbackEngine.play()}
        >
          <HugeiconsIcon icon={PlayIcon} size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Pause">
        <ActionIcon
          aria-label="Pause"
          color="yellow"
          disabled={status !== 'playing'}
          size="lg"
          variant="light"
          onClick={() => playbackEngine.pause()}
        >
          <HugeiconsIcon icon={PauseIcon} size={18} />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Stop">
        <ActionIcon
          aria-label="Stop"
          color="red"
          size="lg"
          variant="light"
          onClick={() => playbackEngine.stop()}
        >
          <HugeiconsIcon icon={StopIcon} size={18} />
        </ActionIcon>
      </Tooltip>
    </Group>
  )
})

const TimelinePlayhead = memo(function TimelinePlayhead({
  playbackEngine,
  timelineRef,
  viewport,
}: {
  playbackEngine: PlaybackEngine
  timelineRef: RefObject<HTMLDivElement | null>
  viewport: ViewportState
}) {
  const playheadProps = useTransportPlayhead(
    playbackEngine,
    viewport.pixelsPerTick,
    timelineRef,
  )

  return (
    <Box

      onPointerCancel={playheadProps.onPointerCancel}
      onPointerDown={playheadProps.onPointerDown}
      onPointerMove={playheadProps.onPointerMove}
      onPointerUp={playheadProps.onPointerUp}
      ref={playheadProps.ref}
      aria-label="Playhead"
      style={{
        bottom: 8,
        cursor: 'ew-resize',
        left: -5,
        pointerEvents: 'auto',
        position: 'absolute',
        touchAction: 'none',
        top: 0,
        width: 12,
        willChange: 'transform',
        zIndex: 10,
      }}
    >
      <Box
        style={{
          background: 'var(--mantine-color-red-6)',
          height: '100%',
          marginInline: 'auto',
          width: 2,
        }}
      />
    </Box>
  )
})

const MasterMixChannelControls = memo(function MasterMixChannelControls({
  master,
  onToggleMuted,
  onVolumeChange,
}: {
  master: MasterMixChannel
  onToggleMuted: () => void
  onVolumeChange: (volumeDb: number) => void
}) {
  return (
    <Stack gap="xs" w="100%">
      <Group justify="space-between">
        <Text fw={700} size="sm">Master Mix Channel</Text>
        <ActionIcon
          aria-label="Mute master mix channel"
          aria-pressed={master.muted}
          color={master.muted ? 'red' : 'gray'}
          size="sm"
          variant={master.muted ? 'filled' : 'light'}
          onClick={onToggleMuted}
        >
          <HugeiconsIcon icon={MuteIcon} size={14} />
        </ActionIcon>
      </Group>
      <Stack gap={4}>
        <Text c="dimmed" size="xs">{`Volume: ${master.volumeDb} dB`}</Text>
        <Slider
          max={MAX_MIX_CHANNEL_VOLUME_DB}
          min={MIN_MIX_CHANNEL_VOLUME_DB}
          size="sm"
          step={1}
          value={master.volumeDb}
          onChange={onVolumeChange}
        />
      </Stack>
    </Stack>
  )
})

const TimelineLabelColumn = memo(function TimelineLabelColumn({
  focusedBlockId,
  hoveredTrackId,
  onClickTrackLabel,
  onSetHoveredTrack,
  selectedTrackIds,
  tracks,
  viewport,
}: {
  focusedBlockId?: string
  hoveredTrackId?: TrackId
  onClickTrackLabel: (event: ReactMouseEvent<HTMLDivElement>, trackId: TrackId) => void
  onSetHoveredTrack: (trackId: TrackId | undefined) => void
  selectedTrackIds: TrackId[]
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
          <Text fw={700} size="sm"></Text>
        </Group>
      </StaticTimelineLabel>
      <StaticTimelineLabel height={viewport.sectionLaneHeight} opacity={focusedBlockId === undefined ? 1 : 0.4}>
        <Text c="dimmed" size="xs">Track</Text>
      </StaticTimelineLabel>
      {tracks.map(track => (
        <TimelineTrackLabel
          key={track.id}
          hovered={hoveredTrackId === track.id}
          selected={selectedTrackIds.includes(track.id)}
          track={track}
          viewport={viewport}
          onClick={event => onClickTrackLabel(event, track.id)}
          onSetHoveredTrack={onSetHoveredTrack}
        />
      ))}
    </Box>
  )
})

const TimelineTrackLabel = memo(function TimelineTrackLabel({
  hovered,
  onClick,
  onSetHoveredTrack,
  selected,
  track,
  viewport,
}: {
  hovered: boolean
  onClick: (event: ReactMouseEvent<HTMLDivElement>) => void
  onSetHoveredTrack: (trackId: TrackId | undefined) => void
  selected: boolean
  track: Track
  viewport: ViewportState
}) {
  return (
    <StaticTimelineLabel
      height={viewport.laneHeight}
      hovered={hovered}
      selected={selected}
      tintColor={track.color}
      onClick={onClick}
      onMouseEnter={() => onSetHoveredTrack(track.id)}
      onMouseLeave={() => onSetHoveredTrack(undefined)}
    >
      <Stack gap={1}>
        <Text fw={600} size="sm" truncate>{track.name}</Text>
        <Group gap={4}>
          <Badge size="xs" variant="light">{track.role}</Badge>
        </Group>
      </Stack>
    </StaticTimelineLabel>
  )
})

const TimelineInstrumentColumn = memo(function TimelineInstrumentColumn({
  hoveredInstrumentId,
  onClick: onClickInstrument,
  onSetHoveredInstrument,
  selectedInstrumentIds,
  tracks,
  viewport,
  workspace,
}: {
  hoveredInstrumentId?: InstrumentId
  onClick: (event: ReactMouseEvent<HTMLDivElement>, instrumentId: InstrumentId) => void
  onSetHoveredInstrument: (instrumentId: InstrumentId | undefined) => void
  selectedInstrumentIds: InstrumentId[]
  tracks: Track[]
  viewport: ViewportState
  workspace: Workspace
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
        <Text fw={700} size="sm"></Text>
      </StaticTimelineLabel>
      <StaticTimelineLabel height={viewport.sectionLaneHeight}>
        <Text c="dimmed" size="xs">Instrument</Text>
      </StaticTimelineLabel>
      {tracks.map((track) => {
        const instrument = selectInstrument(workspace, track.instrumentId)

        if (instrument === undefined) {
          return (
            <StaticTimelineLabel
              key={`missing:${track.id}`}
              height={viewport.laneHeight}
              tintColor={track.color}
            />
          )
        }

        return (
          <StaticTimelineLabel
            key={`${track.id}:${instrument.id}`}
            height={viewport.laneHeight}
            hovered={hoveredInstrumentId === instrument.id}
            selected={selectedInstrumentIds.includes(instrument.id)}
            tintColor={track.color}
            onClick={event => onClickInstrument(event, instrument.id)}
            onMouseEnter={() => onSetHoveredInstrument(instrument.id)}
            onMouseLeave={() => onSetHoveredInstrument(undefined)}
          >
            <Stack gap={1}>
              <Text fw={600} size="sm" truncate>{instrument.name}</Text>
              <Group gap={4}>
                <Badge size="xs" variant="light">{instrument.kind}</Badge>
              </Group>
            </Stack>
          </StaticTimelineLabel>
        )
      })}
    </Box>
  )
})

const TimelineMixChannelColumn = memo(function TimelineMixChannelColumn({
  hoveredMixChannelId,
  onClick: onClickMixChannel,
  onClickMute,
  onClickSolo,
  onSetHoveredMixChannel,
  selectedMixChannelIds,
  tracks,
  viewport,
  workspace,
}: {
  hoveredMixChannelId?: MixChannelId
  onClick: (event: ReactMouseEvent<HTMLDivElement>, mixChannelId: MixChannelId) => void
  onClickMute: (event: ReactMouseEvent<HTMLButtonElement>, mixChannel: MixChannel) => void
  onClickSolo: (event: ReactMouseEvent<HTMLButtonElement>, mixChannel: MixChannel) => void
  onSetHoveredMixChannel: (mixChannelId: MixChannelId | undefined) => void
  selectedMixChannelIds: MixChannelId[]
  tracks: Track[]
  viewport: ViewportState
  workspace: Workspace
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
        <Text fw={700} size="sm"></Text>
      </StaticTimelineLabel>
      <StaticTimelineLabel height={viewport.sectionLaneHeight}>
        <Text c="dimmed" size="xs">Mix</Text>
      </StaticTimelineLabel>
      {tracks.map((track) => {
        const mixChannel = selectMixChannel(workspace, track.mixChannelId)

        if (mixChannel === undefined) {
          return (
            <StaticTimelineLabel
              key={`missing:${track.id}`}
              height={viewport.laneHeight}
              tintColor={track.color}
            />
          )
        }

        return (
          <StaticTimelineLabel
            key={mixChannel.id}
            height={viewport.laneHeight}
            hovered={hoveredMixChannelId === mixChannel.id}
            selected={selectedMixChannelIds.includes(mixChannel.id)}
            tintColor={track.color}
            onClick={event => onClickMixChannel(event, mixChannel.id)}
            onMouseEnter={() => onSetHoveredMixChannel(mixChannel.id)}
            onMouseLeave={() => onSetHoveredMixChannel(undefined)}
          >
            <Group gap={4} wrap="nowrap">
              <ActionIcon
                aria-label={`Mute ${track.name}`}
                aria-pressed={mixChannel.muted}
                color={mixChannel.muted ? 'red' : 'gray'}
                size="sm"
                variant={mixChannel.muted ? 'filled' : 'light'}
                onClick={event => onClickMute(event, mixChannel)}
              >
                <Text size="xs">M</Text>
              </ActionIcon>
              <ActionIcon
                aria-label={`Solo ${track.name}`}
                aria-pressed={mixChannel.soloed}
                color={mixChannel.soloed ? 'green' : 'gray'}
                size="sm"
                variant={mixChannel.soloed ? 'filled' : 'light'}
                onClick={event => onClickSolo(event, mixChannel)}
              >
                <Text size="xs">S</Text>
              </ActionIcon>
            </Group>
          </StaticTimelineLabel>
        )
      })}
    </Box>
  )
})

const StaticTimelineLabel = memo(function StaticTimelineLabel({
  children,
  height,
  hovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  opacity = 1,
  selected = false,
  tintColor,
}: {
  children?: ReactNode
  height: number
  hovered?: boolean
  onClick?: (event: ReactMouseEvent<HTMLDivElement>) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  opacity?: number
  selected?: boolean
  tintColor?: string
}) {
  return (
    <Box
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        alignItems: 'center',
        background: getTrackTint(tintColor, 20),
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        boxShadow: selected && hovered
          ? `${SELECTED_STYLES.shadow}, ${HOVER_BOX_SHADOWS.label}`
          : selected
            ? SELECTED_STYLES.shadow
            : hovered
              ? HOVER_BOX_SHADOWS.label
              : undefined,
        cursor: onClick === undefined ? undefined : 'pointer',
        display: 'flex',
        height,
        opacity,
        paddingInline: 9,
      }}
    >
      {children}
    </Box>
  )
})

const TimelineRuler = memo(function TimelineRuler({
  drag,
  hoveredTimelineEventId,
  marks,
  onMarkerPointerDown,
  onRulerPointerDown,
  onMarkerPointerEnter,
  selectedTimelineEventIds,
  timelineWidth,
  viewport,
  workspace,
}: {
  drag?: DragState
  hoveredTimelineEventId?: TimelineEventId
  marks: RulerMark[]
  onMarkerPointerDown: (event: ReactPointerEvent<HTMLDivElement>, timelineEvent: TimelineEvent) => void
  onRulerPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onMarkerPointerEnter: (timelineEventId: TimelineEventId | undefined) => void
  selectedTimelineEventIds: TimelineEventId[]
  timelineWidth: number
  viewport: ViewportState
  workspace: Workspace
}) {
  const timelineEvents = selectTimelineEvents(workspace)
  const timelineEventPlaceholder = useTimelineEventOverlay(drag)

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
            left: tickToX(viewport.pixelsPerTick, mark.tick),
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

      {timelineEvents.map((timelineEvent) => {
        return (
          <TimelineEventMarker
            key={timelineEvent.id}
            color={getTimelineEventMarkerColor(timelineEvent)}
            icon={getTimelineEventMarkerIcon(timelineEvent)}
            isHovered={hoveredTimelineEventId === timelineEvent.id}
            isSelected={selectedTimelineEventIds.includes(timelineEvent.id)}
            label={getTimelineEventMarkerLabel(timelineEvent)}
            left={tickToX(viewport.pixelsPerTick, timelineEvent.tick)}
            top={getTimelineEventMarkerTop(timelineEvent)}
            onMouseEnter={() => onMarkerPointerEnter(timelineEvent.id)}
            onMouseLeave={() => onMarkerPointerEnter(undefined)}
            onPointerDown={pointerEvent => onMarkerPointerDown(pointerEvent, timelineEvent)}
          />
        )
      })}
      {timelineEventPlaceholder !== undefined && (
        <TimelineEventMarker
          color={getTimelineEventMarkerColor(timelineEventPlaceholder)}
          icon={getTimelineEventMarkerIcon(timelineEventPlaceholder)}
          isPlaceholder
          isHovered={false}
          isSelected={false}
          label={getTimelineEventMarkerLabel(timelineEventPlaceholder)}
          left={tickToX(viewport.pixelsPerTick, timelineEventPlaceholder.tick)}
          top={getTimelineEventMarkerTop(timelineEventPlaceholder)}
        />
      )}
    </Box>
  )
})

const TimelineEventMarker = memo(function TimelineEventMarker({
  color,
  icon,
  isHovered,
  isSelected,
  isPlaceholder = false,
  label,
  left,
  top,
  onMouseEnter,
  onMouseLeave,
  onPointerDown,
}: {
  color: string
  icon: typeof TimeSetting01Icon
  isHovered: boolean
  isPlaceholder?: boolean
  isSelected: boolean
  label: string
  left: number
  top: number
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  return (
    <Box
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      style={{
        alignItems: 'center',
        cursor: 'grab',
        display: 'flex',
        height: 26,
        left: Math.max(-2, left - 3),
        minWidth: 42,
        opacity: isPlaceholder ? 0.52 : 1,
        padding: 3,
        pointerEvents: isPlaceholder ? 'none' : undefined,
        position: 'absolute',
        top: Math.max(0, top - 3),
        zIndex: isSelected ? 8 : isPlaceholder ? 7 : 5,
        userSelect: 'none',
      }}
    >
      <Box
        style={{
          alignItems: 'center',
          background: `var(--mantine-color-${color}-0)`,
          border: `1px ${isPlaceholder ? 'dashed' : 'solid'} var(--mantine-color-${color}-5)`,
          borderRadius: 4,
          boxShadow: isHovered && !isSelected ? HOVER_BOX_SHADOWS.marker : undefined,
          color: `var(--mantine-color-${color}-9)`,
          display: 'flex',
          gap: 3,
          height: 20,
          minWidth: 34,
          outline: isSelected ? SELECTED_STYLES.outline : undefined,
          paddingInline: 4,
        }}
      >
        <HugeiconsIcon icon={icon} size={12} />
        <Text fw={700} size="10px">{label}</Text>
      </Box>
    </Box>
  )
})

const TimelineGridLines = memo(function TimelineGridLines({
  height,
  marks,
  timelineWidth,
  viewport,
}: {
  height: number
  marks: RulerMark[]
  timelineWidth: number
  viewport: ViewportState
}) {
  if (height <= 0) {
    return null
  }

  return (
    <svg
      aria-hidden
      height={height}
      shapeRendering="crispEdges"
      viewBox={`0 0 ${timelineWidth} ${height}`}
      width={timelineWidth}
      style={{
        left: 0,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        zIndex: 0,
      }}
    >
      {(['bar', 'beat', 'subdivision'] as const).map(kind => (
        <path
          key={kind}
          d={getTimelineGridPath(marks, kind, viewport.pixelsPerTick, height)}
          fill="none"
          opacity={getGridLineOpacity(kind)}
          stroke={getGridLineColor(kind)}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
})

const SectionLane = memo(function SectionLane({
  drag,
  focusedBlockId,
  hoveredSectionId,
  marks,
  onEmptyDoubleClick,
  onPointerDown,
  onResizePointerDown,
  onSectionPointerDown,
  onSetHoveredSection,
  selectedSectionIds,
  timelineWidth,
  viewport,
  workspace,
}: {
  drag?: DragState
  focusedBlockId?: string
  hoveredSectionId?: SectionId
  marks: RulerMark[]
  onEmptyDoubleClick: () => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>, section: Section, edge: 'left' | 'right') => void
  onSectionPointerDown: (event: ReactPointerEvent<HTMLDivElement>, section: Section) => void
  onSetHoveredSection: (sectionId: SectionId | undefined) => void
  selectedSectionIds: string[]
  timelineWidth: number
  viewport: ViewportState
  workspace: Workspace
}) {
  const {
    drawRange,
    sectionPlaceholders,
    selectionRange,
  } = useSectionLaneOverlay(drag)

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
      <TimelineGridLines
        height={viewport.sectionLaneHeight}
        marks={marks}
        timelineWidth={timelineWidth}
        viewport={viewport}
      />
      {workspace.arrangement.sections.map(section => (
        <Box
          key={section.id}
          onMouseEnter={() => onSetHoveredSection(section.id)}
          onMouseLeave={() => onSetHoveredSection(undefined)}
          onPointerDown={event => onSectionPointerDown(event, section)}
          title={`${section.name}: ${formatTickRangeAsBars(workspace.timeline, section.startTick, getSectionEndTick(section))}`}
          style={{
            alignItems: 'center',
            background: 'var(--mantine-color-gray-1)',
            border: '1px solid var(--mantine-color-gray-4)',
            borderRadius: 4,
            boxShadow: hoveredSectionId === section.id ? HOVER_BOX_SHADOWS.entity : undefined,
            cursor: 'grab',
            display: 'flex',
            height: 28,
            left: tickToX(viewport.pixelsPerTick, section.startTick),
            outline: selectedSectionIds.includes(section.id) ? SELECTED_STYLES.outline : undefined,
            overflow: 'hidden',
            paddingInline: 7,
            position: 'absolute',
            top: 8,
            width: Math.max(MIN_SECTION_WIDTH, tickToX(viewport.pixelsPerTick, section.lengthTicks)),
            userSelect: 'none',
          }}
        >
          <ResizeHandle edge="left" onPointerDown={event => onResizePointerDown(event, section, 'left')} />
          <Text fw={700} size="xs" truncate>{section.name}</Text>
          <ResizeHandle edge="right" onPointerDown={event => onResizePointerDown(event, section, 'right')} />
        </Box>
      ))}
      {drawRange !== undefined && (
        <TickRangeOverlay
          color="gray"
          startTick={drawRange.startTick}
          endTick={drawRange.endTick}
          viewport={viewport}
        />
      )}
      {selectionRange !== undefined && (
        <TickRangeOverlay
          color="yellow"
          startTick={selectionRange.startTick}
          endTick={selectionRange.endTick}
          viewport={viewport}
        />
      )}
      {sectionPlaceholders.map(section => (
        <EntityPlaceholder
          key={`section-placeholder:${section.id}`}
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
})

const TrackLane = memo(function TrackLane({
  drag,
  focusedBlockId,
  hoveredBlockId,
  onBlockDoubleClick,
  onBlockPointerDown,
  onBlockResizePointerDown,
  onEmptyDoubleClick,
  onPatternClick,
  onPatternEventClick,
  onPointerDown,
  onSetHoveredBlock,
  selectedBlockIds,
  selectedPatternEventIds,
  selectedPatternIds,
  timelineWidth,
  track,
  viewport,
  workspace,
}: {
  drag?: DragState
  focusedBlockId?: string
  hoveredBlockId?: string
  onBlockDoubleClick: (blockId: string) => void
  onBlockPointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block) => void
  onBlockResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block, edge: 'left' | 'right') => void
  onEmptyDoubleClick: () => void
  onPatternClick: (event: ReactMouseEvent<HTMLButtonElement>, patternId: PatternId) => void
  onPatternEventClick: (event: ReactMouseEvent<HTMLButtonElement>, patternEventId: PatternEventId) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, trackId: string) => void
  onSetHoveredBlock: (blockId: string | undefined) => void
  selectedBlockIds: string[]
  selectedPatternEventIds: PatternEventId[]
  selectedPatternIds: PatternId[]
  timelineWidth: number
  track: Track
  viewport: ViewportState
  workspace: Workspace
}) {
  const blocks = useMemo(
    () => selectBlocksForTrack(workspace, track.id),
    [workspace, track.id],
  )
  const stackedBlocks = useBlockStack(
    blocks,
    viewport.laneHeight - BLOCK_TOP - BLOCK_HEIGHT,
  )

  const {
    blockPlaceholders,
    drawRange,
    selectionRange,
  } = useTrackLaneOverlay(drag, workspace, track.id)

  return (
    <Box
      onDoubleClick={onEmptyDoubleClick}
      onPointerDown={event => onPointerDown(event, track.id)}
      style={{
        background: getTrackTint(track.color, 10),
        borderBottom: '1px solid var(--mantine-color-gray-3)',
        height: viewport.laneHeight,
        position: 'relative',
        width: timelineWidth,
      }}
    >
      {stackedBlocks.map(({ block, offset, zIndex }) => (
        <BlockView
          key={block.id}
          block={block}
          focusedBlockId={focusedBlockId}
          hovered={hoveredBlockId === block.id}
          selected={selectedBlockIds.includes(block.id)}
          selectedPatternEventIds={selectedPatternEventIds}
          selectedPatternIds={selectedPatternIds}
          top={BLOCK_TOP + offset}
          viewport={viewport}
          workspace={workspace}
          zIndex={zIndex}
          onDoubleClick={onBlockDoubleClick}
          onPointerDown={onBlockPointerDown}
          onPatternClick={onPatternClick}
          onPatternEventClick={onPatternEventClick}
          onResizePointerDown={onBlockResizePointerDown}
          onSetHoveredBlock={onSetHoveredBlock}
        />
      ))}
      {drawRange !== undefined && (
        <TickRangeOverlay
          color="blue"
          startTick={drawRange.startTick}
          endTick={drawRange.endTick}
          viewport={viewport}
        />
      )}
      {selectionRange !== undefined && (
        <TickRangeOverlay
          color="yellow"
          startTick={selectionRange.startTick}
          endTick={selectionRange.endTick}
          viewport={viewport}
        />
      )}
      {blockPlaceholders.map(block => (
        <EntityPlaceholder
          key={`block-placeholder:${block.id}:${block.trackId}`}
          color="yellow"
          height={BLOCK_HEIGHT}
          label={block.name}
          lengthTicks={block.lengthTicks}
          startTick={block.startTick}
          top={BLOCK_TOP}
          viewport={viewport}
        />
      ))}
    </Box>
  )
})

const BlockView = memo(function BlockView({
  block,
  focusedBlockId,
  hovered,
  onDoubleClick,
  onPatternClick,
  onPatternEventClick,
  onPointerDown,
  onResizePointerDown,
  onSetHoveredBlock,
  selected,
  selectedPatternEventIds,
  selectedPatternIds,
  top,
  viewport,
  workspace,
  zIndex,
}: {
  block: Block
  focusedBlockId?: string
  hovered: boolean
  onDoubleClick: (blockId: string) => void
  onPatternClick: (event: ReactMouseEvent<HTMLButtonElement>, patternId: PatternId) => void
  onPatternEventClick: (event: ReactMouseEvent<HTMLButtonElement>, patternEventId: PatternEventId) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block) => void
  onResizePointerDown: (event: ReactPointerEvent<HTMLDivElement>, block: Block, edge: 'left' | 'right') => void
  onSetHoveredBlock: (blockId: string | undefined) => void
  selected: boolean
  selectedPatternEventIds: PatternEventId[]
  selectedPatternIds: PatternId[]
  top: number
  viewport: ViewportState
  workspace: Workspace
  zIndex: number
}) {
  const isFocused = focusedBlockId === block.id
  const dimmedByFocus = focusedBlockId !== undefined && !isFocused

  const pattern = useMemo(
    () => selectPattern(workspace, block.patternId),
    [block.patternId, workspace],
  )

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
        boxShadow: isFocused ? '0 0 0 2px var(--mantine-color-yellow-5)' : hovered ? HOVER_BOX_SHADOWS.entity : undefined,
        color: 'white',
        cursor: 'grab',
        height: isFocused ? viewport.laneHeight : BLOCK_HEIGHT,
        left: tickToX(viewport.pixelsPerTick, block.startTick),
        opacity: dimmedByFocus ? 0.22 : block.muted ? 0.58 : 0.96,
        outline: selected ? SELECTED_STYLES.outline : undefined,
        overflow: 'hidden',
        padding: '5px 8px',
        position: 'absolute',
        top: isFocused ? 0 : top,
        width: Math.max(MIN_BLOCK_WIDTH, tickToX(viewport.pixelsPerTick, block.lengthTicks)),
        zIndex: isFocused ? 7 : zIndex,
        userSelect: 'none',
      }}
    >
      <ResizeHandle edge="left" onPointerDown={event => onResizePointerDown(event, block, 'left')} />
      <Group justify="space-between" gap={6} wrap="nowrap">
        <Box style={{ minWidth: 0 }}>
          <Text fw={800} size="xs" truncate>{block.name}</Text>
        </Box>
        <Badge color={block.muted ? 'gray' : 'dark'} size="xs" variant="filled">
          {block.playbackMode}
        </Badge>
      </Group>
      <ResizeHandle edge="right" onPointerDown={event => onResizePointerDown(event, block, 'right')} />
      {focusedBlockId === block.id && (
        <FocusedBlockOverlay
          block={block}
          pattern={pattern}
          selectedPatternEventIds={selectedPatternEventIds}
          selectedPatternIds={selectedPatternIds}
          onPatternClick={onPatternClick}
          onPatternEventClick={onPatternEventClick}
        />
      )}
    </Box>
  )
})

const FocusedBlockOverlay = memo(function FocusedBlockOverlay({
  block,
  onPatternClick,
  onPatternEventClick,
  pattern,
  selectedPatternEventIds,
  selectedPatternIds,
}: {
  block: Block
  onPatternClick: (event: ReactMouseEvent<HTMLButtonElement>, patternId: PatternId) => void
  onPatternEventClick: (event: ReactMouseEvent<HTMLButtonElement>, patternEventId: PatternEventId) => void
  pattern?: Pattern
  selectedPatternEventIds: PatternEventId[]
  selectedPatternIds: PatternId[]
}) {
  const patternInstanceCount = useMemo(() => {
    if (pattern === undefined) {
      return 0
    }

    return block.playbackMode === 'loop'
      ? Math.ceil(block.lengthTicks / pattern.lengthTicks)
      : 1
  }, [block, pattern])

  const patternInstanceWidthPercent = useMemo(() => {
    return pattern === undefined || block.playbackMode === 'stretch'
      ? 100
      : pattern.lengthTicks / block.lengthTicks * 100
  }, [block, pattern])

  return (
    <Box
      style={{
        background: 'rgba(255, 255, 255, 0.14)',
        borderRadius: 4,
        bottom: 6,
        left: 6,
        overflow: 'hidden',
        position: 'absolute',
        right: 6,
        top: 25,
      }}
    >
      {pattern !== undefined && Array.from({ length: patternInstanceCount }, (_, instanceIndex) => (
        <Box
          key={instanceIndex}
          style={{
            borderRadius: 3,
            bottom: 0,
            left: `${instanceIndex * patternInstanceWidthPercent}%`,
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            width: `${patternInstanceWidthPercent}%`,
          }}
        >
          <Box
            aria-label={`Select pattern ${pattern.id}`}
            aria-pressed={selectedPatternIds.includes(pattern.id)}
            component="button"
            type="button"
            onClick={event => onPatternClick(event, pattern.id)}
            onPointerDown={event => event.stopPropagation()}
            style={{
              background: 'var(--mantine-color-gray-4)',
              border: selectedPatternIds.includes(pattern.id)
                ? SELECTED_STYLES.border
                : 'none',
              borderRadius: 3,
              cursor: 'pointer',
              inset: 0,
              position: 'absolute',
              zIndex: 1,
            }}
          />
          {pattern.events.map((patternEvent) => {
            const durationTicks = patternEvent.kind === 'chord' || patternEvent.kind === 'note'
              ? patternEvent.durationTicks
              : 0
            const leftPercent = patternEvent.timeTick / pattern.lengthTicks * 100
            const widthPercent = durationTicks / pattern.lengthTicks * 100
            const pitchClass = getPatternEventPitchClass(patternEvent)
            const topPercent = pitchClass === undefined
              ? 50
              : (PITCH_CLASSES.length - pitchClass - 0.5) / PITCH_CLASSES.length * 100
            const selected = selectedPatternEventIds.includes(patternEvent.id)

            return (
              <Box
                key={patternEvent.id}
                aria-label={`Select ${patternEvent.kind} pattern event ${patternEvent.id}`}
                aria-pressed={selected}
                component="button"
                type="button"
                onClick={event => onPatternEventClick(event, patternEvent.id)}
                onPointerDown={event => event.stopPropagation()}
                style={{
                  background: getPatternEventColor(patternEvent),
                  border: selected
                    ? SELECTED_STYLES.border
                    : 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  height: 5,
                  left: `${leftPercent}%`,
                  minWidth: 10,
                  position: 'absolute',
                  top: `${topPercent}%`,
                  transform: 'translateY(-50%)',
                  width: durationTicks === 0 ? 10 : `max(10px, ${widthPercent}%)`,
                  zIndex: 2,
                }}
                title={`${patternEvent.kind}: ${patternEvent.id}`}
              />
            )
          })}
        </Box>
      ))}
    </Box>
  )
})

const InspectorPanel = memo(function InspectorPanel({
  commandHistory,
  draft,
  onDeleteSelected,
  onUpdateBlock,
  onUpdateInstrument,
  onUpdateMixChannel,
  onUpdatePattern,
  onUpdatePatternEvent,
  onUpdateSection,
  onUpdateTimelineEvent,
  onUpdateTrack,
  patterns,
  selectedBlock,
  selectedInstrument,
  selectedMixChannel,
  selectedPattern,
  selectedPatternEvent,
  selectedSection,
  selectedTimelineEvent,
  selectedTrack,
  selection,
  setDraft,
  workspace,
  workspaceErrors,
}: {
  commandHistory: CommandHistoryEntry[]
  draft: InspectorDraft
  onDeleteSelected: () => void
  onUpdateBlock: () => void
  onUpdateInstrument: () => void
  onUpdateMixChannel: () => void
  onUpdatePattern: () => void
  onUpdatePatternEvent: () => void
  onUpdateSection: () => void
  onUpdateTimelineEvent: () => void
  onUpdateTrack: () => void
  patterns: ReturnType<typeof selectPatterns>
  selectedBlock?: Block
  selectedInstrument?: Instrument
  selectedMixChannel?: MixChannel
  selectedPattern?: Pattern
  selectedPatternEvent?: PatternEvent
  selectedSection?: Section
  selectedTimelineEvent?: TimelineEvent
  selectedTrack?: Track
  selection: SelectionState
  setDraft: (updater: (draft: InspectorDraft) => InspectorDraft) => void
  workspace: Workspace
  workspaceErrors: string[]
}) {
  const updateInstrumentSynthEnvelopeDraft = (
    property: keyof NonNullable<InspectorDraft['instrumentSynthEnvelope']>,
    value: number,
  ) => {
    setDraft((currentDraft) => {
      if (currentDraft.instrumentSynthEnvelope === undefined) {
        return currentDraft
      }

      return {
        ...currentDraft,
        instrumentSynthEnvelope: {
          ...currentDraft.instrumentSynthEnvelope,
          [property]: value,
        },
      }
    })
  }

  const updateInstrumentSynthOscillatorDraft = (
    oscillatorIndex: number,
    update: (oscillator: SynthOscillator) => SynthOscillator,
  ) => {
    setDraft((currentDraft) => {
      if (currentDraft.instrumentSynthOscillators === undefined) {
        return currentDraft
      }

      return {
        ...currentDraft,
        instrumentSynthOscillators: currentDraft.instrumentSynthOscillators.map(
          (oscillator, index) => index === oscillatorIndex
            ? update(oscillator)
            : oscillator,
        ),
      }
    })
  }

  const addInstrumentSynthOscillatorDraft = () => {
    setDraft(currentDraft => ({
      ...currentDraft,
      instrumentSynthOscillators: [
        ...(currentDraft.instrumentSynthOscillators ?? []),
        createSynthOscillator(),
      ],
    }))
  }

  const removeInstrumentSynthOscillatorDraft = (oscillatorIndex: number) => {
    setDraft(currentDraft => ({
      ...currentDraft,
      instrumentSynthOscillators: currentDraft.instrumentSynthOscillators?.filter(
        (_oscillator, index) => index !== oscillatorIndex,
      ),
    }))
  }

  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} size="h3">Inspector</Title>
          <Badge color="gray" variant="light">
            {selection.selectedBlockIds.length
              + selection.selectedInstrumentIds.length
              + selection.selectedMixChannelIds.length
              + selection.selectedPatternIds.length
              + selection.selectedPatternEventIds.length
              + selection.selectedSectionIds.length
              + selection.selectedTimelineEventIds.length
              + selection.selectedTrackIds.length}
            {' '}
            selected
          </Badge>
        </Group>

        {selectedTrack !== undefined && (
          <Stack gap="sm">
            <Text fw={700} size="sm">Track</Text>
            <InspectorDataList
              items={[
                ['ID', selectedTrack.id],
                ['Mix channel ID', selectedTrack.mixChannelId],
                ['Instrument sound ID', selectedTrack.instrumentId],
              ]}
            />
            <TextInput
              label="Name"
              size="xs"
              value={draft.trackName}
              onChange={(event) => {
                const { value } = event.currentTarget

                setDraft(currentDraft => ({ ...currentDraft, trackName: value }))
              }}
            />
            <Select
              allowDeselect={false}
              data={TRACK_ROLES.map(value => ({ label: value, value }))}
              label="Role"
              size="xs"
              value={draft.trackRole}
              onChange={value => setDraft(currentDraft => ({
                ...currentDraft,
                trackRole: (value ?? currentDraft.trackRole) as TrackRole,
              }))}
            />
            <MultiSelect
              data={PATTERN_KINDS.map(value => ({ label: value, value }))}
              label="Accepts"
              size="xs"
              value={draft.trackAccepts}
              onChange={value => setDraft(currentDraft => ({
                ...currentDraft,
                trackAccepts: value as PatternKind[],
              }))}
            />
            <Stack gap={6}>
              <Text fw={500} size="xs">Color</Text>
              <Group gap="sm">
                {TRACK_COLOR_PALETTE.map(color => (
                  <ColorSwatch
                    key={color}
                    aria-label={`Set track color to ${color}`}
                    aria-pressed={draft.trackColor === color}
                    color={color}
                    component="button"
                    size={34}
                    type="button"
                    onClick={() => setDraft(currentDraft => ({ ...currentDraft, trackColor: color }))}
                    style={{
                      border: 0,
                      cursor: 'pointer',
                      outline: draft.trackColor === color ? '2px solid var(--mantine-color-gray-8)' : undefined,
                      outlineOffset: 2,
                    }}
                  />
                ))}
              </Group>
            </Stack>
            <Button size="xs" onClick={onUpdateTrack}>Apply Track</Button>
          </Stack>
        )}

        {selectedInstrument !== undefined && (
          <Stack gap="sm">
            <Text fw={700} size="sm">Instrument</Text>
            <InspectorDataList
              items={[
                ['ID', selectedInstrument.id],
                ['Kind', selectedInstrument.kind],
              ]}
            />
            <TextInput
              label="Name"
              size="xs"
              value={draft.instrumentName}
              onChange={(event) => {
                const { value } = event.currentTarget

                setDraft(currentDraft => ({ ...currentDraft, instrumentName: value }))
              }}
            />
            {selectedInstrument.kind === 'thor' && (
              <Paper withBorder radius="sm" p="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600} size="xs">Oscillators</Text>
                    <Button
                      size="xs"
                      variant="light"
                      onClick={addInstrumentSynthOscillatorDraft}
                    >
                      Add oscillator
                    </Button>
                  </Group>
                  {draft.instrumentSynthOscillators?.map((oscillator, oscillatorIndex) => (
                    <Paper key={oscillatorIndex} withBorder radius="sm" p="sm">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text fw={500} size="xs">{`Oscillator ${oscillatorIndex + 1}`}</Text>
                          <ActionIcon
                            aria-label={`Remove oscillator ${oscillatorIndex + 1}`}
                            color="red"
                            size="sm"
                            variant="light"
                            onClick={() => removeInstrumentSynthOscillatorDraft(oscillatorIndex)}
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={14} />
                          </ActionIcon>
                        </Group>
                        <Select
                          allowDeselect={false}
                          data={SYNTH_OSCILLATOR_WAVEFORMS.map(value => ({ label: value, value }))}
                          label="Waveform"
                          size="xs"
                          value={oscillator.waveform}
                          onChange={(value) => {
                            const waveform = SYNTH_OSCILLATOR_WAVEFORMS.find(
                              candidate => candidate === value,
                            )

                            if (waveform !== undefined) {
                              updateInstrumentSynthOscillatorDraft(
                                oscillatorIndex,
                                currentOscillator => ({
                                  ...currentOscillator,
                                  waveform,
                                }),
                              )
                            }
                          }}
                        />
                        <SimpleGrid cols={2} spacing="sm">
                          <NumberInput
                            allowDecimal={false}
                            label="Octave"
                            size="xs"
                            value={oscillator.octave}
                            onChange={value => updateInstrumentSynthOscillatorDraft(
                              oscillatorIndex,
                              currentOscillator => ({
                                ...currentOscillator,
                                octave: parseNumber(
                                  value.toString(),
                                  currentOscillator.octave,
                                ),
                              }),
                            )}
                          />
                          <NumberInput
                            allowDecimal={false}
                            label="Semitone"
                            size="xs"
                            value={oscillator.semitone}
                            onChange={value => updateInstrumentSynthOscillatorDraft(
                              oscillatorIndex,
                              currentOscillator => ({
                                ...currentOscillator,
                                semitone: parseNumber(
                                  value.toString(),
                                  currentOscillator.semitone,
                                ),
                              }),
                            )}
                          />
                          <NumberInput
                            label="Detune (cents)"
                            size="xs"
                            value={oscillator.detuneCents}
                            onChange={value => updateInstrumentSynthOscillatorDraft(
                              oscillatorIndex,
                              currentOscillator => ({
                                ...currentOscillator,
                                detuneCents: parseNumber(
                                  value.toString(),
                                  currentOscillator.detuneCents,
                                ),
                              }),
                            )}
                          />
                          <NumberInput
                            decimalScale={2}
                            label="Level"
                            min={0}
                            size="xs"
                            step={0.05}
                            value={oscillator.level}
                            onChange={value => updateInstrumentSynthOscillatorDraft(
                              oscillatorIndex,
                              currentOscillator => ({
                                ...currentOscillator,
                                level: parseNumber(
                                  value.toString(),
                                  currentOscillator.level,
                                ),
                              }),
                            )}
                          />
                        </SimpleGrid>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}
            {selectedInstrument.kind === 'thor' && (
              <Paper withBorder radius="sm" p="md">
                <Stack gap="md">
                  <Text fw={600} size="xs">Envelope</Text>
                  <SimpleGrid cols={2} spacing="md">
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Text size="xs">Attack</Text>
                        <Text c="dimmed" size="xs">{draft.instrumentSynthEnvelope?.attack}</Text>
                      </Group>
                      <Slider
                        aria-label="Attack"
                        label={null}
                        max={MAX_SYNTH_ENVELOPE_VALUE}
                        min={0}
                        step={0.1}
                        value={draft.instrumentSynthEnvelope?.attack}
                        onChange={value => updateInstrumentSynthEnvelopeDraft('attack', value)}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Text size="xs">Decay</Text>
                        <Text c="dimmed" size="xs">{draft.instrumentSynthEnvelope?.decay}</Text>
                      </Group>
                      <Slider
                        aria-label="Decay"
                        label={null}
                        max={MAX_SYNTH_ENVELOPE_VALUE}
                        min={0}
                        step={0.1}
                        value={draft.instrumentSynthEnvelope?.decay}
                        onChange={value => updateInstrumentSynthEnvelopeDraft('decay', value)}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Text size="xs">Sustain</Text>
                        <Text c="dimmed" size="xs">{draft.instrumentSynthEnvelope?.sustain}</Text>
                      </Group>
                      <Slider
                        aria-label="Sustain"
                        label={null}
                        max={MAX_SYNTH_ENVELOPE_VALUE}
                        min={0}
                        step={0.1}
                        value={draft.instrumentSynthEnvelope?.sustain}
                        onChange={value => updateInstrumentSynthEnvelopeDraft('sustain', value)}
                      />
                    </Stack>
                    <Stack gap={4}>
                      <Group justify="space-between">
                        <Text size="xs">Release</Text>
                        <Text c="dimmed" size="xs">{draft.instrumentSynthEnvelope?.release}</Text>
                      </Group>
                      <Slider
                        aria-label="Release"
                        label={null}
                        max={MAX_SYNTH_ENVELOPE_VALUE}
                        min={0}
                        step={0.1}
                        value={draft.instrumentSynthEnvelope?.release}
                        onChange={value => updateInstrumentSynthEnvelopeDraft('release', value)}
                      />
                    </Stack>
                  </SimpleGrid>
                </Stack>
              </Paper>
            )}
            <Button size="xs" onClick={onUpdateInstrument}>Apply Instrument</Button>
          </Stack>
        )}

        {selectedMixChannel !== undefined && (
          <Stack gap="sm">
            <Text fw={700} size="sm">Mix Channel</Text>
            <InspectorDataList
              items={[
                ['ID', selectedMixChannel.id],
              ]}
            />
            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <Switch
                  checked={draft.mixChannelMuted}
                  label="Muted"
                  size="xs"
                  onChange={(event) => {
                    const { checked } = event.currentTarget

                    setDraft(currentDraft => ({ ...currentDraft, mixChannelMuted: checked }))
                  }}
                />
                <Switch
                  checked={draft.mixChannelSoloed}
                  label="Soloed"
                  size="xs"
                  onChange={(event) => {
                    const { checked } = event.currentTarget

                    setDraft(currentDraft => ({ ...currentDraft, mixChannelSoloed: checked }))
                  }}
                />
                <Group gap="xl" justify="center" wrap="nowrap">
                  <Stack align="center" gap={6}>
                    <Text fw={500} size="xs">Volume</Text>
                    <AngleSlider
                      aria-label="Volume"
                      formatLabel={() => `${draft.mixChannelVolumeDb} dB`}
                      size={88}
                      step={5}
                      value={valueToAngle(
                        draft.mixChannelVolumeDb,
                        MIN_MIX_CHANNEL_VOLUME_DB,
                        MAX_MIX_CHANNEL_VOLUME_DB,
                      )}
                      onChange={value => setDraft(currentDraft => ({
                        ...currentDraft,
                        mixChannelVolumeDb: angleToValue(
                          value,
                          MIN_MIX_CHANNEL_VOLUME_DB,
                          MAX_MIX_CHANNEL_VOLUME_DB,
                          0,
                        ),
                      }))}
                    />
                  </Stack>
                  <Stack align="center" gap={6}>
                    <Text fw={500} size="xs">Pan</Text>
                    <AngleSlider
                      aria-label="Pan"
                      formatLabel={() => draft.mixChannelPan.toFixed(2)}
                      size={88}
                      step={9}
                      value={valueToAngle(
                        draft.mixChannelPan,
                        MIN_MIX_CHANNEL_PAN,
                        MAX_MIX_CHANNEL_PAN,
                      )}
                      onChange={value => setDraft(currentDraft => ({
                        ...currentDraft,
                        mixChannelPan: angleToValue(
                          value,
                          MIN_MIX_CHANNEL_PAN,
                          MAX_MIX_CHANNEL_PAN,
                          2,
                        ),
                      }))}
                    />
                  </Stack>
                </Group>
                <Button size="xs" onClick={onUpdateMixChannel}>Apply Mix Channel</Button>
              </Stack>
            </Paper>
          </Stack>
        )}

        {selectedBlock !== undefined && (
          <Stack gap="sm">
            <Text fw={700} size="sm">Block</Text>
            <InspectorDataList
              items={[
                ['ID', selectedBlock.id],
                ['Track ID', selectedBlock.trackId],
                ['Start tick', selectedBlock.startTick],
                ['Length ticks', selectedBlock.lengthTicks],
                ['End tick', getBlockEndTick(selectedBlock)],
              ]}
            />
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
              data={patterns.map(pattern => ({ label: pattern.name, value: pattern.id }))}
              label="Pattern ID"
              size="xs"
              value={draft.blockPatternId}
              onChange={value => setDraft(currentDraft => ({ ...currentDraft, blockPatternId: value ?? '' }))}
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

        {selectedPattern !== undefined && (
          <Stack gap="sm">
            <Text fw={700} size="sm">Pattern</Text>
            <InspectorDataList
              items={[
                ['ID', selectedPattern.id],
                ['Length ticks', selectedPattern.lengthTicks],
                ['Events', selectedPattern.events.length],
              ]}
            />
            <TextInput
              label="Name"
              size="xs"
              value={draft.patternName}
              onChange={(event) => {
                const { value } = event.currentTarget
                setDraft(currentDraft => ({ ...currentDraft, patternName: value }))
              }}
            />
            <NumberInput
              label="Length ticks"
              min={1}
              size="xs"
              value={draft.patternLengthTicks}
              onChange={value => setDraft(currentDraft => ({
                ...currentDraft,
                patternLengthTicks: parseNumber(value.toString(), currentDraft.patternLengthTicks),
              }))}
            />
            <Select
              allowDeselect={false}
              data={PATTERN_KINDS.map(value => ({ label: value, value }))}
              label="Kind"
              size="xs"
              value={draft.patternKind}
              onChange={value => setDraft(currentDraft => ({
                ...currentDraft,
                patternKind: (value ?? currentDraft.patternKind) as PatternKind,
              }))}
            />
            <Button size="xs" onClick={onUpdatePattern}>Apply Pattern</Button>
          </Stack>
        )}

        {selectedPatternEvent !== undefined && (
          <Stack gap="sm">
            <Divider />
            <Text fw={700} size="sm">Pattern Event</Text>
            <InspectorDataList items={[['ID', selectedPatternEvent.id]]} />
            <NumberInput
              label="Time tick"
              min={0}
              size="xs"
              value={draft.patternEventTimeTick}
              onChange={value => setDraft(currentDraft => ({
                ...currentDraft,
                patternEventTimeTick: parseNumber(value.toString(), currentDraft.patternEventTimeTick),
              }))}
            />
            <Select
              allowDeselect={false}
              data={PATTERN_EVENT_KINDS.map(value => ({ label: value, value }))}
              label="Kind"
              size="xs"
              value={draft.patternEventKind}
              onChange={(value) => {
                const kind = PATTERN_EVENT_KINDS.find(candidate => candidate === value)

                if (kind !== undefined) {
                  setDraft(currentDraft => ({ ...currentDraft, patternEventKind: kind }))
                }
              }}
            />
            {draft.patternEventKind === 'chord' && (
              <>
                <NumberInput
                  label="Duration ticks"
                  min={1}
                  size="xs"
                  value={draft.patternEventDurationTicks}
                  onChange={value => setDraft(currentDraft => ({
                    ...currentDraft,
                    patternEventDurationTicks: parseNumber(
                      value.toString(),
                      currentDraft.patternEventDurationTicks,
                    ),
                  }))}
                />
                <NumberInput
                  label="Velocity"
                  max={127}
                  min={0}
                  size="xs"
                  value={draft.patternEventVelocity}
                  onChange={value => setDraft(currentDraft => ({
                    ...currentDraft,
                    patternEventVelocity: parseNumber(
                      value.toString(),
                      currentDraft.patternEventVelocity,
                    ),
                  }))}
                />

                <SimpleGrid
                  cols={{ base: 1, sm: 2 }}
                  mt="xs"
                  spacing="xs"
                  verticalSpacing="xs"
                >
                  <Text fw={700} size="sm" style={{ gridColumn: '1 / -1' }}>Chord</Text>
                  <Select
                    allowDeselect={false}
                    data={PITCH_CLASS_OPTIONS}
                    label="Root"
                    size="xs"
                    value={`${draft.patternEventChord.root}`}
                    onChange={(value) => {
                      const root = PITCH_CLASSES.find(candidate => `${candidate}` === value)

                      if (root !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventChord: {
                            ...currentDraft.patternEventChord,
                            root,
                          },
                        }))
                      }
                    }}
                  />
                  <Select
                    allowDeselect={false}
                    data={CHORD_QUALITIES.map(value => ({ label: value, value }))}
                    label="Quality"
                    size="xs"
                    value={draft.patternEventChord.quality}
                    onChange={(value) => {
                      const quality = CHORD_QUALITIES.find(candidate => candidate === value)

                      if (quality !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventChord: {
                            ...currentDraft.patternEventChord,
                            quality,
                          },
                        }))
                      }
                    }}
                  />
                  <MultiSelect
                    data={CHORD_EXTENSIONS.map(value => ({ label: value, value }))}
                    label="Extensions"
                    size="xs"
                    value={draft.patternEventChord.extensions}
                    onChange={values => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventChord: {
                        ...currentDraft.patternEventChord,
                        extensions: CHORD_EXTENSIONS.filter(value => values.includes(value)),
                      },
                    }))}
                  />
                  <MultiSelect
                    data={CHORD_ALTERATIONS.map(value => ({ label: value, value }))}
                    label="Alterations"
                    size="xs"
                    value={draft.patternEventChord.alterations}
                    onChange={values => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventChord: {
                        ...currentDraft.patternEventChord,
                        alterations: CHORD_ALTERATIONS.filter(value => values.includes(value)),
                      },
                    }))}
                  />
                </SimpleGrid>

                <SimpleGrid
                  cols={{ base: 1, sm: 2 }}
                  mt="xs"
                  spacing="xs"
                  verticalSpacing="xs"
                >
                  <Text fw={700} size="sm" style={{ gridColumn: '1 / -1' }}>Voicing</Text>
                  <Select
                    allowDeselect={false}
                    data={VOICING_TYPES.map(value => ({ label: value, value }))}
                    label="Type"
                    size="xs"
                    value={draft.patternEventVoicing.type}
                    onChange={(value) => {
                      const type = VOICING_TYPES.find(candidate => candidate === value)

                      if (type !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventVoicing: {
                            ...currentDraft.patternEventVoicing,
                            type,
                          },
                        }))
                      }
                    }}
                  />
                  <NumberInput
                    label="Inversion"
                    size="xs"
                    value={draft.patternEventVoicing.inversion}
                    onChange={value => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventVoicing: {
                        ...currentDraft.patternEventVoicing,
                        inversion: parseNumber(
                          value.toString(),
                          currentDraft.patternEventVoicing.inversion,
                        ),
                      },
                    }))}
                  />
                  <Select
                    allowDeselect={false}
                    data={REGISTERS.map(value => ({ label: value, value }))}
                    label="Register"
                    size="xs"
                    value={draft.patternEventVoicing.register}
                    onChange={(value) => {
                      const register = REGISTERS.find(candidate => candidate === value)

                      if (register !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventVoicing: {
                            ...currentDraft.patternEventVoicing,
                            register,
                          },
                        }))
                      }
                    }}
                  />
                  <NumberInput
                    label="Spread"
                    min={0}
                    size="xs"
                    value={draft.patternEventVoicing.spread}
                    onChange={value => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventVoicing: {
                        ...currentDraft.patternEventVoicing,
                        spread: parseNumber(
                          value.toString(),
                          currentDraft.patternEventVoicing.spread,
                        ),
                      },
                    }))}
                  />
                  <NumberInput
                    label="Octave"
                    max={8}
                    min={0}
                    size="xs"
                    value={draft.patternEventVoicing.octave ?? ''}
                    onChange={value => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventVoicing: {
                        ...currentDraft.patternEventVoicing,
                        octave: typeof value === 'number' ? value : undefined,
                      },
                    }))}
                  />
                  <Select
                    allowDeselect={false}
                    data={OPTIONAL_PITCH_CLASS_OPTIONS}
                    label="Bass note"
                    size="xs"
                    value={draft.patternEventVoicing.bassNote === undefined
                      ? NONE_OPTION_VALUE
                      : `${draft.patternEventVoicing.bassNote}`}
                    onChange={(value) => {
                      const bassNote = PITCH_CLASSES.find(candidate => `${candidate}` === value)

                      if (value === NONE_OPTION_VALUE || bassNote !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventVoicing: {
                            ...currentDraft.patternEventVoicing,
                            bassNote,
                          },
                        }))
                      }
                    }}
                  />
                </SimpleGrid>

                <SimpleGrid
                  cols={{ base: 1, sm: 2 }}
                  mb="sm"
                  mt="xs"
                  spacing="xs"
                  verticalSpacing="xs"
                >
                  <Text fw={700} size="sm" style={{ gridColumn: '1 / -1' }}>Playback</Text>
                  <Select
                    allowDeselect={false}
                    data={CHORD_PLAYBACK_STYLES.map(value => ({ label: value, value }))}
                    label="Style"
                    size="xs"
                    value={draft.patternEventPlayback.style}
                    onChange={(value) => {
                      const style = CHORD_PLAYBACK_STYLES.find(candidate => candidate === value)

                      if (style !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventPlayback: {
                            ...currentDraft.patternEventPlayback,
                            style,
                          },
                        }))
                      }
                    }}
                  />
                  <Select
                    allowDeselect={false}
                    data={CHORD_PLAYBACK_RECIPE_OPTIONS}
                    label="Recipe"
                    size="xs"
                    value={draft.patternEventPlayback.recipeId}
                    onChange={(value) => {
                      const recipeId = CHORD_PLAYBACK_RECIPE_IDS.find(candidate => candidate === value)

                      if (recipeId !== undefined) {
                        setDraft(currentDraft => ({
                          ...currentDraft,
                          patternEventPlayback: {
                            ...currentDraft.patternEventPlayback,
                            recipeId,
                          },
                        }))
                      }
                    }}
                  />
                  <NumberInput
                    decimalScale={2}
                    label="Gate"
                    max={1}
                    min={0}
                    size="xs"
                    step={0.05}
                    value={draft.patternEventPlayback.gate}
                    onChange={value => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventPlayback: {
                        ...currentDraft.patternEventPlayback,
                        gate: parseNumber(value.toString(), currentDraft.patternEventPlayback.gate),
                      },
                    }))}
                  />
                  <NumberInput
                    label="Step ticks"
                    min={1}
                    size="xs"
                    value={draft.patternEventPlayback.stepTicks ?? ''}
                    onChange={value => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventPlayback: {
                        ...currentDraft.patternEventPlayback,
                        stepTicks: typeof value === 'number' ? value : undefined,
                      },
                    }))}
                  />
                  <NumberInput
                    label="Micro stagger ticks"
                    min={0}
                    size="xs"
                    value={draft.patternEventPlayback.microStaggerTicks ?? ''}
                    onChange={value => setDraft(currentDraft => ({
                      ...currentDraft,
                      patternEventPlayback: {
                        ...currentDraft.patternEventPlayback,
                        microStaggerTicks: typeof value === 'number' ? value : undefined,
                      },
                    }))}
                  />
                </SimpleGrid>
              </>
            )}
            {draft.patternEventKind === 'note' && (
              <NumberInput
                label="Duration ticks"
                min={1}
                size="xs"
                value={draft.patternEventDurationTicks}
                onChange={value => setDraft(currentDraft => ({
                  ...currentDraft,
                  patternEventDurationTicks: parseNumber(value.toString(), currentDraft.patternEventDurationTicks),
                }))}
              />
            )}
            {['note', 'drumHit'].includes(draft.patternEventKind) && (
              <NumberInput
                label="Velocity"
                max={127}
                min={0}
                size="xs"
                value={draft.patternEventVelocity}
                onChange={value => setDraft(currentDraft => ({
                  ...currentDraft,
                  patternEventVelocity: parseNumber(value.toString(), currentDraft.patternEventVelocity),
                }))}
              />
            )}
            {draft.patternEventKind === 'note' && (
              <NumberInput
                label="Pitch"
                max={127}
                min={0}
                size="xs"
                value={draft.patternEventPitch}
                onChange={value => setDraft(currentDraft => ({
                  ...currentDraft,
                  patternEventPitch: parseNumber(value.toString(), currentDraft.patternEventPitch),
                }))}
              />
            )}
            {draft.patternEventKind === 'drumHit' && (
              <Select
                allowDeselect={false}
                data={Object.values(DRUM_PIECES).map(value => ({ label: value, value }))}
                label="Piece"
                size="xs"
                value={draft.patternEventPiece}
                onChange={(value) => {
                  const piece: DrumPiece | undefined = Object.values(DRUM_PIECES)
                    .find(candidate => candidate === value)

                  if (piece !== undefined) {
                    setDraft(currentDraft => ({ ...currentDraft, patternEventPiece: piece }))
                  }
                }}
              />
            )}
            {draft.patternEventKind === 'automation' && (
              <>
                <TextInput
                  label="Parameter"
                  size="xs"
                  value={draft.patternEventParameter}
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setDraft(currentDraft => ({ ...currentDraft, patternEventParameter: value }))
                  }}
                />
                <TextInput
                  label="Value"
                  size="xs"
                  value={draft.patternEventValue}
                  onChange={(event) => {
                    const { value } = event.currentTarget
                    setDraft(currentDraft => ({ ...currentDraft, patternEventValue: value }))
                  }}
                />
              </>
            )}
            <Button size="xs" onClick={onUpdatePatternEvent}>Apply Pattern Event</Button>
          </Stack>
        )}

        {selectedSection !== undefined && (
          <Stack gap="sm">
            <Divider />
            <Text fw={700} size="sm">Section</Text>
            <InspectorDataList
              items={[
                ['ID', selectedSection.id],
                ['Start tick', selectedSection.startTick],
                ['Length ticks', selectedSection.lengthTicks],
                ['End tick', getSectionEndTick(selectedSection)],
              ]}
            />
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
            onUpdate={onUpdateTimelineEvent}
          />
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
            ['MixChannels', workspace.mixer.channels.allIds.length],
            ['Patterns', patterns.length],
            ['Sections', workspace.arrangement.sections.length],
            ['Blocks', workspace.arrangement.blocks.length],
            ['TimelineEvents', selectTimelineEvents(workspace).length],
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
            {commandHistory.slice().reverse().map(entry => (
              <Paper key={entry.command.id} withBorder radius="sm" p={6}>
                <Text fw={700} size="xs">{entry.command.label}</Text>
                <Text c="dimmed" size="10px">{entry.command.kind}</Text>
              </Paper>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  )
})

const TimelineEventInspector = memo(function TimelineEventInspector({
  draft,
  event,
  onUpdate,
  setDraft,
  workspace,
}: {
  draft: InspectorDraft
  event: TimelineEvent
  onUpdate: () => void
  setDraft: (updater: (draft: InspectorDraft) => InspectorDraft) => void
  workspace: Workspace
}) {
  return (
    <Stack gap="sm">
      <Divider />
      <Text fw={700} size="sm">Timeline Event</Text>
      <InspectorDataList
        items={[
          ['ID', event.id],
          ['Tick', event.tick],
        ]}
      />
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
      </Group>
    </Stack>
  )
})

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

function TickRangeOverlay({
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
        left: tickToX(viewport.pixelsPerTick, leftTick),
        opacity: 0.55,
        pointerEvents: 'none',
        position: 'absolute',
        top: 8,
        width: Math.max(MIN_OVERLAY_WIDTH, tickToX(viewport.pixelsPerTick, lengthTicks)),
        zIndex: 8,
      }}
    />
  )
}

function EntityPlaceholder({
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
        left: tickToX(viewport.pixelsPerTick, startTick),
        opacity: 0.72,
        overflow: 'hidden',
        paddingInline: 6,
        pointerEvents: 'none',
        position: 'absolute',
        top,
        width: Math.max(MIN_OVERLAY_WIDTH, tickToX(viewport.pixelsPerTick, lengthTicks)),
        zIndex: 9,
      }}
    >
      <Text fw={700} size="10px" truncate>{label}</Text>
    </Box>
  )
}

function StatsGrid({ items }: { items: Array<[string, number]> }) {
  return (
    <SimpleGrid cols={2}>
      {items.map(([label, value]) => (
        <Paper key={label} withBorder radius="sm" p={6}>
          <Text c="dimmed" size="10px">{label}</Text>
          <Text fw={800} size="sm">{value}</Text>
        </Paper>
      ))}
    </SimpleGrid>
  )
}

function InspectorDataList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <Paper withBorder component="dl" m={0} radius="sm" p="xs">
      <Stack gap={5}>
        {items.map(([label, value]) => (
          <Group key={label} align="flex-start" gap="md" justify="space-between" wrap="nowrap">
            <Text c="dimmed" component="dt" size="10px">{label}</Text>
            <Text
              component="dd"
              ff="monospace"
              m={0}
              size="10px"
              ta="right"
              style={{ overflowWrap: 'anywhere' }}
            >
              {value}
            </Text>
          </Group>
        ))}
      </Stack>
    </Paper>
  )
}

function getPatternEventColor(patternEvent: PatternEvent): string {
  switch (patternEvent.kind) {
    case 'automation':
      return 'var(--mantine-color-violet-5)'
    case 'chord':
      return 'var(--mantine-color-blue-5)'
    case 'drumHit':
      return 'var(--mantine-color-orange-5)'
    case 'note':
      return 'var(--mantine-color-teal-5)'
  }
}

function getPatternEventPitchClass(patternEvent: PatternEvent): number | undefined {
  switch (patternEvent.kind) {
    case 'chord':
      return patternEvent.chord.root
    case 'note':
      return pitchClassFromMidiNote(patternEvent.pitch)
    case 'automation':
    case 'drumHit':
      return undefined
  }
}

function getTrackTint(color: string | undefined, strength: number): string | undefined {
  return color === undefined
    ? undefined
    : `color-mix(in srgb, ${color} ${strength}%, white)`
}

function valueToAngle(value: number, min: number, max: number): number {
  const clampedValue = Math.min(max, Math.max(min, value))

  return Math.round(((clampedValue - min) / (max - min)) * ANGLE_SLIDER_MAX)
}

function angleToValue(
  angle: number,
  min: number,
  max: number,
  precision: number,
): number {
  const clampedAngle = Math.min(ANGLE_SLIDER_MAX, Math.max(0, angle))
  const value = min + ((clampedAngle / ANGLE_SLIDER_MAX) * (max - min))
  const precisionMultiplier = 10 ** precision

  return Math.round(value * precisionMultiplier) / precisionMultiplier
}

function getToolIcon(tool: ActiveTool) {
  switch (tool) {
    case 'drawBlock':
      return PencilEdit01Icon
    case 'drawSection':
      return PaintBrush01Icon
    case 'erase':
      return EraserIcon
    case 'hand':
      return HoldIcon
    case 'key':
      return Key01Icon
    case 'meter':
      return MagnetIcon
    case 'move':
      return MoveIcon
    case 'mute':
      return MuteIcon
    case 'resize':
      return Resize01Icon
    case 'select':
      return CursorIcon
    case 'split':
      return ScissorIcon
    case 'tempo':
      return TimeSetting01Icon
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

function getTimelineGridPath(
  marks: RulerMark[],
  kind: RulerMark['kind'],
  pixelsPerTick: number,
  height: number,
): string {
  return marks
    .filter(mark => mark.kind === kind)
    .map(mark => `M ${tickToX(pixelsPerTick, mark.tick) + 0.5} 0 V ${height}`)
    .join(' ')
}

function getGridLineColor(kind: RulerMark['kind']): string {
  switch (kind) {
    case 'bar':
      return 'var(--mantine-color-gray-6)'
    case 'beat':
      return 'var(--mantine-color-gray-5)'
    case 'subdivision':
      return 'var(--mantine-color-gray-4)'
  }
}

function getGridLineOpacity(kind: RulerMark['kind']): number {
  switch (kind) {
    case 'bar':
      return 0.7
    case 'beat':
      return 0.55
    case 'subdivision':
      return 0.4
  }
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

function getToolLabel(tool: ActiveTool): string {
  switch (tool) {
    case 'drawBlock':
      return 'Draw block'
    case 'drawSection':
      return 'Draw section'
    case 'erase':
      return 'Erase'
    case 'hand':
      return 'Hand'
    case 'key':
      return 'Key'
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
  }
}
