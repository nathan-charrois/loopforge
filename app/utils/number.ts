export function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function clampInteger(value: number, min: number, max: number): number {
  return clampNumber(Math.round(value), min, max)
}

export function parseInteger(value: string, fallback = 0): number {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function parseNumber(value: string, fallback = 0): number {
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

export function positiveModulo(value: number, divisor: number): number {
  if (divisor === 0) {
    return 0
  }

  return ((value % divisor) + divisor) % divisor
}
