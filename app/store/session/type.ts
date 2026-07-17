import type { Editor } from '../editor/type'
import type { Workspace } from '../workspace/type'
import type { Command } from './command'
import type { CommandHistory } from './commandHistory'

export type Session = {
  commandHistory: CommandHistory
  editor: Editor
  workspace: Workspace
}

export type SessionStore = {
  dispatch: (command: Command | readonly Command[]) => void
  getSnapshot: () => Session
  redo: () => void
  subscribe: (listener: () => void) => () => void
  undo: () => void
}
