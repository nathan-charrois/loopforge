import type { ClipboardState, Editor } from './type'

export function copySelectionToClipboard(editor: Editor): ClipboardState {
  return {
    blockIds: [...editor.selection.selectedBlockIds],
    patternEventIds: [...editor.selection.selectedPatternEventIds],
  }
}

export function hasClipboardContent(clipboard: ClipboardState): boolean {
  return clipboard.blockIds.length > 0 || clipboard.patternEventIds.length > 0
}
