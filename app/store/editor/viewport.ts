import type { ViewportState } from './type'
import type { Tick } from '~/domain'

export function tickToX(
  pixelsPerTick: number,
  tick: Tick,
): number {
  return tick * pixelsPerTick
}

export function xToTick(
  pixelsPerTick: number,
  x: number,
): Tick {
  return x / pixelsPerTick
}

export function zoomViewport(
  viewport: ViewportState,
  anchorX: number,
  multiplier: number,
): ViewportState {
  const pixelsPerTick = getZoomedPixlesPerTick(viewport, multiplier)
  const anchorTick = xToTick(viewport.pixelsPerTick, viewport.scrollX + anchorX)
  const scrollX = Math.max(0, tickToX(pixelsPerTick, anchorTick) - anchorX)

  return {
    ...viewport,
    pixelsPerTick,
    scrollX,
  }
}

function getZoomedPixlesPerTick(
  viewport: ViewportState,
  multiplier: number,
): number {
  return clampPixelsPerTick(
    viewport.pixelsPerTick * multiplier,
    viewport.minPixelsPerTick,
    viewport.maxPixelsPerTick,
  )
}

function clampPixelsPerTick(
  pixelsPerTick: number,
  minPixelsPerTick: number,
  maxPixelsPerTick: number,
): number {
  return Math.min(maxPixelsPerTick, Math.max(minPixelsPerTick, pixelsPerTick))
}
