import type { ClipboardState, EditorState } from './type'

export function copySelectionToClipboard(editorState: EditorState): ClipboardState {
  return {
    blockIds: [...editorState.selection.selectedBlockIds],
    patternEventIds: [...editorState.selection.selectedPatternEventIds],
  }
}

export function hasClipboardContent(clipboard: ClipboardState): boolean {
  return clipboard.blockIds.length > 0 || clipboard.patternEventIds.length > 0
}
