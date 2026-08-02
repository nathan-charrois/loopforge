import { PITCH_CLASSES, type PitchClass } from '~/domain'

export const PANEL_OCTAVE_START = 2
export const PANEL_OCTAVE_COUNT = 6
export const PANEL_KEY_COUNT = PANEL_OCTAVE_COUNT * PITCH_CLASSES.length

export const PANEL_MIN_MIDI_NOTE = (PANEL_OCTAVE_START + 1) * PITCH_CLASSES.length
export const PANEL_MAX_MIDI_NOTE = PANEL_MIN_MIDI_NOTE + PANEL_KEY_COUNT - 1

export const PANEL_RULER_HEIGHT = 34
export const PANEL_ROW_HEIGHT = 16
export const PANEL_ROLL_HEIGHT = PANEL_KEY_COUNT * PANEL_ROW_HEIGHT
export const PANEL_VIEWPORT_HEIGHT = 440

export const PANEL_PIANO_WIDTH = 88

export const BLACK_PITCH_CLASSES = new Set<PitchClass>([1, 3, 6, 8, 10])
