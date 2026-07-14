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
  anchorX: number,
  multiplier: number,
): ViewportState {
  const nextPixelsPerTick = getNextPixelsPerTick(viewport, multiplier)
  const pixelsPerTick = clampPixelsPerTick(viewport, nextPixelsPerTick)
  const scrollX = getScrollPosition(viewport, pixelsPerTick, anchorX)

  return clampViewport({ ...viewport, pixelsPerTick, scrollX })
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

function getNextPixelsPerTick(viewport: ViewportState, multiplier: number): number {
  if (multiplier) {
    return viewport.pixelsPerTick * multiplier
  }

  return viewport.pixelsPerTick
}

function getScrollPosition(viewport: ViewportState, nextPixelsPerTick: number, anchorX: number): number {
  const tickAtAnchor = (viewport.scrollX + anchorX) / viewport.pixelsPerTick

  return Math.max(0, (tickAtAnchor * nextPixelsPerTick) - anchorX)
}
