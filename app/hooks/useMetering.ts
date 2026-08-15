import {
  useCallback,
  useSyncExternalStore,
} from 'react'

import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import type { MixChannelId } from '~/domain'

export function useMetering(mixChannelId: MixChannelId): number {
  const audioEngine = usePlaybackEngine().audioEngine
  const getSnapshot = useCallback(
    () => audioEngine.getMixerMeterSnapshot()[mixChannelId] ?? 0,
    [audioEngine, mixChannelId],
  )

  return useSyncExternalStore(
    audioEngine.subscribeMixerMeters,
    getSnapshot,
    getSnapshot,
  )
}
