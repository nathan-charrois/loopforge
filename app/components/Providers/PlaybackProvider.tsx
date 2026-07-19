import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { useSessionStore } from './SessionProvider'
import { PlaybackEngine } from '~/audio'
import type { Workspace } from '~/store/workspace'

const PlaybackEngineContext = createContext<PlaybackEngine | undefined>(undefined)

type Props = {
  children: ReactNode
}

export function PlaybackProvider({ children }: Props) {
  const sessionStore = useSessionStore()
  const playbackEngine = useMemo(() => new PlaybackEngine(), [])

  useEffect(() => {
    let previousWorkspace: Workspace | undefined

    const synchronizeWorkspace = (): void => {
      const workspace = sessionStore.getSnapshot().workspace

      if (workspace === previousWorkspace) {
        return
      }

      previousWorkspace = workspace
      playbackEngine.loadWorkspace(workspace)
    }

    synchronizeWorkspace()

    const unsubscribe = sessionStore.subscribe(synchronizeWorkspace)

    return () => {
      unsubscribe()
      playbackEngine.dispose()
    }
  }, [sessionStore, playbackEngine])

  return (
    <PlaybackEngineContext.Provider value={playbackEngine}>
      {children}
    </PlaybackEngineContext.Provider>
  )
}

export function usePlaybackEngine(): PlaybackEngine {
  const engine = useContext(PlaybackEngineContext)

  if (engine === undefined) {
    throw new Error('usePlaybackEngine must be used within PlaybackProvider')
  }

  return engine
}
