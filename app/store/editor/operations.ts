import { createInspectorState, createSelectionState } from './factory'
import {
  toggleSelectionIds,
} from './selection'
import type {
  ActiveTool,
  EditorState,
  InspectorPanel,
} from './types'
import type { BlockId, SectionId } from '~/domain/arrangement'
import type { PatternEventId } from '~/domain/patternEvents'
import type { TrackId } from '~/domain/tracks'

export function setActiveTool(editorState: EditorState, tool: ActiveTool): EditorState {
  return {
    ...editorState,
    activeTool: tool,
  }
}

export function removeSelection(editorState: EditorState): EditorState {
  return {
    ...editorState,
    selection: createSelectionState(),
  }
}

export function addBlockToSelection(editorState: EditorState, blockId: BlockId, additive = false): EditorState {
  if (additive) {
    return {
      ...editorState,
      selection: {
        ...editorState.selection,
        selectedBlockIds: toggleSelectionIds(editorState.selection.selectedBlockIds, blockId),
      },
    }
  }

  return {
    ...editorState,
    selection: {
      ...createSelectionState(),
      selectedBlockIds: [blockId],
    },
  }
}

export function addSectionToSelection(editorState: EditorState, sectionId: SectionId, additive = false): EditorState {
  if (additive) {
    return {
      ...editorState,
      selection: {
        ...editorState.selection,
        selectedSectionIds: toggleSelectionIds(
          editorState.selection.selectedSectionIds,
          sectionId,
        ),
      },
    }
  }

  return {
    ...editorState,
    selection: {
      ...createSelectionState(),
      selectedSectionIds: [sectionId],
    },
  }
}

export function addPatternEventToSelection(
  editorState: EditorState,
  patternEventId: PatternEventId,
  additive = false,
  focusedBlockId?: BlockId,
): EditorState {
  if (additive) {
    return {
      ...editorState,
      selection: {
        ...editorState.selection,
        selectedPatternEventIds: toggleSelectionIds(
          editorState.selection.selectedPatternEventIds,
          patternEventId,
        ),
      },
    }
  }

  return {
    ...editorState,
    selection: {
      ...createSelectionState(),
      selectedBlockIds: focusedBlockId ? [focusedBlockId] : [],
      selectedPatternEventIds: [patternEventId],
    },
  }
}

export function addTrackToSelection(
  editorState: EditorState,
  trackId: TrackId,
  additive = false,
): EditorState {
  if (additive) {
    return {
      ...editorState,
      selection: {
        ...editorState.selection,
        selectedTrackIds: toggleSelectionIds(
          editorState.selection.selectedTrackIds,
          trackId,
        ),
      },
    }
  }

  return {
    ...editorState,
    selection: {
      ...createSelectionState(),
      selectedTrackIds: [trackId],
    },
  }
}

export function setInspectorPanel(editorState: EditorState, panel: InspectorPanel): EditorState {
  return {
    ...editorState,
    inspector: {
      open: true,
      panel,
    },
  }
}

export function setInspectorClose(editorState: EditorState): EditorState {
  return {
    ...editorState,
    inspector: createInspectorState(),
  }
}
