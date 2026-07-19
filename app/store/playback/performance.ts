import type {
  InstrumentId,
  MixChannelId,
  Tick,
  TrackId,
} from '~/domain'
import {
  selectInstrument,
  selectMixChannel,
  selectTrack,
  type Workspace,
} from '~/store/workspace'
import type {
  PlaybackSchedule,
  PlaybackScheduleWarning,
  PlaybackTrigger,
} from '~/utils/schedule'

export type PerformancePlan = {
  tracks: Record<TrackId, PerformanceTrack>
  triggers: PlaybackTrigger[]
  triggerStartTicks: Tick[]
  startTick: Tick
  endTick: Tick
  warnings: PerformancePlanWarning[]
}

export type PerformanceTrack = {
  trackId: TrackId
  instrumentId: InstrumentId
  mixChannelId: MixChannelId
}

export type PerformancePlanWarning
  = | PlaybackScheduleWarning
    | MissingPerformanceTrackWarning
    | MissingPerformanceInstrumentWarning
    | MissingPerformanceMixChannelWarning

export type MissingPerformanceTrackWarning = {
  kind: 'missingPerformanceTrack'
  trackId: TrackId
}

export type MissingPerformanceInstrumentWarning = {
  kind: 'missingPerformanceInstrument'
  trackId: TrackId
  instrumentId: InstrumentId
}

export type MissingPerformanceMixChannelWarning = {
  kind: 'missingPerformanceMixChannel'
  trackId: TrackId
  mixChannelId: MixChannelId
}

export function buildPerformancePlan(
  workspace: Workspace,
  schedule: PlaybackSchedule,
): PerformancePlan {
  const warnings: PerformancePlanWarning[] = [...schedule.warnings]
  const tracks: Record<TrackId, PerformanceTrack> = {}

  const partialTracks = createPerformanceTracks(workspace, schedule.triggers, warnings)

  for (const [trackId, track] of Object.entries(partialTracks)) {
    if (track !== undefined) {
      tracks[trackId] = track
    }
  }

  const triggers = sortPlaybackTriggers(schedule.triggers.filter(
    trigger => tracks[trigger.source.trackId] !== undefined,
  ))

  return {
    endTick: schedule.projectEndTick,
    startTick: triggers[0]?.startTick ?? 0,
    tracks,
    triggers,
    triggerStartTicks: triggers.map(trigger => trigger.startTick),
    warnings,
  }
}

export function createPerformanceTracks(
  workspace: Workspace,
  triggers: PlaybackTrigger[],
  warnings: PerformancePlanWarning[],
): Partial<Record<TrackId, PerformanceTrack>> {
  const tracks: Partial<Record<TrackId, PerformanceTrack>> = {}
  const trackIds = new Set(triggers.map(trigger => trigger.source.trackId))

  for (const trackId of trackIds) {
    const track = selectTrack(workspace, trackId)

    if (track === undefined) {
      warnings.push({ kind: 'missingPerformanceTrack', trackId })
      continue
    }

    const instrument = selectInstrument(workspace, track.instrumentId)
    const mixChannel = selectMixChannel(workspace, track.mixChannelId)

    if (instrument === undefined) {
      warnings.push({
        instrumentId: track.instrumentId,
        kind: 'missingPerformanceInstrument',
        trackId,
      })
    }

    if (mixChannel === undefined) {
      warnings.push({
        kind: 'missingPerformanceMixChannel',
        mixChannelId: track.mixChannelId,
        trackId,
      })
    }

    if (instrument === undefined || mixChannel === undefined) {
      continue
    }

    tracks[trackId] = {
      instrumentId: instrument.id,
      mixChannelId: mixChannel.id,
      trackId,
    }
  }

  return tracks
}

export function sortPlaybackTriggers(
  triggers: PlaybackTrigger[],
): PlaybackTrigger[] {
  return [...triggers].sort((left, right) => {
    if (left.startTick !== right.startTick) {
      return left.startTick - right.startTick
    }

    return left.id.localeCompare(right.id)
  })
}
