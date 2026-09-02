export const WAVETABLE_IDS = [
  'basic',
  'bright',
  'hollow',
] as const

type WavetableFrame = Readonly<{
  imag: Float32Array
  real: Float32Array
}>

const HARMONIC_COUNT = 32

const SINE_FRAME = createFrame(harmonic => harmonic === 1 ? 1 : 0)

const TRIANGLE_FRAME = createFrame((harmonic) => {
  if (harmonic % 2 === 0) {
    return 0
  }

  return ((harmonic - 1) / 2) % 2 === 0
    ? 1 / harmonic ** 2
    : -1 / harmonic ** 2
})

const SAW_FRAME = createFrame(harmonic => 1 / harmonic)

const SQUARE_FRAME = createFrame(harmonic => harmonic % 2 === 0 ? 0 : 1 / harmonic)

const HOLLOW_FRAME = createFrame((harmonic) => {
  if (harmonic === 1) {
    return 0.35
  }

  return harmonic % 2 === 0 ? 0 : 1 / Math.sqrt(harmonic)
})

const WAVETABLES: Readonly<Record<typeof WAVETABLE_IDS[number], readonly WavetableFrame[]>> = {
  basic: [SINE_FRAME, TRIANGLE_FRAME, SAW_FRAME],
  bright: [TRIANGLE_FRAME, SAW_FRAME, SQUARE_FRAME],
  hollow: [SINE_FRAME, HOLLOW_FRAME, SQUARE_FRAME],
}

export function createWavetablePeriodicWave(
  context: BaseAudioContext,
  wavetableId: string,
  position: number,
): PeriodicWave {
  const frames = WAVETABLES[isWavetableId(wavetableId) ? wavetableId : 'basic']
  const scaledPosition = clamp(position, 0, 1) * (frames.length - 1)
  const firstFrameIndex = Math.floor(scaledPosition)
  const secondFrameIndex = Math.min(firstFrameIndex + 1, frames.length - 1)
  const mix = scaledPosition - firstFrameIndex
  const firstFrame = frames[firstFrameIndex]
  const secondFrame = frames[secondFrameIndex]
  const real = new Float32Array(HARMONIC_COUNT + 1)
  const imag = new Float32Array(HARMONIC_COUNT + 1)

  for (let harmonic = 0; harmonic <= HARMONIC_COUNT; harmonic += 1) {
    real[harmonic] = interpolate(
      firstFrame.real[harmonic],
      secondFrame.real[harmonic],
      mix,
    )
    imag[harmonic] = interpolate(
      firstFrame.imag[harmonic],
      secondFrame.imag[harmonic],
      mix,
    )
  }

  return context.createPeriodicWave(real, imag)
}

function createFrame(
  harmonicAmplitude: (harmonic: number) => number,
): WavetableFrame {
  const imag = new Float32Array(HARMONIC_COUNT + 1)

  for (let harmonic = 1; harmonic <= HARMONIC_COUNT; harmonic += 1) {
    imag[harmonic] = harmonicAmplitude(harmonic)
  }

  return {
    imag,
    real: new Float32Array(HARMONIC_COUNT + 1),
  }
}

function isWavetableId(
  wavetableId: string,
): wavetableId is typeof WAVETABLE_IDS[number] {
  return WAVETABLE_IDS.some(candidate => candidate === wavetableId)
}

function interpolate(from: number, to: number, amount: number): number {
  return from + (to - from) * amount
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value))
}
