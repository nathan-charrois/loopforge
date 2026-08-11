import {
  useEffect,
  useState,
} from 'react'

const SAMPLE_DURATION_MS = 325

export function FramesPerSecondMeter() {
  const [measurement, setMeasurement] = useState<number>(0)

  useEffect(() => {
    let animationFrameId: number
    let frameCount = 0
    let previousFrameAt = performance.now()
    let sampleStartedAt = previousFrameAt

    const measureFrame = (frameAt: number) => {
      frameCount += 1
      previousFrameAt = frameAt

      const sampleDurationMs = frameAt - sampleStartedAt

      if (sampleDurationMs >= SAMPLE_DURATION_MS) {
        setMeasurement(
          Math.round(frameCount * 1000 / sampleDurationMs),
        )

        frameCount = 0
        sampleStartedAt = frameAt
      }

      animationFrameId = requestAnimationFrame(measureFrame)
    }

    animationFrameId = requestAnimationFrame(measureFrame)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        zIndex: 10,
        padding: '6px 8px',
        fontFamily: 'monospace',
        fontSize: 12,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1.35,
        pointerEvents: 'none',
        userSelect: 'none',
        color: measurement < 20 ? 'red' : measurement < 30 ? 'orange' : undefined,
      }}
    >
      <div>
        {measurement || '--'}
        {' '}
        FPS
      </div>
    </div>
  )
}
