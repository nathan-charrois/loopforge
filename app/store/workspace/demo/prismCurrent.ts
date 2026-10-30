import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  type CompressorEffect,
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
  createPattern,
  createProject,
  createProjectMetadata,
  createSection,
  createSubtractorInstrument,
  createSynthOscillator,
  createTempoEvent,
  createThorInstrument,
  createTimeline,
  createTrack,
  type DurationTicks,
  type Effect,
  type Instrument,
  type MidiNote,
  type NoteEvent,
  type Pattern,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type PianoBar = {
  bassPitch: MidiNote
  cell: readonly MidiNote[]
  crown?: readonly PianoCrownNote[]
  velocityOffset: number
}

type PianoCrownNote = {
  durationPulses: number
  pitch: MidiNote
  startPulse: number
  velocity: number
}

type DragonPhrase = {
  bar: number
  durationPulses: number
  pitches: readonly MidiNote[]
  startPulse: number
  stepPulses: number
  velocity: number
}

type StringPhrase = {
  durationTicks: DurationTicks
  pitches: readonly MidiNote[]
  startTick: number
  velocity: number
}

export function prismCurrent(): Workspace {
  const barTicks = PPQ * 4
  const passTicks = barTicks * 16
  const totalTicks = passTicks * 2
  const segmentTicks = barTicks * 4
  const pulseTicks = PPQ / 4
  const noteGapTicks = PPQ / 16
  const pianoColor = '#4dabf7'
  const stringsColor = '#da77f2'
  const beatColor = '#fd7e14'
  const emberDragonColor = '#ff4d2e'
  const frostDragonColor = '#66d9ff'
  const finaleChoirColor = '#ffd43b'
  const bar3 = barTicks * 2
  const bar4 = barTicks * 3
  const bar5 = barTicks * 4
  const bar6 = barTicks * 5
  const bar7 = barTicks * 6
  const bar8 = barTicks * 7
  const bar9 = barTicks * 8
  const bar10 = barTicks * 9
  const bar11 = barTicks * 10
  const bar12 = barTicks * 11
  const bar13 = barTicks * 12
  const bar14 = barTicks * 13
  const bar15 = barTicks * 14
  const bar16 = barTicks * 15
  const dragonDuelStartBar = 9
  const dragonDuelStartTick = bar9
  const dragonDuelTicks = totalTicks - dragonDuelStartTick
  const finaleStartTick = passTicks + bar15
  const finaleTicks = barTicks * 2
  const pianoTrack = createTrack({
    color: pianoColor,
    id: 'prism_current_track_piano',
    instrumentId: 'piano.default',
    name: 'Piano',
    role: 'melody',
  })
  const stringsTrack = createTrack({
    accepts: ['note'],
    color: stringsColor,
    id: 'prism_current_track_strings',
    instrumentId: 'strings.default',
    name: 'Strings',
    role: 'chords',
  })
  const beatTrack = createTrack({
    color: beatColor,
    id: 'prism_current_track_beat',
    instrumentId: 'drums.default',
    name: 'Slow Pulse',
    role: 'drums',
  })
  const emberDragonTrack = createTrack({
    color: emberDragonColor,
    id: 'prism_current_track_ember_dragon',
    instrumentId: 'dragon.embermaw',
    name: 'Ember Dragon',
    role: 'melody',
  })
  const frostDragonTrack = createTrack({
    color: frostDragonColor,
    id: 'prism_current_track_frost_dragon',
    instrumentId: 'dragon.rimewing',
    name: 'Frost Dragon',
    role: 'melody',
  })
  const finaleChoirTrack = createTrack({
    accepts: ['note'],
    color: finaleChoirColor,
    id: 'prism_current_track_finale_choir',
    instrumentId: 'choir.dragonheart',
    name: 'Final Sky Choir',
    role: 'chords',
  })
  const tracks = [pianoTrack, emberDragonTrack, frostDragonTrack, finaleChoirTrack, stringsTrack, beatTrack]
  const pianoDrumCompressor: CompressorEffect = {
    attackSeconds: 0.008,
    enabled: true,
    id: 'prism_current_effect_piano_drum_compressor',
    kneeDb: 8,
    kind: 'compressor',
    name: 'Slow Pulse Piano Ducking',
    ratio: 6,
    releaseSeconds: 0.32,
    sidechainSourceMixChannelId: beatTrack.mixChannelId,
    thresholdDb: -26,
  }
  const pianoBars: readonly PianoBar[] = [
    { bassPitch: 38, cell: [50, 57, 62, 65, 64], velocityOffset: 0 },
    { bassPitch: 38, cell: [50, 57, 62, 65, 64, 69], velocityOffset: 2 },
    { bassPitch: 34, cell: [46, 53, 57, 62, 65, 69], velocityOffset: 4 },
    { bassPitch: 36, cell: [48, 55, 60, 62, 64, 67, 64], velocityOffset: 5 },
    { bassPitch: 38, cell: [50, 57, 62, 64, 65, 69, 74], velocityOffset: 7 },
    { bassPitch: 31, cell: [43, 50, 53, 57, 60, 62, 65], velocityOffset: 8 },
    { bassPitch: 33, cell: [45, 52, 57, 62, 64, 67, 61, 64], velocityOffset: 10 },
    { bassPitch: 38, cell: [50, 57, 62, 65, 64, 69, 74, 69, 50, 57, 62, 66, 64, 69, 74, 69], velocityOffset: 0 },

    // Bars 9–16 rotate and contract the cells while the harmony borrows brighter modes.
    { bassPitch: 31, cell: [43, 50, 55, 59, 62, 66, 69], velocityOffset: 4 },
    { bassPitch: 42, cell: [54, 57, 62, 64, 66, 69, 74], velocityOffset: 5 },
    { bassPitch: 34, cell: [46, 53, 57, 62, 60, 65], velocityOffset: 3 },
    { bassPitch: 39, cell: [51, 58, 63, 67, 62, 70, 74], velocityOffset: 7 },
    { bassPitch: 31, cell: [43, 50, 53, 57, 60, 65], velocityOffset: 8 },
    { bassPitch: 33, cell: [45, 52, 57, 62, 65, 64, 69], velocityOffset: 4 },
    { bassPitch: 33, cell: [45, 52, 57, 62, 64, 67, 61, 70], velocityOffset: 10 },
    { bassPitch: 38, cell: [50, 57, 62, 65, 64, 69, 74, 69], velocityOffset: -4 },

    // The second pass blooms upward: wider cells support a singing crown line,
    // culminating in a two-bar cadenza before the final D-minor arrival.
    {
      bassPitch: 38,
      cell: [50, 57, 62, 65, 69, 74, 77, 81],
      crown: [
        { durationPulses: 6, pitch: 86, startPulse: 0, velocity: 88 },
        { durationPulses: 4, pitch: 84, startPulse: 8, velocity: 84 },
        { durationPulses: 3, pitch: 81, startPulse: 13, velocity: 80 },
      ],
      velocityOffset: 2,
    },
    {
      bassPitch: 41,
      cell: [53, 60, 65, 69, 72, 76, 81, 84],
      crown: [
        { durationPulses: 5, pitch: 88, startPulse: 1, velocity: 90 },
        { durationPulses: 5, pitch: 86, startPulse: 7, velocity: 86 },
        { durationPulses: 3, pitch: 84, startPulse: 13, velocity: 82 },
      ],
      velocityOffset: 4,
    },
    {
      bassPitch: 34,
      cell: [46, 53, 58, 62, 65, 69, 74, 77, 81],
      crown: [
        { durationPulses: 7, pitch: 89, startPulse: 0, velocity: 92 },
        { durationPulses: 4, pitch: 86, startPulse: 8, velocity: 86 },
        { durationPulses: 3, pitch: 84, startPulse: 13, velocity: 84 },
      ],
      velocityOffset: 5,
    },
    {
      bassPitch: 36,
      cell: [48, 55, 60, 64, 67, 72, 76, 79, 84],
      crown: [
        { durationPulses: 4, pitch: 91, startPulse: 0, velocity: 94 },
        { durationPulses: 4, pitch: 88, startPulse: 5, velocity: 90 },
        { durationPulses: 6, pitch: 86, startPulse: 10, velocity: 86 },
      ],
      velocityOffset: 7,
    },
    {
      bassPitch: 31,
      cell: [43, 50, 55, 59, 62, 67, 71, 74, 79, 83],
      crown: [
        { durationPulses: 8, pitch: 91, startPulse: 0, velocity: 94 },
        { durationPulses: 7, pitch: 93, startPulse: 9, velocity: 98 },
      ],
      velocityOffset: 7,
    },
    {
      bassPitch: 42,
      cell: [54, 57, 62, 66, 69, 74, 78, 81, 86],
      crown: [
        { durationPulses: 5, pitch: 93, startPulse: 0, velocity: 98 },
        { durationPulses: 5, pitch: 95, startPulse: 6, velocity: 100 },
        { durationPulses: 4, pitch: 98, startPulse: 12, velocity: 104 },
      ],
      velocityOffset: 9,
    },
    {
      bassPitch: 34,
      cell: [46, 53, 57, 62, 65, 70, 74, 77, 81, 86],
      crown: [
        { durationPulses: 4, pitch: 98, startPulse: 0, velocity: 104 },
        { durationPulses: 4, pitch: 96, startPulse: 5, velocity: 100 },
        { durationPulses: 6, pitch: 93, startPulse: 10, velocity: 96 },
      ],
      velocityOffset: 10,
    },
    {
      bassPitch: 39,
      cell: [51, 58, 63, 67, 70, 75, 79, 82, 87, 91],
      crown: [
        { durationPulses: 5, pitch: 94, startPulse: 0, velocity: 100 },
        { durationPulses: 4, pitch: 91, startPulse: 6, velocity: 96 },
        { durationPulses: 5, pitch: 87, startPulse: 11, velocity: 92 },
      ],
      velocityOffset: 8,
    },
    {
      bassPitch: 43,
      cell: [55, 62, 67, 70, 74, 79, 83, 86, 91],
      crown: [
        { durationPulses: 8, pitch: 95, startPulse: 0, velocity: 102 },
        { durationPulses: 7, pitch: 98, startPulse: 9, velocity: 106 },
      ],
      velocityOffset: 10,
    },
    {
      bassPitch: 45,
      cell: [57, 64, 69, 73, 76, 81, 85, 88, 93],
      crown: [
        { durationPulses: 4, pitch: 100, startPulse: 0, velocity: 108 },
        { durationPulses: 4, pitch: 97, startPulse: 5, velocity: 104 },
        { durationPulses: 6, pitch: 93, startPulse: 10, velocity: 98 },
      ],
      velocityOffset: 11,
    },
    {
      bassPitch: 33,
      cell: [45, 52, 57, 61, 64, 69, 73, 76, 81, 85],
      crown: [
        { durationPulses: 3, pitch: 93, startPulse: 0, velocity: 98 },
        { durationPulses: 3, pitch: 97, startPulse: 4, velocity: 102 },
        { durationPulses: 3, pitch: 100, startPulse: 8, velocity: 106 },
        { durationPulses: 3, pitch: 105, startPulse: 12, velocity: 110 },
      ],
      velocityOffset: 12,
    },
    {
      bassPitch: 36,
      cell: [48, 55, 60, 63, 67, 72, 75, 79, 84, 87],
      crown: [
        { durationPulses: 4, pitch: 103, startPulse: 0, velocity: 108 },
        { durationPulses: 4, pitch: 99, startPulse: 5, velocity: 104 },
        { durationPulses: 6, pitch: 96, startPulse: 10, velocity: 100 },
      ],
      velocityOffset: 10,
    },
    {
      bassPitch: 43,
      cell: [43, 50, 55, 59, 62, 67, 71, 74, 79, 83, 86],
      crown: [
        { durationPulses: 3, pitch: 95, startPulse: 0, velocity: 102 },
        { durationPulses: 3, pitch: 98, startPulse: 4, velocity: 106 },
        { durationPulses: 3, pitch: 103, startPulse: 8, velocity: 110 },
        { durationPulses: 3, pitch: 107, startPulse: 12, velocity: 112 },
      ],
      velocityOffset: 12,
    },
    {
      bassPitch: 33,
      cell: [45, 52, 57, 62, 65, 69, 74, 77, 81, 86, 89],
      crown: [
        { durationPulses: 2, pitch: 105, startPulse: 0, velocity: 112 },
        { durationPulses: 2, pitch: 101, startPulse: 3, velocity: 108 },
        { durationPulses: 2, pitch: 98, startPulse: 6, velocity: 106 },
        { durationPulses: 2, pitch: 93, startPulse: 9, velocity: 102 },
        { durationPulses: 4, pitch: 89, startPulse: 12, velocity: 98 },
      ],
      velocityOffset: 12,
    },
    {
      bassPitch: 45,
      cell: [45, 52, 57, 61, 64, 67, 70, 73, 76, 81, 85, 88],
      crown: [
        { durationPulses: 2, pitch: 100, startPulse: 0, velocity: 110 },
        { durationPulses: 2, pitch: 103, startPulse: 2, velocity: 112 },
        { durationPulses: 2, pitch: 106, startPulse: 4, velocity: 114 },
        { durationPulses: 2, pitch: 109, startPulse: 6, velocity: 116 },
        { durationPulses: 7, pitch: 112, startPulse: 9, velocity: 118 },
      ],
      velocityOffset: 14,
    },
    {
      bassPitch: 38,
      cell: [50, 57, 62, 65, 69, 74, 77, 81, 86, 89, 93, 98],
      crown: [
        { durationPulses: 3, pitch: 110, startPulse: 0, velocity: 112 },
        { durationPulses: 3, pitch: 105, startPulse: 4, velocity: 108 },
        { durationPulses: 8, pitch: 98, startPulse: 8, velocity: 104 },
      ],
      velocityOffset: 8,
    },
  ]
  const stringPhrases: readonly StringPhrase[] = [
    {
      durationTicks: (barTicks * 2) - noteGapTicks,
      pitches: [50, 57, 62, 65],
      startTick: 0,
      velocity: 55,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [46, 53, 57, 62],
      startTick: bar3,
      velocity: 58,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [48, 55, 59, 62, 64],
      startTick: bar4,
      velocity: 60,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [50, 57, 62, 65, 69],
      startTick: bar5,
      velocity: 64,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 53, 57, 60],
      startTick: bar6,
      velocity: 68,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 57, 62],
      startTick: bar7,
      velocity: 70,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 55, 61],
      startTick: bar7 + (PPQ * 2),
      velocity: 72,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [50, 57, 62, 64, 65, 69],
      startTick: bar8,
      velocity: 62,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [50, 57, 62, 64, 66, 69],
      startTick: bar8 + (PPQ * 2),
      velocity: 64,
    },

    // Borrowed Light: the bar-eight F-natural/F-sharp pivot opens into G major.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 55, 59, 62, 66, 69],
      startTick: bar9,
      velocity: 64,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [42, 50, 57, 62, 64, 66, 69],
      startTick: bar10,
      velocity: 66,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [46, 53, 57, 62, 65],
      startTick: bar11,
      velocity: 62,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [39, 46, 51, 55, 58, 62],
      startTick: bar12,
      velocity: 68,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 53, 57, 60, 62],
      startTick: bar13,
      velocity: 70,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [45, 50, 57, 62, 64, 65],
      startTick: bar14,
      velocity: 64,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 57, 62, 67],
      startTick: bar15,
      velocity: 72,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 55, 61, 64, 70],
      startTick: bar15 + (PPQ * 2),
      velocity: 74,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [38, 50, 57, 62, 64, 65, 69],
      startTick: bar16,
      velocity: 64,
    },

    // Second pass: higher, wider voicings follow the piano's prismatic ascent.
    {
      durationTicks: (barTicks * 2) - noteGapTicks,
      pitches: [38, 50, 57, 62, 65, 69, 74],
      startTick: passTicks,
      velocity: 62,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [34, 46, 53, 58, 62, 65, 69],
      startTick: passTicks + bar3,
      velocity: 66,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [36, 48, 55, 60, 64, 67, 72],
      startTick: passTicks + bar4,
      velocity: 68,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 55, 59, 62, 67, 71],
      startTick: passTicks + bar5,
      velocity: 70,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [42, 54, 57, 62, 66, 69, 74],
      startTick: passTicks + bar6,
      velocity: 72,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [46, 53, 58, 62, 65, 70, 74],
      startTick: passTicks + bar7,
      velocity: 74,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [46, 53, 57, 62, 65, 69, 77],
      startTick: passTicks + bar7 + (PPQ * 2),
      velocity: 76,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [39, 51, 58, 63, 67, 70, 75],
      startTick: passTicks + bar8,
      velocity: 76,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [39, 51, 58, 62, 67, 70, 79],
      startTick: passTicks + bar8 + (PPQ * 2),
      velocity: 78,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 55, 62, 67, 70, 74, 79],
      startTick: passTicks + bar9,
      velocity: 78,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [45, 57, 64, 69, 73, 76, 81],
      startTick: passTicks + bar10,
      velocity: 80,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [33, 45, 52, 57, 61, 64, 69, 73],
      startTick: passTicks + bar11,
      velocity: 82,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [36, 48, 55, 60, 63, 67, 72, 75],
      startTick: passTicks + bar12,
      velocity: 84,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 55, 62, 67, 71, 74, 79, 83],
      startTick: passTicks + bar13,
      velocity: 86,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [33, 45, 52, 57, 62, 65, 69, 74],
      startTick: passTicks + bar14,
      velocity: 88,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [33, 45, 52, 57, 61, 65, 70, 76],
      startTick: passTicks + bar14 + (PPQ * 2),
      velocity: 90,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 57, 64, 67, 70, 73, 76, 81],
      startTick: passTicks + bar15,
      velocity: 92,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 57, 64, 67, 70, 73, 77, 85],
      startTick: passTicks + bar15 + (PPQ * 2),
      velocity: 94,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [38, 50, 57, 62, 65, 69, 74, 77, 81],
      startTick: passTicks + bar16,
      velocity: 82,
    },
  ]
  const finaleChoirPhrases: readonly StringPhrase[] = [
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [38, 50, 57, 62, 65, 69],
      startTick: 0,
      velocity: 88,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [43, 55, 62, 67, 70, 74, 79],
      startTick: PPQ * 2,
      velocity: 92,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 57, 61, 64, 67, 70, 76],
      startTick: barTicks,
      velocity: 96,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [38, 50, 57, 62, 65, 69, 74, 77, 81],
      startTick: barTicks + (PPQ * 2),
      velocity: 104,
    },
  ]
  const emberDragonPhrases: readonly DragonPhrase[] = [
    {
      bar: 9,
      durationPulses: 2,
      pitches: [50, 57, 62, 65, 69, 65, 64, 62],
      startPulse: 0,
      stepPulses: 2,
      velocity: 82,
    },
    {
      bar: 13,
      durationPulses: 2,
      pitches: [53, 60, 65, 69, 72, 69, 67, 65],
      startPulse: 0,
      stepPulses: 2,
      velocity: 86,
    },
    {
      bar: 17,
      durationPulses: 2,
      pitches: [50, 57, 62, 65, 69, 74, 72, 69],
      startPulse: 0,
      stepPulses: 2,
      velocity: 88,
    },
    {
      bar: 21,
      durationPulses: 2,
      pitches: [55, 62, 67, 71, 74, 79, 77, 74],
      startPulse: 0,
      stepPulses: 2,
      velocity: 92,
    },
    {
      bar: 25,
      durationPulses: 1,
      pitches: [55, 62, 67, 70, 74, 79, 83, 79, 74, 70, 67, 62],
      startPulse: 0,
      stepPulses: 1,
      velocity: 94,
    },
    {
      bar: 27,
      durationPulses: 1,
      pitches: [57, 64, 69, 73, 76, 81, 85, 88, 85, 81, 76, 73],
      startPulse: 2,
      stepPulses: 1,
      velocity: 98,
    },
    {
      bar: 29,
      durationPulses: 1,
      pitches: [45, 52, 57, 61, 64, 69, 73, 76, 81, 85, 81, 76, 73, 69, 64, 61],
      startPulse: 0,
      stepPulses: 1,
      velocity: 102,
    },
    {
      bar: 31,
      durationPulses: 1,
      pitches: [50, 57, 62, 65, 69, 74, 77, 81, 86, 89, 86, 81, 77, 74, 69, 65],
      startPulse: 0,
      stepPulses: 1,
      velocity: 108,
    },
    {
      bar: 32,
      durationPulses: 2,
      pitches: [62, 65, 69, 74, 77, 81, 86, 89],
      startPulse: 0,
      stepPulses: 2,
      velocity: 112,
    },
  ]
  const frostDragonPhrases: readonly DragonPhrase[] = [
    {
      bar: 10,
      durationPulses: 2,
      pitches: [69, 76, 81, 84, 88, 84, 83, 81],
      startPulse: 0,
      stepPulses: 2,
      velocity: 82,
    },
    {
      bar: 14,
      durationPulses: 2,
      pitches: [69, 76, 81, 85, 88, 85, 83, 81],
      startPulse: 0,
      stepPulses: 2,
      velocity: 86,
    },
    {
      bar: 18,
      durationPulses: 2,
      pitches: [72, 77, 81, 84, 89, 93, 89, 84],
      startPulse: 0,
      stepPulses: 2,
      velocity: 88,
    },
    {
      bar: 22,
      durationPulses: 2,
      pitches: [74, 78, 81, 86, 90, 93, 90, 86],
      startPulse: 0,
      stepPulses: 2,
      velocity: 92,
    },
    {
      bar: 26,
      durationPulses: 1,
      pitches: [86, 83, 79, 74, 71, 67, 62, 67, 71, 74, 79, 83],
      startPulse: 4,
      stepPulses: 1,
      velocity: 94,
    },
    {
      bar: 28,
      durationPulses: 1,
      pitches: [93, 88, 85, 81, 76, 73, 69, 73, 76, 81, 85, 88],
      startPulse: 0,
      stepPulses: 1,
      velocity: 98,
    },
    {
      bar: 30,
      durationPulses: 1,
      pitches: [93, 89, 86, 81, 77, 74, 69, 65, 69, 74, 77, 81, 86, 89, 93, 98],
      startPulse: 0,
      stepPulses: 1,
      velocity: 102,
    },
    {
      bar: 31,
      durationPulses: 1,
      pitches: [98, 93, 89, 86, 81, 77, 74, 69, 74, 77, 81, 86, 89, 93, 98, 101],
      startPulse: 0,
      stepPulses: 1,
      velocity: 108,
    },
    {
      bar: 32,
      durationPulses: 2,
      pitches: [98, 93, 89, 86, 81, 77, 74, 62],
      startPulse: 0,
      stepPulses: 2,
      velocity: 112,
    },
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_1',
          lengthTicks: segmentTicks,
          name: 'First Light',
          patternId: 'prism_current_pattern_piano_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_2',
          lengthTicks: segmentTicks,
          name: 'Widening Current',
          patternId: 'prism_current_pattern_piano_2',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_3',
          lengthTicks: segmentTicks,
          name: 'Borrowed Light',
          patternId: 'prism_current_pattern_piano_3',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_4',
          lengthTicks: segmentTicks,
          name: 'Shadow Return',
          patternId: 'prism_current_pattern_piano_4',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_5',
          lengthTicks: segmentTicks,
          name: 'Prismatic Ascent',
          patternId: 'prism_current_pattern_piano_5',
          playbackMode: 'oneShot',
          startTick: passTicks,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_6',
          lengthTicks: segmentTicks,
          name: 'Open Sky',
          patternId: 'prism_current_pattern_piano_6',
          playbackMode: 'oneShot',
          startTick: passTicks + bar5,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_7',
          lengthTicks: segmentTicks,
          name: 'Crown of Light',
          patternId: 'prism_current_pattern_piano_7',
          playbackMode: 'oneShot',
          startTick: passTicks + bar9,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_8',
          lengthTicks: segmentTicks,
          name: 'Impossible Horizon',
          patternId: 'prism_current_pattern_piano_8',
          playbackMode: 'oneShot',
          startTick: passTicks + bar13,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_1',
          lengthTicks: segmentTicks,
          name: 'First Refraction',
          patternId: 'prism_current_pattern_strings_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_2',
          lengthTicks: segmentTicks,
          name: 'Rising Field',
          patternId: 'prism_current_pattern_strings_2',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_3',
          lengthTicks: segmentTicks,
          name: 'Borrowed Light',
          patternId: 'prism_current_pattern_strings_3',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_4',
          lengthTicks: segmentTicks,
          name: 'Minor Return',
          patternId: 'prism_current_pattern_strings_4',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_5',
          lengthTicks: segmentTicks,
          name: 'Second Refraction',
          patternId: 'prism_current_pattern_strings_5',
          playbackMode: 'oneShot',
          startTick: passTicks,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_6',
          lengthTicks: segmentTicks,
          name: 'Radiant Field',
          patternId: 'prism_current_pattern_strings_6',
          playbackMode: 'oneShot',
          startTick: passTicks + bar5,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_7',
          lengthTicks: segmentTicks,
          name: 'High Aurora',
          patternId: 'prism_current_pattern_strings_7',
          playbackMode: 'oneShot',
          startTick: passTicks + bar9,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_8',
          lengthTicks: segmentTicks,
          name: 'Final Refraction',
          patternId: 'prism_current_pattern_strings_8',
          playbackMode: 'oneShot',
          startTick: passTicks + bar13,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: emberDragonColor,
          id: 'prism_current_block_ember_dragon',
          lengthTicks: dragonDuelTicks,
          name: 'Embermaw Challenge',
          patternId: 'prism_current_pattern_ember_dragon',
          playbackMode: 'oneShot',
          startTick: dragonDuelStartTick,
          trackId: emberDragonTrack.id,
        }),
        createBlock({
          color: frostDragonColor,
          id: 'prism_current_block_frost_dragon',
          lengthTicks: dragonDuelTicks,
          name: 'Rimewing Answer',
          patternId: 'prism_current_pattern_frost_dragon',
          playbackMode: 'oneShot',
          startTick: dragonDuelStartTick,
          trackId: frostDragonTrack.id,
        }),
        createBlock({
          color: finaleChoirColor,
          id: 'prism_current_block_finale_choir',
          lengthTicks: finaleTicks,
          name: 'Dragonheart Ascension',
          patternId: 'prism_current_pattern_finale_choir',
          playbackMode: 'oneShot',
          startTick: finaleStartTick,
          trackId: finaleChoirTrack.id,
        }),
        createBlock({
          color: beatColor,
          id: 'prism_current_block_beat',
          lengthTicks: totalTicks,
          name: 'Half-Speed Gravity',
          patternId: 'prism_current_pattern_beat',
          playbackMode: 'loop',
          startTick: 0,
          trackId: beatTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'prism_current_section_first_light',
          lengthTicks: barTicks * 2,
          name: 'First Light',
          startTick: 0,
        }),
        createSection({
          id: 'prism_current_section_refraction',
          lengthTicks: barTicks * 2,
          name: 'Refraction',
          startTick: bar3,
        }),
        createSection({
          id: 'prism_current_section_widening',
          lengthTicks: barTicks * 2,
          name: 'Widening Current',
          startTick: bar5,
        }),
        createSection({
          id: 'prism_current_section_return',
          lengthTicks: barTicks * 2,
          name: 'Turn Home',
          startTick: bar7,
        }),
        createSection({
          id: 'prism_current_section_borrowed_light',
          lengthTicks: barTicks * 8,
          name: 'Borrowed Light',
          startTick: bar9,
        }),
        createSection({
          id: 'prism_current_section_prismatic_ascent',
          lengthTicks: barTicks * 4,
          name: 'Prismatic Ascent',
          startTick: passTicks,
        }),
        createSection({
          id: 'prism_current_section_open_sky',
          lengthTicks: barTicks * 4,
          name: 'Open Sky',
          startTick: passTicks + bar5,
        }),
        createSection({
          id: 'prism_current_section_crown_of_light',
          lengthTicks: barTicks * 4,
          name: 'Crown of Light',
          startTick: passTicks + bar9,
        }),
        createSection({
          id: 'prism_current_section_impossible_horizon',
          lengthTicks: barTicks * 4,
          name: 'Impossible Horizon',
          startTick: passTicks + bar13,
        }),
      ],
    },
    effects: createEntityStore<Effect>([pianoDrumCompressor]),
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        effectIds: [pianoDrumCompressor.id],
        id: 'piano.default',
        name: 'Concert Piano',
        soundId: 'keys.default',
      }),
      createThorInstrument({
        id: 'strings.default',
        name: 'Chamber Strings',
        soundId: 'strings.default',
      }),
      createSubtractorInstrument({
        envelope: { attack: 0.006, decay: 0.26, release: 0.34, sustain: 0.62 },
        filter: { cutoffHz: 1850, resonance: 7.2, type: 'lowpass' },
        glideSeconds: 0.055,
        id: emberDragonTrack.instrumentId,
        mono: true,
        name: 'Embermaw Lead',
        oscillatorMix: 0.38,
        oscillators: [
          createSynthOscillator({ level: 0.78, waveform: 'sawtooth' }),
          createSynthOscillator({ detuneCents: 9, level: 0.56, octave: -1, waveform: 'square' }),
        ],
        soundId: 'lead.embermaw',
      }),
      createSubtractorInstrument({
        envelope: { attack: 0.012, decay: 0.3, release: 0.48, sustain: 0.58 },
        filter: { cutoffHz: 3100, resonance: 8.6, type: 'bandpass' },
        glideSeconds: 0.085,
        id: frostDragonTrack.instrumentId,
        mono: true,
        name: 'Rimewing Lead',
        oscillatorMix: 0.56,
        oscillators: [
          createSynthOscillator({ level: 0.68, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -11, level: 0.5, octave: 1, waveform: 'sawtooth' }),
        ],
        soundId: 'lead.rimewing',
      }),
      createThorInstrument({
        envelope: { attack: 0.08, decay: 0.8, release: 2.4, sustain: 0.72 },
        filter: { cutoffHz: 2400, resonance: 2.8, type: 'lowpass' },
        id: finaleChoirTrack.instrumentId,
        name: 'Dragonheart Choir',
        oscillators: [
          createSynthOscillator({ level: 0.48, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -8, level: 0.3, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 8, level: 0.16, octave: -1, waveform: 'square' }),
        ],
        soundId: 'choir.dragonheart',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Soft Pulse Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.05,
            pitchSemitones: -11,
            soundId: 'drums.closedHat.default',
            volumeDb: -11,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.46,
            pitchSemitones: -10,
            soundId: 'drums.kick.default',
            volumeDb: 9,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.31,
            pitchSemitones: -11,
            soundId: 'drums.openHat.default',
            volumeDb: -21,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.26,
            pitchSemitones: -7,
            soundId: 'drums.snare.default',
            volumeDb: -9,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: pianoTrack.mixChannelId,
          pan: -0.25,
          volumeDb: -7,
        }),
        createMixChannel({
          id: emberDragonTrack.mixChannelId,
          pan: -0.62,
          volumeDb: -12,
        }),
        createMixChannel({
          id: frostDragonTrack.mixChannelId,
          pan: 0.62,
          volumeDb: -12,
        }),
        createMixChannel({
          id: finaleChoirTrack.mixChannelId,
          pan: 0,
          volumeDb: -14,
        }),
        createMixChannel({
          id: stringsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: -10,
        }),
        createMixChannel({
          id: beatTrack.mixChannelId,
          pan: 0,
          volumeDb: 9,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      ...splitPattern(createPattern({
        events: createPianoEvents(pianoBars, barTicks, pulseTicks, noteGapTicks),
        id: 'prism_current_pattern_piano',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          harmony: 'Dm(add9) · Bbmaj7 · Cmaj9 · Dm(add9) · Gm11 · A7sus4 → A7 · Dm(add9) → D(add9) · Gmaj9 · D(add9)/F# · Bbmaj7 · Ebmaj7 · Gm11 · Dm/A · A7sus4 → A7b9 · Dm(add9), then a rising reharmonized second pass',
          process: 'Five-note cells expand and rotate, then bloom into wide arpeggios beneath a singing crown line and final cadenza.',
        },
        name: 'Additive Current',
      }), segmentTicks, [
        'First Light',
        'Widening Current',
        'Borrowed Light',
        'Shadow Return',
        'Prismatic Ascent',
        'Open Sky',
        'Crown of Light',
        'Impossible Horizon',
      ]),
      ...splitPattern(createPattern({
        events: createVoicedPhraseEvents('prism_current_event_strings', stringPhrases),
        id: 'prism_current_pattern_strings',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar eight pivots from F natural to F sharp, opening into G major before the minor-key return.',
          movement: 'Slow voice-leading broadens beneath the piano pulse, then returns in wider and progressively higher inversions.',
        },
        name: 'Slow Refraction',
      }), segmentTicks, [
        'First Refraction',
        'Rising Field',
        'Borrowed Light',
        'Minor Return',
        'Second Refraction',
        'Radiant Field',
        'High Aurora',
        'Final Refraction',
      ]),
      createPattern({
        events: createDragonEvents(
          'prism_current_event_ember_dragon',
          emberDragonPhrases,
          dragonDuelStartBar,
          barTicks,
          pulseTicks,
          noteGapTicks,
        ),
        id: 'prism_current_pattern_ember_dragon',
        kind: 'note',
        lengthTicks: dragonDuelTicks,
        metadata: {
          character: 'A low, hot saw lead that challenges in rising D-minor and modal sequences.',
          rivalry: 'Calls first, then accelerates from four-bar exchanges into a bar-by-bar aerial duel.',
        },
        name: 'Embermaw Challenge',
      }),
      createPattern({
        events: createDragonEvents(
          'prism_current_event_frost_dragon',
          frostDragonPhrases,
          dragonDuelStartBar,
          barTicks,
          pulseTicks,
          noteGapTicks,
        ),
        id: 'prism_current_pattern_frost_dragon',
        kind: 'note',
        lengthTicks: dragonDuelTicks,
        metadata: {
          character: 'A bright, icy bandpass lead that answers from the opposite side and upper register.',
          rivalry: 'Mirrors and inverts Embermaw until both lines collide, cross, and resolve together.',
        },
        name: 'Rimewing Answer',
      }),
      createPattern({
        events: createVoicedPhraseEvents('prism_current_event_finale_choir', finaleChoirPhrases),
        id: 'prism_current_pattern_finale_choir',
        kind: 'note',
        lengthTicks: finaleTicks,
        metadata: {
          entrance: 'Bars 31–32 only, beneath the dragons at their closest and most intense.',
          movement: 'Four widening voicings rise through D minor, G minor, A7sus, and a final Dm(add9/11).',
        },
        name: 'Dragonheart Ascension',
      }),
      createPattern({
        events: createDrumHitEvents('prism_current_event_beat', [
          // A sparse four-bar pulse that makes 108 BPM feel closer to 54.
          createDrumHitEvent({ id: 'beat_1', piece: 'kick', timeTick: 0, velocity: 92 }),
          createDrumHitEvent({ id: 'beat_2', piece: 'snare', timeTick: PPQ * 2, velocity: 58 }),

          createDrumHitEvent({ id: 'beat_3', piece: 'kick', timeTick: barTicks + (PPQ / 2), velocity: 76 }),
          createDrumHitEvent({ id: 'beat_4', piece: 'snare', timeTick: barTicks + (PPQ * 2), velocity: 56 }),
          createDrumHitEvent({ id: 'beat_5', piece: 'closedHat', timeTick: barTicks + (PPQ * 3), velocity: 28 }),

          createDrumHitEvent({ id: 'beat_6', piece: 'kick', timeTick: bar3, velocity: 88 }),
          createDrumHitEvent({ id: 'beat_7', piece: 'snare', timeTick: bar3 + (PPQ * 2), velocity: 60 }),

          createDrumHitEvent({ id: 'beat_8', piece: 'kick', timeTick: bar4 + (PPQ / 2), velocity: 78 }),
          createDrumHitEvent({ id: 'beat_9', piece: 'snare', timeTick: bar4 + (PPQ * 2), velocity: 56 }),
          createDrumHitEvent({ id: 'beat_10', piece: 'openHat', timeTick: bar4 + (PPQ * 7) / 2, velocity: 32 }),
        ]),
        id: 'prism_current_pattern_beat',
        kind: 'drum',
        lengthTicks: segmentTicks,
        metadata: {
          feel: 'super sparse half-time pulse',
          perceivedBpm: 54,
        },
        name: 'Four-Bar Slow Pulse',
      }),
    ]),
    project: createProject({
      id: 'project_prism_current',
      metadata: createProjectMetadata({
        description: 'A thirty-two-bar minimalist study whose soaring second pass becomes an aerial synth-dragon duel crowned by a final sky choir.',
        tags: ['minimalist', 'additive-process', 'modal-interchange', 'piano', 'strings', 'synth-duel', 'choir-finale', 'slow-beat'],
      }),
      name: 'Prism Current',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'prism_current_key',
          key: { mode: 'minor', tonic: 2 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'prism_current_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 108,
          id: 'prism_current_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createPianoEvents(
  bars: readonly PianoBar[],
  barTicks: DurationTicks,
  pulseTicks: DurationTicks,
  noteGapTicks: DurationTicks,
): NoteEvent[] {
  return bars.flatMap((bar, barIndex) => {
    const barStartTick = barIndex * barTicks
    const pulseCount = barTicks / pulseTicks
    const pulses = Array.from({ length: pulseCount }, (_, pulseIndex) => {
      const beginsCell = pulseIndex % bar.cell.length === 0
      const beginsBeat = pulseIndex % 4 === 0

      return createNoteEvent({
        durationTicks: pulseTicks - noteGapTicks,
        id: `prism_current_event_piano_${barIndex + 1}_${pulseIndex + 1}`,
        pitch: bar.cell[pulseIndex % bar.cell.length],
        timeTick: barStartTick + (pulseIndex * pulseTicks),
        velocity: (beginsCell ? 88 : beginsBeat ? 80 : 68) + bar.velocityOffset,
      })
    })
    const crown = (bar.crown ?? []).map((note, noteIndex) => createNoteEvent({
      durationTicks: (note.durationPulses * pulseTicks) - noteGapTicks,
      id: `prism_current_event_piano_crown_${barIndex + 1}_${noteIndex + 1}`,
      pitch: note.pitch,
      timeTick: barStartTick + (note.startPulse * pulseTicks),
      velocity: note.velocity,
    }))

    return [
      createNoteEvent({
        durationTicks: barTicks - (noteGapTicks * 2),
        id: `prism_current_event_piano_bass_${barIndex + 1}`,
        pitch: bar.bassPitch,
        timeTick: barStartTick,
        velocity: 72 + bar.velocityOffset,
      }),
      ...pulses,
      ...crown,
    ]
  })
}

function createVoicedPhraseEvents(id: string, phrases: readonly StringPhrase[]): NoteEvent[] {
  return phrases.flatMap((phrase, phraseIndex) => phrase.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: phrase.durationTicks,
    id: `${id}_${phraseIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: phrase.startTick,
    velocity: phrase.velocity - (pitchIndex * 2),
  })))
}

function createDragonEvents(
  id: string,
  phrases: readonly DragonPhrase[],
  startBar: number,
  barTicks: DurationTicks,
  pulseTicks: DurationTicks,
  noteGapTicks: DurationTicks,
): NoteEvent[] {
  return phrases.flatMap((phrase, phraseIndex) => phrase.pitches.map((pitch, noteIndex) => createNoteEvent({
    durationTicks: (phrase.durationPulses * pulseTicks) - noteGapTicks,
    id: `${id}_${phraseIndex + 1}_${noteIndex + 1}`,
    pitch,
    timeTick: ((phrase.bar - startBar) * barTicks)
      + ((phrase.startPulse + (noteIndex * phrase.stepPulses)) * pulseTicks),
    velocity: Math.min(126, phrase.velocity + noteIndex),
  })))
}

function splitPattern(
  pattern: Pattern,
  segmentLengthTicks: DurationTicks,
  segmentNames: readonly string[],
): Pattern[] {
  const segmentCount = Math.ceil(pattern.lengthTicks / segmentLengthTicks)

  if (segmentNames.length !== segmentCount) {
    throw new Error(`Pattern ${pattern.id} requires ${segmentCount} segment names.`)
  }

  return segmentNames.map((name, index) => {
    const startTick = index * segmentLengthTicks
    const endTick = startTick + segmentLengthTicks

    return createPattern({
      events: [...pattern.events]
        .filter(event => event.timeTick >= startTick && event.timeTick < endTick)
        .map(event => ({
          ...event,
          timeTick: event.timeTick - startTick,
        })),
      id: `${pattern.id}_${index + 1}`,
      kind: pattern.kind,
      lengthTicks: segmentLengthTicks,
      metadata: {
        ...pattern.metadata,
        sourcePatternId: pattern.id,
      },
      name,
    })
  })
}
