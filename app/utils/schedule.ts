import {
  type Block,
  getBlockEndTick,
  getScheduledEventDurationTicks,
  type Pattern,
  type PatternEvent,
  type Tick,
  type Track,
} from '~/domain'
import {
  selectPattern,
  selectTrack,
  selectWorkspaceEndTick,
  type Workspace,
} from '~/store/workspace'

export type ScheduledPlaybackEvent = {
  id: string
  blockId: string
  durationTicks: number
  event: PatternEvent
  patternId: string
  startTick: Tick
  trackId: string
  trackVolume: number
}

export type PlaybackScheduleWarning = {
  id: string
  message: string
}

export type PlaybackSchedule = {
  eventStartTicks: Tick[]
  events: ScheduledPlaybackEvent[]
  projectEndTick: Tick
  warnings: PlaybackScheduleWarning[]
}

export function buildSchedule(workspace: Workspace): PlaybackSchedule {
  const events: ScheduledPlaybackEvent[] = []
  const warnings: PlaybackScheduleWarning[] = []

  for (const block of workspace.arrangement.blocks) {
    const context = getSchedulableBlockContext(workspace, block, warnings)

    if (context === null) {
      continue
    }

    if (block.playbackMode === 'stretch') {
      warnings.push({
        id: `stretch-${block.id}`,
        message: `${block.name} uses stretch playback; v1 schedules it as a single clipped pattern pass.`,
      })
    }

    const repeatPattern = block.playbackMode === 'loop'

    for (let offsetTick = 0; offsetTick < block.lengthTicks; offsetTick += context.pattern.lengthTicks) {
      for (const event of context.pattern.events) {
        const scheduledEvent = createScheduledPlaybackEvent({
          block,
          event,
          offsetTick,
          pattern: context.pattern,
          track: context.track,
        })

        if (scheduledEvent !== null) {
          events.push(scheduledEvent)
        }
      }

      if (!repeatPattern) {
        break
      }
    }
  }

  const sortedEvents = events.sort(sortScheduledEvents)

  return {
    eventStartTicks: sortedEvents.map(event => event.startTick),
    events: sortedEvents,
    projectEndTick: selectWorkspaceEndTick(workspace),
    warnings,
  }
}

function getSchedulableBlockContext(
  workspace: Workspace,
  block: Block,
  warnings: PlaybackScheduleWarning[],
): { pattern: Pattern, track: Track } | null {
  if (block.muted) {
    return null
  }

  const track = selectTrack(workspace, block.trackId)

  if (track === undefined) {
    warnings.push({
      id: `missing-track-${block.id}`,
      message: `Block ${block.name} references missing track ${block.trackId}.`,
    })
    return null
  }

  if (track.muted) {
    return null
  }

  const pattern = selectPattern(workspace, block.patternId)

  if (pattern === undefined) {
    warnings.push({
      id: `missing-pattern-${block.id}`,
      message: `Block ${block.name} references missing pattern ${block.patternId}.`,
    })
    return null
  }

  if (!track.accepts.includes(pattern.kind)) {
    warnings.push({
      id: `track-accepts-${block.id}`,
      message: `${track.name} does not accept ${pattern.kind} patterns.`,
    })
    return null
  }

  if (pattern.lengthTicks <= 0) {
    warnings.push({
      id: `pattern-length-${pattern.id}`,
      message: `${pattern.name} has no positive length and cannot be scheduled.`,
    })
    return null
  }

  return {
    pattern,
    track,
  }
}

function createScheduledPlaybackEvent({
  block,
  event,
  offsetTick,
  pattern,
  track,
}: {
  block: Block
  event: PatternEvent
  offsetTick: number
  pattern: Pattern
  track: Track
}): ScheduledPlaybackEvent | null {
  const blockEndTick = getBlockEndTick(block)
  const startTick = block.startTick + offsetTick + event.timeTick

  if (startTick >= blockEndTick) {
    return null
  }

  const maxDurationTicks = blockEndTick - startTick

  return {
    blockId: block.id,
    durationTicks: getScheduledEventDurationTicks(event, maxDurationTicks),
    event,
    id: `${block.id}:${offsetTick}:${event.id}`,
    patternId: pattern.id,
    startTick,
    trackId: track.id,
    trackVolume: track.volume,
  }
}

function sortScheduledEvents(left: ScheduledPlaybackEvent, right: ScheduledPlaybackEvent): number {
  if (left.startTick !== right.startTick) {
    return left.startTick - right.startTick
  }

  return left.id.localeCompare(right.id)
}
