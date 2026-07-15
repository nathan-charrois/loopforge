import type { Workspace } from './type'
import { type KeyEvent, type MeterEvent, sortTimelineEventsByTick, type TempoEvent, type TimelineEvent, type TimelineEventId } from '~/domain'
import { type Block, type BlockId, getBlockEndTick, getSectionEndTick, isBlockInRange, isSectionInRange, type Section, type SectionId, sortBlocksByStartTick } from '~/domain/arrangement'
import type { Tick, TickRange } from '~/domain/musicPrimitives'
import type { PatternEvent, PatternEventId } from '~/domain/patternEvents'
import type { Pattern, PatternId } from '~/domain/patterns'
import type { Track, TrackId } from '~/domain/tracks'

export function selectTracks(workspace: Workspace): Track[] {
  return workspace.tracks.allIds.map(trackId => workspace.tracks.byId[trackId])
}

export function selectTrack(workspace: Workspace, trackId: TrackId): Track | undefined {
  return workspace.tracks.byId[trackId]
}

export function selectPatterns(workspace: Workspace): Pattern[] {
  return workspace.patterns.allIds.map(patternId => workspace.patterns.byId[patternId])
}

export function selectPattern(workspace: Workspace, patternId: PatternId): Pattern | undefined {
  return workspace.patterns.byId[patternId]
}

export function selectPatternForBlock(workspace: Workspace, block: Block): Pattern | undefined {
  return workspace.patterns.byId[block.patternId]
}

export function selectBlock(workspace: Workspace, blockId: BlockId): Block | undefined {
  return workspace.arrangement.blocks.find(block => block.id === blockId)
}

export function selectSection(workspace: Workspace, sectionId: SectionId): Section | undefined {
  return workspace.arrangement.sections.find(section => section.id === sectionId)
}

export function selectPatternEvent(
  workspace: Workspace,
  patternId: PatternId,
  patternEventId: PatternEventId,
): PatternEvent | undefined {
  return selectPattern(workspace, patternId)?.events.find(event => event.id === patternEventId)
}

export function selectPatternIdForEvent(
  workspace: Workspace,
  patternEventId: PatternEventId,
): PatternId | undefined {
  for (const patternId of workspace.patterns.allIds) {
    if (selectPatternEvent(workspace, patternId, patternEventId)) {
      return patternId
    }
  }

  return undefined
}

export function selectBlocksForTrack(workspace: Workspace, trackId: TrackId): Block[] {
  return sortBlocksByStartTick(selectBlocksByTrackId(workspace, trackId))
}

export function selectBlocksByTrackId(workspace: Workspace, trackId: TrackId): Block[] {
  return workspace.arrangement.blocks.filter(block => block.trackId === trackId)
}

export function selectBlocksInRange(workspace: Workspace, range: TickRange): Block[] {
  return workspace.arrangement.blocks.filter(block => isBlockInRange(block, range))
}

export function selectSectionsInRange(workspace: Workspace, range: TickRange): Section[] {
  return workspace.arrangement.sections.filter(section => isSectionInRange(section, range))
}

export function selectWorkspaceEndTick(workspace: Workspace): Tick {
  const sectionEndTicks = workspace.arrangement.sections.map(getSectionEndTick)
  const blockEndTicks = workspace.arrangement.blocks.map(getBlockEndTick)

  return Math.max(0, ...sectionEndTicks, ...blockEndTicks)
}

export function selectTimelineEvent(workspace: Workspace, timelineEventId: TimelineEventId): TimelineEvent | undefined {
  return selectTimelineEvents(workspace).find(timelineEvent => timelineEvent.id === timelineEventId)
}

export function selectTimelineEvents(workspace: Workspace): TimelineEvent[] {
  return sortTimelineEventsByTick([
    ...workspace.timeline.tempoEvents,
    ...workspace.timeline.meterEvents,
    ...workspace.timeline.keyEvents,
  ])
}

export function selectTimelineEventIds(workspace: Workspace): TimelineEventId[] {
  return selectTimelineEvents(workspace).map(timelineEvent => timelineEvent.id)
}

export function selectTempoEvents(workspace: Workspace, tick: Tick): TempoEvent | undefined {
  return workspace.timeline.tempoEvents.find(event => event.tick === tick)
}

export function selectMeterEvents(workspace: Workspace, tick: Tick): MeterEvent | undefined {
  return workspace.timeline.meterEvents.find(event => event.tick === tick)
}

export function selectKeyEvents(workspace: Workspace, tick: Tick): KeyEvent | undefined {
  return workspace.timeline.keyEvents.find(event => event.tick === tick)
}
