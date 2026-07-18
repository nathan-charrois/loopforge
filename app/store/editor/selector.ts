import { selectBlock, selectMixChannel, selectSection, selectTimelineEvent, selectTrack, type Workspace } from '../workspace'
import type { Editor, SelectionState } from './type'
import type { Block, MixChannel, Section, TimelineEvent, Track } from '~/domain'

export function selectFirstSelectedBlock(editor: Editor, workspace: Workspace): Block | undefined {
  if (editor.selection.selectedBlockIds.length === 1) {
    return selectBlock(workspace, editor.selection.selectedBlockIds[0])
  }

  return undefined
}

export function selectFirstSelectedMixChannel(editor: Editor, workspace: Workspace): MixChannel | undefined {
  if (editor.selection.selectedMixChannelIds.length === 1) {
    return selectMixChannel(workspace, editor.selection.selectedMixChannelIds[0])
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

export function selectFirstSelectedTrack(editor: Editor, workspace: Workspace): Track | undefined {
  if (editor.selection.selectedTrackIds.length === 1) {
    return selectTrack(workspace, editor.selection.selectedTrackIds[0])
  }

  return undefined
}

export function hasAnySelection(selection: SelectionState): boolean {
  return selection.selectedBlockIds.length > 0
    || selection.selectedMixChannelIds.length > 0
    || selection.selectedSectionIds.length > 0
    || selection.selectedPatternEventIds.length > 0
    || selection.selectedTrackIds.length > 0
    || selection.selectedTimelineEventIds.length > 0
}
