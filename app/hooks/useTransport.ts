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
import type { TransportSnapshot, TransportStatus } from '~/playback/transport'
import {
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

export function useTransportPlayhead(
  playbackEngine: PlaybackEngine,
  pixelsPerTick: number,
  timelineRef: RefObject<HTMLDivElement | null>,
) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const getSeekTickFromClientX = useCallback((clientX: number) => {
    if (timelineRef.current === null) {
      return playbackEngine.transport.getSnapshot().playheadTick
    }

    const rect = timelineRef.current.getBoundingClientRect()
    const rawTick = xToTick(pixelsPerTick, clientX - rect.left)

    return Math.max(
      0,
      Math.min(
        playbackEngine.transport.getSnapshot().projectEndTick,
        Math.round(rawTick),
      ),
    )
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
      const playheadTick = playbackEngine.transport.getSnapshot().playheadTick

      if (playheadRef.current !== null && Number.isFinite(playheadTick)) {
        playheadRef.current.style.transform = `translateX(${tickToX(pixelsPerTick, playheadTick)}px)`
      }

      frameId = requestAnimationFrame(updatePlayheadTransform)
    }

    frameId = requestAnimationFrame(updatePlayheadTransform)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [pixelsPerTick, playbackEngine])

  return useMemo(() => ({
    onPointerCancel: handlePointerEnd,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    ref: playheadRef,
  }), [handlePointerDown, handlePointerEnd, handlePointerMove])
}
