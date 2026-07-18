import { copySelectionToClipboard } from './clipboard'
import { createSelectionState } from './factory'
import { snapTimelineRange } from './snap'
import type {
  ActiveTool,
  ClipboardState,
  Editor,
  InspectorPanel,
  InspectorState,
  SelectionState,
} from './type'
import type { BlockId, SectionId } from '~/domain/arrangement'
import type { Tick } from '~/domain/musicPrimitives'
import type { TimelineEventId } from '~/domain/timeline'
import {
  selectBlocksInRange,
  selectSectionsInRange,
  type Workspace,
} from '~/store/workspace'
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

export function copySelection(editor: Editor): Editor {
  return setClipboard(editor, copySelectionToClipboard(editor))
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

export function selectBlock(
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

export function selectSection(
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

export function selectTimelineEvent(
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

export function selectTimelineRange(
  editor: Editor,
  workspace: Workspace,
  startTick: Tick,
  endTick: Tick,
): Editor {
  const range = snapTimelineRange(workspace.timeline, startTick, endTick)
  const bounds = {
    endTick: range.startTick + range.lengthTicks,
    startTick: range.startTick,
  }

  return setSelection(editor, {
    ...createSelectionState(),
    selectedBlockIds:
      selectBlocksInRange(workspace, bounds).map(block => block.id),
    selectedSectionIds:
      selectSectionsInRange(workspace, bounds).map(section => section.id),
  })
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
