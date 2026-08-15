import {
  useCallback,
  useSyncExternalStore,
} from 'react'

import { INITIAL_MIXER_METER_READING } from '~/audio/mixerGraph'
import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import type { MixChannelId } from '~/domain'

export function useMeterLevel(mixChannelId: MixChannelId): number {
  const audioEngine = usePlaybackEngine().audioEngine
  const getSnapshot = useCallback(
    () => audioEngine.getMixerMeterSnapshot()[mixChannelId]?.level
      ?? INITIAL_MIXER_METER_READING.level,
    [audioEngine, mixChannelId],
  )

  return useSyncExternalStore(
    audioEngine.subscribeMixerMeters,
    getSnapshot,
    getSnapshot,
  )
}

export function useMeterPeak(mixChannelId: MixChannelId): number {
  const audioEngine = usePlaybackEngine().audioEngine
  const getSnapshot = useCallback(
    () => audioEngine.getMixerMeterSnapshot()[mixChannelId]?.peak
      ?? INITIAL_MIXER_METER_READING.peak,
    [audioEngine, mixChannelId],
  )

  return useSyncExternalStore(
    audioEngine.subscribeMixerMeters,
    getSnapshot,
    getSnapshot,
  )
}
