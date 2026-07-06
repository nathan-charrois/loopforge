import type { BlockId, SectionId } from '../arrangement'
import type { ChordSymbol } from '../harmony'
import type { PatternEventId } from '../patternEvents'
import { createDefaultTransportState, type TransportState } from '../playback'
import type { TrackId } from '../tracks'

export type ActiveTool = 'select' | 'draw' | 'erase' | 'split' | 'resize' | 'audition'
export type InspectorPanel = 'project' | 'track' | 'block' | 'pattern' | 'event'

export type SelectionState = {
  selectedBlockIds: BlockId[]
  selectedPatternEventIds: PatternEventId[]
  selectedTrackIds: TrackId[]
  selectedSectionIds: SectionId[]
}

export type ClipboardState = {
  blockIds: BlockId[]
  patternEventIds: PatternEventId[]
}

export type InspectorState = {
  open: boolean
  panel?: InspectorPanel
}

export type EditorState = {
  activeTool: ActiveTool
  clipboard: ClipboardState
  hoveredChord?: ChordSymbol
  inspector: InspectorState
  selection: SelectionState
  transport: TransportState
}

export function createDefaultSelectionState(): SelectionState {
  return {
    selectedBlockIds: [],
    selectedPatternEventIds: [],
    selectedSectionIds: [],
    selectedTrackIds: [],
  }
}

export function createDefaultClipboardState(): ClipboardState {
  return {
    blockIds: [],
    patternEventIds: [],
  }
}

export function createDefaultInspectorState(): InspectorState {
  return {
    open: false,
  }
}

export function createDefaultEditorState(input: Partial<EditorState> = {}): EditorState {
  return {
    activeTool: input.activeTool ?? 'select',
    clipboard: input.clipboard ?? createDefaultClipboardState(),
    hoveredChord: input.hoveredChord,
    inspector: input.inspector ?? createDefaultInspectorState(),
    selection: input.selection ?? createDefaultSelectionState(),
    transport: input.transport ?? createDefaultTransportState(),
  }
}

export function clearSelection(selection: SelectionState): SelectionState {
  return {
    ...selection,
    selectedBlockIds: [],
    selectedPatternEventIds: [],
    selectedSectionIds: [],
    selectedTrackIds: [],
  }
}

export function hasSelection(selection: SelectionState): boolean {
  return selection.selectedBlockIds.length > 0
    || selection.selectedPatternEventIds.length > 0
    || selection.selectedTrackIds.length > 0
    || selection.selectedSectionIds.length > 0
}
