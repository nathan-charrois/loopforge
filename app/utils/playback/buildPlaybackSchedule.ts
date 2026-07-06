import {
  getBlockEndTick,
  getPatternEventEndTick,
  getProjectPattern,
  getProjectTrack,
  type PatternEvent,
  PPQ,
  type Project,
  type Tick,
} from '~/domain'

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

const MIN_PROJECT_LENGTH_TICKS = 4 * 4 * PPQ

export function buildPlaybackSchedule(project: Project): PlaybackSchedule {
  const events: ScheduledPlaybackEvent[] = []
  const warnings: PlaybackScheduleWarning[] = []

  for (const block of project.arrangement.blocks) {
    if (block.muted) {
      continue
    }

    const track = getProjectTrack(project, block.trackId)

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

    const pattern = getProjectPattern(project, block.patternId)

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
    projectEndTick: getProjectEndTick(project),
    warnings,
  }
}

export function findFirstScheduledEventAtOrAfter(schedule: PlaybackSchedule, tick: Tick): number {
  let low = 0
  let high = schedule.eventStartTicks.length

  while (low < high) {
    const midpoint = Math.floor((low + high) / 2)

    if (schedule.eventStartTicks[midpoint] < tick) {
      low = midpoint + 1
    }
    else {
      high = midpoint
    }
  }

  return low
}

export function getProjectEndTick(project: Project): Tick {
  const sectionEndTicks = project.arrangement.sections.map(section => section.startTick + section.lengthTicks)
  const blockEndTicks = project.arrangement.blocks.map(getBlockEndTick)

  return Math.max(MIN_PROJECT_LENGTH_TICKS, ...sectionEndTicks, ...blockEndTicks)
}

function getScheduledEventDurationTicks(event: PatternEvent, maxDurationTicks: number): number {
  if (event.kind !== 'chord' && event.kind !== 'note') {
    return 0
  }

  return Math.max(0, Math.min(getPatternEventEndTick(event) - event.timeTick, maxDurationTicks))
}
