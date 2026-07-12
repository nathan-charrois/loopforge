import { clearSelection, type SelectionState } from '~/domain'

export function selectBlockInSelection(
  selection: SelectionState,
  blockId: string,
  additive: boolean,
): SelectionState {
  if (additive) {
    return {
      ...selection,
      selectedBlockIds: toggleId(selection.selectedBlockIds, blockId),
    }
  }

  return {
    ...clearSelection(selection),
    selectedBlockIds: [blockId],
  }
}

export function selectSectionInSelection(
  selection: SelectionState,
  sectionId: string,
  additive: boolean,
): SelectionState {
  if (additive) {
    return {
      ...selection,
      selectedSectionIds: toggleId(selection.selectedSectionIds, sectionId),
    }
  }

  return {
    ...clearSelection(selection),
    selectedSectionIds: [sectionId],
  }
}

export function selectPatternEventInSelection(
  selection: SelectionState,
  patternEventId: string,
  additive: boolean,
  focusedBlockId?: string,
): SelectionState {
  if (additive) {
    return {
      ...selection,
      selectedPatternEventIds: toggleId(selection.selectedPatternEventIds, patternEventId),
    }
  }

  return {
    ...clearSelection(selection),
    selectedBlockIds: focusedBlockId === undefined ? [] : [focusedBlockId],
    selectedPatternEventIds: [patternEventId],
  }
}

export function hasAnySelection(selection: SelectionState): boolean {
  return selection.selectedBlockIds.length > 0
    || selection.selectedSectionIds.length > 0
    || selection.selectedPatternEventIds.length > 0
    || selection.selectedTrackIds.length > 0
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter(currentId => currentId !== id)
    : [...ids, id]
}

export function createEmptySelectionState(): SelectionState {
  return {
    selectedBlockIds: [],
    selectedPatternEventIds: [],
    selectedSectionIds: [],
    selectedTrackIds: [],
  }
}
