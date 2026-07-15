export function toggleInArray<TValue extends string>(array: TValue[], value: TValue): TValue[] {
  return array.includes(value)
    ? array.filter(currentItem => currentItem !== value)
    : [...array, value]
}
