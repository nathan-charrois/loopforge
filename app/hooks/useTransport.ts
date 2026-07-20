import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { PlaybackEngine } from '~/audio'
import {
  tickToX,
  xToTick,
} from '~/store/editor'
import type { TransportStatus } from '~/utils/transport'

export function useTransportStatus(playbackEngine: PlaybackEngine): TransportStatus {
  const [status, setStatus] = useState<TransportStatus>(
    () => playbackEngine.getStatus(),
  )

  const statusRef = useRef(status)

  useEffect(() => {
    return playbackEngine.subscribe((snapshot) => {
      if (statusRef.current === snapshot.status) {
        return
      }

      statusRef.current = snapshot.status
      setStatus(snapshot.status)
    })
  }, [playbackEngine])

  return status
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
      return playbackEngine.getPlayheadTick()
    }

    const rect = timelineRef.current.getBoundingClientRect()
    const rawTick = xToTick(pixelsPerTick, clientX - rect.left)

    return Math.max(
      0,
      Math.min(playbackEngine.getSnapshot().projectEndTick, Math.round(rawTick)),
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
      const playheadTick = playbackEngine.getPlayheadTick()

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
