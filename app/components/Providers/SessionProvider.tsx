import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'

import type { Editor } from '~/store/editor'
import {
  type CommandHistory,
  createSession,
  createSessionStore,
  createSnapshot,
  type SelectorType,
  type Session,
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

export function useSessionStore(): SessionStore {
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
    dispatch: store.dispatch,
    replace: store.replace,
    redo: store.redo,
    undo: store.undo,
  }
}

export function useWorkspace<T>(selector: SelectorType<Workspace, T>): T {
  const store = useSessionStore()

  const selectWorkspace = useMemo(
    () => (session: Session) => selector(session.workspace),
    [selector],
  )

  const getSnapshot = useMemo(
    () => createSnapshot(store.getSnapshot, selectWorkspace),
    [selectWorkspace, store],
  )

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot,
  )
}

export function useEditor<T>(selector: SelectorType<Editor, T>): T {
  const store = useSessionStore()

  const selectEditor = useMemo(
    () => (session: Session) => selector(session.editor),
    [selector],
  )

  const getSnapshot = useMemo(
    () => createSnapshot(store.getSnapshot, selectEditor),
    [selectEditor, store],
  )

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot,
  )
}

export function useCommandHistory<T>(selector: SelectorType<CommandHistory, T>): T {
  const store = useSessionStore()

  const selectCommandHistory = useMemo(
    () => (session: Session) => selector(session.commandHistory),
    [selector],
  )

  const getSnapshot = useMemo(
    () => createSnapshot(store.getSnapshot, selectCommandHistory),
    [selectCommandHistory, store],
  )

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getSnapshot,
  )
}
