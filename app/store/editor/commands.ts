import {
  copySelection,
  selectBlock,
  selectMixChannel,
  selectSection,
  selectTimelineEvent,
  selectTrack,
  setActiveTool,
  setClipboard,
  setFocusedBlockId,
  setHoveredChord,
  setInspector,
  setSelection,
} from './operations'
import type {
  ActiveTool,
  ClipboardState,
  Editor,
  InspectorState,
  SelectionState,
} from './type'
import type { BlockId, MixChannelId, SectionId, TimelineEventId, TrackId } from '~/domain'
import type {
  CommandPayload,
  EditorCommand,
  EditorCommandKind,
  JsonValue,
} from '~/store/session/command'

let editorCommandSequence = 1

export function applyEditorCommand(
  editor: Editor,
  command: EditorCommand,
): Editor {
  const { payload } = command

  switch (command.kind) {
    case 'copySelection':
      return copySelection(editor)
    case 'selectBlock': {
      const blockId = getPayloadString(payload, 'blockId')
      return blockId === undefined
        ? editor
        : selectBlock(editor, blockId, getPayloadBoolean(payload, 'additive') ?? false)
    }
    case 'selectMixChannel': {
      const mixChannelId = getPayloadString(payload, 'mixChannelId')
      return mixChannelId === undefined
        ? editor
        : selectMixChannel(editor, mixChannelId, getPayloadBoolean(payload, 'additive') ?? false)
    }
    case 'selectSection': {
      const sectionId = getPayloadString(payload, 'sectionId')
      return sectionId === undefined
        ? editor
        : selectSection(editor, sectionId, getPayloadBoolean(payload, 'additive') ?? false)
    }
    case 'selectTimelineEvent': {
      const timelineEventId = getPayloadString(payload, 'timelineEventId')
      return timelineEventId === undefined
        ? editor
        : selectTimelineEvent(editor, timelineEventId, getPayloadBoolean(payload, 'additive') ?? false)
    }
    case 'selectTrack': {
      const trackId = getPayloadString(payload, 'trackId')
      return trackId === undefined
        ? editor
        : selectTrack(editor, trackId, getPayloadBoolean(payload, 'additive') ?? false)
    }
    case 'setActiveTool': {
      const activeTool = getPayloadString(payload, 'activeTool') as ActiveTool | undefined
      return activeTool === undefined ? editor : setActiveTool(editor, activeTool)
    }
    case 'setClipboard': {
      const clipboard = getPayloadObject<ClipboardState>(payload, 'clipboard')
      return clipboard === undefined ? editor : setClipboard(editor, clipboard)
    }
    case 'setFocusedBlockId':
      return setFocusedBlockId(
        editor,
        typeof payload.focusedBlockId === 'string' ? payload.focusedBlockId : undefined,
      )
    case 'setHoveredChord':
      return setHoveredChord(
        editor,
        payload.hoveredChord === null
          ? undefined
          : payload.hoveredChord as Editor['hoveredChord'],
      )
    case 'setInspector': {
      const inspector = getPayloadObject<InspectorState>(payload, 'inspector')
      return inspector === undefined ? editor : setInspector(editor, inspector)
    }
    case 'setSelection': {
      const selection = getPayloadObject<SelectionState>(payload, 'selection')
      return selection === undefined ? editor : setSelection(editor, selection)
    }
  }
}

export function createCopySelectionCommand(): EditorCommand {
  return createEditorCommandRecord('copySelection', 'Copy selection', {})
}

export function createSelectBlockCommand(blockId: BlockId, additive: boolean): EditorCommand {
  return createEditorCommandRecord('selectBlock', 'Select block', { additive, blockId })
}

export function createSelectMixChannelCommand(
  mixChannelId: MixChannelId,
  additive: boolean,
): EditorCommand {
  return createEditorCommandRecord('selectMixChannel', 'Select mix channel', { additive, mixChannelId })
}

export function createSelectSectionCommand(sectionId: SectionId, additive: boolean): EditorCommand {
  return createEditorCommandRecord('selectSection', 'Select section', { additive, sectionId })
}

export function createSelectTimelineEventCommand(
  timelineEventId: TimelineEventId,
  additive: boolean,
): EditorCommand {
  return createEditorCommandRecord('selectTimelineEvent', 'Select timeline event', {
    additive,
    timelineEventId,
  })
}

export function createSelectTrackCommand(trackId: TrackId, additive: boolean): EditorCommand {
  return createEditorCommandRecord('selectTrack', 'Select track', { additive, trackId })
}

export function createSetActiveToolCommand(tool: ActiveTool): EditorCommand {
  return createEditorCommandRecord('setActiveTool', `Set active tool to ${tool}`, { activeTool: tool })
}

export function createSetHoveredChordCommand(hoveredChord: Editor['hoveredChord']): EditorCommand {
  return createEditorCommandRecord(
    'setHoveredChord',
    hoveredChord === undefined ? 'Clear hovered chord' : 'Set hovered chord',
    { hoveredChord: hoveredChord === undefined ? null : toJsonValue(hoveredChord) },
  )
}

export function createSetClipboardCommand(clipboard: ClipboardState): EditorCommand {
  return createEditorCommandRecord('setClipboard', 'Update clipboard', { clipboard: toJsonValue(clipboard) })
}

export function createSetFocusedBlockIdCommand(blockId?: BlockId): EditorCommand {
  return createEditorCommandRecord(
    'setFocusedBlockId',
    blockId === undefined ? 'Clear focused block' : `Focus block ${blockId}`,
    { focusedBlockId: blockId ?? null },
  )
}

export function createSetInspectorCommand(label: string, inspector: InspectorState): EditorCommand {
  return createEditorCommandRecord('setInspector', label, { inspector: toJsonValue(inspector) })
}

export function createSetSelectionCommand(selection: SelectionState, label = 'Update selection'): EditorCommand {
  return createEditorCommandRecord('setSelection', label, { selection: toJsonValue(selection) })
}

function createEditorCommandRecord(
  kind: EditorCommandKind,
  label: string,
  payload: CommandPayload,
): EditorCommand {
  const sequence = editorCommandSequence
  editorCommandSequence += 1

  return {
    createdAt: new Date().toISOString(),
    id: `editor_command_${sequence}`,
    kind,
    label,
    payload,
    target: 'editor',
  }
}

function getPayloadObject<TValue>(payload: CommandPayload, key: string): TValue | undefined {
  const value = payload[key]

  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined
  }

  return value as TValue
}

function getPayloadString(payload: CommandPayload, key: string): string | undefined {
  const value = payload[key]
  return typeof value === 'string' ? value : undefined
}

function getPayloadBoolean(payload: CommandPayload, key: string): boolean | undefined {
  const value = payload[key]
  return typeof value === 'boolean' ? value : undefined
}

function toJsonValue<TValue>(value: TValue): JsonValue {
  return value as JsonValue
}
