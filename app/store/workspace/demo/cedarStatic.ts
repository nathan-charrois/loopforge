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
]

export function cedarStatic(): Workspace {
  const eighthNoteTicks = PPQ / 2
  const dottedQuarterTicks = PPQ + eighthNoteTicks
  const barTicks = dottedQuarterTicks * 2
  const totalTicks = barTicks * 8
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
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.035,
          decay: 1.1,
          release: 2.4,
          sustain: 0.5,
        },
        filter: {
          cutoffHz: 2100,
          resonance: 2.2,
          type: 'lowpass',
        },
        id: 'cedar_static_chords',
        name: 'Felt & Cedar',
        oscilators: [
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
        filter: {
          cutoffHz: 1750,
          resonance: 3.1,
          type: 'lowpass',
        },
        id: 'cedar_static_voice',
        name: 'Weathered Throat',
        oscilators: [
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
        filter: {
          cutoffHz: 720,
          resonance: 1.8,
          type: 'lowpass',
        },
        id: 'cedar_static_bass',
        name: 'Roots Under Snow',
        oscilators: [
          createSynthOscillator({ level: 0.74, waveform: 'sine' }),
          createSynthOscillator({ level: 0.26, octave: 1, waveform: 'triangle' }),
        ],
        soundId: 'bass.default',
      }),
      createDrumInstrument({
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
        createMixChannel({ id: chordsTrack.mixChannelId, pan: -0.14, volumeDb: -10 }),
        createMixChannel({ id: voiceTrack.mixChannelId, pan: 0.18, volumeDb: -9 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: 0 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.08, volumeDb: 1 }),
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
          modalInterchange: 'Bar six borrows Am6/9, the minor iv, from parallel E minor; C-natural is the single note that changes the weather.',
          progression: 'Emaj9(add6) · Bsus4/F# → Badd9/F# · C#m11 · Amaj9/E · Emaj9/G# · Am6/9/E · C#m11 → F#13sus/A# · B13sus → Emaj9',
          voicing: 'Low root-fifth shells support close upper clusters; common tones E, F#, and B make every change feel breathed rather than struck.',
        },
        name: 'Cedar-Space Voicings',
      }),
      createPattern({
        events: createMelodyEvents(voiceMelody),
        id: 'cedar_static_pattern_voice',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'A late B–C# question first falls to G#, then blooms upward to E; the borrowed C-natural in bar six becomes the emotional hinge.',
        },
        name: 'Static in the Throat',
      }),
      createPattern({
        events: createBassEvents(bassLine),
        id: 'cedar_static_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Dotted-quarter roots and fifths leave space for the voicings, then C#–A#–B–E creates the final thaw.',
        },
        name: 'Rootline Thaw',
      }),
      createPattern({
        events: createDrumEvents(eighthNoteTicks),
        id: 'cedar_static_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'A muted 6/8 floorboard pulse opens into low ride, drops almost to silence under the borrowed chord, and answers with a three-hit tom fill.',
        },
        name: 'Boots Across the Floor',
      }),
    ]),
    project: createProject({
      id: 'project_cedar_static',
      metadata: createProjectMetadata({
        description: 'An original eight-bar atmospheric indie-folk miniature in 6/8, built from breathy close harmony, a fragile high motif, sub-bass roots, and a blanket-damped floorboard beat.',
        tags: ['6/8', 'atmospheric', 'indie-folk', 'modal-interchange', 'open-voicings'],
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
