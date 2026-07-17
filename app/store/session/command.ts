import { applyEditorCommand } from '../editor/commands'
import { applyWorkspaceCommand } from '../workspace/commands'
import { pushHistoryCommand, redoHistoryCommand, undoHistoryCommand } from './commandHistory'
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
  'renameBlock',
  'setBlockMuted',
  'setBlockColor',
  'setBlockPlaybackMode',
  'assignBlockPattern',
  'moveBlockToTrack',
  'addSection',
  'deleteSection',
  'duplicateSection',
  'moveSection',
  'resizeSection',
  'splitSection',
  'renameSection',
  'addTrack',
  'deleteTrack',
  'renameTrack',
  'reorderTrack',
  'setTrackMuted',
  'setTrackSoloed',
  'setTrackVolume',
  'setTrackColor',
  'setTrackInstrument',
  'addPattern',
  'deletePattern',
  'duplicatePattern',
  'renamePattern',
  'addPatternEvent',
  'deletePatternEvent',
  'duplicatePatternEvent',
  'movePatternEvent',
  'resizePatternEvent',
  'updatePatternEvent',
  'addTempoEvent',
  'deleteTempoEvent',
  'updateTempoEvent',
  'addMeterEvent',
  'deleteMeterEvent',
  'updateMeterEvent',
  'addKeyEvent',
  'deleteKeyEvent',
  'updateKeyEvent',
  'moveTimelineEvent',
  'setGridDivision',
  'renameEntity',
] as const

export const EDITOR_COMMAND_KINDS = [
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
  inverse?: CommandPayload
}

export type EditorCommand = BaseCommand<'editor', EditorCommandKind>
export type WorkspaceCommand = BaseCommand<'workspace', WorkspaceCommandKind>

export type Command = EditorCommand | WorkspaceCommand

export function executeCommand(
  session: Session,
  command: Command,
): Session {
  const result = pushHistoryCommand(session.commandHistory, command)

  if (result.command === undefined) {
    return session
  }

  return {
    ...applyCommand(session, command),
    commandHistory: result.history,
  }
}

export function undoCommand(
  session: Session,
): Session {
  const result = undoHistoryCommand(session.commandHistory)

  if (result.command === undefined) {
    return session
  }

  return {
    ...applyCommand(session, result.command, true),
    commandHistory: result.history,
  }
}

export function redoCommand(
  session: Session,
): Session {
  const result = redoHistoryCommand(session.commandHistory)

  if (result.command === undefined) {
    return session
  }

  return {
    ...applyCommand(session, result.command),
    commandHistory: result.history,
  }
}

function applyCommand(
  session: Session,
  command: Command,
  useInverse = false,
): Session {
  if (command.target === 'editor') {
    return {
      ...session,
      editor: applyEditorCommand(session.editor, command, useInverse),
    }
  }

  return {
    ...session,
    workspace: applyWorkspaceCommand(session.workspace, command, useInverse),
  }
}
