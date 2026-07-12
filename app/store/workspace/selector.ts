import type { Workspace } from './workspace'
import { type Block, type BlockId, getBlockEndTick, getBlocksForTrack, type Section, type SectionId } from '~/domain/arrangement'
import type { Tick } from '~/domain/musicPrimitives'
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

export function selectPatternEventContext(
  workspace: Workspace,
  patternEventId: PatternEventId,
): { patternId: PatternId } | undefined {
  for (const patternId of workspace.patterns.allIds) {
    const pattern = workspace.patterns.byId[patternId]

    if (pattern?.events.some(event => event.id === patternEventId)) {
      return { patternId }
    }
  }

  return undefined
}

export function selectBlocksForTrack(workspace: Workspace, trackId: TrackId): Block[] {
  return getBlocksForTrack(workspace.arrangement, trackId)
}

export function selectBlocksInRange(workspace: Workspace, startTick: Tick, endTick: Tick): Block[] {
  return workspace.arrangement.blocks.filter(block => rangesOverlap(
    block.startTick,
    getBlockEndTick(block),
    startTick,
    endTick,
  ))
}

export function selectSectionsInRange(workspace: Workspace, startTick: Tick, endTick: Tick): Section[] {
  return workspace.arrangement.sections.filter(section => rangesOverlap(
    section.startTick,
    section.startTick + section.lengthTicks,
    startTick,
    endTick,
  ))
}

export function selectWorkspaceEndTick(workspace: Workspace): Tick {
  const sectionEndTicks = workspace.arrangement.sections.map(section => section.startTick + section.lengthTicks)
  const blockEndTicks = workspace.arrangement.blocks.map(getBlockEndTick)

  return Math.max(0, ...sectionEndTicks, ...blockEndTicks)
}

export function selectHighestBlockEndTick(workspace: Workspace): Tick {
  return workspace.arrangement.blocks.reduce((latestEndTick, block) => Math.max(latestEndTick, getBlockEndTick(block)), 0)
}

function rangesOverlap(leftStart: Tick, leftEnd: Tick, rightStart: Tick, rightEnd: Tick): boolean {
  return leftStart < rightEnd && rightStart < leftEnd
}
