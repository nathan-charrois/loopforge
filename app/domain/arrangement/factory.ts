import { createPositiveDurationTicks, createTick, type DurationTicks, type Tick } from '../musicPrimitives'
import type { PatternId } from '../patterns'
import type { TrackId } from '../tracks'
import { DEFAULT_SECTION_LENGTH_TICKS } from './constants'
import type { Arrangement, Block, BlockId, BlockPlaybackMode, Section, SectionId } from './index'

export function createSection(input: {
  id: SectionId
  name: string
  startTick?: Tick
  lengthTicks?: DurationTicks
}): Section {
  return {
    id: input.id,
    lengthTicks: createPositiveDurationTicks(input.lengthTicks ?? DEFAULT_SECTION_LENGTH_TICKS),
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
