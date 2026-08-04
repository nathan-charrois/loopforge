import { useMemo } from 'react'

import {
  type Block,
  getBlockEndTick,
  sortBlocksByStartTick,
  type Tick,
} from '~/domain'

const BLOCK_PEEK_PX = 6
const MAX_BLOCK_Z_INDEX = 6

export type StackedBlock = {
  block: Block
  offset: number
  zIndex: number
}

export function useBlockStack(
  blocks: readonly Block[],
  maxOffset: number,
): StackedBlock[] {
  return useMemo(() => {
    const stackEndTicks: Tick[] = []
    const blocksWithStackIndex = sortBlocksByStartTick(blocks).map((block) => {
      const availableStackIndex = stackEndTicks.findIndex(
        endTick => endTick <= block.startTick,
      )
      const stackIndex = availableStackIndex === -1
        ? stackEndTicks.length
        : availableStackIndex

      stackEndTicks[stackIndex] = getBlockEndTick(block)

      return { block, stackIndex }
    })

    const offsetStep = stackEndTicks.length > 1
      ? Math.min(BLOCK_PEEK_PX, Math.max(0, maxOffset) / (stackEndTicks.length - 1))
      : 0

    return blocksWithStackIndex.map(({ block, stackIndex }) => ({
      block,
      offset: stackIndex * offsetStep,
      zIndex: Math.min(MAX_BLOCK_Z_INDEX, stackIndex + 2),
    }))
  }, [blocks, maxOffset])
}
