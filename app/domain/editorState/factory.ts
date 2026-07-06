import type { ClipboardState, EditorState, InspectorState, SelectionState } from './editorState'

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
  }
}
