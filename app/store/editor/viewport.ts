import type { Tick } from '~/domain'

export type TimelineViewportState = {
  scrollX: number
  scrollY: number
  pixelsPerTick: number
  minPixelsPerTick: number
  maxPixelsPerTick: number
  laneHeight: number
  sectionLaneHeight: number
  rulerHeight: number
}

export type VisibleTimelineRange = {
  startTick: Tick
  endTick: Tick
}

export function createDefaultTimelineViewportState(
  input: Partial<TimelineViewportState> = {},
): TimelineViewportState {
  return {
    laneHeight: input.laneHeight ?? 72,
    maxPixelsPerTick: input.maxPixelsPerTick ?? 0.42,
    minPixelsPerTick: input.minPixelsPerTick ?? 0.035,
    pixelsPerTick: input.pixelsPerTick ?? 0.1,
    rulerHeight: input.rulerHeight ?? 82,
    scrollX: input.scrollX ?? 0,
    scrollY: input.scrollY ?? 0,
    sectionLaneHeight: input.sectionLaneHeight ?? 44,
  }
}

export function tickToPixel(viewport: TimelineViewportState, tick: Tick): number {
  return tick * viewport.pixelsPerTick
}

export function pixelToTick(viewport: TimelineViewportState, pixel: number): Tick {
  return Math.max(0, Math.round(pixel / viewport.pixelsPerTick))
}

export function getVisibleTimelineRange(
  viewport: TimelineViewportState,
  widthPixels = 0,
): VisibleTimelineRange {
  return {
    endTick: pixelToTick(viewport, viewport.scrollX + Math.max(0, widthPixels)),
    startTick: pixelToTick(viewport, viewport.scrollX),
  }
}

export function zoomTimelineViewport(
  viewport: TimelineViewportState,
  zoomMultiplier: number,
  anchorPixel = 0,
): TimelineViewportState {
  const nextPixelsPerTick = clamp(
    viewport.pixelsPerTick * zoomMultiplier,
    viewport.minPixelsPerTick,
    viewport.maxPixelsPerTick,
  )

  if (nextPixelsPerTick === viewport.pixelsPerTick) {
    return viewport
  }

  const anchorTick = (viewport.scrollX + Math.max(0, anchorPixel)) / viewport.pixelsPerTick

  return {
    ...viewport,
    pixelsPerTick: nextPixelsPerTick,
    scrollX: Math.max(0, (anchorTick * nextPixelsPerTick) - Math.max(0, anchorPixel)),
  }
}

export function scrollTimelineViewport(
  viewport: TimelineViewportState,
  scroll: Partial<Pick<TimelineViewportState, 'scrollX' | 'scrollY'>>,
): TimelineViewportState {
  return {
    ...viewport,
    scrollX: Math.max(0, scroll.scrollX ?? viewport.scrollX),
    scrollY: Math.max(0, scroll.scrollY ?? viewport.scrollY),
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
