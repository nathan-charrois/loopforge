import { createEditor } from '../editor/factory'
import type { Editor } from '../editor/type'
import { createDemoWorkspace, createWorkspace } from '../workspace/factory'
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

export function createInitialSession(): Session {
  return createSession(
    createWorkspace(),
    createEditor(),
  )
}

export function createDemoSession(demo: string): Session {
  return createSession(
    createDemoWorkspace(demo),
    createEditor(),
  )
}
