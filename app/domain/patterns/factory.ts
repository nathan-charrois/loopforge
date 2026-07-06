import { type ChordQuality, createChordSymbol } from '../harmony'
import type { PitchClass } from '../musicPrimitives'
import {
  createAutomationEvent,
  createChordEvent,
  createDrumHitEvent,
  createNoteEvent,
  type PatternEvent,
} from '../patternEvents'
import type { PatternKind } from './index'

export function createSeedPatternEvents(
  patternKind: PatternKind,
  lengthTicks: number,
  options: {
    chordQuality: ChordQuality
    chordRoot: PitchClass
    drumPiece: string
    notePitch: number
  },
): PatternEvent[] {
  const halfLengthTicks = Math.max(120, Math.floor(lengthTicks / 2))

  switch (patternKind) {
    case 'automation':
      return [
        createAutomationEvent({
          id: 'event_automation_1',
          parameter: 'filterCutoff',
          timeTick: 0,
          value: 0.65,
        }),
      ]
    case 'chord':
      return [
        createChordEvent({
          chord: createChordSymbol({
            extensions: ['7'],
            quality: options.chordQuality,
            root: options.chordRoot,
          }),
          durationTicks: halfLengthTicks,
          id: 'event_chord_1',
          timeTick: 0,
          velocity: 96,
        }),
        createChordEvent({
          chord: createChordSymbol({
            quality: 'major',
            root: ((options.chordRoot + 5) % 12) as PitchClass,
          }),
          durationTicks: Math.max(120, lengthTicks - halfLengthTicks),
          id: 'event_chord_2',
          timeTick: halfLengthTicks,
          velocity: 88,
        }),
      ]
    case 'drum':
      return [
        createDrumHitEvent({
          id: 'event_drum_1',
          kitPiece: options.drumPiece,
          timeTick: 0,
          velocity: 112,
        }),
        createDrumHitEvent({
          id: 'event_drum_2',
          kitPiece: 'snare',
          timeTick: halfLengthTicks,
          velocity: 98,
        }),
      ]
    case 'note':
      return [
        createNoteEvent({
          durationTicks: halfLengthTicks,
          id: 'event_note_1',
          pitch: options.notePitch,
          timeTick: 0,
          velocity: 96,
        }),
        createNoteEvent({
          durationTicks: Math.max(120, lengthTicks - halfLengthTicks),
          id: 'event_note_2',
          pitch: options.notePitch + 7,
          timeTick: halfLengthTicks,
          velocity: 88,
        }),
      ]
  }
}
