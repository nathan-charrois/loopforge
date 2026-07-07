import type { Workspace } from './workspace'
import { type Block, getBlockEndTick, getBlocksForTrack } from '~/domain/arrangement'
import type { Tick } from '~/domain/musicPrimitives'
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

export function selectBlocksForTrack(workspace: Workspace, trackId: TrackId): Block[] {
  return getBlocksForTrack(workspace.arrangement, trackId)
}

export function selectWorkspaceEndTick(workspace: Workspace): Tick {
  const sectionEndTicks = workspace.arrangement.sections.map(section => section.startTick + section.lengthTicks)
  const blockEndTicks = workspace.arrangement.blocks.map(getBlockEndTick)

  return Math.max(0, ...sectionEndTicks, ...blockEndTicks)
}

export function selectHighestBlockEndTick(workspace: Workspace): Tick {
  return workspace.arrangement.blocks.reduce((latestEndTick, block) => Math.max(latestEndTick, getBlockEndTick(block)), 0)
}
