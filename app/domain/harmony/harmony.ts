import {
  type Interval,
  normalizePitchClass,
  type PitchClass,
  transposePitchClass,
} from '../musicPrimitives'
import {
  CHORD_ALTERATION_INTERVALS,
  CHORD_EXTENSION_INTERVALS,
  CHORD_QUALITIES,
  CHORD_QUALITY_INTERVALS,
  type ChordAlteration,
  type ChordExtension,
  type ChordQuality,
  type Mode,
  MODE_INTERVALS,
  MODES,
} from './constants'

export type Scale = {
  root: PitchClass
  mode: Mode
}

export type Key = {
  tonic: PitchClass
  mode: Mode
}

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

export function isMode(value: string): value is Mode {
  return MODES.includes(value as Mode)
}

export function isChordQuality(value: string): value is ChordQuality {
  return CHORD_QUALITIES.includes(value as ChordQuality)
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
