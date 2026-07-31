import { type Block, createTick, type DurationTicks, getBlockEndTick, isTickInRange, type Tick } from '~/domain'

export type PlayheadMap = {
  getLocalTick(transportTick: Tick): Tick | undefined
  getTransportTick(localTick: Tick, currentTransportTick: Tick): Tick
}

export function createDefaultPlayheadMap(): PlayheadMap {
  return {
    getLocalTick: transportTick => transportTick,
    getTransportTick: localTick => localTick,
  }
}

export function createPatternPlayheadMap(
  block: Block,
  patternLengthTicks: DurationTicks,
): PlayheadMap {
  return {
    getLocalTick(transportTick) {
      return getPatternTickAtTransportTick(
        block,
        patternLengthTicks,
        transportTick,
      )
    },

    getTransportTick(localTick, currentTransportTick) {
      return getTransportTickForPatternTick(
        block,
        patternLengthTicks,
        localTick,
        currentTransportTick,
      )
    },
  }
}

function getPatternTickAtTransportTick(
  block: Block,
  patternLengthTicks: DurationTicks,
  transportTick: Tick,
): Tick | undefined {
  if (
    patternLengthTicks <= 0
    || transportTick < block.startTick
    || transportTick >= getBlockEndTick(block)
  ) {
    return undefined
  }

  const blockTick = transportTick - block.startTick

  switch (block.playbackMode) {
    case 'loop':
      return createTick(blockTick % patternLengthTicks)

    case 'oneShot':
      return blockTick < patternLengthTicks
        ? createTick(blockTick)
        : undefined

    case 'stretch':
      return createTick(Math.min(
        patternLengthTicks - 1,
        Math.floor(
          blockTick * patternLengthTicks / block.lengthTicks,
        ),
      ))
  }
}

function getTransportTickForPatternTick(
  block: Block,
  patternLengthTicks: DurationTicks,
  panelTick: Tick,
  currentTransportTick: Tick,
): Tick {
  const blockEndTick = getBlockEndTick(block)
  const clampedPanelTick = createTick(
    Math.max(0, Math.min(panelTick, patternLengthTicks - 1)),
  )

  switch (block.playbackMode) {
    case 'oneShot':
      return createTick(Math.min(
        block.startTick + clampedPanelTick,
        blockEndTick - 1,
      ))

    case 'stretch':
      return createTick(Math.min(
        blockEndTick - 1,
        block.startTick + Math.floor(
          clampedPanelTick * block.lengthTicks / patternLengthTicks,
        ),
      ))

    case 'loop':
      const isInsideBlock = isTickInRange(currentTransportTick, {
        startTick: block.startTick,
        endTick: getBlockEndTick(block),
      })

      const repetitionIndex = isInsideBlock
        ? Math.floor((currentTransportTick - block.startTick) / patternLengthTicks)
        : 0

      const candidateTick
        = block.startTick
          + repetitionIndex * patternLengthTicks
          + panelTick

      return createTick(Math.min(
        candidateTick,
        blockEndTick - 1,
      ))
  }
}
