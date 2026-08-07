import {
  memo,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Box, NumberInput, Slider, Stack, Text } from '@mantine/core'

import { PANEL_PIANO_WIDTH } from './constants'
import type { Pattern, PatternEvent, PatternEventId, Velocity } from '~/domain'
import { MAX_VELOCITY } from '~/domain'
import type { ActivePatternPanelTool, PatternEventDraft } from '~/store/editor'

export const PatternPanelVelocityRow = memo(function PatternPanelVelocityRow({
  tool,
  pattern,
  pixelsPerTick,
  selectedPatternEvent,
  selectedPatternEventIds,
  timelineWidth,
  velocityTimelineRef,
  onDeletePatternEvent,
  onSelectPatternEvent,
  onUpdatePatternEventDraft,
}: {
  tool: ActivePatternPanelTool
  pattern: Pattern
  pixelsPerTick: number
  selectedPatternEvent?: PatternEvent
  selectedPatternEventIds?: PatternEventId[]
  timelineWidth: number
  velocityTimelineRef: RefObject<HTMLDivElement | null>
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
  onUpdatePatternEventDraft: (patternEvent: PatternEvent, patternEventDraft: Partial<PatternEventDraft>) => void
}) {
  const selectedVelocityEvent = selectedPatternEvent !== undefined
    && selectedPatternEvent.kind !== 'automation'
    ? selectedPatternEvent
    : undefined
  const [velocity, setVelocity] = useState<Velocity>(
    selectedVelocityEvent?.velocity ?? 0,
  )

  useEffect(() => {
    setVelocity(selectedVelocityEvent?.velocity ?? 0)
  }, [selectedVelocityEvent?.id, selectedVelocityEvent?.velocity])

  const commitVelocity = useCallback((nextVelocity: number) => {
    if (selectedVelocityEvent === undefined) {
      return
    }

    const clampedVelocity = Math.min(
      MAX_VELOCITY,
      Math.max(0, Math.round(nextVelocity)),
    )

    setVelocity(clampedVelocity)
    onUpdatePatternEventDraft(selectedVelocityEvent, {
      patternEventVelocity: clampedVelocity,
    })
  }, [onUpdatePatternEventDraft, selectedVelocityEvent])

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-sm)',
        display: 'grid',
        gridTemplateColumns: `${PANEL_PIANO_WIDTH}px minmax(0, 1fr)`,
        minHeight: 104,
        overflow: 'hidden',
      }}
    >
      <Stack
        gap={6}
        p="xs"
        style={{
          borderRight: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Text fw={700} size="xs">Velocity</Text>
        <NumberInput
          aria-label="Selected event velocity"
          disabled={selectedVelocityEvent === undefined}
          max={MAX_VELOCITY}
          min={0}
          size="xs"
          value={velocity}
          onBlur={() => commitVelocity(velocity)}
          onChange={value => setVelocity(Number(value) || 0)}
        />
        <Slider
          label={null}
          max={MAX_VELOCITY}
          min={0}
          size="xs"
          disabled={selectedVelocityEvent === undefined}
          value={velocity}
          onChange={setVelocity}
          onChangeEnd={commitVelocity}
        />
      </Stack>
      <Box
        pos="relative"
        style={{
          background: 'var(--mantine-color-gray-0)',
          overflow: 'hidden',
        }}
      >
        <Box
          ref={velocityTimelineRef}
          style={{
            height: 102,
            position: 'relative',
            transform: 'translateX(0)',
            width: timelineWidth,
            willChange: 'transform',
          }}
        >
          {pattern.events.filter(
            (patternEvent): patternEvent is Extract<PatternEvent, { velocity: Velocity }> => (
              patternEvent.kind !== 'automation'
            ),
          ).map((patternEvent) => {
            const selected = selectedPatternEventIds?.includes(patternEvent.id)
            const height = Math.max(4, patternEvent.velocity / MAX_VELOCITY * 72)

            return (
              <Box
                key={patternEvent.id}
                component="button"
                type="button"
                aria-label={`Velocity ${patternEvent.velocity}`}
                onPointerDown={(pointerEvent: ReactPointerEvent<HTMLButtonElement>) => {
                  pointerEvent.stopPropagation()

                  if (tool === 'delete') {
                    onDeletePatternEvent(patternEvent.id)
                    return
                  }

                  onSelectPatternEvent(patternEvent.id, pointerEvent.shiftKey)
                }}
                style={{
                  background: patternEvent.kind === 'drumHit'
                    ? selected
                      ? 'var(--mantine-color-orange-5)'
                      : 'var(--mantine-color-orange-3)'
                    : selected
                      ? 'var(--mantine-color-blue-5)'
                      : 'var(--mantine-color-blue-3)',
                  border: 0,
                  borderRadius: '2px 2px 0 0',
                  bottom: 12,
                  cursor: 'pointer',
                  height,
                  left: patternEvent.timeTick * pixelsPerTick,
                  opacity: getPatternEventOpacity(patternEvent),
                  padding: 0,
                  position: 'absolute',
                  width: selected ? 7 : 5,
                }}
              />
            )
          })}
        </Box>
      </Box>
    </Box>
  )
})

function getPatternEventOpacity(patternEvent: PatternEvent): number {
  if (patternEvent.kind === 'automation') {
    return 1
  }

  return 0.2 + (patternEvent.velocity / MAX_VELOCITY * 0.8)
}
