export function toggleInArray(array: string[], value: string): string[] {
  return array.includes(value)
    ? array.filter(currentItem => currentItem !== value)
    : [...array, value]
}
