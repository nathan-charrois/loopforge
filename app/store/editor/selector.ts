import {
  selectBlock,
  selectEffect,
  selectInstrument,
  selectMixChannel,
  selectPattern,
  selectPatternByPatternEventId,
  selectPatternEvent,
  selectSection,
  selectTimelineEvent,
  selectTrack,
  type Workspace,
} from '../workspace'
import type { Editor, SelectionState } from './type'
import type { Block, Effect, Instrument, MixChannel, Pattern, PatternEvent, Section, TimelineEvent, Track } from '~/domain'

export function selectEditor(editor: Editor): Editor {
  return editor
}

export function selectActiveTool(editor: Editor): Editor['activeTool'] {
  return editor.activeTool
}

export function selectFocusedBlockId(editor: Editor): Editor['focusedBlockId'] {
  return editor.focusedBlockId
}

export function selectSelectedBlockIds(editor: Editor): SelectionState['selectedBlockIds'] {
  return editor.selection.selectedBlockIds
}

export function selectSelectedEffectIds(editor: Editor): SelectionState['selectedEffectIds'] {
  return editor.selection.selectedEffectIds
}

export function selectSelectedInstrumentIds(editor: Editor): SelectionState['selectedInstrumentIds'] {
  return editor.selection.selectedInstrumentIds
}

export function selectSelectedMixChannelIds(editor: Editor): SelectionState['selectedMixChannelIds'] {
  return editor.selection.selectedMixChannelIds
}

export function selectSelectedPatternIds(editor: Editor): SelectionState['selectedPatternIds'] {
  return editor.selection.selectedPatternIds
}

export function selectSelectedPatternEventIds(editor: Editor): SelectionState['selectedPatternEventIds'] {
  return editor.selection.selectedPatternEventIds
}

export function selectSelectedSectionIds(editor: Editor): SelectionState['selectedSectionIds'] {
  return editor.selection.selectedSectionIds
}

export function selectSelectedTimelineEventIds(editor: Editor): SelectionState['selectedTimelineEventIds'] {
  return editor.selection.selectedTimelineEventIds
}

export function selectSelectedTrackIds(editor: Editor): SelectionState['selectedTrackIds'] {
  return editor.selection.selectedTrackIds
}

export function selectFirstSelectedBlock(editor: Editor, workspace: Workspace): Block | undefined {
  if (editor.selection.selectedBlockIds.length === 1) {
    return selectBlock(workspace, editor.selection.selectedBlockIds[0])
  }

  return undefined
}

export function selectFirstSelectedEffect(editor: Editor, workspace: Workspace): Effect | undefined {
  if (editor.selection.selectedEffectIds.length === 1) {
    return selectEffect(workspace, editor.selection.selectedEffectIds[0])
  }

  return undefined
}

export function selectFirstSelectedInstrument(editor: Editor, workspace: Workspace): Instrument | undefined {
  if (editor.selection.selectedInstrumentIds.length === 1) {
    return selectInstrument(workspace, editor.selection.selectedInstrumentIds[0])
  }

  return undefined
}

export function selectFirstSelectedMixChannel(editor: Editor, workspace: Workspace): MixChannel | undefined {
  if (editor.selection.selectedMixChannelIds.length === 1) {
    return selectMixChannel(workspace, editor.selection.selectedMixChannelIds[0])
  }

  return undefined
}

export function selectFirstSelectedPattern(
  editor: Editor,
  workspace: Workspace,
): Pattern | undefined {
  if (editor.selection.selectedPatternIds.length === 1) {
    return selectPattern(workspace, editor.selection.selectedPatternIds[0])
  }

  return undefined
}

export function selectFirstSelectedPatternEvent(
  editor: Editor,
  workspace: Workspace,
): PatternEvent | undefined {
  if (editor.selection.selectedPatternEventIds.length !== 1) {
    return undefined
  }

  const patternEventId = editor.selection.selectedPatternEventIds[0]
  const patternId = selectPatternByPatternEventId(workspace, patternEventId)

  if (!patternId) {
    return undefined
  }

  return selectPatternEvent(workspace, patternId, patternEventId)
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
    || selection.selectedEffectIds.length > 0
    || selection.selectedInstrumentIds.length > 0
    || selection.selectedMixChannelIds.length > 0
    || selection.selectedPatternIds.length > 0
    || selection.selectedSectionIds.length > 0
    || selection.selectedPatternEventIds.length > 0
    || selection.selectedTrackIds.length > 0
    || selection.selectedTimelineEventIds.length > 0
}
