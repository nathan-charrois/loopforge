import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  createBlock,
  createDrumHitEvent,
  createDrumHitEvents,
  createDrumInstrument,
  createDrumPieceSound,
  createEffect,
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
  type Effect,
  type EqEffect,
  type Instrument,
  type MidiNote,
  type NoteEvent,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type VoicingGesture = {
  durationTicks: number
  pitches: readonly MidiNote[]
  startTick: number
  velocity: number
}

type NoteGesture = {
  durationTicks: number
  pitch: MidiNote
  startTick: number
  velocity: number
}

type DrumBar = {
  hats: readonly number[]
  kicks: readonly number[]
  lowToms?: readonly number[]
  pulse: 'closedHat' | 'ride'
  snares: readonly number[]
}

const DRUM_BARS: readonly DrumBar[] = [
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 3.5], pulse: 'closedHat', snares: [3] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 2.5], pulse: 'closedHat', snares: [3] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 3, 4.5], pulse: 'closedHat', snares: [3] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 2.5], lowToms: [5], pulse: 'closedHat', snares: [3] },
  { hats: [0, 1, 2, 3, 4], kicks: [0, 3.5], pulse: 'closedHat', snares: [4] },
  { hats: [1, 4], kicks: [0], lowToms: [3], pulse: 'closedHat', snares: [] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 2.5, 4], pulse: 'closedHat', snares: [3] },
  { hats: [0, 1, 2, 3], kicks: [0, 3], lowToms: [4, 4.5, 5], pulse: 'closedHat', snares: [3] },
  { hats: [0, 2, 4], kicks: [0], pulse: 'ride', snares: [3] },
  { hats: [1, 3, 5], kicks: [0, 3.5], pulse: 'ride', snares: [3] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 4], pulse: 'ride', snares: [3] },
  { hats: [0, 2, 4, 5], kicks: [0], lowToms: [5], pulse: 'ride', snares: [3] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 3.5], pulse: 'ride', snares: [3] },
  { hats: [0, 3], kicks: [0], pulse: 'ride', snares: [] },
  { hats: [0, 1, 2, 3, 4, 5], kicks: [0, 4], pulse: 'ride', snares: [3] },
  { hats: [0, 2, 4, 5], kicks: [0, 3], lowToms: [4.5, 5], pulse: 'ride', snares: [3] },
]

export function cedarStatic(): Workspace {
  const eighthNoteTicks = PPQ / 2
  const dottedQuarterTicks = PPQ + eighthNoteTicks
  const barTicks = dottedQuarterTicks * 2
  const passTicks = barTicks * 8
  const totalTicks = passTicks * 2
  const noteGapTicks = PPQ / 8
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const chordsColor = '#a56a43'
  const voiceColor = '#da77f2'
  const bassColor = '#2f9e44'
  const drumsColor = '#e67700'
  const chordsTrack = createTrack({
    accepts: ['note'],
    color: chordsColor,
    id: 'cedar_static_track_chords',
    instrumentId: 'cedar_static_chords',
    name: 'Felt & Cedar',
    role: 'chords',
  })
  const voiceTrack = createTrack({
    color: voiceColor,
    id: 'cedar_static_track_voice',
    instrumentId: 'cedar_static_voice',
    name: 'Weathered Throat',
    role: 'melody',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'cedar_static_track_bass',
    instrumentId: 'cedar_static_bass',
    name: 'Roots Under Snow',
    role: 'bass',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'cedar_static_track_drums',
    instrumentId: 'cedar_static_drums',
    name: 'Cabin Floor',
    role: 'drums',
  })
  const tracks = [chordsTrack, voiceTrack, bassTrack, drumsTrack]
  const chordsEq = createCedarEq({
    highShelfFrequencyHz: 10000,
    highShelfGainDb: -2,
    highShelfQ: 0.7,
    id: 'cedar_static_eq_chords',
    lowShelfFrequencyHz: 120,
    lowShelfGainDb: 2,
    lowShelfQ: 0.7,
    name: 'Felt & Cedar EQ',
    param1FrequencyHz: 315,
    param1GainDb: 6,
    param1Q: 0.3,
    param2FrequencyHz: 2500,
    param2GainDb: -3.5,
    param2Q: 0.7,
  })
  const voiceEq = createCedarEq({
    highShelfFrequencyHz: 10000,
    highShelfGainDb: 2,
    highShelfQ: 0.7,
    id: 'cedar_static_eq_voice',
    lowShelfFrequencyHz: 160,
    lowShelfGainDb: -10,
    lowShelfQ: 0.7,
    name: 'Weathered Throat EQ',
    param1FrequencyHz: 400,
    param1GainDb: -3,
    param1Q: 1.4,
    param2FrequencyHz: 3150,
    param2GainDb: 4,
    param2Q: 1,
  })
  const bassEq = createCedarEq({
    highShelfFrequencyHz: 4000,
    highShelfGainDb: -10,
    highShelfQ: 0.7,
    id: 'cedar_static_eq_bass',
    lowShelfFrequencyHz: 80,
    lowShelfGainDb: 3,
    lowShelfQ: 0.7,
    name: 'Roots Under Snow EQ',
    param1FrequencyHz: 250,
    param1GainDb: -4,
    param1Q: 1,
    param2FrequencyHz: 800,
    param2GainDb: 2,
    param2Q: 0.7,
  })
  const drumsEq = createCedarEq({
    highShelfFrequencyHz: 10000,
    highShelfGainDb: -4,
    highShelfQ: 0.7,
    id: 'cedar_static_eq_drums',
    lowShelfFrequencyHz: 80,
    lowShelfGainDb: 6,
    lowShelfQ: 1,
    name: 'Cabin Floor EQ',
    param1FrequencyHz: 200,
    param1GainDb: -3,
    param1Q: 1,
    param2FrequencyHz: 1500,
    param2GainDb: 3,
    param2Q: 1.6,
  })
  const voicings: readonly VoicingGesture[] = [
    // Emaj9(add6): a wide E/B shell holds a close G#–B–C#–F# glow above it.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [40, 47, 52, 56, 59, 61, 66],
      startTick: bar(1),
      velocity: 68,
    },

    // Bsus4/F# resolves only E to D#, leaving the ninth suspended at the top.
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [42, 47, 52, 54, 59, 61, 64],
      startTick: bar(2),
      velocity: 66,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [42, 47, 51, 54, 59, 61, 66],
      startTick: bar(2) + dottedQuarterTicks,
      velocity: 70,
    },

    // C#m11 keeps E, F#, and B from the preceding voicing while the bass falls.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [37, 44, 52, 54, 59, 64],
      startTick: bar(3),
      velocity: 70,
    },

    // Amaj9/E never fully settles on its root, preserving the hovering first phrase.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [40, 45, 49, 52, 56, 59, 64],
      startTick: bar(4),
      velocity: 68,
    },

    // The second phrase begins on the same tonic colors over a rising G# bass.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [44, 47, 52, 54, 59, 64],
      startTick: bar(5),
      velocity: 72,
    },

    // Am6/9/E is borrowed iv from parallel E minor: C-natural changes the weather.
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [40, 45, 48, 54, 59, 64],
      startTick: bar(6),
      velocity: 74,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [40, 48, 52, 57, 59, 64],
      startTick: bar(6) + dottedQuarterTicks,
      velocity: 68,
    },

    // C#m11 opens into F#13sus/A#, lifting the bass chromatically toward B.
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [37, 44, 52, 54, 59, 64],
      startTick: bar(7),
      velocity: 72,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [46, 49, 52, 54, 59, 63],
      startTick: bar(7) + dottedQuarterTicks,
      velocity: 76,
    },

    // B13sus gathers the unresolved tones, then the final dotted quarter comes home.
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [35, 42, 45, 49, 52, 56],
      startTick: bar(8),
      velocity: 72,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [40, 47, 52, 56, 59, 61, 66],
      startTick: bar(8) + dottedQuarterTicks,
      velocity: 66,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [47, 52, 56, 59, 61, 66, 71, 73],
      startTick: bar(9),
      velocity: 62,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [54, 59, 61, 64, 66, 71, 73],
      startTick: bar(10),
      velocity: 64,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [54, 59, 63, 66, 71, 73, 78],
      startTick: bar(10) + dottedQuarterTicks,
      velocity: 66,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [49, 56, 59, 64, 66, 71, 76, 78],
      startTick: bar(11),
      velocity: 66,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [52, 57, 61, 64, 68, 71, 76, 80],
      startTick: bar(12),
      velocity: 68,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [56, 59, 64, 66, 71, 76, 80, 83],
      startTick: bar(13),
      velocity: 70,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [52, 57, 61, 66, 68, 71, 76, 78],
      startTick: bar(14),
      velocity: 72,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [52, 57, 61, 64, 68, 73, 78, 80],
      startTick: bar(14) + dottedQuarterTicks,
      velocity: 70,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [49, 56, 59, 64, 66, 71, 76, 80],
      startTick: bar(15),
      velocity: 72,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [58, 61, 64, 66, 71, 75, 80, 85],
      startTick: bar(15) + dottedQuarterTicks,
      velocity: 74,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [47, 54, 57, 61, 64, 68, 73, 78],
      startTick: bar(16),
      velocity: 72,
    },
    {
      durationTicks: dottedQuarterTicks - noteGapTicks,
      pitches: [52, 59, 64, 68, 71, 73, 78, 80, 83],
      startTick: bar(16) + dottedQuarterTicks,
      velocity: 70,
    },
  ]
  const voiceMelody: readonly NoteGesture[] = [
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(1) + (eighthNoteTicks * 3), velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(1) + (eighthNoteTicks * 4), velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(1) + (eighthNoteTicks * 5), velocity: 64 },

    { durationTicks: eighthNoteTicks * 2, pitch: 66, startTick: bar(2) + eighthNoteTicks, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(2) + (eighthNoteTicks * 3), velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(2) + (eighthNoteTicks * 4), velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(2) + (eighthNoteTicks * 5), velocity: 66 },

    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(3) + eighthNoteTicks, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(3) + (eighthNoteTicks * 2), velocity: 68 },
    { durationTicks: eighthNoteTicks * 2, pitch: 76, startTick: bar(3) + (eighthNoteTicks * 3), velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(3) + (eighthNoteTicks * 5), velocity: 66 },

    { durationTicks: eighthNoteTicks * 2, pitch: 69, startTick: bar(4), velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(4) + (eighthNoteTicks * 3), velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 66, startTick: bar(4) + (eighthNoteTicks * 4), velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 64, startTick: bar(4) + (eighthNoteTicks * 5), velocity: 58 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(5) + (eighthNoteTicks * 3), velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(5) + (eighthNoteTicks * 4), velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(5) + (eighthNoteTicks * 5), velocity: 78 },

    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(6) + eighthNoteTicks, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(6) + (eighthNoteTicks * 2), velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(6) + (eighthNoteTicks * 3), velocity: 68 },
    { durationTicks: eighthNoteTicks * 2, pitch: 69, startTick: bar(6) + (eighthNoteTicks * 4), velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(7) + eighthNoteTicks, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(7) + (eighthNoteTicks * 2), velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(7) + (eighthNoteTicks * 3), velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(7) + (eighthNoteTicks * 4), velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(7) + (eighthNoteTicks * 5), velocity: 82 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(8), velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(8) + eighthNoteTicks, velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(8) + (eighthNoteTicks * 2), velocity: 72 },
    { durationTicks: dottedQuarterTicks, pitch: 76, startTick: bar(8) + dottedQuarterTicks, velocity: 68 },
  ]
  const angelicVoiceMelody: readonly NoteGesture[] = voiceMelody.map(note => ({
    ...note,
    pitch: note.pitch + 12,
    startTick: note.startTick + passTicks,
    velocity: Math.max(58, note.velocity - 2),
  }))
  const angelicVoiceHalo: readonly NoteGesture[] = voiceMelody
    .filter(note => note.startTick >= bar(5))
    .map(note => ({
      ...note,
      pitch: note.pitch + 24,
      startTick: note.startTick + passTicks,
      velocity: Math.max(48, note.velocity - 16),
    }))
  const bassLine: readonly NoteGesture[] = [
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 40, startTick: bar(1), velocity: 78 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 47, startTick: bar(1) + dottedQuarterTicks, velocity: 68 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 47, startTick: bar(2) + dottedQuarterTicks, velocity: 70 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 37, startTick: bar(3), velocity: 80 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 44, startTick: bar(3) + dottedQuarterTicks, velocity: 70 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 45, startTick: bar(4) + dottedQuarterTicks, velocity: 72 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 44, startTick: bar(5), velocity: 80 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 47, startTick: bar(5) + dottedQuarterTicks, velocity: 70 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 40, startTick: bar(6), velocity: 76 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 45, startTick: bar(6) + dottedQuarterTicks, velocity: 70 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 37, startTick: bar(7), velocity: 80 },
    { durationTicks: dottedQuarterTicks - noteGapTicks, pitch: 35, startTick: bar(8), velocity: 82 },
    { durationTicks: dottedQuarterTicks, pitch: 40, startTick: bar(8) + dottedQuarterTicks, velocity: 74 },
  ]
  const angelicBassLine: readonly NoteGesture[] = bassLine.map(note => ({
    ...note,
    pitch: note.pitch + 12,
    startTick: note.startTick + passTicks,
    velocity: Math.max(56, note.velocity - 12),
  }))

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: chordsColor,
          id: 'cedar_static_block_chords',
          lengthTicks: totalTicks,
          name: 'Cedar-Space Voicings',
          patternId: 'cedar_static_pattern_chords',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: chordsTrack.id,
        }),
        createBlock({
          color: voiceColor,
          id: 'cedar_static_block_voice',
          lengthTicks: totalTicks,
          name: 'Static in the Throat',
          patternId: 'cedar_static_pattern_voice',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: voiceTrack.id,
        }),
        createBlock({
          color: bassColor,
          id: 'cedar_static_block_bass',
          lengthTicks: totalTicks,
          name: 'Rootline Thaw',
          patternId: 'cedar_static_pattern_bass',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'cedar_static_block_drums',
          lengthTicks: totalTicks,
          name: 'Boots Across the Floor',
          patternId: 'cedar_static_pattern_drums',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'cedar_static_section_cold_porches',
          lengthTicks: barTicks * 4,
          name: 'Cold Porches',
          startTick: bar(1),
        }),
        createSection({
          id: 'cedar_static_section_weather_turns',
          lengthTicks: barTicks * 4,
          name: 'The Weather Turns',
          startTick: bar(5),
        }),
        createSection({
          id: 'cedar_static_section_snow_becomes_light',
          lengthTicks: barTicks * 4,
          name: 'Snow Becomes Light',
          startTick: bar(9),
        }),
        createSection({
          id: 'cedar_static_section_rafters_open',
          lengthTicks: barTicks * 4,
          name: 'The Rafters Open',
          startTick: bar(13),
        }),
      ],
    },
    effects: createEntityStore<Effect>([
      chordsEq,
      voiceEq,
      bassEq,
      drumsEq,
    ]),
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.035,
          decay: 1.1,
          release: 2.4,
          sustain: 0.5,
        },
        effectIds: [chordsEq.id],
        filter: {
          cutoffHz: 2100,
          resonance: 2.2,
          type: 'lowpass',
        },
        id: 'cedar_static_chords',
        name: 'Felt & Cedar',
        oscillators: [
          createSynthOscillator({ level: 0.58, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -8, level: 0.22, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 7, level: 0.14, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ level: 0.06, octave: -1, waveform: 'triangle' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.16,
          decay: 1.4,
          release: 2.8,
          sustain: 0.58,
        },
        effectIds: [voiceEq.id],
        filter: {
          cutoffHz: 1750,
          resonance: 3.1,
          type: 'lowpass',
        },
        id: 'cedar_static_voice',
        name: 'Weathered Throat',
        oscillators: [
          createSynthOscillator({ detuneCents: -6, level: 0.48, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 6, level: 0.32, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.2, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'voice.ghost',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.025,
          decay: 0.48,
          release: 0.8,
          sustain: 0.68,
        },
        effectIds: [bassEq.id],
        filter: {
          cutoffHz: 720,
          resonance: 1.8,
          type: 'lowpass',
        },
        id: 'cedar_static_bass',
        name: 'Roots Under Snow',
        oscillators: [
          createSynthOscillator({ level: 0.74, waveform: 'sine' }),
          createSynthOscillator({ level: 0.26, octave: 1, waveform: 'triangle' }),
        ],
        soundId: 'bass.default',
      }),
      createDrumInstrument({
        effectIds: [drumsEq.id],
        id: 'cedar_static_drums',
        name: 'Cabin Floor Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.045,
            pitchSemitones: -6,
            soundId: 'drums.closedHat.default',
            volumeDb: -11,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.38,
            pitchSemitones: -8,
            soundId: 'drums.kick.default',
            volumeDb: 16,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.36,
            pitchSemitones: -8,
            soundId: 'drums.lowTom.default',
            volumeDb: -6,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.22,
            pitchSemitones: -11,
            soundId: 'drums.ride.default',
            volumeDb: -26,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.2,
            pitchSemitones: -4,
            soundId: 'drums.snare.default',
            volumeDb: 1,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: chordsTrack.mixChannelId, pan: -0.5, volumeDb: -15 }),
        createMixChannel({ id: voiceTrack.mixChannelId, pan: 0.5, volumeDb: -8 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: -2 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0, volumeDb: -5 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createVoicingEvents(voicings),
        id: 'cedar_static_pattern_chords',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar six borrows Am6/9 from parallel E minor; on the angelic return, Amaj9(#11) replaces that shadow with open-sky Lydian color.',
          progression: 'The original E-major cycle returns in bars 9–16 as high, root-light inversions with brighter extensions.',
          voicing: 'Low root-fifth shells and close clusters open into wide upper-register ninths, elevenths, and octave-spanning halos.',
        },
        name: 'Cedar-Space Voicings',
      }),
      createPattern({
        events: createMelodyEvents([
          ...voiceMelody,
          ...angelicVoiceMelody,
          ...angelicVoiceHalo,
        ]),
        id: 'cedar_static_pattern_voice',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'The fragile first-pass question returns an octave higher, then gains a quiet second-octave halo for the final four bars.',
        },
        name: 'Static in the Throat',
      }),
      createPattern({
        events: createBassEvents([...bassLine, ...angelicBassLine]),
        id: 'cedar_static_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Dotted-quarter roots and fifths return an octave higher and softer, turning the grounded bass into a floating cello-like foundation.',
        },
        name: 'Rootline Thaw',
      }),
      createPattern({
        events: createDrumEvents(eighthNoteTicks),
        id: 'cedar_static_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'The muted 6/8 floorboard pulse returns as a sparse ride-cymbal halo, retaining the kick/snare shape while lifting the second pass.',
        },
        name: 'Boots Across the Floor',
      }),
    ]),
    project: createProject({
      id: 'project_cedar_static',
      metadata: createProjectMetadata({
        description: 'A sixteen-bar atmospheric indie-folk piece in 6/8 whose weathered first pass returns as high luminous harmony, octave-haloed melody, and shimmering ride cymbal.',
        tags: ['6/8', 'angelic', 'atmospheric', 'indie-folk', 'modal-interchange', 'open-voicings'],
      }),
      name: 'Cedar Static',
    }),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({
          id: 'cedar_static_key',
          key: { mode: 'major', tonic: 4 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'cedar_static_meter',
          tick: 0,
          timeSignature: { denominator: 8, numerator: 6 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 84,
          id: 'cedar_static_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createCedarEq(
  input: Omit<EqEffect, 'enabled' | 'kind'>,
): EqEffect {
  return {
    ...createEffect({
      id: input.id,
      kind: 'eq',
      name: input.name,
    }) as EqEffect,
    ...input,
  }
}

function createVoicingEvents(voicings: readonly VoicingGesture[]): NoteEvent[] {
  const notes = voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `cedar_static_voicing_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex * 2, 10),
  })))

  return createNoteEvents('cedar_static_event_chords', notes)
}

function createMelodyEvents(melody: readonly NoteGesture[]): NoteEvent[] {
  const notes = melody.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `cedar_static_voice_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('cedar_static_event_voice', notes)
}

function createBassEvents(bassLine: readonly NoteGesture[]): NoteEvent[] {
  const notes = bassLine.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `cedar_static_bass_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('cedar_static_event_bass', notes)
}

function createDrumEvents(eighthNoteTicks: number): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []

  DRUM_BARS.forEach((drumBar, barIndex) => {
    const barStartTick = barIndex * eighthNoteTicks * 6
    const addHits = (
      piece: DrumPiece,
      eighthOffsets: readonly number[],
      velocity: (hitIndex: number) => number,
    ) => eighthOffsets.forEach((eighthOffset, hitIndex) => hits.push(createDrumHitEvent({
      id: `cedar_static_drum_seed_${barIndex + 1}_${piece}_${hitIndex + 1}`,
      piece,
      timeTick: barStartTick + (eighthOffset * eighthNoteTicks),
      velocity: velocity(hitIndex),
    })))

    addHits('kick', drumBar.kicks, hitIndex => hitIndex === 0 ? 102 : 72 - (hitIndex * 4))
    addHits('snare', drumBar.snares, () => barIndex >= 4 ? 80 : 74)
    addHits(drumBar.pulse, drumBar.hats, hitIndex => 34 + ((hitIndex % 3) * 6))
    addHits('lowTom', drumBar.lowToms ?? [], hitIndex => 50 + (hitIndex * 12))
  })

  return createDrumHitEvents('cedar_static_event_drums', hits)
}
