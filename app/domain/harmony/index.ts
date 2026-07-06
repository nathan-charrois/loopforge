import {
  getNoteNameForPitchClass,
  type Interval,
  normalizePitchClass,
  type NoteName,
  type PitchClass,
  transposePitchClass,
} from '../musicPrimitives'

export const MODES = [
  'major',
  'minor',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'locrian',
] as const

export type Mode = typeof MODES[number]

export type Scale = {
  root: PitchClass
  mode: Mode
}

export type Key = {
  tonic: PitchClass
  mode: Mode
}

export const CHORD_QUALITIES = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'sus2',
  'sus4',
] as const

export type ChordQuality = typeof CHORD_QUALITIES[number]
export type ChordExtension = '6' | '7' | 'maj7' | '9' | '11' | '13'
export type ChordAlteration = 'b5' | '#5' | 'b9' | '#9' | '#11' | 'b13'
export type ChordFunction = 'tonic' | 'predominant' | 'dominant' | 'subdominant' | 'passing'
export type RomanNumeral = string
export type NashvilleNumber = string

export type ChordSymbol = {
  root: PitchClass
  quality: ChordQuality
  extensions: ChordExtension[]
  alterations: ChordAlteration[]
  bass?: PitchClass
}

const MODE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
} as const satisfies Record<Mode, readonly Interval[]>

const CHORD_QUALITY_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
} as const satisfies Record<ChordQuality, readonly Interval[]>

const CHORD_EXTENSION_INTERVALS = {
  6: 9,
  7: 10,
  maj7: 11,
  9: 14,
  11: 17,
  13: 21,
} as const satisfies Record<ChordExtension, Interval>

const CHORD_ALTERATION_INTERVALS = {
  'b5': 6,
  '#5': 8,
  'b9': 13,
  '#9': 15,
  '#11': 18,
  'b13': 20,
} as const satisfies Record<ChordAlteration, Interval>

const CHORD_QUALITY_SUFFIX = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
} as const satisfies Record<ChordQuality, string>

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const

export function isMode(value: string): value is Mode {
  return MODES.includes(value as Mode)
}

export function isChordQuality(value: string): value is ChordQuality {
  return CHORD_QUALITIES.includes(value as ChordQuality)
}

export function createDefaultKey(): Key {
  return {
    mode: 'major',
    tonic: 0,
  }
}

export function createChordSymbol(input: {
  root: PitchClass
  quality?: ChordQuality
  extensions?: ChordExtension[]
  alterations?: ChordAlteration[]
  bass?: PitchClass
}): ChordSymbol {
  return {
    alterations: input.alterations ?? [],
    bass: input.bass,
    extensions: input.extensions ?? [],
    quality: input.quality ?? 'major',
    root: input.root,
  }
}

export function formatChordSymbol(chord: ChordSymbol): string {
  const root = getNoteNameForPitchClass(chord.root)
  const quality = CHORD_QUALITY_SUFFIX[chord.quality]
  const extensions = chord.extensions.join('')
  const alterations = chord.alterations.join('')
  const bass = chord.bass === undefined ? '' : `/${getNoteNameForPitchClass(chord.bass)}`

  return `${root}${quality}${extensions}${alterations}${bass}`
}

export function transposeChordSymbol(chord: ChordSymbol, interval: Interval): ChordSymbol {
  return {
    ...chord,
    alterations: [...chord.alterations],
    bass: chord.bass === undefined ? undefined : transposePitchClass(chord.bass, interval),
    extensions: [...chord.extensions],
    root: transposePitchClass(chord.root, interval),
  }
}

export function getChordPitchClasses(chord: ChordSymbol): PitchClass[] {
  const intervals = new Set<Interval>(CHORD_QUALITY_INTERVALS[chord.quality])

  for (const extension of chord.extensions) {
    intervals.add(CHORD_EXTENSION_INTERVALS[extension])
  }

  for (const alteration of chord.alterations) {
    intervals.add(CHORD_ALTERATION_INTERVALS[alteration])
  }

  return Array.from(intervals, interval => normalizePitchClass(chord.root + interval))
}

export function getScalePitchClasses(scaleOrKey: Scale | Key): PitchClass[] {
  const root = 'tonic' in scaleOrKey ? scaleOrKey.tonic : scaleOrKey.root

  return MODE_INTERVALS[scaleOrKey.mode].map(interval => normalizePitchClass(root + interval))
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

export function getPitchClassName(pitchClass: PitchClass): NoteName {
  return getNoteNameForPitchClass(pitchClass)
}
