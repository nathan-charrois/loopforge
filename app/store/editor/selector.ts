import { selectBlock, selectSection, selectTimelineEvent, type Workspace } from '../workspace'
import type { EditorState, SelectionState } from './type'
import type { Block, Section, TimelineEvent } from '~/domain'

export function selectFirstSelectedBlock(editorState: EditorState, workspace: Workspace): Block | undefined {
  if (editorState.selection.selectedBlockIds.length === 1) {
    return selectBlock(workspace, editorState.selection.selectedBlockIds[0])
  }

  return undefined
}

export function selectFirstSelectedSection(editorState: EditorState, workspace: Workspace): Section | undefined {
  if (editorState.selection.selectedSectionIds.length === 1) {
    return selectSection(workspace, editorState.selection.selectedSectionIds[0])
  }

  return undefined
}

export function selectFirstSelectedTimelineEvent(editorState: EditorState, workspace: Workspace): TimelineEvent | undefined {
  if (editorState.selection.selectedTimelineEventIds.length === 1) {
    return selectTimelineEvent(workspace, editorState.selection.selectedTimelineEventIds[0])
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
