import { type ReactNode, useState } from 'react'
import { type MetaArgs } from 'react-router'
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'

import { DebugNav } from './DebugNav'
import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'
import { useSession } from '~/components/Providers/SessionProvider'
import {
  type Block,
  createBlock,
  createChordEvent,
  createChordSymbol,
  createDrumHitEvent,
  createNoteEvent,
  createPattern,
  createSection,
  getBlockEndTick,
  getPatternEventEndTick,
  getSectionEndTick,
  type Pattern,
  type PatternEvent,
  type Section,
} from '~/domain'
import {
  ACTIVE_TOOLS,
  type ActiveTool,
  type Editor,
  INSPECTOR_PANELS,
  setActiveToolAction,
  setInspectorPanelAction,
  setSelectionAction,
} from '~/store/editor'
import {
  type Command,
  COMMAND_KINDS,
  type CommandHistoryEntry,
  type CommandKind,
  type CommandPayload,
  EDITOR_COMMAND_KINDS,
  type EditorCommandKind,
  type WorkspaceCommandKind,
} from '~/store/session'
import type { Workspace } from '~/store/workspace'

const DISABLED_ACTIVE_TOOLS = new Set<ActiveTool>([
  'hand',
  'key',
  'meter',
  'move',
  'mute',
  'resize',
  'split',
  'tempo',
])
const TICK_WIDTH = 0.09
type SelectionField = keyof Editor['selection']

const MOCK_SECTIONS = [
  createSection({
    id: 'mock_section_intro',
    lengthTicks: 3840,
    name: 'Intro',
    startTick: 0,
  }),
  createSection({
    id: 'mock_section_drop',
    lengthTicks: 3840,
    name: 'Drop',
    startTick: 3840,
  }),
]

const MOCK_BLOCKS = [
  createBlock({
    color: '#4c6ef5',
    id: 'mock_block_chords_intro',
    lengthTicks: 1920,
    name: 'Intro Chords',
    patternId: 'mock_pattern_chords_intro',
    startTick: 0,
    trackId: 'mock_track_chords',
  }),
  createBlock({
    color: '#15aabf',
    id: 'mock_block_chords_drop',
    lengthTicks: 3840,
    name: 'Drop Chords',
    patternId: 'mock_pattern_chords_drop',
    startTick: 3840,
    trackId: 'mock_track_chords',
  }),
  createBlock({
    color: '#40c057',
    id: 'mock_block_bass_intro',
    lengthTicks: 2880,
    name: 'Intro Bass',
    patternId: 'mock_pattern_bass_intro',
    startTick: 960,
    trackId: 'mock_track_bass',
  }),
  createBlock({
    color: '#f59f00',
    id: 'mock_block_drums_drop',
    lengthTicks: 3840,
    name: 'Drop Drums',
    patternId: 'mock_pattern_drums_drop',
    startTick: 3840,
    trackId: 'mock_track_drums',
  }),
]

const MOCK_PATTERNS = [
  createPattern({
    events: [
      createChordEvent({
        chord: createChordSymbol({ root: 0 }),
        durationTicks: 960,
        id: 'mock_event_chords_intro_1',
        timeTick: 0,
        velocity: 92,
      }),
      createChordEvent({
        chord: createChordSymbol({ root: 7 }),
        durationTicks: 960,
        id: 'mock_event_chords_intro_2',
        timeTick: 960,
        velocity: 88,
      }),
    ],
    id: 'mock_pattern_chords_intro',
    kind: 'chord',
    lengthTicks: 1920,
    name: 'Intro Chords',
  }),
  createPattern({
    events: [
      createChordEvent({
        chord: createChordSymbol({ extensions: ['7'], root: 5 }),
        durationTicks: 960,
        id: 'mock_event_chords_drop_1',
        timeTick: 0,
        velocity: 104,
      }),
      createChordEvent({
        chord: createChordSymbol({ root: 7 }),
        durationTicks: 960,
        id: 'mock_event_chords_drop_2',
        timeTick: 960,
        velocity: 100,
      }),
    ],
    id: 'mock_pattern_chords_drop',
    kind: 'chord',
    lengthTicks: 1920,
    name: 'Drop Chords',
  }),
  createPattern({
    events: [
      createNoteEvent({
        durationTicks: 480,
        id: 'mock_event_bass_intro_1',
        pitch: 36,
        timeTick: 0,
        velocity: 96,
      }),
      createNoteEvent({
        durationTicks: 480,
        id: 'mock_event_bass_intro_2',
        pitch: 43,
        timeTick: 480,
        velocity: 90,
      }),
    ],
    id: 'mock_pattern_bass_intro',
    kind: 'note',
    lengthTicks: 960,
    name: 'Intro Bass',
  }),
  createPattern({
    events: [
      createDrumHitEvent({
        id: 'mock_event_drums_drop_1',
        piece: 'kick',
        timeTick: 0,
        velocity: 112,
      }),
      createDrumHitEvent({
        id: 'mock_event_drums_drop_2',
        piece: 'snare',
        timeTick: 480,
        velocity: 104,
      }),
      createDrumHitEvent({
        id: 'mock_event_drums_drop_3',
        piece: 'closedHat',
        timeTick: 720,
        velocity: 78,
      }),
    ],
    id: 'mock_pattern_drums_drop',
    kind: 'drum',
    lengthTicks: 960,
    name: 'Drop Drums',
  }),
]

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Editor' },
  ]
}

export default function Editor() {
  return (
    <AppProvider>
      <EditorDebugContent />
    </AppProvider>
  )
}

function EditorDebugContent() {
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
  const [commandSequence, setCommandSequence] = useState(1)

  function setActiveTool(tool: ActiveTool) {
    dispatch(setActiveToolAction(tool))
  }

  function setInspectorPanel(panel: Editor['inspector']['panel']) {
    if (panel !== undefined) {
      dispatch(setInspectorPanelAction(panel))
    }
  }

  function handlepushHistoryCommand(kind: CommandKind, payload?: CommandPayload) {
    const command = createDebugCommand(
      kind,
      commandSequence,
      editor,
      workspace,
      payload,
    )

    dispatch(command)
    setCommandSequence(currentSequence => currentSequence + 1)
  }

  function handleSelectionTargetClick({
    deleteCommandKind,
    field,
    id,
    payload,
  }: {
    deleteCommandKind?: CommandKind
    field: SelectionField
    id: string
    payload?: CommandPayload
  }) {
    if (editor.activeTool === 'select') {
      dispatch(setSelectionAction(
        selectOnly(editor.selection, field, id),
      ))

      return
    }

    if (editor.activeTool === 'drawBlock' || editor.activeTool === 'drawSection') {
      dispatch(setSelectionAction(
        toggleOnly(editor.selection, field, id),
      ))

      return
    }

    if (editor.activeTool === 'erase') {
      if (deleteCommandKind !== undefined) {
        handlepushHistoryCommand(deleteCommandKind, payload)
      }

      dispatch(setSelectionAction(
        removeSelectedId(editor.selection, field, id),
      ))
    }
  }

  function handleMockBlockClick(block: Block) {
    handleSelectionTargetClick({
      deleteCommandKind: 'deleteBlock',
      field: 'selectedBlockIds',
      id: block.id,
      payload: {
        targetBlockId: block.id,
        targetBlockName: block.name,
      },
    })
  }

  function handleMockPatternEventClick(patternEvent: PatternEvent, pattern: Pattern, block: Block) {
    handleSelectionTargetClick({
      deleteCommandKind: 'deletePatternEvent',
      field: 'selectedPatternEventIds',
      id: patternEvent.id,
      payload: {
        targetBlockId: block.id,
        targetPatternEventId: patternEvent.id,
        targetPatternEventKind: patternEvent.kind,
        targetPatternId: pattern.id,
      },
    })
  }

  function handleMockSectionClick(section: Section) {
    handleSelectionTargetClick({
      field: 'selectedSectionIds',
      id: section.id,
    })
  }

  function handleMockTrackClick(trackId: string) {
    handleSelectionTargetClick({
      field: 'selectedTrackIds',
      id: trackId,
    })
  }

  return (
    <AppLayout>
      <Stack gap="md" py="lg">
        <Group justify="space-between" align="center">
          <Stack gap={2}>
            <Title order={1}>Editor Debug</Title>
            <DebugNav />
          </Stack>
          <Badge color="gray" variant="light">
            {commandHistory.undoStack.length}
            {' '}
            commands
          </Badge>
        </Group>

        <DebugPanel title="ActiveTool">
          <Group gap="xs">
            {ACTIVE_TOOLS.map(tool => (
              <Button
                key={tool}
                disabled={DISABLED_ACTIVE_TOOLS.has(tool)}
                size="xs"
                variant={editor.activeTool === tool ? 'filled' : 'light'}
                onClick={() => setActiveTool(tool)}
              >
                {tool}
              </Button>
            ))}
          </Group>
        </DebugPanel>

        <DebugPanel title="Mock Arrangement">
          <MockArrangement
            blocks={MOCK_BLOCKS}
            editor={editor}
            onBlockClick={handleMockBlockClick}
            onPatternEventClick={handleMockPatternEventClick}
            onSectionClick={handleMockSectionClick}
            onTrackClick={handleMockTrackClick}
            patterns={MOCK_PATTERNS}
            sections={MOCK_SECTIONS}
          />
        </DebugPanel>

        <DebugPanel title="InspectorPanel">
          <Group gap="xs">
            {INSPECTOR_PANELS.map(panel => (
              <Button
                key={panel}
                size="xs"
                variant={editor.inspector.panel === panel && editor.inspector.open ? 'filled' : 'light'}
                onClick={() => setInspectorPanel(panel)}
              >
                {panel}
              </Button>
            ))}
          </Group>
        </DebugPanel>

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <DebugPanel title="Editor JSON">
            <JsonBlock value={editor} />
          </DebugPanel>
          <DebugPanel title="CommandHistory JSON">
            <JsonBlock value={commandHistory} />
          </DebugPanel>
        </SimpleGrid>
        <DebugPanel title="CommandKind">
          <Group gap="xs">
            {COMMAND_KINDS.map(kind => (
              <Button key={kind} size="xs" variant="light" onClick={() => handlepushHistoryCommand(kind)}>
                {kind}
              </Button>
            ))}
          </Group>
        </DebugPanel>

        <DebugPanel title="Command History">
          <Group gap="xs">
            <Button
              disabled={!canUndo}
              size="xs"
              variant="light"
              onClick={undo}
            >
              Undo
            </Button>
            <Button
              disabled={!canRedo}
              size="xs"
              variant="light"
              onClick={redo}
            >
              Redo
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <CommandHistoryList commands={commandHistory.undoStack} title="Undo Stack" />
            <CommandHistoryList commands={commandHistory.redoStack} title="Redo Stack" />
          </SimpleGrid>
        </DebugPanel>

      </Stack>
    </AppLayout>
  )
}

function createDebugCommand(
  kind: CommandKind,
  sequence: number,
  editor: Editor,
  workspace: Workspace,
  payload: CommandPayload = {},
): Command {
  if (EDITOR_COMMAND_KINDS.includes(kind as EditorCommandKind)) {
    const editorPayload = createEditorDebugCommandPayload(
      kind as EditorCommandKind,
      editor,
    )

    return {
      createdAt: new Date().toISOString(),
      id: `debug_command_${sequence}`,
      kind: kind as EditorCommandKind,
      label: kind,
      payload: editorPayload,
      target: 'editor',
    }
  }

  const workspacePayload: CommandPayload = kind === 'setGridDivision'
    ? { grid: workspace.timeline.grid }
    : {}

  return {
    createdAt: new Date().toISOString(),
    id: `debug_command_${sequence}`,
    kind: kind as WorkspaceCommandKind,
    label: kind,
    payload: {
      activeTool: editor.activeTool,
      inspectorOpen: editor.inspector.open,
      inspectorPanel: editor.inspector.panel ?? null,
      selectedBlockIds: editor.selection.selectedBlockIds,
      selectedMixChannelIds: editor.selection.selectedMixChannelIds,
      selectedPatternIds: editor.selection.selectedPatternIds,
      selectedPatternEventIds: editor.selection.selectedPatternEventIds,
      selectedSectionIds: editor.selection.selectedSectionIds,
      selectedTimelineEventIds: editor.selection.selectedTimelineEventIds,
      selectedTrackIds: editor.selection.selectedTrackIds,
      sequence,
      ...workspacePayload,
      ...payload,
    },
    target: 'workspace',
  }
}

function createEditorDebugCommandPayload(
  kind: EditorCommandKind,
  editor: Editor,
): CommandPayload {
  switch (kind) {
    case 'copySelection':
      return {}
    case 'selectBlock':
      return editor.selection.selectedBlockIds[0] === undefined
        ? {}
        : { additive: false, blockId: editor.selection.selectedBlockIds[0] }
    case 'selectMixChannel':
      return editor.selection.selectedMixChannelIds[0] === undefined
        ? {}
        : { additive: false, mixChannelId: editor.selection.selectedMixChannelIds[0] }
    case 'selectPattern':
      return editor.selection.selectedPatternIds[0] === undefined
        ? {}
        : { additive: false, patternId: editor.selection.selectedPatternIds[0] }
    case 'selectPatternEvent':
      return editor.selection.selectedPatternEventIds[0] === undefined
        ? {}
        : { additive: false, patternEventId: editor.selection.selectedPatternEventIds[0] }
    case 'selectSection':
      return editor.selection.selectedSectionIds[0] === undefined
        ? {}
        : { additive: false, sectionId: editor.selection.selectedSectionIds[0] }
    case 'selectTimelineEvent':
      return editor.selection.selectedTimelineEventIds[0] === undefined
        ? {}
        : { additive: false, timelineEventId: editor.selection.selectedTimelineEventIds[0] }
    case 'selectTrack':
      return editor.selection.selectedTrackIds[0] === undefined
        ? {}
        : { additive: false, trackId: editor.selection.selectedTrackIds[0] }
    case 'setActiveTool':
      return { activeTool: editor.activeTool }
    case 'setClipboard':
      return { clipboard: editor.clipboard as never }
    case 'setFocusedBlockId':
      return { focusedBlockId: editor.focusedBlockId ?? null }
    case 'setHoveredChord':
      return { hoveredChord: editor.hoveredChord as never ?? null }
    case 'setInspector':
      return { inspector: editor.inspector as never }
    case 'setSelection':
      return { selection: editor.selection as never }
  }
}

function createEmptySelection(selection: Editor['selection']): Editor['selection'] {
  return {
    ...selection,
    selectedBlockIds: [],
    selectedMixChannelIds: [],
    selectedPatternIds: [],
    selectedPatternEventIds: [],
    selectedSectionIds: [],
    selectedTimelineEventIds: [],
    selectedTrackIds: [],
  }
}

function selectOnly(selection: Editor['selection'], field: SelectionField, id: string): Editor['selection'] {
  return {
    ...createEmptySelection(selection),
    [field]: [id],
  }
}

function toggleOnly(selection: Editor['selection'], field: SelectionField, id: string): Editor['selection'] {
  const selectedIds = selection[field]

  return {
    ...createEmptySelection(selection),
    [field]: selectedIds.includes(id)
      ? selectedIds.filter(selectedId => selectedId !== id)
      : [...selectedIds, id],
  }
}

function removeSelectedId(selection: Editor['selection'], field: SelectionField, id: string): Editor['selection'] {
  return {
    ...selection,
    [field]: selection[field].filter(selectedId => selectedId !== id),
  }
}

function MockArrangement({
  blocks,
  editor,
  onBlockClick,
  onPatternEventClick,
  onSectionClick,
  onTrackClick,
  patterns,
  sections,
}: {
  blocks: Block[]
  editor: Editor
  onBlockClick: (block: Block) => void
  onPatternEventClick: (patternEvent: PatternEvent, pattern: Pattern, block: Block) => void
  onSectionClick: (section: Section) => void
  onTrackClick: (trackId: string) => void
  patterns: Pattern[]
  sections: Section[]
}) {
  const trackIds = Array.from(new Set(blocks.map(block => block.trackId)))
  const endTick = Math.max(
    ...sections.map(getSectionEndTick),
    ...blocks.map(getBlockEndTick),
  )
  const timelineWidth = Math.max(720, endTick * TICK_WIDTH)
  const patternById = new Map(patterns.map(pattern => [pattern.id, pattern]))

  return (
    <Box style={{ overflowX: 'auto' }}>
      <Stack gap={6} style={{ minWidth: timelineWidth }}>
        <Box
          style={{
            height: 36,
            position: 'relative',
          }}
        >
          {sections.map(section => (
            <Box
              key={section.id}
              aria-pressed={editor.selection.selectedSectionIds.includes(section.id)}
              component="button"
              onClick={() => onSectionClick(section)}
              style={{
                background: 'var(--mantine-color-gray-1)',
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: 4,
                cursor: 'pointer',
                height: 32,
                left: section.startTick * TICK_WIDTH,
                outline: editor.selection.selectedSectionIds.includes(section.id) ? '3px solid var(--mantine-color-blue-5)' : undefined,
                padding: '6px 8px',
                position: 'absolute',
                textAlign: 'left',
                top: 0,
                width: Math.max(96, section.lengthTicks * TICK_WIDTH),
              }}
              type="button"
            >
              <Text fw={600} size="xs" truncate>{section.name}</Text>
            </Box>
          ))}
        </Box>

        {trackIds.map(trackId => (
          <Box
            key={trackId}
            onClick={() => onTrackClick(trackId)}
            style={{
              background: 'var(--mantine-color-gray-0)',
              border: '1px solid var(--mantine-color-gray-2)',
              borderRadius: 4,
              cursor: 'pointer',
              height: 94,
              outline: editor.selection.selectedTrackIds.includes(trackId) ? '3px solid var(--mantine-color-green-5)' : undefined,
              position: 'relative',
            }}
          >
            <Text
              c="dimmed"
              fw={600}
              size="xs"
              style={{
                left: 8,
                position: 'absolute',
                top: 6,
              }}
            >
              {formatTrackLabel(trackId)}
            </Text>
            {blocks
              .filter(block => block.trackId === trackId)
              .map((block) => {
                const isSelected = editor.selection.selectedBlockIds.includes(block.id)
                const pattern = patternById.get(block.patternId)

                return (
                  <Box
                    key={block.id}
                    aria-pressed={isSelected}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation()
                      onBlockClick(block)
                    }}
                    role="button"
                    style={{
                      background: block.muted ? 'var(--mantine-color-gray-4)' : block.color,
                      border: 'none',
                      borderRadius: 4,
                      color: 'var(--mantine-color-white)',
                      cursor: 'pointer',
                      height: 62,
                      left: block.startTick * TICK_WIDTH,
                      opacity: block.muted ? 0.55 : 0.95,
                      outline: isSelected ? '3px solid var(--mantine-color-yellow-4)' : '1px solid rgba(255, 255, 255, 0.4)',
                      overflow: 'hidden',
                      padding: '6px 8px',
                      position: 'absolute',
                      textAlign: 'left',
                      top: 26,
                      width: Math.max(104, block.lengthTicks * TICK_WIDTH),
                    }}
                    tabIndex={0}
                    title={block.name}
                  >
                    <Text c="white" fw={700} size="xs" truncate>{block.name}</Text>
                    <Text c="white" size="xs" truncate>{block.patternId}</Text>
                    {pattern !== undefined && (
                      <PatternEventsStrip
                        block={block}
                        editor={editor}
                        onPatternEventClick={onPatternEventClick}
                        pattern={pattern}
                      />
                    )}
                  </Box>
                )
              })}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

function PatternEventsStrip({
  block,
  editor,
  onPatternEventClick,
  pattern,
}: {
  block: Block
  editor: Editor
  onPatternEventClick: (patternEvent: PatternEvent, pattern: Pattern, block: Block) => void
  pattern: Pattern
}) {
  const markers = getPatternEventMarkers(block, pattern)

  return (
    <Box
      style={{
        bottom: 6,
        left: 8,
        position: 'absolute',
        right: 8,
        top: 38,
      }}
    >
      {markers.map(({ cycleStartTick, event, leftPercent, width }) => {
        const isSelected = editor.selection.selectedPatternEventIds.includes(event.id)

        return (
          <Box
            key={`${event.id}:${cycleStartTick}`}
            aria-pressed={isSelected}
            component="button"
            onClick={(clickEvent) => {
              clickEvent.stopPropagation()
              onPatternEventClick(event, pattern, block)
            }}
            style={{
              background: isSelected ? 'var(--mantine-color-yellow-3)' : 'rgba(255, 255, 255, 0.74)',
              border: '1px solid rgba(0, 0, 0, 0.22)',
              borderRadius: 3,
              bottom: 0,
              color: 'var(--mantine-color-dark-8)',
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 700,
              left: `${leftPercent}%`,
              lineHeight: '14px',
              overflow: 'hidden',
              padding: '0 3px',
              position: 'absolute',
              textAlign: 'left',
              top: 0,
              whiteSpace: 'nowrap',
              width,
            }}
            title={`${pattern.name}: ${formatPatternEventLabel(event)}`}
            type="button"
          >
            {formatPatternEventLabel(event)}
          </Box>
        )
      })}
    </Box>
  )
}

function getPatternEventMarkers(block: Block, pattern: Pattern): Array<{
  cycleStartTick: number
  event: PatternEvent
  leftPercent: number
  width: string | number
}> {
  const markers: Array<{
    cycleStartTick: number
    event: PatternEvent
    leftPercent: number
    width: string | number
  }> = []

  for (let cycleStartTick = 0; cycleStartTick < block.lengthTicks; cycleStartTick += pattern.lengthTicks) {
    for (const event of pattern.events) {
      const eventStartTick = cycleStartTick + event.timeTick

      if (eventStartTick >= block.lengthTicks) {
        continue
      }

      const eventEndTick = Math.min(block.lengthTicks, cycleStartTick + getPatternEventEndTick(event))
      const eventLengthTicks = Math.max(0, eventEndTick - eventStartTick)
      const eventLengthPercent = eventLengthTicks / block.lengthTicks * 100

      markers.push({
        cycleStartTick,
        event,
        leftPercent: eventStartTick / block.lengthTicks * 100,
        width: eventLengthTicks === 0
          ? 18
          : `max(18px, ${eventLengthPercent}%)`,
      })
    }
  }

  return markers
}

function formatPatternEventLabel(patternEvent: PatternEvent): string {
  switch (patternEvent.kind) {
    case 'automation':
      return patternEvent.parameter
    case 'chord':
      return 'Chord'
    case 'drumHit':
      return patternEvent.piece
    case 'note':
      return `N${patternEvent.pitch}`
  }
}

function formatTrackLabel(trackId: string): string {
  return trackId
    .replace('mock_track_', '')
    .replace(/^\w/, firstLetter => firstLetter.toUpperCase())
}

function DebugPanel({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Title order={2} size="h4">{title}</Title>
        <Divider />
        {children}
      </Stack>
    </Paper>
  )
}

function CommandHistoryList({
  commands,
  title,
}: {
  commands: CommandHistoryEntry[]
  title: string
}) {
  if (commands.length === 0) {
    return (
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={600} size="sm">{title}</Text>
          <Badge color="gray" variant="light">0</Badge>
        </Group>
        <Text c="dimmed" size="sm">No commands</Text>
      </Stack>
    )
  }

  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text fw={600} size="sm">{title}</Text>
        <Badge color="gray" variant="light">{commands.length}</Badge>
      </Group>
      {commands.map(entry => (
        <Paper key={entry.command.id} withBorder radius="sm" p="sm">
          <Group justify="space-between" align="flex-start" gap="xs">
            <Box>
              <Group gap="xs">
                <Badge variant="light">{entry.command.kind}</Badge>
                <Text fw={600} size="sm">{entry.command.label}</Text>
              </Group>
              <Text c="dimmed" size="xs">{entry.command.id}</Text>
            </Box>
            <Text c="dimmed" size="xs">{entry.command.createdAt}</Text>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <Box
      component="pre"
      m={0}
      p="sm"
      style={{
        background: 'var(--mantine-color-gray-0)',
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 4,
        fontSize: 12,
        maxHeight: 420,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  )
}
