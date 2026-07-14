import { selectBlock, selectSection, type Workspace } from '../workspace'
import type { EditorState } from './type'
import type { Block, Section } from '~/domain'

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

export function hasAnySelection(editorState: EditorState): boolean {
  return editorState.selection.selectedBlockIds.length > 0
    || editorState.selection.selectedSectionIds.length > 0
    || editorState.selection.selectedPatternEventIds.length > 0
    || editorState.selection.selectedTrackIds.length > 0
}
