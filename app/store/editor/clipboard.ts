import type { ClipboardState, SelectionState } from '~/domain'

export function createClipboardFromSelection(selection: SelectionState): ClipboardState {
  return {
    blockIds: [...selection.selectedBlockIds],
    patternEventIds: [...selection.selectedPatternEventIds],
  }
}

export function hasClipboardContent(clipboard: ClipboardState): boolean {
  return clipboard.blockIds.length > 0 || clipboard.patternEventIds.length > 0
}
