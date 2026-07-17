import type { Editor } from '../editor/type'
import type { Workspace } from '../workspace/type'
import type { CommandHistory } from './commandHistory'
import type { Session } from './type'

export function createSession(workspace: Workspace, editor: Editor): Session {
  return {
    commandHistory: createCommandHistory(),
    editor,
    workspace,
  }
}
export function createCommandHistory(): CommandHistory {
  return {
    redoStack: [],
    undoStack: [],
  }
}
