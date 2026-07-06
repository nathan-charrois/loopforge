import type { Interval } from '../musicPrimitives'

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

export const CHORD_QUALITIES = [
  'major',
  'minor',
  'diminished',
  'augmented',
  'sus2',
  'sus4',
] as const
export type ChordQuality = typeof CHORD_QUALITIES[number]

export const CHORD_EXTENSIONS = ['6', '7', 'maj7', '9', '11', '13'] as const
export type ChordExtension = typeof CHORD_EXTENSIONS[number]

export const CHORD_ALTERATIONS = ['b5', '#5', 'b9', '#9', '#11', 'b13'] as const
export type ChordAlteration = typeof CHORD_ALTERATIONS[number]

export const MODE_INTERVALS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
} as const satisfies Record<Mode, readonly Interval[]>

export const CHORD_QUALITY_INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
} as const satisfies Record<ChordQuality, readonly Interval[]>

export const CHORD_EXTENSION_INTERVALS = {
  6: 9,
  7: 10,
  maj7: 11,
  9: 14,
  11: 17,
  13: 21,
} as const satisfies Record<ChordExtension, Interval>

export const CHORD_ALTERATION_INTERVALS = {
  'b5': 6,
  '#5': 8,
  'b9': 13,
  '#9': 15,
  '#11': 18,
  'b13': 20,
} as const satisfies Record<ChordAlteration, Interval>

export const CHORD_QUALITY_SUFFIX = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
} as const satisfies Record<ChordQuality, string>

export const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const
