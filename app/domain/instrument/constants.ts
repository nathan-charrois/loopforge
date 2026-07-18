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
