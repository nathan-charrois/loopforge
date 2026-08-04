import { Menu, Menubar, Text } from '@mantine/core'

type Props = {
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
  onNewProject,
  onOpenProject,
  onOpenProjectDemo,
  onSaveProject,
  onUndoCommand,
  onRedoCommand,
  onCopyCommand,
  onPasteCommand,
}: Props) {
  return (
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
              <Menu.Item onClick={() => onOpenProjectDemo('lanternsInFive')}>Lanterns in Five</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('theHouseIsListening')}>The House is Listening</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('blueHourBelow')}>Blue Hour Below</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('prismCurrent')}>Prism Current</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('neonOrchard')}>Neon Orchard</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('tidalCathedral')}>Tidal Cathedral</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('cutGlassAlibi')}>Cut Glass Alibi</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('zeroKelvinBloom')}>Zero Kelvin Bloom</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('eightfoldParallax')}>Eight Fold Parallax</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('fifthFloorRain')}>Fifth Floor Rain</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('velvetUndertow')}>Velvet Undertow</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('cedarStatic')}>Cedar Static</Menu.Item>
              <Menu.Item onClick={() => onOpenProjectDemo('vacantReceiver')}>Vacant Receiver</Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>
          <Menu.Divider />
          <Menu.Item
            rightSection={<Text size="xs" c="dimmed">⌘S</Text>}
            onClick={onSaveProject}
          >
            Save
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
  )
}
