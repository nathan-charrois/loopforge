import { applyEditorCommand } from '../editor/commands'
import { applyWorkspaceCommand } from '../workspace/commands'
import {
  type CommandHistoryEntry,
  pushHistoryEntry,
  redoHistoryEntry,
  undoHistoryEntry,
} from './commandHistory'
import type { Session } from './type'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type CommandId = string

export type CommandPayload = Record<string, JsonValue>
export type CommandTarget = 'editor' | 'workspace'

export const WORKSPACE_COMMAND_KINDS = [
  'addBlock',
  'deleteBlock',
  'duplicateBlock',
  'moveBlock',
  'resizeBlock',
  'splitBlock',
  'updateBlock',
  'addSection',
  'deleteSection',
  'duplicateSection',
  'moveSection',
  'resizeSection',
  'splitSection',
  'updateSection',
  'addTrack',
  'deleteTrack',
  'reorderTrack',
  'updateTrack',
  'addPattern',
  'deletePattern',
  'updatePattern',
  'addPatternEvent',
  'deletePatternEvent',
  'updatePatternEvent',
  'addTimelineEvent',
  'deleteTimelineEvent',
  'updateTimelineEvent',
  'setGridDivision',
] as const

export const EDITOR_COMMAND_KINDS = [
  'copySelection',
  'selectBlock',
  'selectSection',
  'selectTimelineEvent',
  'selectTimelineRange',
  'setActiveTool',
  'setClipboard',
  'setFocusedBlockId',
  'setHoveredChord',
  'setInspector',
  'setSelection',
] as const

export const COMMAND_KINDS = [
  ...WORKSPACE_COMMAND_KINDS,
  ...EDITOR_COMMAND_KINDS,
] as const

export type CommandKind = typeof COMMAND_KINDS[number]
export type WorkspaceCommandKind = typeof WORKSPACE_COMMAND_KINDS[number]
export type EditorCommandKind = typeof EDITOR_COMMAND_KINDS[number]

type BaseCommand<Target extends CommandTarget, Kind extends CommandKind> = {
  id: CommandId
  kind: Kind
  target: Target
  label: string
  createdAt: string
  payload: CommandPayload
}

export type EditorCommand = BaseCommand<'editor', EditorCommandKind>
export type WorkspaceCommand = BaseCommand<'workspace', WorkspaceCommandKind>

export type Command = EditorCommand | WorkspaceCommand

export function executeCommand(
  session: Session,
  command: Command,
): Session {
  const appliedSession = applyCommand(session, command)
  const entry = createHistoryEntry(session, appliedSession, command)
  const result = pushHistoryEntry(session.commandHistory, entry)

  return {
    ...appliedSession,
    commandHistory: result.history,
  }
}

export function undoCommand(
  session: Session,
): Session {
  const result = undoHistoryEntry(session.commandHistory)

  if (result.entry === undefined) {
    return session
  }

  return {
    ...restoreHistoryEntry(session, result.entry, 'before'),
    commandHistory: result.history,
  }
}

export function redoCommand(
  session: Session,
): Session {
  const result = redoHistoryEntry(session.commandHistory)

  if (result.entry === undefined) {
    return session
  }

  return {
    ...restoreHistoryEntry(session, result.entry, 'after'),
    commandHistory: result.history,
  }
}

function applyCommand(
  session: Session,
  command: Command,
): Session {
  if (command.target === 'editor') {
    return {
      ...session,
      editor: applyEditorCommand(session.editor, session.workspace, command),
    }
  }

  return {
    ...session,
    workspace: applyWorkspaceCommand(session.workspace, command),
  }
}

function createHistoryEntry(
  before: Session,
  after: Session,
  command: Command,
): CommandHistoryEntry {
  if (command.target === 'editor') {
    return {
      after: after.editor,
      before: before.editor,
      command,
      target: 'editor',
    }
  }

  return {
    after: after.workspace,
    before: before.workspace,
    command,
    target: 'workspace',
  }
}

function restoreHistoryEntry(
  session: Session,
  entry: CommandHistoryEntry,
  field: 'after' | 'before',
): Session {
  if (entry.target === 'editor') {
    return {
      ...session,
      editor: entry[field],
    }
  }

  return {
    ...session,
    workspace: entry[field],
  }
}
