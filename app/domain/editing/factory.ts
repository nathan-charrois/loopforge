import type { CommandKind } from './constants'
import type { Command, CommandHistory, CommandId, CommandPayload } from './editing'

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
