import { type ChordSymbol, getChordPitchClasses } from '../harmony'
import {
  getOctaveForMidiNote,
  type MidiNote,
  midiNoteFromPitchClass,
  type Octave,
  type PitchClass,
  pitchClassFromMidiNote,
} from '../musicPrimitives'
import {
  DEFAULT_VOICING_OCTAVE,
  type Register,
  REGISTER_SEMITONE_OFFSETS,
  type VoicingType,
} from './constants'

export type VoiceIndex = number
export type Inversion = number
export type Spread = number

export type ChordVoicing = {
  type: VoicingType
  inversion: Inversion
  register: Register
  spread: Spread
  octave?: Octave
  bassNote?: PitchClass
}

export type VoicedNote = {
  voiceIndex: VoiceIndex
  midiNote: MidiNote
  pitchClass: PitchClass
  octave: Octave
}

export function materializeChordVoicing(chord: ChordSymbol, voicing: ChordVoicing): VoicedNote[] {
  const pitchClasses = orderPitchClassesFromRoot(getChordPitchClasses(chord), chord.root)
  const baseOctave = voicing.octave ?? DEFAULT_VOICING_OCTAVE
  const closedNotes = pitchClassesToAscendingMidiNotes(pitchClasses, baseOctave)
  const invertedNotes = applyInversion(closedNotes, voicing.inversion)
  const typedNotes = applyVoicingType(invertedNotes, voicing.type)
  const spreadNotes = applySpread(typedNotes, voicing.spread)
  const bassNotes = getBassNotes(voicing, baseOctave, spreadNotes)
  const registeredNotes = applyRegister([...bassNotes, ...spreadNotes], voicing.register)

  return registeredNotes
    .sort((left, right) => left - right)
    .map(midiNoteToVoicedNote)
}

function orderPitchClassesFromRoot(pitchClasses: PitchClass[], root: PitchClass): PitchClass[] {
  return [...pitchClasses].sort((left, right) => {
    const leftDistance = (left - root + 12) % 12
    const rightDistance = (right - root + 12) % 12

    return leftDistance - rightDistance
  })
}

function pitchClassesToAscendingMidiNotes(pitchClasses: PitchClass[], baseOctave: Octave): MidiNote[] {
  const midiNotes: MidiNote[] = []

  for (const pitchClass of pitchClasses) {
    let midiNote = midiNoteFromPitchClass(pitchClass, baseOctave)

    while (midiNotes.length > 0 && midiNote <= midiNotes[midiNotes.length - 1]) {
      midiNote += 12
    }

    midiNotes.push(midiNote)
  }

  return midiNotes
}

function applyInversion(midiNotes: MidiNote[], inversion: Inversion): MidiNote[] {
  if (midiNotes.length === 0) {
    return []
  }

  const output = [...midiNotes]
  const inversionCount = ((Math.trunc(inversion) % output.length) + output.length) % output.length

  for (let index = 0; index < inversionCount; index += 1) {
    const shiftedNote = output.shift()

    if (shiftedNote !== undefined) {
      output.push(shiftedNote + 12)
    }
  }

  return output
}

function applyVoicingType(midiNotes: MidiNote[], type: VoicingType): MidiNote[] {
  if (type !== 'drop2' || midiNotes.length < 4) {
    return [...midiNotes]
  }

  const output = [...midiNotes]
  output[output.length - 2] -= 12

  return output
}

function applySpread(midiNotes: MidiNote[], spread: Spread): MidiNote[] {
  if (spread <= 0) {
    return [...midiNotes]
  }

  return midiNotes.map((midiNote, index) => {
    if (index === 0) {
      return midiNote
    }

    const octaveLift = Math.floor((index * spread) / 2)

    return midiNote + (octaveLift * 12)
  })
}

function applyRegister(midiNotes: MidiNote[], register: Register): MidiNote[] {
  const semitoneOffset = REGISTER_SEMITONE_OFFSETS[register]

  if (semitoneOffset === 0) {
    return [...midiNotes]
  }

  return midiNotes.map(midiNote => midiNote + semitoneOffset)
}

function getBassNotes(voicing: ChordVoicing, baseOctave: Octave, notes: MidiNote[]): MidiNote[] {
  if (voicing.bassNote === undefined) {
    return []
  }

  let bassNote = midiNoteFromPitchClass(voicing.bassNote, baseOctave - 1)
  const lowestNote = notes[0]

  while (lowestNote !== undefined && bassNote >= lowestNote) {
    bassNote -= 12
  }

  return [bassNote]
}

function midiNoteToVoicedNote(midiNote: MidiNote, voiceIndex: VoiceIndex): VoicedNote {
  return {
    voiceIndex,
    midiNote,
    octave: getOctaveForMidiNote(midiNote),
    pitchClass: pitchClassFromMidiNote(midiNote),
  }
}
