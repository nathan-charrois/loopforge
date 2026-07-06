import { type ChordSymbol, getChordPitchClasses } from '../harmony'
import {
  getOctaveForMidiNote,
  type MidiNote,
  midiNoteFromPitchClass,
  type Octave,
  type PitchClass,
  pitchClassFromMidiNote,
} from '../musicPrimitives'
import { type Register, REGISTER_BASE_OCTAVES, type VoicingType } from './constants'

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

export type MaterializedNote = {
  midiNote: MidiNote
  pitchClass: PitchClass
  octave: Octave
}

export function materializeChordVoicing(chord: ChordSymbol, voicing: ChordVoicing): MaterializedNote[] {
  const pitchClasses = orderPitchClassesFromRoot(getChordPitchClasses(chord), chord.root)
  const baseOctave = voicing.octave ?? REGISTER_BASE_OCTAVES[voicing.register]
  const closedNotes = pitchClassesToAscendingMidiNotes(pitchClasses, baseOctave)
  const invertedNotes = applyInversion(closedNotes, voicing.inversion)
  const spreadNotes = applySpread(invertedNotes, voicing)
  const bassNotes = getBassNotes(voicing, baseOctave, spreadNotes)

  return [...bassNotes, ...spreadNotes]
    .sort((left, right) => left - right)
    .map(midiNoteToMaterializedNote)
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

function applySpread(midiNotes: MidiNote[], voicing: ChordVoicing): MidiNote[] {
  if (voicing.type === 'close') {
    return [...midiNotes]
  }

  if (voicing.type === 'drop2' && midiNotes.length >= 4) {
    const output = [...midiNotes]
    output[output.length - 2] -= 12

    return output
  }

  const octaveSpread = voicing.type === 'spread' ? Math.max(1, voicing.spread || 1) : 1

  return midiNotes.map((midiNote, index) => {
    if (index % 2 === 0) {
      return midiNote
    }

    return midiNote + (12 * octaveSpread)
  })
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

function midiNoteToMaterializedNote(midiNote: MidiNote): MaterializedNote {
  return {
    midiNote,
    octave: getOctaveForMidiNote(midiNote),
    pitchClass: pitchClassFromMidiNote(midiNote),
  }
}
