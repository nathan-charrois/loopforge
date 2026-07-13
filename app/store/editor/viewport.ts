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
