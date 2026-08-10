import { normalizePitchClass } from '../musicPrimitives'
import {
  CHORD_ALTERATIONS,
  CHORD_EXTENSIONS,
  CHORD_QUALITY_INTERVALS,
  type ChordAlteration,
  type ChordExtension,
  type ChordQuality,
  type Mode,
  MODE_INTERVALS,
  ROMAN_NUMERALS,
} from './constants'
import { createChordSymbol } from './factory'
import { type ChordSymbol, type Key } from './harmony'

export const CHORD_LIBRARY_CATEGORIES = [
  'diatonic',
  'common',
  'borrowed',
  'extensions',
  'alterations',
  'suspended',
  'secondary',
  'modal',
  'chromatic',
  'passing',
  'substitutions',
  'color',
] as const

export type ChordLibraryCategory = typeof CHORD_LIBRARY_CATEGORIES[number]

export type ChordLibraryEntry = {
  category: ChordLibraryCategory
  chord: ChordSymbol
  degree: string
}

export type ChordLibrary = Record<ChordLibraryCategory, ChordLibraryEntry[]>

const COMMON_ALTERATION_PAIRS = [
  ['b9', 'b5'],
  ['b9', '#5'],
  ['#9', 'b5'],
  ['#9', '#5'],
  ['b9', '#11'],
  ['#9', '#11'],
  ['b9', 'b13'],
  ['#9', 'b13'],
] as const satisfies readonly (readonly ChordAlteration[])[]

const MODAL_SIGNATURES = [
  { degree: 'Aeo ♭VI', degreeIndex: 5, mode: 'minor' },
  { degree: 'Dor IV', degreeIndex: 3, mode: 'dorian' },
  { degree: 'Phr ♭II', degreeIndex: 1, mode: 'phrygian' },
  { degree: 'Lyd II', degreeIndex: 1, mode: 'lydian' },
  { degree: 'Mix ♭VII', degreeIndex: 6, mode: 'mixolydian' },
  { degree: 'Loc ♭V', degreeIndex: 4, mode: 'locrian' },
] as const satisfies readonly {
  degree: string
  degreeIndex: number
  mode: Mode
}[]

export function createChordLibrary(key: Key): ChordLibrary {
  const diatonicChords = createModeTriads(key)
  const parallelMode = getParallelMode(key.mode, diatonicChords[0]?.chord.quality)

  return {
    alterations: createAlterationChords(diatonicChords),
    borrowed: createBorrowedChords(key, diatonicChords, parallelMode),
    chromatic: createChromaticMediants(key),
    color: createColorChords(diatonicChords),
    common: createCommonChords(key, diatonicChords),
    diatonic: diatonicChords,
    extensions: createExtensionChords(diatonicChords),
    modal: createModalChords(key),
    passing: createPassingDiminishedChords(diatonicChords),
    secondary: createSecondaryDominants(diatonicChords),
    substitutions: createSubstitutionChords(key),
    suspended: createSuspendedChords(diatonicChords),
  }
}

function createBorrowedChords(
  key: Key,
  diatonicChords: ChordLibraryEntry[],
  parallelMode: Mode,
): ChordLibraryEntry[] {
  return createModeTriads({ ...key, mode: parallelMode })
    .map((entry, degreeIndex) => ({ degreeIndex, entry }))
    .filter(({ entry }) => !diatonicChords.some(
      diatonic => areSameTriad(diatonic.chord, entry.chord),
    ))
    .map(({ degreeIndex, entry }) => ({
      ...entry,
      category: 'borrowed' as const,
      degree: formatScaleDegree(
        entry.chord.quality,
        degreeIndex,
        getDegreeAccidental(key.mode, parallelMode, degreeIndex),
      ),
    }))
}

function createModeTriads(key: Key): ChordLibraryEntry[] {
  const intervals = MODE_INTERVALS[key.mode]

  return intervals.map((rootInterval, degreeIndex) => {
    const thirdInterval = getStackedScaleInterval(intervals, degreeIndex, 2)
    const fifthInterval = getStackedScaleInterval(intervals, degreeIndex, 4)
    const quality = getTriadQuality(thirdInterval, fifthInterval)

    return {
      category: 'diatonic',
      chord: createChordSymbol({
        quality,
        root: normalizePitchClass(key.tonic + rootInterval),
      }),
      degree: formatScaleDegree(quality, degreeIndex),
    }
  })
}

function createCommonChords(
  key: Key,
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  return [0, 1, 3, 4, 5].map((degreeIndex) => {
    const entry = diatonicChords[degreeIndex]
    const extension = getDiatonicSeventhExtension(key.mode, degreeIndex)

    return {
      category: 'common',
      chord: {
        ...entry.chord,
        extensions: [extension],
      },
      degree: entry.degree,
    }
  })
}

function createColorChords(
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  const tonic = diatonicChords[0]
  const subdominant = diatonicChords[3]
  const dominant = diatonicChords[4]

  return [
    createColorEntry(tonic, 'add2'),
    createColorEntry(tonic, 'add4'),
    createColorEntry(subdominant, 'add2'),
    createColorEntry(dominant, 'sus2'),
    createColorEntry(dominant, 'sus4'),
  ]
}

function createExtensionChords(
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  return diatonicChords
    .filter(entry => entry.chord.quality !== 'diminished')
    .flatMap(entry => CHORD_EXTENSIONS.map(extension => ({
      category: 'extensions' as const,
      chord: {
        ...entry.chord,
        extensions: [extension],
      },
      degree: entry.degree,
    })))
}

function createAlterationChords(
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  const dominant = diatonicChords[4]

  return [
    ...CHORD_ALTERATIONS.map(alteration => [alteration] as const),
    ...COMMON_ALTERATION_PAIRS,
  ].map(alterations => createAlterationEntry(dominant, alterations))
}

function createAlterationEntry(
  entry: ChordLibraryEntry,
  alterations: readonly ChordAlteration[],
): ChordLibraryEntry {
  return {
    category: 'alterations',
    chord: {
      ...entry.chord,
      alterations: [...alterations],
      extensions: ['7'],
    },
    degree: entry.degree,
  }
}

function createSuspendedChords(
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  return diatonicChords.flatMap(entry => (['sus2', 'sus4'] as const).map(quality => ({
    category: 'suspended' as const,
    chord: {
      ...entry.chord,
      quality,
    },
    degree: entry.degree,
  })))
}

function createSecondaryDominants(
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  return diatonicChords.slice(1).map(target => ({
    category: 'secondary',
    chord: createChordSymbol({
      extensions: ['7'],
      quality: 'major',
      root: normalizePitchClass(target.chord.root + 7),
    }),
    degree: `V/${target.degree}`,
  }))
}

function createModalChords(key: Key): ChordLibraryEntry[] {
  return MODAL_SIGNATURES.map(({ degree, degreeIndex, mode }) => {
    const entry = createModeTriads({ ...key, mode })[degreeIndex]

    return {
      ...entry,
      category: 'modal',
      degree,
    }
  })
}

function createChromaticMediants(key: Key): ChordLibraryEntry[] {
  return [
    createRelativeChordEntry(key, 'chromatic', '♭III', 3, 'major'),
    createRelativeChordEntry(key, 'chromatic', '♭iii', 3, 'minor'),
    createRelativeChordEntry(key, 'chromatic', 'III', 4, 'major'),
    createRelativeChordEntry(key, 'chromatic', 'iii', 4, 'minor'),
    createRelativeChordEntry(key, 'chromatic', '♭VI', 8, 'major'),
    createRelativeChordEntry(key, 'chromatic', '♭vi', 8, 'minor'),
    createRelativeChordEntry(key, 'chromatic', 'VI', 9, 'major'),
    createRelativeChordEntry(key, 'chromatic', 'vi', 9, 'minor'),
  ]
}

function createPassingDiminishedChords(
  diatonicChords: ChordLibraryEntry[],
): ChordLibraryEntry[] {
  return diatonicChords.map(target => ({
    category: 'passing',
    chord: createChordSymbol({
      quality: 'diminished',
      root: normalizePitchClass(target.chord.root - 1),
    }),
    degree: `vii°/${target.degree}`,
  }))
}

function createSubstitutionChords(key: Key): ChordLibraryEntry[] {
  return [
    createRelativeChordEntry(key, 'substitutions', 'subV', 1, 'major', ['7']),
    createRelativeChordEntry(key, 'substitutions', '♭VII7', 10, 'major', ['7']),
    createRelativeChordEntry(key, 'substitutions', 'N6', 1, 'major'),
    createRelativeChordEntry(key, 'substitutions', 'iv', 5, 'minor'),
    createRelativeChordEntry(key, 'substitutions', '♭VImaj7', 8, 'major', ['maj7']),
    createRelativeChordEntry(key, 'substitutions', 'V+7', 7, 'augmented', ['7']),
    createRelativeChordEntry(key, 'substitutions', 'CT°', 0, 'diminished'),
  ]
}

function createRelativeChordEntry(
  key: Key,
  category: ChordLibraryCategory,
  degree: string,
  rootInterval: number,
  quality: ChordQuality,
  extensions: ChordExtension[] = [],
): ChordLibraryEntry {
  return {
    category,
    chord: createChordSymbol({
      extensions,
      quality,
      root: normalizePitchClass(key.tonic + rootInterval),
    }),
    degree,
  }
}

function createColorEntry(
  entry: ChordLibraryEntry,
  quality: Extract<ChordQuality, 'add2' | 'add4' | 'sus2' | 'sus4'>,
): ChordLibraryEntry {
  return {
    category: 'color',
    chord: {
      ...entry.chord,
      quality,
    },
    degree: entry.degree,
  }
}

function getStackedScaleInterval(
  intervals: readonly number[],
  degreeIndex: number,
  scaleStepOffset: number,
): number {
  const targetIndex = degreeIndex + scaleStepOffset
  const octaveOffset = Math.floor(targetIndex / intervals.length) * 12

  return intervals[targetIndex % intervals.length] + octaveOffset - intervals[degreeIndex]
}

function getTriadQuality(thirdInterval: number, fifthInterval: number): ChordQuality {
  for (const quality of ['major', 'minor', 'diminished', 'augmented'] as const) {
    const intervals = CHORD_QUALITY_INTERVALS[quality]

    if (intervals[1] === thirdInterval && intervals[2] === fifthInterval) {
      return quality
    }
  }

  throw new Error(`Unsupported diatonic triad intervals: ${thirdInterval}, ${fifthInterval}`)
}

function getDiatonicSeventhExtension(
  mode: Mode,
  degreeIndex: number,
): ChordExtension {
  const seventhInterval = getStackedScaleInterval(
    MODE_INTERVALS[mode],
    degreeIndex,
    6,
  )

  return seventhInterval === 11 ? 'maj7' : '7'
}

function getParallelMode(mode: Mode, tonicQuality?: ChordQuality): Mode {
  if (mode === 'major') {
    return 'minor'
  }

  if (mode === 'minor') {
    return 'major'
  }

  return tonicQuality === 'major' ? 'minor' : 'major'
}

function getDegreeAccidental(
  mode: Mode,
  parallelMode: Mode,
  degreeIndex: number,
): string {
  const interval = MODE_INTERVALS[mode][degreeIndex]
  const parallelInterval = MODE_INTERVALS[parallelMode][degreeIndex]
  const difference = parallelInterval - interval

  if (difference < 0) {
    return '♭'.repeat(Math.abs(difference))
  }

  return '♯'.repeat(difference)
}

function formatScaleDegree(
  quality: ChordQuality,
  degreeIndex: number,
  accidental = '',
): string {
  const numeral = ROMAN_NUMERALS[degreeIndex]
  const isLowerCase = quality === 'minor' || quality === 'diminished'
  const qualitySuffix = quality === 'diminished'
    ? '°'
    : quality === 'augmented' ? '+' : ''

  return `${accidental}${isLowerCase ? numeral.toLowerCase() : numeral}${qualitySuffix}`
}

function areSameTriad(left: ChordSymbol, right: ChordSymbol): boolean {
  return left.root === right.root && left.quality === right.quality
}
