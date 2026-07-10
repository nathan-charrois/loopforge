import { getNoteNameForPitchClass } from '../musicPrimitives'
import { CHORD_QUALITY_SUFFIX, ROMAN_NUMERALS } from './constants'
import { type ChordSymbol, getScalePitchClasses, type Key, type NashvilleNumber, type RomanNumeral } from './harmony'

export function formatChordSymbol(chord: ChordSymbol): string {
  const root = getNoteNameForPitchClass(chord.root)
  const quality = CHORD_QUALITY_SUFFIX[chord.quality]
  const extensions = chord.extensions.join('')
  const alterations = chord.alterations.join('')

  return `${root}${quality}${extensions}${alterations}`
}

export function getRomanNumeral(chord: ChordSymbol, key: Key): RomanNumeral {
  const scalePitchClasses = getScalePitchClasses(key)
  const degreeIndex = scalePitchClasses.indexOf(chord.root)

  if (degreeIndex === -1) {
    return '?'
  }

  const base = ROMAN_NUMERALS[degreeIndex]

  if (chord.quality === 'diminished') {
    return `${base.toLowerCase()}dim`
  }

  if (chord.quality === 'minor') {
    return base.toLowerCase()
  }

  return base
}

export function getNashvilleNumber(chord: ChordSymbol, key: Key): NashvilleNumber {
  const scalePitchClasses = getScalePitchClasses(key)
  const degreeIndex = scalePitchClasses.indexOf(chord.root)

  if (degreeIndex === -1) {
    return '?'
  }

  const number = `${degreeIndex + 1}`

  if (chord.quality === 'diminished') {
    return `${number}dim`
  }

  if (chord.quality === 'minor') {
    return `${number}m`
  }

  return number
}
