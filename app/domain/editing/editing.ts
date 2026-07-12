import type { CommandKind } from './constants'

export type CommandId = string

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type CommandPayload = Record<string, JsonValue>

export type Command = {
  id: CommandId
  kind: CommandKind
  label: string
  createdAt: string
  payload: CommandPayload
  inverse?: CommandPayload
}

export type CommandHistory = {
  undoStack: Command[]
  redoStack: Command[]
}

export function canUndoCommand(history: CommandHistory): boolean {
  return history.undoStack.length > 0
}

export function canRedoCommand(history: CommandHistory): boolean {
  return history.redoStack.length > 0
}

export function pushCommand(history: CommandHistory, command: Command): CommandHistory {
  return {
    redoStack: [],
    undoStack: [...history.undoStack, command],
  }
}

export function undoCommand(history: CommandHistory): {
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

export function redoCommand(history: CommandHistory): {
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
