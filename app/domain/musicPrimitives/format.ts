import { NOTE_NAME_TO_PITCH_CLASS, type NoteName, PITCH_CLASS_TO_NOTE_NAME, type PitchClass } from './constants'

export function getPitchClassForNoteName(noteName: NoteName): PitchClass {
  return NOTE_NAME_TO_PITCH_CLASS[noteName]
}

export function getNoteNameForPitchClass(pitchClass: PitchClass): NoteName {
  return PITCH_CLASS_TO_NOTE_NAME[pitchClass]
}
