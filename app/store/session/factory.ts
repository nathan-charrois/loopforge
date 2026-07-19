import { createEditor } from '../editor/factory'
import type { Editor } from '../editor/type'
import { createInitialWorkspace } from '../workspace/factory'
import type { Workspace } from '../workspace/type'
import type { CommandHistory } from './commandHistory'
import type { Session } from './type'

export function createInitialSession(): Session {
  return createSession(createInitialWorkspace(), createEditor())
}

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
