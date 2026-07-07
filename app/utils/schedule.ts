import {
  getBlockEndTick,
  getScheduledEventDurationTicks,
  type PatternEvent,
  type Tick,
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
    if (block.muted) {
      continue
    }

    const track = selectTrack(workspace, block.trackId)

    if (track === undefined) {
      warnings.push({
        id: `missing-track-${block.id}`,
        message: `Block ${block.name} references missing track ${block.trackId}.`,
      })
      continue
    }

    if (track.muted) {
      continue
    }

    const pattern = selectPattern(workspace, block.patternId)

    if (pattern === undefined) {
      warnings.push({
        id: `missing-pattern-${block.id}`,
        message: `Block ${block.name} references missing pattern ${block.patternId}.`,
      })
      continue
    }

    if (!track.accepts.includes(pattern.kind)) {
      warnings.push({
        id: `track-accepts-${block.id}`,
        message: `${track.name} does not accept ${pattern.kind} patterns.`,
      })
      continue
    }

    if (block.playbackMode === 'stretch') {
      warnings.push({
        id: `stretch-${block.id}`,
        message: `${block.name} uses stretch playback; v1 schedules it as loop playback.`,
      })
    }

    if (pattern.lengthTicks <= 0) {
      warnings.push({
        id: `pattern-length-${pattern.id}`,
        message: `${pattern.name} has no positive length and cannot be scheduled.`,
      })
      continue
    }

    const repeatPattern = block.playbackMode === 'loop' || block.playbackMode === 'stretch'
    const blockEndTick = getBlockEndTick(block)

    for (let offsetTick = 0; offsetTick < block.lengthTicks; offsetTick += pattern.lengthTicks) {
      for (const event of pattern.events) {
        const startTick = block.startTick + offsetTick + event.timeTick

        if (startTick >= blockEndTick) {
          continue
        }

        events.push({
          blockId: block.id,
          durationTicks: getScheduledEventDurationTicks(event, blockEndTick - startTick),
          event,
          id: `${block.id}:${offsetTick}:${event.id}`,
          patternId: pattern.id,
          startTick,
          trackId: track.id,
          trackVolume: track.volume,
        })
      }

      if (!repeatPattern) {
        break
      }
    }
  }

  const sortedEvents = events.sort((left, right) => {
    if (left.startTick !== right.startTick) {
      return left.startTick - right.startTick
    }

    return left.id.localeCompare(right.id)
  })

  return {
    eventStartTicks: sortedEvents.map(event => event.startTick),
    events: sortedEvents,
    projectEndTick: selectWorkspaceEndTick(workspace),
    warnings,
  }
}
