import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { flushSync } from 'react-dom'

import {
  createViewportState,
  zoomViewport,
} from '~/store/editor'

const WHEEL_ZOOM_SENSITIVITY = 0.0005

export function useViewport() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState(() => createViewportState())

  const zoomViewportAt = useCallback((
    scrollElement: HTMLDivElement,
    anchorPixel: number,
    multiplier: number,
  ) => {
    const scrollX = scrollElement.scrollLeft
    let nextScrollX = scrollX

    flushSync(() => {
      setViewport((currentViewport) => {
        const nextViewport = zoomViewport(
          {
            ...currentViewport,
            scrollX,
          },
          anchorPixel,
          multiplier,
        )

        nextScrollX = nextViewport.scrollX

        return nextViewport
      })
    })

    scrollElement.scrollLeft = nextScrollX
  }, [])

  const handleZoomBy = useCallback((multiplier: number) => {
    const scrollElement = scrollRef.current

    if (scrollElement === null) {
      return
    }

    zoomViewportAt(
      scrollElement,
      scrollElement.clientWidth / 2,
      multiplier,
    )
  }, [zoomViewportAt])

  const handleViewportWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (event.deltaY === 0) {
      return
    }

    event.preventDefault()

    const scrollElement = event.currentTarget
    const rect = scrollElement.getBoundingClientRect()

    zoomViewportAt(
      scrollElement,
      event.clientX - rect.left,
      getZoomMultiplier(event),
    )
  }, [zoomViewportAt])

  return useMemo(() => ({
    viewport,
    scrollRef,
    handleViewportWheel,
    handleZoomBy,
  }), [
    viewport,
    scrollRef,
    handleViewportWheel,
    handleZoomBy,
  ])
}

function getZoomMultiplier(event: ReactWheelEvent<HTMLDivElement>): number {
  const deltaY = getWheelDeltaPixels(event)
  return Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY)
}

function getWheelDeltaPixels(event: ReactWheelEvent<HTMLDivElement>): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * event.currentTarget.clientHeight
  }

  return event.deltaY
}
