import {
  type Command,
  executeCommand,
  redoCommand,
  undoCommand,
} from './command'
import type { Session, SessionStore } from './type'

export function createSessionStore(initialSession: Session): SessionStore {
  let snapshot = initialSession
  const listeners = new Set<() => void>()

  function commit(session: Session) {
    if (session === snapshot) {
      return
    }

    snapshot = session

    for (const listener of listeners) {
      listener()
    }
  }

  function dispatch(commandOrCommands: Command | readonly Command[]) {
    const commands = Array.isArray(commandOrCommands)
      ? commandOrCommands
      : [commandOrCommands]

    let nextSession = snapshot

    for (const command of commands) {
      nextSession = executeCommand(nextSession, command)
    }

    commit(nextSession)
  }

  return {
    dispatch,
    getSnapshot: () => snapshot,
    redo() {
      commit(redoCommand(snapshot))
    },
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    undo() {
      commit(undoCommand(snapshot))
    },
  }
}
