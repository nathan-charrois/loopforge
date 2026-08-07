import { memo } from 'react'
import { Box, Text } from '@mantine/core'

import { PANEL_RULER_HEIGHT } from './constants'
import type { RulerMark } from '~/domain'

export const PatternPanelRuler = memo(function PatternPanelRuler({
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
        background: 'var(--mantine-color-white)',
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
          c="dark.7"
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
