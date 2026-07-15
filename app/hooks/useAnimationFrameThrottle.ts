import {
  useCallback,
  useEffect,
  useRef,
} from 'react'

export function useAnimationFrameThrottle<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
): (...args: TArgs) => void {
  const callbackRef = useRef(callback)
  const frameRef = useRef<number | null>(null)
  const argsRef = useRef<TArgs | null>(null)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }

      frameRef.current = null
      argsRef.current = null
    }
  }, [])

  return useCallback((...args: TArgs) => {
    argsRef.current = args

    if (frameRef.current !== null) {
      return
    }

    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null

      const nextArgs = argsRef.current
      argsRef.current = null

      if (nextArgs === null) {
        return
      }

      callbackRef.current(...nextArgs)
    })
  }, [])
}
