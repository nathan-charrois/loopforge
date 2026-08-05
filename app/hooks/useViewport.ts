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
  scrollViewport,
  zoomViewport,
} from '~/store/editor'

const MOUSE_DRAG_MAX_SCROLL_STEP_PX = 20
const MOUSE_DRAG_SAFE_ZONE_PX = 50
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

  const handleAutoScroll = useCallback((clientX: number) => {
    const scrollElement = scrollRef.current

    if (scrollElement === null) {
      return false
    }

    const rect = scrollElement.getBoundingClientRect()

    const scrollDelta = getMouseDragScrollDelta(
      clientX - rect.left,
      scrollElement.clientWidth,
    )

    const anchorPixel = getMouseDragAnchorPixel(
      scrollElement,
      scrollDelta,
    )

    if (anchorPixel === scrollElement.scrollLeft) {
      return false
    }

    flushSync(() => {
      setViewport(
        viewport => scrollViewport(viewport, anchorPixel),
      )
    })
    scrollElement.scrollLeft = anchorPixel
  }, [])

  const handleViewportFit = useCallback((lengthTicks: number) => {
    const scrollElement = scrollRef.current

    if (scrollElement === null || lengthTicks <= 0) {
      return
    }

    const pixelsPerTick = scrollElement.clientWidth / lengthTicks

    setViewport(currentViewport => ({
      ...currentViewport,
      maxPixelsPerTick: pixelsPerTick * 4,
      minPixelsPerTick: pixelsPerTick / 4,
      pixelsPerTick,
      scrollX: 0,
    }))
    scrollElement.scrollLeft = 0
  }, [])

  return useMemo(() => ({
    viewport,
    scrollRef,
    handleAutoScroll,
    handleViewportFit,
    handleViewportWheel,
    handleZoomBy,
  }), [
    viewport,
    scrollRef,
    handleAutoScroll,
    handleViewportFit,
    handleViewportWheel,
    handleZoomBy,
  ])
}

function getMouseDragScrollDelta(
  pointerX: number,
  viewportWidth: number,
): number {
  const leftDistance = MOUSE_DRAG_SAFE_ZONE_PX - pointerX

  if (leftDistance > 0) {
    return -Math.min(leftDistance, MOUSE_DRAG_MAX_SCROLL_STEP_PX)
  }

  const rightDistance = pointerX - (viewportWidth - MOUSE_DRAG_SAFE_ZONE_PX)

  if (rightDistance > 0) {
    return Math.min(rightDistance, MOUSE_DRAG_MAX_SCROLL_STEP_PX)
  }

  return 0
}

function getMouseDragAnchorPixel(
  scrollElement: HTMLDivElement,
  scrollDelta: number,
): number {
  const maxScrollX = Math.max(0, scrollElement.scrollWidth - scrollElement.clientWidth)
  return Math.min(maxScrollX, Math.max(0, scrollElement.scrollLeft + scrollDelta))
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
