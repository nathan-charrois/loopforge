import type { Editor } from '../editor/type'
import type { Workspace } from '../workspace/type'
import type { Command } from './command'
import type { CommandHistory } from './commandHistory'

export type Session = {
  commandHistory: CommandHistory
  editor: Editor
  workspace: Workspace
}

export type Dispatch = (
  commandOrCommands: Command | readonly Command[],
) => void

export type SessionStore = {
  dispatch: Dispatch
  getSnapshot: () => Session
  redo: () => void
  subscribe: (listener: () => void) => () => void
  undo: () => void
}
