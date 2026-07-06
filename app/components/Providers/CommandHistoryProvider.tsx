import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

import {
  canRedoCommand,
  canUndoCommand,
  type Command,
  type CommandHistory,
  createEmptyCommandHistory,
  pushCommand as pushCommandToHistory,
  redoCommand as redoCommandInHistory,
  undoCommand as undoCommandInHistory,
} from '~/domain'

type CommandHistoryContextValue = {
  canRedo: boolean
  canUndo: boolean
  commandHistory: CommandHistory
  pushCommand: (command: Command) => void
  redoCommand: () => void
  setCommandHistory: Dispatch<SetStateAction<CommandHistory>>
  undoCommand: () => void
}

const CommandHistoryContext = createContext<CommandHistoryContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export function CommandHistoryProvider({ children }: Props) {
  const [commandHistory, setCommandHistory] = useState<CommandHistory>(() => createEmptyCommandHistory())

  const pushCommand = useCallback((command: Command) => {
    setCommandHistory(currentHistory => pushCommandToHistory(currentHistory, command))
  }, [])

  const undoCommand = useCallback(() => {
    setCommandHistory((currentHistory) => {
      const nextState = undoCommandInHistory(currentHistory)

      return nextState.history
    })
  }, [])

  const redoCommand = useCallback(() => {
    setCommandHistory((currentHistory) => {
      const nextState = redoCommandInHistory(currentHistory)

      return nextState.history
    })
  }, [])

  const contextValue = useMemo<CommandHistoryContextValue>(() => ({
    canRedo: canRedoCommand(commandHistory),
    canUndo: canUndoCommand(commandHistory),
    commandHistory,
    pushCommand,
    redoCommand,
    setCommandHistory,
    undoCommand,
  }), [commandHistory, pushCommand, redoCommand, undoCommand])

  return (
    <CommandHistoryContext.Provider value={contextValue}>
      {children}
    </CommandHistoryContext.Provider>
  )
}

export function useCommandHistory() {
  const value = useContext(CommandHistoryContext)

  if (value === undefined) {
    throw new Error('useCommandHistory must be used within CommandHistoryProvider')
  }

  return value
}
