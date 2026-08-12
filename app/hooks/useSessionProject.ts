import { useCallback, useMemo } from 'react'

import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import { useSessionStore } from '~/components/Providers/SessionProvider'
import {
  createDemoSession,
  createInitialSession,
  deserializeSession,
  downloadTextFile,
  openTextFile,
  serializeSession,
} from '~/store/session'

export type SessionProject = {
  handleNew(): void
  handleOpenDemo(demo: string): void
  handleSave(): void
  handleOpen(): Promise<void>
}

export function useSessionProject(): SessionProject {
  const sessionStore = useSessionStore()

  const playbackEngine = usePlaybackEngine()

  const handleNew = useCallback(() => {
    playbackEngine.reset()

    sessionStore.replace(
      createInitialSession(),
    )
  }, [sessionStore, playbackEngine])

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

    playbackEngine.reset()

    sessionStore.replace(
      deserializeSession(contents),
    )
  }, [sessionStore, playbackEngine])

  const handleOpenDemo = useCallback((demo: string) => {
    playbackEngine.reset()

    sessionStore.replace(
      createDemoSession(demo),
    )
  }, [sessionStore, playbackEngine])

  return useMemo(() => ({
    handleNew,
    handleOpenDemo,
    handleSave,
    handleOpen,
  }), [
    handleNew,
    handleOpenDemo,
    handleSave,
    handleOpen,
  ])
}
