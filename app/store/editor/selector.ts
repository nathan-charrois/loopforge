import {
  type BlockId,
} from '~/domain'
import {
  selectBlock,
  type Workspace,
} from '~/store/workspace'
import { buildSchedule, type PlaybackTrigger, type ScheduledPlaybackEvent } from '~/utils/schedule'

export type FocusedBlockPlaybackView = {
  blockId: BlockId
  events: ScheduledPlaybackEvent[]
  triggers: PlaybackTrigger[]
}

export function getFocusedBlockPlaybackView(
  workspace: Workspace,
  focusedBlockId: BlockId | undefined,
): FocusedBlockPlaybackView | undefined {
  if (focusedBlockId === undefined) {
    return undefined
  }

  const schedule = buildSchedule(workspace)
  const events = schedule.events.filter(event => event.blockId === focusedBlockId)

  if (events.length === 0 && selectBlock(workspace, focusedBlockId) === undefined) {
    return undefined
  }

  return {
    blockId: focusedBlockId,
    events,
    triggers: events.flatMap(event => event.triggers),
  }
}
