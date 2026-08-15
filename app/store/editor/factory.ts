import { DEFAULT_MAX_PIXELS_PER_TICK, DEFAULT_MIN_PIXELS_PER_TICK, DEFAULT_PIXELS_PER_TICK } from './constants'
import { snapTimelineRange } from './snap'
import type { ClipboardState, Editor, InspectorState, SelectionState, ViewportState } from './type'
import {
  type Block,
  createBlock,
  createDrumHitEvent,
  createNoteEvent,
  createPattern,
  createPositiveDurationTicks,
  createSection,
  createTick,
  createTrack,
  type DrumHitEvent,
  type DrumPiece,
  type DurationTicks,
  getBarLengthTicksAtTick,
  getBlockEndTick,
  getPatternKindForTrack,
  getSectionEndTick,
  type MidiNote,
  type NoteEvent,
  type Pattern,
  type PatternId,
  type Section,
  type Tick,
  type TickRange,
  type Track,
  type TrackId,
} from '~/domain'
import {
  selectBlock,
  selectBlocksInRange,
  selectPatternEventIds,
  selectSection,
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

export function createSelectionFromTickRange(
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

export function createTickRangeFromSelection(
  workspace: Workspace,
  editor: Editor,
): TickRange {
  const tickRange: TickRange = {
    startTick: Number.POSITIVE_INFINITY,
    endTick: 0,
  }

  for (const blockId of editor.selection.selectedBlockIds) {
    const block = selectBlock(workspace, blockId)

    if (block !== undefined) {
      tickRange.startTick = Math.min(tickRange.startTick, block.startTick)
      tickRange.endTick = Math.max(tickRange.endTick, getBlockEndTick(block))
    }
  }

  for (const sectionId of editor.selection.selectedSectionIds) {
    const section = selectSection(workspace, sectionId)

    if (section !== undefined) {
      tickRange.startTick = Math.min(tickRange.startTick, section.startTick)
      tickRange.endTick = Math.max(tickRange.endTick, getSectionEndTick(section))
    }
  }

  return tickRange
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
    id?: PatternId
    lengthTicks?: DurationTicks
    trackId: TrackId
  },
): Pattern {
  const track = workspace.tracks.byId[input.trackId]

  if (track === undefined) {
    throw new Error(`Track ${input.trackId} does not exist.`)
  }

  const patternNumber = workspace.patterns.allIds.length + 1

  return createPattern({
    id: input.id ?? createDraftEntityId('pattern', workspace.patterns.allIds),
    kind: getPatternKindForTrack(track),
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
  patternId,
  startTick,
  lengthTicks,
  pitch,
  piece,
}: {
  workspace: Workspace
  lengthTicks: DurationTicks
  patternId: PatternId
  startTick: Tick
  pitch?: MidiNote
  piece?: DrumPiece
}): DrumHitEvent | NoteEvent {
  const pattern = workspace.patterns.byId[patternId]

  if (pattern === undefined) {
    throw new Error(`Pattern ${patternId} does not exist.`)
  }

  const timeTick = createTick(startTick)
  const existingEventIds = selectPatternEventIds(workspace)

  switch (pattern.kind) {
    case 'note':
      const durationTicks = createPositiveDurationTicks(Math.min(
        lengthTicks,
        pattern.lengthTicks - timeTick,
      ))

      return createNoteEvent({
        id: createDraftEntityId('event_note', existingEventIds),
        durationTicks,
        timeTick,
        pitch,
      })
    case 'drum':
      return createDrumHitEvent({
        id: createDraftEntityId('event_drum', existingEventIds),
        timeTick,
        piece,
      })
  }

  throw new Error(`Pattern kind ${pattern.kind} does not exist.`)
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
