import { createPositiveDurationTicks, createTick, type DurationTicks, type Tick } from '../musicPrimitives'
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

export function sortBlocksByStartTick(blocks: readonly Block[]): Block[] {
  return [...blocks].sort((left, right) => {
    if (left.startTick !== right.startTick) {
      return left.startTick - right.startTick
    }

    return left.id.localeCompare(right.id)
  })
}

export function getBlocksForTrack(arrangement: Arrangement, trackId: TrackId): Block[] {
  return sortBlocksByStartTick(arrangement.blocks.filter(block => block.trackId === trackId))
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

export function isBlockWithinSection(block: Block, section: Section): boolean {
  const blockEndTick = getBlockEndTick(block)
  const sectionEndTick = section.startTick + section.lengthTicks

  return block.startTick >= section.startTick && blockEndTick <= sectionEndTick
}

export * from './constants'
export * from './factory'
