import type { ActiveTool } from './types'
import {
  type BlockId,
  sortTimelineEventsByTick,
  type TimelineEvent,
} from '~/domain'
import { selectBlock, type Workspace } from '~/store/workspace'
import { buildSchedule, type PlaybackTrigger, type ScheduledPlaybackEvent } from '~/utils/schedule'

export function selectFocusedBlockEvents(
  workspace: Workspace,
  focusedBlockId?: BlockId,
): {
  events: ScheduledPlaybackEvent[]
  triggers: PlaybackTrigger[]
} | undefined {
  if (!focusedBlockId) {
    return undefined
  }

  if (!selectBlock(workspace, focusedBlockId)) {
    return undefined
  }

  const schedule = buildSchedule(workspace)
  const events = schedule.events.filter(event => event.blockId === focusedBlockId)

  return {
    events,
    triggers: events.flatMap(event => event.triggers),
  }
}

export function selectTimelineEvents(workspace: Workspace): TimelineEvent[] {
  return sortTimelineEventsByTick([
    ...workspace.timeline.tempoEvents,
    ...workspace.timeline.meterEvents,
    ...workspace.timeline.keyEvents,
  ])
}

export function getToolLabel(tool: ActiveTool): string {
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

export function formatPlaybackTrigger(trigger: PlaybackTrigger): string {
  if (trigger.kind === 'note') {
    return `MIDI ${trigger.pitch}`
  }

  if (trigger.kind === 'drum') {
    return trigger.kitPiece
  }

  return `${trigger.parameter}: ${trigger.value}`
}

export function getPlaybackTriggerTop(trigger: PlaybackTrigger): number {
  if (trigger.kind === 'note') {
    return 4 + ((127 - trigger.pitch) % 18)
  }

  if (trigger.kind === 'drum') {
    return 14
  }

  return 22
}
