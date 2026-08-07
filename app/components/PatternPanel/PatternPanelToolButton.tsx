import { memo } from 'react'
import { CursorIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ActionIcon, Tooltip } from '@mantine/core'

export const PatternPanelToolButton = memo(function PatternPanelToolButton({
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
