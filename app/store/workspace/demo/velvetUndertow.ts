import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  createBlock,
  createDrumHitEvent,
  createDrumHitEvents,
  createDrumInstrument,
  createDrumPieceSound,
  createKeyEvent,
  createMeterEvent,
  createMixChannel,
  createMixer,
  createNoteEvent,
  createNoteEvents,
  createPattern,
  createProject,
  createProjectMetadata,
  createSection,
  createSynthOscillator,
  createTempoEvent,
  createThorInstrument,
  createTimeline,
  createTrack,
  type DrumHitEvent,
  type DrumPiece,
  type Instrument,
  type MidiNote,
  type NoteEvent,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type ChordVoicing = {
  durationTicks: number
  pitches: readonly MidiNote[]
  startTick: number
  velocity: number
}

type TopNote = {
  durationTicks: number
  pitch: MidiNote
  startTick: number
  velocity: number
}

const KICK_BEATS: readonly (readonly number[])[] = [
  [0, 1.5, 2.75],
  [0, 1.75, 3.25],
  [0, 0.75, 2, 3.5],
  [0, 1.5, 2.75],
  [0, 1.25, 2.5, 3.75],
  [0, 1.75, 2.75],
  [0, 0.75, 2.5, 3.25],
  [0, 1.5, 2.75, 3.5],
  [0, 1.25, 2.75, 3.5],
  [0, 1.75, 2.5],
  [0, 0.75, 2.25, 3.25],
  [0, 1.5, 2.75, 3.75],
  [0, 1.25, 2, 3.5],
  [0, 1.75, 2.75, 3.25],
  [0, 0.75, 2.5, 3.75],
  [0, 1.5, 2.75, 3.25, 3.75],
  // Bars 17–20 repeat the opening pocket exactly.
  [0, 1.5, 2.75],
  [0, 1.75, 3.25],
  [0, 0.75, 2, 3.5],
  [0, 1.5, 2.75],
  // Bars 21–24 pull the same feel into a final variation.
  [0, 1.25, 2.5, 3.5],
  [0, 0.75, 1.75, 3.25],
  [0, 1.5, 2.25, 3, 3.75],
  [0, 1.25, 2.75, 3],
]

export function velvetUndertow(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 24
  const bassPatternTicks = barTicks * 6
  const endingBassPatternTicks = barTicks * 4
  const eighthNoteTicks = PPQ / 2
  const sixteenthNoteTicks = PPQ / 4
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const keysColor = '#7950f2'
  const drumsColor = '#fd7e14'
  const bassColor = '#2f9e44'
  const keysTrack = createTrack({
    color: keysColor,
    id: 'velvet_undertow_track_keys',
    instrumentId: 'velvet_undertow_keys',
    name: 'Moonpool Keys',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'velvet_undertow_track_drums',
    instrumentId: 'velvet_undertow_drums',
    name: 'Undertow Pocket',
    role: 'drums',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'velvet_undertow_track_bass',
    instrumentId: 'velvet_undertow_bass',
    name: 'Pressure Bloom',
    role: 'bass',
  })
  const tracks = [keysTrack, drumsTrack, bassTrack]
  const chordVoicings: readonly ChordVoicing[] = [
    // Dm9: low root beneath a compact C–F–A–E upper structure.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [38, 48, 53, 57, 64], startTick: bar(1), velocity: 76 },
    // Bbmaj9/D: the D pedal stays still while the upper voices turn warm.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [38, 46, 53, 57, 60], startTick: bar(2), velocity: 72 },
    // Fmaj9/C: a wide second inversion keeps the bass descending gently.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [36, 52, 57, 60, 67], startTick: bar(3), velocity: 70 },
    // G6/9 is the borrowed major IV from D Dorian; B natural is its shaft of light.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [43, 50, 57, 59, 64], startTick: bar(4), velocity: 78 },
    // Dm11/A returns home without putting the root in the bass.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [45, 50, 53, 60, 64, 67], startTick: bar(5), velocity: 76 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [46, 53, 57, 60, 62], startTick: bar(6), velocity: 72 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [43, 50, 53, 58, 62, 69], startTick: bar(7), velocity: 74 },
    // The suspended dominant slowly reveals C# before resolving on beat four.
    { durationTicks: PPQ + eighthNoteTicks, pitches: [45, 52, 55, 58, 62], startTick: bar(8), velocity: 76 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [45, 52, 55, 58, 61, 64], startTick: bar(8) + (PPQ * 3) / 2, velocity: 82 },
    { durationTicks: PPQ, pitches: [38, 53, 57, 60, 64], startTick: bar(8) + (PPQ * 3), velocity: 68 },

    // Bars 9–10 recall the opening from below before the new bass arrives.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [36, 50, 53, 57, 64], startTick: bar(9), velocity: 74 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [46, 53, 57, 60, 62], startTick: bar(10), velocity: 72 },
    // From bar 11 onward the keys release the low register to Pressure Bloom.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [52, 57, 60, 64, 67], startTick: bar(11), velocity: 70 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [50, 57, 59, 64, 69], startTick: bar(12), velocity: 78 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [50, 53, 60, 64, 67], startTick: bar(13), velocity: 74 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [52, 55, 59, 62, 64], startTick: bar(14), velocity: 70 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [53, 57, 60, 62, 65], startTick: bar(15), velocity: 72 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [50, 53, 58, 60, 65], startTick: bar(15) + (PPQ * 2), velocity: 76 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [52, 55, 58, 62], startTick: bar(16), velocity: 76 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [52, 55, 58, 61, 64], startTick: bar(16) + (PPQ * 3) / 2, velocity: 82 },
    { durationTicks: PPQ, pitches: [53, 57, 60, 64], startTick: bar(16) + (PPQ * 3), velocity: 68 },

    // Bars 17–20 are a direct reprise of the first four voicings.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [38, 48, 53, 57, 64], startTick: bar(17), velocity: 76 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [38, 46, 53, 57, 60], startTick: bar(18), velocity: 72 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [36, 52, 57, 60, 67], startTick: bar(19), velocity: 70 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [43, 50, 57, 59, 64], startTick: bar(20), velocity: 78 },

    // Pressure Bloom's return lets the final variation stay above the low register.
    { durationTicks: barTicks - eighthNoteTicks, pitches: [53, 57, 60, 64, 69], startTick: bar(21), velocity: 76 },
    { durationTicks: barTicks - eighthNoteTicks, pitches: [53, 57, 60, 62, 65], startTick: bar(22), velocity: 72 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [50, 53, 58, 60, 65], startTick: bar(23), velocity: 74 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [50, 57, 59, 64, 69], startTick: bar(23) + (PPQ * 2), velocity: 80 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [52, 55, 58, 62], startTick: bar(24), velocity: 78 },
    { durationTicks: PPQ + eighthNoteTicks, pitches: [52, 55, 58, 61, 64], startTick: bar(24) + (PPQ * 3) / 2, velocity: 84 },
    { durationTicks: PPQ, pitches: [53, 57, 60, 64, 69], startTick: bar(24) + (PPQ * 3), velocity: 76 },
  ]
  const topNotes: readonly TopNote[] = [
    // A small three-note answer curls around each long voicing.
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(1) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(1) + (PPQ * 9) / 4, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(1) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(2) + (PPQ * 3) / 2, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(2) + (PPQ * 5) / 2, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 65, startTick: bar(2) + (PPQ * 13) / 4, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(3) + PPQ, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(3) + (PPQ * 7) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(3) + (PPQ * 5) / 2, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(3) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(4) + (PPQ * 5) / 4, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(4) + (PPQ * 2), velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(4) + (PPQ * 11) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(4) + (PPQ * 7) / 2, velocity: 64 },

    // The second phrase keeps the contour but changes its landing notes.
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(5) + PPQ, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(5) + (PPQ * 7) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(5) + (PPQ * 5) / 2, velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(5) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 65, startTick: bar(6) + (PPQ * 3) / 2, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(6) + (PPQ * 9) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(6) + (PPQ * 3), velocity: 74 },

    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(7) + PPQ, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar(7) + (PPQ * 7) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(7) + (PPQ * 5) / 2, velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(7) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: sixteenthNoteTicks, pitch: 70, startTick: bar(8) + (PPQ * 3) / 4, velocity: 66 },
    { durationTicks: sixteenthNoteTicks, pitch: 69, startTick: bar(8) + PPQ, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(8) + (PPQ * 2), velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(8) + (PPQ * 3), velocity: 58 },

    // Bars 9–10 echo the hook in a lower arc, holding back the new voice.
    { durationTicks: eighthNoteTicks, pitch: 64, startTick: bar(9) + PPQ, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(9) + (PPQ * 7) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(9) + (PPQ * 5) / 2, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(9) + (PPQ * 13) / 4, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 62, startTick: bar(10) + (PPQ * 5) / 4, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 65, startTick: bar(10) + (PPQ * 2), velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(10) + (PPQ * 11) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(10) + (PPQ * 7) / 2, velocity: 64 },

    // The bass entrance lets the upper response become lighter and more open.
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(11) + (PPQ * 5) / 4, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(11) + (PPQ * 2), velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(11) + (PPQ * 3), velocity: 76 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(12) + PPQ, velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(12) + (PPQ * 7) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(12) + (PPQ * 5) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(12) + (PPQ * 13) / 4, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(13) + PPQ, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(13) + (PPQ * 7) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(13) + (PPQ * 5) / 2, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar(13) + (PPQ * 13) / 4, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(14) + PPQ, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(14) + (PPQ * 7) / 4, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(14) + (PPQ * 5) / 2, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(14) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 65, startTick: bar(15) + (PPQ * 3) / 4, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(15) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(15) + (PPQ * 9) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(15) + (PPQ * 11) / 4, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar(15) + (PPQ * 13) / 4, velocity: 74 },

    { durationTicks: sixteenthNoteTicks, pitch: 70, startTick: bar(16) + (PPQ * 3) / 4, velocity: 66 },
    { durationTicks: sixteenthNoteTicks, pitch: 69, startTick: bar(16) + PPQ, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(16) + (PPQ * 2), velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(16) + (PPQ * 3), velocity: 64 },

    // The opening melody returns unchanged in bars 17–20.
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(17) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(17) + (PPQ * 9) / 4, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(17) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(18) + (PPQ * 3) / 2, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(18) + (PPQ * 5) / 2, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 65, startTick: bar(18) + (PPQ * 13) / 4, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(19) + PPQ, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(19) + (PPQ * 7) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(19) + (PPQ * 5) / 2, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(19) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(20) + (PPQ * 5) / 4, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(20) + (PPQ * 2), velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(20) + (PPQ * 11) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(20) + (PPQ * 7) / 2, velocity: 64 },

    // The ending reshapes that contour around the returning sub-bass.
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(21) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(21) + (PPQ * 9) / 4, velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(21) + (PPQ * 13) / 4, velocity: 70 },

    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(22) + (PPQ * 5) / 4, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(22) + (PPQ * 2), velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 65, startTick: bar(22) + (PPQ * 11) / 4, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(22) + (PPQ * 7) / 2, velocity: 76 },

    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar(23) + PPQ, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar(23) + (PPQ * 7) / 4, velocity: 72 },
    { durationTicks: sixteenthNoteTicks, pitch: 71, startTick: bar(23) + (PPQ * 2), velocity: 80 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(23) + (PPQ * 11) / 4, velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(23) + (PPQ * 7) / 2, velocity: 68 },

    { durationTicks: sixteenthNoteTicks, pitch: 70, startTick: bar(24) + (PPQ * 3) / 4, velocity: 68 },
    { durationTicks: sixteenthNoteTicks, pitch: 69, startTick: bar(24) + PPQ, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(24) + (PPQ * 2), velocity: 78 },
    { durationTicks: PPQ, pitch: 74, startTick: bar(24) + (PPQ * 3), velocity: 72 },
  ]
  const bassNotes: readonly TopNote[] = [
    // Pattern ticks are local to the bar-11 Block.
    { durationTicks: PPQ * 2 + eighthNoteTicks, pitch: 45, startTick: 0, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 52, startTick: (PPQ * 11) / 4, velocity: 72 },
    { durationTicks: sixteenthNoteTicks, pitch: 48, startTick: (PPQ * 7) / 2, velocity: 66 },

    { durationTicks: PPQ * 2 + eighthNoteTicks, pitch: 47, startTick: barTicks, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 50, startTick: barTicks + (PPQ * 5) / 2, velocity: 72 },
    { durationTicks: sixteenthNoteTicks, pitch: 45, startTick: barTicks + (PPQ * 7) / 2, velocity: 66 },

    { durationTicks: PPQ * 2 + eighthNoteTicks, pitch: 38, startTick: barTicks * 2, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 45, startTick: (barTicks * 2) + (PPQ * 11) / 4, velocity: 74 },
    { durationTicks: sixteenthNoteTicks, pitch: 48, startTick: (barTicks * 2) + (PPQ * 7) / 2, velocity: 68 },

    { durationTicks: PPQ * 2 + eighthNoteTicks, pitch: 36, startTick: barTicks * 3, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 43, startTick: (barTicks * 3) + (PPQ * 5) / 2, velocity: 72 },
    { durationTicks: sixteenthNoteTicks, pitch: 40, startTick: (barTicks * 3) + (PPQ * 7) / 2, velocity: 66 },

    { durationTicks: PPQ * 2, pitch: 34, startTick: barTicks * 4, velocity: 92 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 43, startTick: (barTicks * 4) + (PPQ * 2), velocity: 88 },
    { durationTicks: sixteenthNoteTicks, pitch: 38, startTick: (barTicks * 4) + (PPQ * 7) / 2, velocity: 68 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 33, startTick: barTicks * 5, velocity: 96 },
    { durationTicks: PPQ, pitch: 40, startTick: (barTicks * 5) + (PPQ * 3) / 2, velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 43, startTick: (barTicks * 5) + (PPQ * 5) / 2, velocity: 72 },
    { durationTicks: PPQ, pitch: 38, startTick: (barTicks * 5) + (PPQ * 3), velocity: 86 },
  ]
  const endingBassNotes: readonly TopNote[] = [
    // A four-bar return that grows from F into the final low-D octave.
    { durationTicks: PPQ * 2 + eighthNoteTicks, pitch: 41, startTick: 0, velocity: 92 },
    { durationTicks: eighthNoteTicks, pitch: 45, startTick: (PPQ * 11) / 4, velocity: 76 },
    { durationTicks: sixteenthNoteTicks, pitch: 48, startTick: (PPQ * 7) / 2, velocity: 68 },

    { durationTicks: PPQ * 2 + eighthNoteTicks, pitch: 34, startTick: barTicks, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 36, startTick: barTicks + (PPQ * 5) / 2, velocity: 76 },
    { durationTicks: sixteenthNoteTicks, pitch: 41, startTick: barTicks + (PPQ * 7) / 2, velocity: 68 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 31, startTick: barTicks * 2, velocity: 98 },
    { durationTicks: eighthNoteTicks, pitch: 38, startTick: (barTicks * 2) + (PPQ * 7) / 4, velocity: 76 },
    { durationTicks: PPQ, pitch: 35, startTick: (barTicks * 2) + (PPQ * 2), velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 43, startTick: (barTicks * 2) + (PPQ * 13) / 4, velocity: 72 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 33, startTick: barTicks * 3, velocity: 102 },
    { durationTicks: PPQ, pitch: 40, startTick: (barTicks * 3) + (PPQ * 3) / 2, velocity: 80 },
    { durationTicks: eighthNoteTicks, pitch: 43, startTick: (barTicks * 3) + (PPQ * 5) / 2, velocity: 74 },
    { durationTicks: PPQ, pitch: 26, startTick: (barTicks * 3) + (PPQ * 3), velocity: 108 },
    { durationTicks: PPQ, pitch: 38, startTick: (barTicks * 3) + (PPQ * 3), velocity: 88 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: keysTrack.color,
          id: 'velvet_undertow_block_melody',
          lengthTicks: totalTicks,
          name: keysTrack.name,
          patternId: 'velvet_undertow_pattern_melody',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: keysTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'velvet_undertow_block_drums',
          lengthTicks: totalTicks,
          name: drumsTrack.name,
          patternId: 'velvet_undertow_pattern_drums',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: bassTrack.color,
          id: 'velvet_undertow_block_bass',
          lengthTicks: bassPatternTicks,
          name: 'Pressure Bloom — Bar 11 Entrance',
          patternId: 'velvet_undertow_pattern_bass',
          playbackMode: 'oneShot',
          startTick: bar(11),
          trackId: bassTrack.id,
        }),
        createBlock({
          color: bassTrack.color,
          id: 'velvet_undertow_block_bass_ending',
          lengthTicks: endingBassPatternTicks,
          name: 'Pressure Bloom — Final Return',
          patternId: 'velvet_undertow_pattern_bass_ending',
          playbackMode: 'oneShot',
          startTick: bar(21),
          trackId: bassTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'velvet_undertow_section_low_tide',
          lengthTicks: barTicks * 4,
          name: 'Low Tide',
          startTick: bar(1),
        }),
        createSection({
          id: 'velvet_undertow_section_under_current',
          lengthTicks: barTicks * 4,
          name: 'Under Current',
          startTick: bar(5),
        }),
        createSection({
          id: 'velvet_undertow_section_moon_pull',
          lengthTicks: barTicks * 4,
          name: 'Moon Pull',
          startTick: bar(9),
        }),
        createSection({
          id: 'velvet_undertow_section_pressure_bloom',
          lengthTicks: barTicks * 4,
          name: 'Pressure Bloom',
          startTick: bar(13),
        }),
        createSection({
          id: 'velvet_undertow_section_surface_memory',
          lengthTicks: barTicks * 4,
          name: 'Surface Memory',
          startTick: bar(17),
        }),
        createSection({
          id: 'velvet_undertow_section_final_bloom',
          lengthTicks: barTicks * 4,
          name: 'Final Bloom',
          startTick: bar(21),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.018,
          decay: 0.5,
          release: 0.9,
          sustain: 0.46,
        },
        filter: {
          cutoffHz: 2450,
          resonance: 2.2,
          type: 'lowpass',
        },
        id: 'velvet_undertow_keys',
        name: 'Moonpool Electric Piano',
        oscilators: [
          createSynthOscillator({ level: 0.56, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -7, level: 0.18, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 7, level: 0.14, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ level: 0.12, octave: -1, waveform: 'triangle' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.025,
          decay: 0.28,
          release: 0.42,
          sustain: 0.72,
        },
        filter: {
          cutoffHz: 620,
          resonance: 1.8,
          type: 'lowpass',
        },
        id: 'velvet_undertow_bass',
        name: 'Pressure Bloom Sub Bass',
        oscilators: [
          createSynthOscillator({ level: 0.72, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -5, level: 0.2, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.08, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'bass.default',
      }),
      createDrumInstrument({
        id: 'velvet_undertow_drums',
        name: 'Undertow Pocket Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.055,
            pitchSemitones: -4,
            soundId: 'drums.closedHat.default',
            volumeDb: -13,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.5,
            pitchSemitones: -8,
            soundId: 'drums.kick.default',
            volumeDb: 7,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.38,
            pitchSemitones: -7,
            soundId: 'drums.lowTom.default',
            volumeDb: -1,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.24,
            pitchSemitones: -5,
            soundId: 'drums.openHat.default',
            volumeDb: -15,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.2,
            pitchSemitones: -6,
            soundId: 'drums.ride.default',
            volumeDb: -17,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.2,
            pitchSemitones: -4,
            soundId: 'drums.snare.default',
            volumeDb: -1,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: keysTrack.mixChannelId, pan: -0.12, volumeDb: -8 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.1, volumeDb: 2 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: -1 }),
      ]),
      master: {
        muted: false,
        volumeDb: -2,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createHarmonyEvents(chordVoicings, topNotes),
        id: 'velvet_undertow_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bars four, twelve, twenty, and twenty-three use G6/9, the major IV borrowed from D Dorian; B natural is the defining tone.',
          progression: 'Bars 1–16 establish two related D-minor arcs; bars 17–20 reprise Dm9 · Bbmaj9/D · Fmaj9/C · G6/9; bars 21–24 vary it as Dm9/F · Bbmaj9/C · Gm11 → G6/9 · A7(b9) → Dm9.',
          voicing: 'Wide low anchors return without bass for the reprise, then become upper structures when Pressure Bloom re-enters at bar twenty-one.',
        },
        name: 'Moonpool Changes',
      }),
      createPattern({
        events: createDrumEvents(barTicks, eighthNoteTicks, sixteenthNoteTicks),
        id: 'velvet_undertow_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'The opening pocket returns exactly in bars seventeen through twenty, then the final variation brings back muted ride and a descending tom tail.',
        },
        name: 'Undertow Pocket',
      }),
      createPattern({
        events: createBassEvents(bassNotes),
        id: 'velvet_undertow_pattern_bass',
        kind: 'note',
        lengthTicks: bassPatternTicks,
        metadata: {
          entrance: 'Pressure Bloom enters at bar eleven, then owns the low register through the final resolution.',
        },
        name: 'Pressure Bloom',
      }),
      createPattern({
        events: createBassEvents(endingBassNotes, 'velvet_undertow_event_bass_ending'),
        id: 'velvet_undertow_pattern_bass_ending',
        kind: 'note',
        lengthTicks: endingBassPatternTicks,
        metadata: {
          entrance: 'Pressure Bloom returns at bar twenty-one and resolves in a low D octave beneath the final chord.',
        },
        name: 'Pressure Bloom — Final Return',
      }),
    ]),
    project: createProject({
      id: 'project_velvet_undertow',
      metadata: createProjectMetadata({
        description: 'A twenty-four-bar deep-pocket nocturne that reprises its opening before Pressure Bloom returns for a modal final variation and low-D ending.',
        tags: ['chill', 'deep', 'drum-focused', 'modal-interchange', 'three-track'],
      }),
      name: 'Velvet Undertow',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'velvet_undertow_key',
          key: { mode: 'minor', tonic: 2 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'velvet_undertow_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 88,
          id: 'velvet_undertow_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createHarmonyEvents(
  voicings: readonly ChordVoicing[],
  topNotes: readonly TopNote[],
): NoteEvent[] {
  const chordNotes = voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `velvet_undertow_chord_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - (pitchIndex === 0 ? 0 : 10) + (pitchIndex === voicing.pitches.length - 1 ? 3 : 0),
  })))
  const melodyNotes = topNotes.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `velvet_undertow_top_note_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('velvet_undertow_event_keys', [...chordNotes, ...melodyNotes])
}

function createBassEvents(
  notes: readonly TopNote[],
  eventId = 'velvet_undertow_event_bass',
): NoteEvent[] {
  return createNoteEvents(eventId, notes.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `velvet_undertow_bass_note_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  })))
}

function createDrumEvents(
  barTicks: number,
  eighthNoteTicks: number,
  sixteenthNoteTicks: number,
): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []
  const swingTicks = PPQ / 12
  let hitIndex = 0
  const addHit = (piece: DrumPiece, timeTick: number, velocity: number) => {
    hitIndex += 1
    hits.push(createDrumHitEvent({
      id: `velvet_undertow_drum_${hitIndex}`,
      piece,
      timeTick,
      velocity,
    }))
  }

  for (let barIndex = 0; barIndex < KICK_BEATS.length; barIndex += 1) {
    const barStartTick = barIndex * barTicks
    const turnaroundBar = barIndex % 4 === 3
    const repriseSection = barIndex >= 16 && barIndex < 20
    const grooveBarIndex = repriseSection ? barIndex - 16 : barIndex
    const rideSection = (barIndex >= 12 && barIndex < 16) || (barIndex >= 20 && barIndex < 23)

    KICK_BEATS[barIndex].forEach((beat, kickIndex) => {
      addHit('kick', barStartTick + Math.round(beat * PPQ), kickIndex === 0 ? 108 : 88 - (kickIndex * 3))
    })

    // The single strong snare on beat three makes a deep half-time center.
    addHit('snare', barStartTick + (PPQ * 2) + (swingTicks / 2), grooveBarIndex >= 8 ? 96 : grooveBarIndex >= 4 ? 94 : 90)
    if (barIndex % 2 === 1) {
      addHit('snare', barStartTick + (PPQ * 15) / 4, 42)
    }
    if (barIndex % 4 === 2) {
      addHit('snare', barStartTick + (PPQ * 7) / 4, 38)
    }

    for (let eighthIndex = 0; eighthIndex < 8; eighthIndex += 1) {
      const isOpenTurnaround = turnaroundBar && eighthIndex === 7
      addHit(
        isOpenTurnaround ? 'openHat' : rideSection && eighthIndex % 2 === 0 ? 'ride' : 'closedHat',
        barStartTick
        + (eighthIndex * eighthNoteTicks)
        + (eighthIndex % 2 === 1 ? swingTicks : 0),
        eighthIndex % 2 === 0 ? (eighthIndex === 0 ? 68 : 60) : 48,
      )
    }

    // Quiet sixteenths move around from bar to bar instead of filling every gap.
    const ghostHatSteps = barIndex % 2 === 0 ? [3, 11, 15] : [5, 9, 13]
    ghostHatSteps.forEach((step, ghostIndex) => {
      addHit('closedHat', barStartTick + (step * sixteenthNoteTicks), 34 + (ghostIndex * 3))
    })

    if (turnaroundBar) {
      const firstTomVelocity = barIndex === 23 ? 98 : barIndex === 15 ? 84 : barIndex === 7 ? 78 : barIndex === 11 ? 74 : 68
      const secondTomVelocity = barIndex === 23 ? 112 : barIndex === 15 ? 96 : barIndex === 7 ? 88 : barIndex === 11 ? 82 : 74

      addHit('lowTom', barStartTick + (PPQ * 13) / 4, firstTomVelocity)
      addHit('lowTom', barStartTick + (PPQ * 15) / 4, secondTomVelocity)
    }
  }

  return createDrumHitEvents('velvet_undertow_event_drums', hits)
}
