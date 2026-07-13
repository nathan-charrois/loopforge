import { createPositiveDurationTicks, createTick, type DurationTicks, isTickRangeOverlap, type Tick, type TickRange } from '../musicPrimitives'
import type { PatternId } from '../patterns'
import type { TrackId } from '../tracks'
import { BLOCK_PLAYBACK_MODES } from './constants'

export type SectionId = string
export type BlockId = string
export type BlockPlaybackMode = typeof BLOCK_PLAYBACK_MODES[number]

export type Section = {
  id: SectionId
  name: string
  startTick: Tick
  lengthTicks: DurationTicks
}

export type Block = {
  id: BlockId
  trackId: TrackId
  patternId: PatternId
  startTick: Tick
  lengthTicks: DurationTicks
  muted: boolean
  color: string
  name: string
  playbackMode: BlockPlaybackMode
}

export type Arrangement = {
  sections: Section[]
  blocks: Block[]
}

export function getBlockEndTick(block: Block): Tick {
  return block.startTick + block.lengthTicks
}

export function getSectionEndTick(section: Section): Tick {
  return section.startTick + section.lengthTicks
}

export function sortBlocksByStartTick(blocks: readonly Block[]): Block[] {
  return [...blocks].sort((left, right) => {
    if (left.startTick !== right.startTick) {
      return left.startTick - right.startTick
    }

    return left.id.localeCompare(right.id)
  })
}

export function moveBlock(block: Block, startTick: Tick): Block {
  return {
    ...block,
    startTick: createTick(startTick),
  }
}

export function resizeBlock(block: Block, lengthTicks: DurationTicks): Block {
  return {
    ...block,
    lengthTicks: createPositiveDurationTicks(lengthTicks),
  }
}

export function isBlockInRange(block: Block, range: TickRange): boolean {
  return isTickRangeOverlap({
    startTick: block.startTick,
    endTick: getBlockEndTick(block),
  }, range)
}

export function isSectionInRange(section: Section, range: TickRange): boolean {
  return isTickRangeOverlap({
    startTick: section.startTick,
    endTick: getSectionEndTick(section),
  }, range)
}
