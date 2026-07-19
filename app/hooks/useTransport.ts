import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  tickToX,
  xToTick,
} from '~/store/editor'
import type { Workspace } from '~/store/workspace'
import {
  Transport,
  type TransportStatus,
} from '~/utils/transport'

export function useTransport(
  workspace: Workspace,
  loopEnabled: boolean = false,
): Transport {
  const transportRef = useRef<Transport | null>(null)

  if (transportRef.current === null) {
    transportRef.current = new Transport(workspace)
  }

  const transport = transportRef.current
  const workspaceRef = useRef(workspace)

  useEffect(() => {
    if (workspaceRef.current !== workspace) {
      transport.setWorkspace(workspace)
      workspaceRef.current = workspace
    }

    if (!loopEnabled || transport.getSnapshot().loopEnabled !== loopEnabled) {
      transport.setLoop(undefined, loopEnabled)
    }
  }, [loopEnabled, transport, workspace])

  useEffect(() => {
    return () => {
      transport.destroy()
    }
  }, [transport])

  return transport
}

export function useTransportStatus(transport: Transport): TransportStatus {
  const [status, setStatus] = useState<TransportStatus>(() => transport.getSnapshot().status)
  const statusRef = useRef(status)

  useEffect(() => {
    return transport.subscribe((snapshot) => {
      if (statusRef.current === snapshot.status) {
        return
      }

      statusRef.current = snapshot.status
      setStatus(snapshot.status)
    })
  }, [transport])

  return status
}

export function useTransportPlayhead(
  transport: Transport,
  pixelsPerTick: number,
  timelineRef: RefObject<HTMLDivElement | null>,
) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const getSeekTickFromClientX = useCallback((clientX: number) => {
    if (timelineRef.current === null) {
      return transport.getPlayheadTick()
    }

    const rect = timelineRef.current.getBoundingClientRect()
    const rawTick = xToTick(pixelsPerTick, clientX - rect.left)

    return Math.max(
      0,
      Math.min(transport.getSnapshot().projectEndTick, Math.round(rawTick)),
    )
  }, [pixelsPerTick, timelineRef, transport])

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    isDraggingRef.current = true

    event.currentTarget.setPointerCapture(event.pointerId)
    transport.seek(getSeekTickFromClientX(event.clientX))
  }, [getSeekTickFromClientX, transport])

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    transport.seek(getSeekTickFromClientX(event.clientX))
  }, [getSeekTickFromClientX, transport])

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
      const playheadTick = transport.getPlayheadTick()

      if (playheadRef.current !== null && Number.isFinite(playheadTick)) {
        playheadRef.current.style.transform = `translateX(${tickToX(pixelsPerTick, playheadTick)}px)`
      }

      frameId = requestAnimationFrame(updatePlayheadTransform)
    }

    frameId = requestAnimationFrame(updatePlayheadTransform)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [pixelsPerTick, transport])

  return useMemo(() => ({
    onPointerCancel: handlePointerEnd,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerEnd,
    ref: playheadRef,
  }), [handlePointerDown, handlePointerEnd, handlePointerMove])
}
