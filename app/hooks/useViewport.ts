import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import { flushSync } from 'react-dom'

import { useAnimationFrameThrottle } from './useAnimationFrameThrottle'
import {
  createViewportState,
  zoomViewport,
} from '~/store/editor'

const WHEEL_ZOOM_SENSITIVITY = 0.001
const WHEEL_ZOOM_SAFE_ZONE_PX = 50

export function useViewport() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState(() => createViewportState())

  const zoomViewportAt = useAnimationFrameThrottle(
    useCallback((
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
    }, []),
  )

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

    const anchorPixel = getWheelZoomAnchorPixel(
      event.clientX - rect.left,
      scrollElement.clientWidth,
    )

    zoomViewportAt(
      scrollElement,
      anchorPixel,
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

function getWheelZoomAnchorPixel(
  pointerX: number,
  viewportWidth: number,
): number {
  if (pointerX <= WHEEL_ZOOM_SAFE_ZONE_PX) {
    return 0
  }

  if (pointerX >= viewportWidth - WHEEL_ZOOM_SAFE_ZONE_PX) {
    return viewportWidth
  }

  return pointerX
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
