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

import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'
import { useCommandHistory } from '~/components/Providers/CommandHistoryProvider'
import { useEditorState } from '~/components/Providers/EditorStateProvider'
import {
  ACTIVE_TOOLS,
  type Command,
  COMMAND_KINDS,
  type CommandKind,
  createCommand,
  type EditorState,
  INSPECTOR_PANELS,
} from '~/domain'

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
  const { editorState, setActiveTool, setInspectorPanel } = useEditorState()
  const {
    canRedo,
    canUndo,
    commandHistory,
    pushCommand,
    redoCommand,
    undoCommand,
  } = useCommandHistory()
  const [commandSequence, setCommandSequence] = useState(1)

  function handlePushCommand(kind: CommandKind) {
    const command = createDebugCommand(kind, commandSequence, editorState)

    pushCommand(command)
    setCommandSequence(currentSequence => currentSequence + 1)
  }

  return (
    <AppLayout>
      <Stack gap="md" py="lg">
        <Group justify="space-between" align="center">
          <Title order={1} size="h2">Editor Debug</Title>
          <Badge color="gray" variant="light">
            {commandHistory.undoStack.length}
            {' '}
            commands
          </Badge>
        </Group>

        <DebugPanel title="CommandKind">
          <Group gap="xs">
            {COMMAND_KINDS.map(kind => (
              <Button key={kind} size="xs" variant="light" onClick={() => handlePushCommand(kind)}>
                {kind}
              </Button>
            ))}
          </Group>
        </DebugPanel>

        <DebugPanel title="ActiveTool">
          <Group gap="xs">
            {ACTIVE_TOOLS.map(tool => (
              <Button
                key={tool}
                size="xs"
                variant={editorState.activeTool === tool ? 'filled' : 'light'}
                onClick={() => setActiveTool(tool)}
              >
                {tool}
              </Button>
            ))}
          </Group>
        </DebugPanel>

        <DebugPanel title="InspectorPanel">
          <Group gap="xs">
            {INSPECTOR_PANELS.map(panel => (
              <Button
                key={panel}
                size="xs"
                variant={editorState.inspector.panel === panel && editorState.inspector.open ? 'filled' : 'light'}
                onClick={() => setInspectorPanel(panel)}
              >
                {panel}
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
              onClick={undoCommand}
            >
              Undo
            </Button>
            <Button
              disabled={!canRedo}
              size="xs"
              variant="light"
              onClick={redoCommand}
            >
              Redo
            </Button>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <CommandHistoryList commands={commandHistory.undoStack} title="Undo Stack" />
            <CommandHistoryList commands={commandHistory.redoStack} title="Redo Stack" />
          </SimpleGrid>
        </DebugPanel>

        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <DebugPanel title="EditorState JSON">
            <JsonBlock value={editorState} />
          </DebugPanel>
          <DebugPanel title="CommandHistory JSON">
            <JsonBlock value={commandHistory} />
          </DebugPanel>
        </SimpleGrid>
      </Stack>
    </AppLayout>
  )
}

function createDebugCommand(kind: CommandKind, sequence: number, editorState: EditorState): Command {
  return createCommand({
    createdAt: new Date().toISOString(),
    id: `debug_command_${sequence}`,
    kind,
    label: kind,
    payload: {
      activeTool: editorState.activeTool,
      inspectorOpen: editorState.inspector.open,
      inspectorPanel: editorState.inspector.panel ?? null,
      selectedBlockIds: editorState.selection.selectedBlockIds,
      selectedPatternEventIds: editorState.selection.selectedPatternEventIds,
      selectedSectionIds: editorState.selection.selectedSectionIds,
      selectedTrackIds: editorState.selection.selectedTrackIds,
      sequence,
    },
  })
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
  commands: Command[]
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
      {commands.map(command => (
        <Paper key={command.id} withBorder radius="sm" p="sm">
          <Group justify="space-between" align="flex-start" gap="xs">
            <Box>
              <Group gap="xs">
                <Badge variant="light">{command.kind}</Badge>
                <Text fw={600} size="sm">{command.label}</Text>
              </Group>
              <Text c="dimmed" size="xs">{command.id}</Text>
            </Box>
            <Text c="dimmed" size="xs">{command.createdAt}</Text>
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
