import { DEFAULT_MAX_PIXELS_PER_TICK, DEFAULT_MIN_PIXELS_PER_TICK, DEFAULT_PIXELS_PER_TICK } from './constants'
import { snapTimelineRange } from './snap'
import type { ClipboardState, Editor, InspectorState, SelectionState, ViewportState } from './type'
import {
  type Block,
  createBlock,
  createNoteEvent,
  createPattern,
  createPositiveDurationTicks,
  createSection,
  createTick,
  createTrack,
  type DurationTicks,
  getBarLengthTicksAtTick,
  type MidiNote,
  type NoteEvent,
  type Pattern,
  type PatternId,
  type PatternKind,
  type Section,
  type Tick,
  type Track,
  type TrackId,
} from '~/domain'
import {
  selectBlocksInRange,
  selectPatternEventIds,
  selectSectionsInRange,
  selectTrackIds,
  type Workspace,
} from '~/store/workspace'

export function createSelectionState(): SelectionState {
  return {
    selectedBlockIds: [],
    selectedInstrumentIds: [],
    selectedMixChannelIds: [],
    selectedPatternIds: [],
    selectedPatternEventIds: [],
    selectedSectionIds: [],
    selectedTimelineEventIds: [],
    selectedTrackIds: [],
  }
}

export function createRangeSelectionState(
  workspace: Workspace,
  startTick: Tick,
  endTick: Tick,
  startRow: number,
  currentRow: number,
): SelectionState {
  const range = snapTimelineRange(workspace.timeline, startTick, endTick)
  const bounds = {
    endTick: range.startTick + range.lengthTicks,
    startTick: range.startTick,
  }
  const firstRow = Math.max(0, Math.min(startRow, currentRow))
  const lastRow = Math.min(workspace.tracks.allIds.length, Math.max(startRow, currentRow))
  const trackIds = new Set(workspace.tracks.allIds.slice(
    Math.max(0, firstRow - 1),
    lastRow,
  ))

  return {
    ...createSelectionState(),
    selectedBlockIds:
      selectBlocksInRange(workspace, bounds)
        .filter(block => trackIds.has(block.trackId))
        .map(block => block.id),
    selectedSectionIds: firstRow === 0
      ? selectSectionsInRange(workspace, bounds).map(section => section.id)
      : [],
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
    activePatternPanelTool: input.activePatternPanelTool ?? 'select',
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
    pixelsPerTick: input.pixelsPerTick ?? DEFAULT_PIXELS_PER_TICK,
    minPixelsPerTick: input.minPixelsPerTick ?? DEFAULT_MIN_PIXELS_PER_TICK,
    maxPixelsPerTick: input.maxPixelsPerTick ?? DEFAULT_MAX_PIXELS_PER_TICK,
    laneHeight: input.laneHeight ?? 72,
    sectionLaneHeight: input.sectionLaneHeight ?? 45,
    rulerHeight: input.rulerHeight ?? 100,
  }
}

export function createArrangementBlockDraft(
  workspace: Workspace,
  input: {
    lengthTicks: DurationTicks
    startTick: Tick
    trackId: TrackId
    patternId: PatternId
  },
): Block {
  const track = workspace.tracks.byId[input.trackId]
  if (track === undefined) {
    throw new Error(`Track ${input.trackId} does not exist.`)
  }

  const blockNumber = workspace.arrangement.blocks.length + 1

  return createBlock({
    color: track.color,
    id: createDraftEntityId('block', workspace.arrangement.blocks.map(block => block.id)),
    lengthTicks: input.lengthTicks,
    name: `Block ${blockNumber}`,
    playbackMode: 'loop',
    startTick: input.startTick,
    trackId: track.id,
    patternId: input.patternId,
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

export function createArrangementPatternDraft(
  workspace: Workspace,
  input: {
    kind?: PatternKind
    lengthTicks?: DurationTicks
  } = {},
): Pattern {
  const patternNumber = workspace.patterns.allIds.length + 1

  return createPattern({
    id: createDraftEntityId('pattern', workspace.patterns.allIds),
    kind: input.kind ?? 'note',
    lengthTicks: input.lengthTicks ?? getBarLengthTicksAtTick(workspace.timeline, 0),
    name: `Pattern ${patternNumber}`,
  })
}

export function createArrangementTrackDraft(workspace: Workspace): Track {
  const existingIds = selectTrackIds(workspace)
  const trackId = createDraftEntityId('track', existingIds)

  return createTrack({
    id: trackId,
    name: `Track ${trackId}`,
    role: 'chords',
  })
}

export function createArrangementPatternEventDraft({
  workspace,
  lengthTicks,
  patternId,
  pitch,
  startTick,
}: {
  workspace: Workspace
  lengthTicks: DurationTicks
  patternId: PatternId
  pitch: MidiNote
  startTick: Tick
}): NoteEvent {
  const pattern = workspace.patterns.byId[patternId]

  if (pattern === undefined) {
    throw new Error(`Pattern ${patternId} does not exist.`)
  }

  if (pattern.kind !== 'note') {
    throw new Error(`Pattern ${pattern.id} does not accept note events.`)
  }

  const timeTick = createTick(Math.min(
    startTick,
    pattern.lengthTicks - 1,
  ))

  const durationTicks = createPositiveDurationTicks(Math.min(
    lengthTicks,
    pattern.lengthTicks - timeTick,
  ))

  const existingEventIds = selectPatternEventIds(workspace)

  return createNoteEvent({
    id: createDraftEntityId('event_note', existingEventIds),
    durationTicks,
    pitch,
    timeTick,
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
