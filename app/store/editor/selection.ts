import type { SelectionState } from './types'

export function hasAnySelection(selection: SelectionState): boolean {
  return selection.selectedBlockIds.length > 0
    || selection.selectedSectionIds.length > 0
    || selection.selectedPatternEventIds.length > 0
    || selection.selectedTrackIds.length > 0
}

export function toggleSelectionIds(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter(currentId => currentId !== id)
    : [...ids, id]
}
