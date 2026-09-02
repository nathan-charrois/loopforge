export const DRUM_PIECES = {
  kick: 'kick',
  snare: 'snare',
  closedHat: 'closedHat',
  openHat: 'openHat',
  clap: 'clap',
  lowTom: 'lowTom',
  midTom: 'midTom',
  highTom: 'highTom',
  crash: 'crash',
  ride: 'ride',
} as const

export type DrumPiece = typeof DRUM_PIECES[keyof typeof DRUM_PIECES]

export const DEFAULT_DRUM_PIECE = DRUM_PIECES['kick']

export const INSTRUMENT_KINDS = ['drum', 'thor', 'subtractor'] as const
