import type { ClipboardState, Editor, InspectorState, SelectionState, ViewportState } from './type'
import {
  type Block,
  createBlock,
  createSection,
  type DurationTicks,
  type Section,
  type Tick,
  type TrackId,
} from '~/domain'
import { type Workspace } from '~/store/workspace'

export function createSelectionState(): SelectionState {
  return {
    selectedBlockIds: [],
    selectedPatternEventIds: [],
    selectedSectionIds: [],
    selectedTimelineEventIds: [],
    selectedTrackIds: [],
  }
}

export function createClipboardState(): ClipboardState {
  return {
    blockIds: [],
    patternEventIds: [],
  }
}

export function createInspectorState(): InspectorState {
  return {
    open: false,
  }
}

export function createEditor(input: Partial<Editor> = {}): Editor {
  return {
    activeTool: input.activeTool ?? 'select',
    clipboard: input.clipboard ?? createClipboardState(),
    focusedBlockId: input.focusedBlockId,
    hoveredChord: input.hoveredChord,
    inspector: input.inspector ?? createInspectorState(),
    selection: input.selection ?? createSelectionState(),
  }
}

export function createViewportState(input: Partial<ViewportState> = {}): ViewportState {
  return {
    scrollX: input.scrollX ?? 0,
    scrollY: input.scrollY ?? 0,
    pixelsPerTick: input.pixelsPerTick ?? 0.1,
    minPixelsPerTick: input.minPixelsPerTick ?? 0.035,
    maxPixelsPerTick: input.maxPixelsPerTick ?? 0.42,
    laneHeight: input.laneHeight ?? 72,
    sectionLaneHeight: input.sectionLaneHeight ?? 44,
    rulerHeight: input.rulerHeight ?? 82,
  }
}

export function createArrangementBlockDraft(
  workspace: Workspace,
  input: {
    lengthTicks: DurationTicks
    startTick: Tick
    trackId: TrackId
  },
): Block {
  const track = workspace.tracks.byId[input.trackId]
  const pattern = workspace.patterns.allIds
    .map(patternId => workspace.patterns.byId[patternId])
    .find(currentPattern => currentPattern !== undefined && track?.accepts.includes(currentPattern.kind))

  if (track === undefined) {
    throw new Error(`Track ${input.trackId} does not exist.`)
  }

  if (pattern === undefined) {
    throw new Error(`Track ${track.name} has no compatible pattern.`)
  }

  const blockNumber = workspace.arrangement.blocks.length + 1

  return createBlock({
    color: track.color,
    id: createDraftEntityId('block', workspace.arrangement.blocks.map(block => block.id)),
    lengthTicks: input.lengthTicks,
    name: `Block ${blockNumber}`,
    patternId: pattern.id,
    playbackMode: 'loop',
    startTick: input.startTick,
    trackId: track.id,
  })
}

export function createArrangementSectionDraft(
  workspace: Workspace,
  input: {
    lengthTicks: DurationTicks
    startTick: Tick
  },
): Section {
  const sectionNumber = workspace.arrangement.sections.length + 1

  return createSection({
    id: createDraftEntityId('section', workspace.arrangement.sections.map(section => section.id)),
    lengthTicks: input.lengthTicks,
    name: `Section ${sectionNumber}`,
    startTick: input.startTick,
  })
}

function createDraftEntityId(prefix: string, existingIds: readonly string[]): string {
  const existingIdSet = new Set(existingIds)
  let index = existingIds.length + 1
  let id = `${prefix}_${index}`

  while (existingIdSet.has(id)) {
    index += 1
    id = `${prefix}_${index}`
  }

  return id
}
