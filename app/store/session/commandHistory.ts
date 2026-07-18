import type { Editor } from '../editor/type'
import type { Workspace } from '../workspace/type'
import type { EditorCommand, WorkspaceCommand } from './command'

export type EditorHistoryEntry = {
  after: Editor
  before: Editor
  command: EditorCommand
  target: 'editor'
}

export type WorkspaceHistoryEntry = {
  after: Workspace
  before: Workspace
  command: WorkspaceCommand
  target: 'workspace'
}

export type CommandHistoryEntry = EditorHistoryEntry | WorkspaceHistoryEntry

export type CommandHistory = {
  redoStack: CommandHistoryEntry[]
  undoStack: CommandHistoryEntry[]
}

export function pushHistoryEntry(
  history: CommandHistory,
  entry: CommandHistoryEntry,
) {
  return {
    entry,
    history: {
      redoStack: [],
      undoStack: [...history.undoStack, entry],
    },
  }
}

export function undoHistoryEntry(history: CommandHistory): {
  entry?: CommandHistoryEntry
  history: CommandHistory
} {
  const entry = history.undoStack.at(-1)

  if (entry === undefined) {
    return { history }
  }

  return {
    entry,
    history: {
      redoStack: [...history.redoStack, entry],
      undoStack: history.undoStack.slice(0, -1),
    },
  }
}

export function redoHistoryEntry(history: CommandHistory): {
  entry?: CommandHistoryEntry
  history: CommandHistory
} {
  const entry = history.redoStack.at(-1)

  if (entry === undefined) {
    return { history }
  }

  return {
    entry,
    history: {
      redoStack: history.redoStack.slice(0, -1),
      undoStack: [...history.undoStack, entry],
    },
  }
}

export function canUndoCommand(history: CommandHistory): boolean {
  return history.undoStack.length > 0
}

export function canRedoCommand(history: CommandHistory): boolean {
  return history.redoStack.length > 0
}
