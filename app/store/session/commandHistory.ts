import type { Command } from './command'

export type CommandHistory = {
  redoStack: Command[]
  undoStack: Command[]
}

export function pushHistoryCommand(
  history: CommandHistory,
  command: Command,
) {
  return {
    command,
    history: {
      redoStack: [],
      undoStack: [...history.undoStack, command],
    },
  }
}

export function undoHistoryCommand(history: CommandHistory): {
  command?: Command
  history: CommandHistory
} {
  const command = history.undoStack.at(-1)

  if (command === undefined) {
    return { history }
  }

  return {
    command,
    history: {
      redoStack: [...history.redoStack, command],
      undoStack: history.undoStack.slice(0, -1),
    },
  }
}

export function redoHistoryCommand(history: CommandHistory): {
  command?: Command
  history: CommandHistory
} {
  const command = history.redoStack.at(-1)

  if (command === undefined) {
    return { history }
  }

  return {
    command,
    history: {
      redoStack: history.redoStack.slice(0, -1),
      undoStack: [...history.undoStack, command],
    },
  }
}

export function canUndoCommand(history: CommandHistory): boolean {
  return history.undoStack.length > 0
}

export function canRedoCommand(history: CommandHistory): boolean {
  return history.redoStack.length > 0
}
