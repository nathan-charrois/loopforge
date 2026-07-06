import type { BlockId, SectionId } from '../arrangement'
import type { ChordSymbol } from '../harmony'
import type { PatternEventId } from '../patternEvents'
import type { TrackId } from '../tracks'
import type { ActiveTool, InspectorPanel } from './constants'

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
