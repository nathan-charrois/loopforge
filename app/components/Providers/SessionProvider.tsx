import {
  createContext,
  type ReactNode,
  useContext,
  useRef,
  useSyncExternalStore,
} from 'react'

import type { Editor } from '~/store/editor'
import {
  canRedoCommand,
  canUndoCommand,
  createSession,
  createSessionStore,
  type SessionStore,
} from '~/store/session'
import type { Workspace } from '~/store/workspace'

const SessionStoreContext = createContext<SessionStore | undefined>(undefined)

type Props = {
  children: ReactNode
  createInitialEditor: () => Editor
  createInitialWorkspace: () => Workspace
}

export function SessionProvider({
  children,
  createInitialEditor,
  createInitialWorkspace,
}: Props) {
  const storeRef = useRef<SessionStore | null>(null)

  if (storeRef.current === null) {
    storeRef.current = createSessionStore(createSession(
      createInitialWorkspace(),
      createInitialEditor(),
    ))
  }

  return (
    <SessionStoreContext.Provider value={storeRef.current}>
      {children}
    </SessionStoreContext.Provider>
  )
}

function useSessionStore(): SessionStore {
  const store = useContext(SessionStoreContext)

  if (store === undefined) {
    throw new Error('useSessionStore must be used within SessionProvider')
  }

  return store
}

export function useSession() {
  const store = useSessionStore()
  const session = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )

  return {
    ...session,
    canRedo: canRedoCommand(session.commandHistory),
    canUndo: canUndoCommand(session.commandHistory),
    dispatch: store.dispatch,
    redo: store.redo,
    undo: store.undo,
  }
}

export function useWorkspace() {
  const store = useSessionStore()

  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().workspace,
    () => store.getSnapshot().workspace,
  )
}

export function useEditor() {
  const store = useSessionStore()

  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().editor,
    () => store.getSnapshot().editor,
  )
}

export function useCommandHistory() {
  const store = useSessionStore()

  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().commandHistory,
    () => store.getSnapshot().commandHistory,
  )
}
