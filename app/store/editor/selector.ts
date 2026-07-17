import { selectBlock, selectSection, selectTimelineEvent, type Workspace } from '../workspace'
import type { Editor, SelectionState } from './type'
import type { Block, Section, TimelineEvent } from '~/domain'

export function selectFirstSelectedBlock(editor: Editor, workspace: Workspace): Block | undefined {
  if (editor.selection.selectedBlockIds.length === 1) {
    return selectBlock(workspace, editor.selection.selectedBlockIds[0])
  }

  return undefined
}

export function selectFirstSelectedSection(editor: Editor, workspace: Workspace): Section | undefined {
  if (editor.selection.selectedSectionIds.length === 1) {
    return selectSection(workspace, editor.selection.selectedSectionIds[0])
  }

  return undefined
}

export function selectFirstSelectedTimelineEvent(editor: Editor, workspace: Workspace): TimelineEvent | undefined {
  if (editor.selection.selectedTimelineEventIds.length === 1) {
    return selectTimelineEvent(workspace, editor.selection.selectedTimelineEventIds[0])
  }

  return undefined
}

export function hasAnySelection(selection: SelectionState): boolean {
  return selection.selectedBlockIds.length > 0
    || selection.selectedSectionIds.length > 0
    || selection.selectedPatternEventIds.length > 0
    || selection.selectedTrackIds.length > 0
    || selection.selectedTimelineEventIds.length > 0
}
