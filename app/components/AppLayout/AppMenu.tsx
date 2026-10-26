import { ActionIcon, Group, Menu, Menubar, Select, Text, Tooltip } from '@mantine/core'

import { WORKSPACE_DEMOS } from '~/store/workspace/demoCatalog'

const DEMO_SELECT_DATA = WORKSPACE_DEMOS.map(demo => ({
  label: demo.name,
  value: demo.id,
}))

type Props = {
  currentProjectId: string
  onExportProject: () => void
  onNewProject: () => void
  onOpenProject: () => void
  onOpenProjectDemo: (name: string) => void
  onSaveProject: () => void
  onUndoCommand: () => void
  onRedoCommand: () => void
  onCopyCommand: () => void
  onPasteCommand: () => void
}

export function AppMenu({
  currentProjectId,
  onExportProject,
  onNewProject,
  onOpenProject,
  onOpenProjectDemo,
  onSaveProject,
  onUndoCommand,
  onRedoCommand,
  onCopyCommand,
  onPasteCommand,
}: Props) {
  const currentDemoIndex = WORKSPACE_DEMOS.findIndex(demo => demo.projectId === currentProjectId)
  const currentDemo = WORKSPACE_DEMOS[currentDemoIndex]

  const openAdjacentDemo = (offset: number) => {
    const nextIndex = currentDemoIndex === -1
      ? offset > 0 ? 0 : WORKSPACE_DEMOS.length - 1
      : (currentDemoIndex + offset + WORKSPACE_DEMOS.length) % WORKSPACE_DEMOS.length

    onOpenProjectDemo(WORKSPACE_DEMOS[nextIndex].id)
  }

  return (
    <Group gap="md">
      <Menubar>
        <Menubar.Menu width={220}>
          <Menubar.Target>Project</Menubar.Target>
          <Menubar.Dropdown>
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘N</Text>}
              onClick={onNewProject}
            >
              New
            </Menu.Item>
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘O</Text>}
              onClick={onOpenProject}
            >
              Open
            </Menu.Item>
            <Menu.Sub>
              <Menu.Sub.Target>
                <Menu.Sub.Item>Open demo</Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                {WORKSPACE_DEMOS.map(demo => (
                  <Menu.Item key={demo.id} onClick={() => onOpenProjectDemo(demo.id)}>
                    {demo.name}
                  </Menu.Item>
                ))}
              </Menu.Sub.Dropdown>
            </Menu.Sub>
            <Menu.Divider />
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘S</Text>}
              onClick={onSaveProject}
            >
              Save
            </Menu.Item>
            <Menu.Item onClick={onExportProject}>
              Export audio…
            </Menu.Item>
          </Menubar.Dropdown>
        </Menubar.Menu>
        <Menubar.Menu width={220}>
          <Menubar.Target>Edit</Menubar.Target>
          <Menubar.Dropdown>
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘Z</Text>}
              onClick={onUndoCommand}
            >
              Undo
            </Menu.Item>
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘⇧Z</Text>}
              onClick={onRedoCommand}
            >
              Redo
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘C</Text>}
              onClick={onCopyCommand}
            >
              Copy
            </Menu.Item>
            <Menu.Item
              rightSection={<Text size="xs" c="dimmed">⌘V</Text>}
              onClick={onPasteCommand}
            >
              Paste
            </Menu.Item>
          </Menubar.Dropdown>
        </Menubar.Menu>
      </Menubar>
      <Group gap={4} wrap="nowrap">
        <Text size="xs" c="dimmed" fw={600}>Demo</Text>
        <Tooltip label="Previous demo">
          <ActionIcon
            aria-label="Previous demo"
            variant="subtle"
            onClick={() => openAdjacentDemo(-1)}
          >
            ←
          </ActionIcon>
        </Tooltip>
        <Select
          aria-label="Demo song"
          data={DEMO_SELECT_DATA}
          placeholder="Choose a demo"
          searchable
          value={currentDemo?.id ?? null}
          w={220}
          onChange={value => value !== null && onOpenProjectDemo(value)}
        />
        <Tooltip label="Next demo">
          <ActionIcon
            aria-label="Next demo"
            variant="subtle"
            onClick={() => openAdjacentDemo(1)}
          >
            →
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  )
}
