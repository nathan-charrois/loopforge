import { createPositiveDurationTicks, createTick, type DurationTicks, type Tick } from '../musicPrimitives'
import type { PatternId } from '../patterns'
import { PPQ } from '../timeline'
import type { TrackId } from '../tracks'

export type SectionId = string
export type BlockId = string
export type BlockPlaybackMode = 'loop' | 'oneShot' | 'stretch'

export type Section = {
  id: SectionId
  name: string
  startTick: Tick
  lengthTicks: DurationTicks
  loopEnabled: boolean
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

export const DEFAULT_SECTION_LENGTH_TICKS = 16 * 4 * PPQ

export function createSection(input: {
  id: SectionId
  name: string
  startTick?: Tick
  lengthTicks?: DurationTicks
  loopEnabled?: boolean
}): Section {
  return {
    id: input.id,
    lengthTicks: createPositiveDurationTicks(input.lengthTicks ?? DEFAULT_SECTION_LENGTH_TICKS),
    loopEnabled: input.loopEnabled ?? false,
    name: input.name,
    startTick: createTick(input.startTick ?? 0),
  }
}

export function createBlock(input: {
  id: BlockId
  trackId: TrackId
  patternId: PatternId
  startTick?: Tick
  lengthTicks: DurationTicks
  muted?: boolean
  color?: string
  name?: string
  playbackMode?: BlockPlaybackMode
}): Block {
  return {
    color: input.color ?? '#6c6f7d',
    id: input.id,
    lengthTicks: createPositiveDurationTicks(input.lengthTicks),
    muted: input.muted ?? false,
    name: input.name ?? 'Untitled Block',
    patternId: input.patternId,
    playbackMode: input.playbackMode ?? 'loop',
    startTick: createTick(input.startTick ?? 0),
    trackId: input.trackId,
  }
}

export function createDefaultArrangement(): Arrangement {
  return {
    blocks: [],
    sections: [
      createSection({
        id: 'section_intro',
        name: 'Intro',
      }),
    ],
  }
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
