import { useCallback, useMemo } from 'react'

import { useSessionStore } from '~/components/Providers/SessionProvider'
import {
  createInitialSession,
  deserializeSession,
  downloadTextFile,
  openTextFile,
  serializeSession,
} from '~/store/session'

export type SessionProject = {
  newProject(): void
  saveProject(): void
  loadProject(): Promise<void>
}

export function useSessionProject(): SessionProject {
  const sessionStore = useSessionStore()

  const newProject = useCallback(() => {
    sessionStore.replace(
      createInitialSession(),
    )
  }, [createInitialSession, sessionStore])

  const saveProject = useCallback(() => {
    const session = sessionStore.getSnapshot()
    const contents = serializeSession(session)

    downloadTextFile(
      contents,
      `${session.workspace.project.name}.json`,
    )
  }, [sessionStore])

  const loadProject = useCallback(async () => {
    const contents = await openTextFile()

    if (contents === undefined) {
      return
    }

    const session = deserializeSession(contents)

    sessionStore.replace(session)
  }, [sessionStore])

  return useMemo(() => ({
    newProject,
    saveProject,
    loadProject,
  }), [
    newProject,
    saveProject,
    loadProject,
  ])
}
