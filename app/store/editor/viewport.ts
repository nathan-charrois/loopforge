import type { ViewportState } from './type'
import type { Tick } from '~/domain'

export function tickToX(viewport: ViewportState, tick: Tick): number {
  return tick * viewport.pixelsPerTick
}

export function xToTick(viewport: ViewportState, x: number): Tick {
  return Math.max(0, Math.round(x / viewport.pixelsPerTick))
}

export function zoomViewport(
  viewport: ViewportState,
  input: {
    anchorX?: number
    delta?: number
    multiplier?: number
  },
): ViewportState {
  const nextPixelsPerTick = clampPixelsPerTick(
    viewport,
    input.multiplier === undefined
      ? viewport.pixelsPerTick + (input.delta ?? 0)
      : viewport.pixelsPerTick * input.multiplier,
  )
  const anchorX = input.anchorX ?? 0
  const tickAtAnchor = (viewport.scrollX + anchorX) / viewport.pixelsPerTick

  return clampViewport({
    ...viewport,
    pixelsPerTick: nextPixelsPerTick,
    scrollX: Math.max(0, (tickAtAnchor * nextPixelsPerTick) - anchorX),
  })
}

function clampViewport(viewport: ViewportState): ViewportState {
  return {
    ...viewport,
    pixelsPerTick: clampPixelsPerTick(viewport, viewport.pixelsPerTick),
    scrollX: Math.max(0, viewport.scrollX),
    scrollY: Math.max(0, viewport.scrollY),
  }
}

function clampPixelsPerTick(viewport: ViewportState, pixelsPerTick: number): number {
  return Math.min(viewport.maxPixelsPerTick, Math.max(viewport.minPixelsPerTick, pixelsPerTick))
}
