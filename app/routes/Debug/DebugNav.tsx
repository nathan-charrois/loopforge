import { Link, useLocation } from 'react-router'
import { Button, Group } from '@mantine/core'

const DEBUG_NAV_ITEMS = [
  { label: 'Chord', path: '/chord' },
  { label: 'Notes', path: '/notes' },
  { label: 'Playback', path: '/playback' },
  { label: 'Editor', path: '/editor' },
  { label: 'Arrangement', path: '/arrangement' },
] as const

export function DebugNav() {
  const { pathname } = useLocation()

  return (
    <Group gap={6} wrap="wrap" my="lg">
      {DEBUG_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.path

        return (
          <Button
            key={item.path}
            color={isActive ? 'blue' : 'gray'}
            component={Link}
            size="xs"
            to={item.path}
            variant={isActive ? 'filled' : 'light'}
          >
            {item.label}
          </Button>
        )
      })}
    </Group>
  )
}
