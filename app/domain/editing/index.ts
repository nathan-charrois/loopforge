export type CommandId = string
export const COMMAND_KINDS = [
  'addBlock',
  'moveBlock',
  'resizeBlock',
  'deleteBlock',
  'addPatternEvent',
  'movePatternEvent',
  'deletePatternEvent',
  'renameEntity',
] as const
export type CommandKind = typeof COMMAND_KINDS[number]

export type CommandPayload = Record<string, boolean | null | number | string | string[]>

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

export function createCommand(input: {
  id: CommandId
  kind: CommandKind
  label: string
  createdAt: string
  payload?: CommandPayload
  inverse?: CommandPayload
}): Command {
  return {
    createdAt: input.createdAt,
    id: input.id,
    inverse: input.inverse,
    kind: input.kind,
    label: input.label,
    payload: input.payload ?? {},
  }
}

export function createEmptyCommandHistory(): CommandHistory {
  return {
    redoStack: [],
    undoStack: [],
  }
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
