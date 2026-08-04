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
  handleNew(): void
  handleSave(): void
  handleOpen(): Promise<void>
}

export function useSessionProject(): SessionProject {
  const sessionStore = useSessionStore()

  const handleNew = useCallback(() => {
    sessionStore.replace(
      createInitialSession(),
    )
  }, [createInitialSession, sessionStore])

  const handleSave = useCallback(() => {
    const session = sessionStore.getSnapshot()
    const contents = serializeSession(session)

    downloadTextFile(
      contents,
      `${session.workspace.project.name}.json`,
    )
  }, [sessionStore])

  const handleOpen = useCallback(async () => {
    const contents = await openTextFile()

    if (contents === undefined) {
      return
    }

    const session = deserializeSession(contents)

    sessionStore.replace(session)
  }, [sessionStore])

  return useMemo(() => ({
    handleNew,
    handleSave,
    handleOpen,
  }), [
    handleNew,
    handleSave,
    handleOpen,
  ])
}
