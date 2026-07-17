import { createInspectorState, createSelectionState } from './factory'
import type {
  ActiveTool,
  ClipboardState,
  Editor,
  InspectorPanel,
  InspectorState,
  SelectionState,
} from './type'
import type { BlockId, SectionId } from '~/domain/arrangement'
import type { PatternEventId } from '~/domain/patternEvents'
import type { TimelineEventId } from '~/domain/timeline'
import type { TrackId } from '~/domain/tracks'
import { toggleInArray } from '~/utils/array'

export function setActiveTool(
  editor: Editor,
  tool: ActiveTool,
): Editor {
  return {
    ...editor,
    activeTool: tool,
  }
}

export function setFocusedBlockId(
  editor: Editor,
  blockId?: BlockId,
): Editor {
  return {
    ...editor,
    focusedBlockId: blockId,
  }
}

export function setClipboard(
  editor: Editor,
  clipboard: ClipboardState,
): Editor {
  return {
    ...editor,
    clipboard,
  }
}

export function setHoveredChord(
  editor: Editor,
  hoveredChord: Editor['hoveredChord'],
): Editor {
  return {
    ...editor,
    hoveredChord,
  }
}

export function setInspector(
  editor: Editor,
  inspector: InspectorState,
): Editor {
  return {
    ...editor,
    inspector,
  }
}

export function setSelection(
  editor: Editor,
  selection: SelectionState,
): Editor {
  return {
    ...editor,
    selection,
  }
}

export function removeSelection(
  editor: Editor,
): Editor {
  return {
    ...editor,
    selection: createSelectionState(),
  }
}

export function addBlockToSelection(
  editor: Editor,
  blockId: BlockId,
  additive = false,
): Editor {
  if (additive) {
    return {
      ...editor,
      selection: {
        ...editor.selection,
        selectedBlockIds: toggleInArray(
          editor.selection.selectedBlockIds,
          blockId,
        ),
      },
    }
  }

  return {
    ...editor,
    selection: {
      ...createSelectionState(),
      selectedBlockIds: [
        blockId,
      ],
    },
  }
}

export function addSectionToSelection(
  editor: Editor,
  sectionId: SectionId,
  additive = false,
): Editor {
  if (additive) {
    return {
      ...editor,
      selection: {
        ...editor.selection,
        selectedSectionIds: toggleInArray(
          editor.selection.selectedSectionIds,
          sectionId,
        ),
      },
    }
  }

  return {
    ...editor,
    selection: {
      ...createSelectionState(),
      selectedSectionIds: [
        sectionId,
      ],
    },
  }
}

export function addPatternEventToSelection(
  editor: Editor,
  patternEventId: PatternEventId,
  additive = false,
  focusedBlockId?: BlockId,
): Editor {
  if (additive) {
    return {
      ...editor,
      selection: {
        ...editor.selection,
        selectedPatternEventIds: toggleInArray(
          editor.selection.selectedPatternEventIds,
          patternEventId,
        ),
      },
    }
  }

  return {
    ...editor,
    selection: {
      ...createSelectionState(),
      selectedBlockIds: focusedBlockId ? [focusedBlockId] : [],
      selectedPatternEventIds: [
        patternEventId,
      ],
    },
  }
}

export function addTrackToSelection(
  editor: Editor,
  trackId: TrackId,
  additive = false,
): Editor {
  if (additive) {
    return {
      ...editor,
      selection: {
        ...editor.selection,
        selectedTrackIds: toggleInArray(
          editor.selection.selectedTrackIds,
          trackId,
        ),
      },
    }
  }

  return {
    ...editor,
    selection: {
      ...createSelectionState(),
      selectedTrackIds: [
        trackId,
      ],
    },
  }
}

export function addTimelineEventToSelection(
  editor: Editor,
  timelineEventId: TimelineEventId,
  additive = false,
): Editor {
  if (additive) {
    return {
      ...editor,
      selection: {
        ...editor.selection,
        selectedTimelineEventIds: toggleInArray(
          editor.selection.selectedTimelineEventIds,
          timelineEventId,
        ),
      },
    }
  }

  return {
    ...editor,
    selection: {
      ...createSelectionState(),
      selectedTimelineEventIds: [
        timelineEventId,
      ],
    },
  }
}

export function setInspectorPanel(
  editor: Editor,
  panel: InspectorPanel,
): Editor {
  return {
    ...editor,
    inspector: {
      open: true,
      panel,
    },
  }
}

export function setInspectorClose(
  editor: Editor,
): Editor {
  return {
    ...editor,
    inspector: createInspectorState(),
  }
}
