import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'

import type { PlaybackEngine } from '~/playback/playback'
import { createDefaultPlayheadMap, type PlayheadMap } from '~/playback/playhead'
import type { TransportSnapshot, TransportStatus } from '~/playback/transport'
import {
  clampTimelineTick,
  tickToX,
  xToTick,
} from '~/store/editor'

export function useTransportStatus(playbackEngine: PlaybackEngine): TransportStatus {
  const getSnapshot = useCallback(
    () => playbackEngine.transport.getSnapshot().status,
    [playbackEngine],
  )

  return useSyncExternalStore(
    playbackEngine.transport.subscribe,
    getSnapshot,
    getSnapshot,
  )
}

export function useTransportSnapshot(
  playbackEngine: PlaybackEngine,
): TransportSnapshot {
  return useSyncExternalStore(
    playbackEngine.transport.subscribe,
    playbackEngine.transport.getSnapshot,
    playbackEngine.transport.getSnapshot,
  )
}

const DEFAULT_PLAYHEAD_MAP = createDefaultPlayheadMap()

export function useTransportPlayhead(
  playbackEngine: PlaybackEngine,
  pixelsPerTick: number,
  timelineRef: RefObject<HTMLDivElement | null>,
  playheadMap: PlayheadMap = DEFAULT_PLAYHEAD_MAP,
) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const playheadMapRef = useRef<PlayheadMap>(playheadMap)
  const isDraggingRef = useRef(false)

  playheadMapRef.current = playheadMap

  const getSeekTickFromClientX = useCallback((clientX: number) => {
    const snapshot = playbackEngine.transport.getSnapshot()

    if (timelineRef.current === null) {
      return snapshot.playheadTick
    }

    const rect = timelineRef.current.getBoundingClientRect()
    const localTickFloat = xToTick(pixelsPerTick, clientX - rect.left)

    const transportTick = playheadMapRef.current.getTransportTick(
      clampTimelineTick(localTickFloat),
      snapshot.playheadTick,
    )

    return Math.max(0, Math.min(snapshot.projectEndTick, transportTick))
  }, [pixelsPerTick, playbackEngine, timelineRef])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    isDraggingRef.current = true

    event.currentTarget.setPointerCapture(event.pointerId)
    playbackEngine.seek(getSeekTickFromClientX(event.clientX))
  }, [getSeekTickFromClientX, playbackEngine])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    playbackEngine.seek(getSeekTickFromClientX(event.clientX))
  }, [getSeekTickFromClientX, playbackEngine])

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return
    }

    event.stopPropagation()
    isDraggingRef.current = false

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  useEffect(() => {
    let frameId = 0

    function updatePlayheadTransform() {
      const element = playheadRef.current

      if (element === null) {
        return
      }

      const transportTick = playbackEngine.transport.getSnapshot().playheadTick
      const localTick = playheadMapRef.current.getLocalTick(transportTick)

      if (localTick === undefined || !Number.isFinite(localTick)) {
        element.style.visibility = 'hidden'
      }
      else {
        element.style.visibility = 'visible'
        element.style.transform = `translateX(${tickToX(pixelsPerTick, localTick)}px)`
      }

      frameId = requestAnimationFrame(updatePlayheadTransform)
    }

    frameId = requestAnimationFrame(updatePlayheadTransform)

    return () => cancelAnimationFrame(frameId)
  }, [pixelsPerTick, playbackEngine])

  return useMemo(() => ({
    onPointerCancel: handlePointerEnd,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    ref: playheadRef,
  }), [handlePointerDown, handlePointerEnd, handlePointerMove])
}
