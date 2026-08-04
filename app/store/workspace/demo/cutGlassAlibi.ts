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

type ChordGesture = {
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

type DrumGesture = {
  beat: number
  piece: DrumPiece
  velocity: number
}

export function cutGlassAlibi(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 12
  const eighthNoteTicks = PPQ / 2
  const sixteenthNoteTicks = PPQ / 4
  const bar2 = barTicks
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
  const harmonyTrack = createTrack({
    accepts: ['note'],
    color: '#c92a2a',
    id: 'cut_glass_track_harmony',
    instrumentId: 'cut_glass_harmony',
    name: 'Broken Marquee',
    role: 'chords',
  })
  const melodyTrack = createTrack({
    color: '#5f3dc4',
    id: 'cut_glass_track_melody',
    instrumentId: 'cut_glass_melody',
    name: 'Wiretap Reed',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: '#e67700',
    id: 'cut_glass_track_drums',
    instrumentId: 'cut_glass_drums',
    name: 'Editing-Room Kit',
    role: 'drums',
  })
  const tracks = [harmonyTrack, melodyTrack, drumsTrack]

  const harmonyGestures: readonly ChordGesture[] = [
    // Dm(add9): the bass and upper chord live in a single chamber-piano gesture.
    {
      durationTicks: barTicks - eighthNoteTicks,
      pitches: [38, 50, 53, 57, 64],
      startTick: 0,
      velocity: 82,
    },
    {
      durationTicks: PPQ - sixteenthNoteTicks,
      pitches: [39, 51, 55, 57, 58, 62],
      startTick: bar2,
      velocity: 92,
    },
    {
      durationTicks: PPQ,
      pitches: [51, 55, 57, 62, 64],
      startTick: bar2 + (PPQ * 5) / 2,
      velocity: 78,
    },
    {
      durationTicks: PPQ * 3,
      pitches: [46, 55, 58, 62, 64],
      startTick: bar3 + eighthNoteTicks,
      velocity: 76,
    },
    ...createStabGestures(
      bar4,
      [45, 55, 58, 61, 64],
      [0, 1.5, 3],
      [eighthNoteTicks, eighthNoteTicks, PPQ - sixteenthNoteTicks],
      96,
    ),
    {
      durationTicks: (PPQ * 11) / 4,
      pitches: [38, 50, 53, 57, 64],
      startTick: bar5,
      velocity: 84,
    },
    {
      durationTicks: eighthNoteTicks,
      pitches: [50, 57, 62, 65, 69],
      startTick: bar5 + (PPQ * 13) / 4,
      velocity: 88,
    },
    {
      durationTicks: PPQ + (PPQ * 3) / 4,
      pitches: [37, 52, 55, 58, 61],
      startTick: bar6,
      velocity: 86,
    },
    {
      durationTicks: PPQ + (PPQ * 3) / 4,
      pitches: [45, 55, 58, 61, 64],
      startTick: bar6 + (PPQ * 2),
      velocity: 94,
    },
    // Dmaj6 is the hard-cut modal interchange: I6 borrowed from parallel D major.
    {
      durationTicks: barTicks - sixteenthNoteTicks,
      pitches: [38, 50, 54, 57, 59, 62],
      startTick: bar7,
      velocity: 98,
    },
    {
      durationTicks: PPQ + eighthNoteTicks,
      pitches: [46, 50, 53, 57, 64],
      startTick: bar8,
      velocity: 84,
    },
    {
      durationTicks: PPQ + eighthNoteTicks,
      pitches: [53, 57, 58, 62, 64],
      startTick: bar8 + (PPQ * 2),
      velocity: 78,
    },
    {
      durationTicks: barTicks - eighthNoteTicks,
      pitches: [43, 50, 55, 58, 62, 69],
      startTick: bar9,
      velocity: 80,
    },
    {
      durationTicks: PPQ,
      pitches: [39, 51, 55, 57, 58, 62],
      startTick: bar10,
      velocity: 90,
    },
    {
      durationTicks: PPQ,
      pitches: [51, 55, 57, 62, 64],
      startTick: bar10 + (PPQ * 5) / 2,
      velocity: 82,
    },
    ...createStabGestures(
      bar11,
      [45, 55, 58, 61, 64],
      [0, 1.25, 2.5, 3.25],
      [eighthNoteTicks, eighthNoteTicks, eighthNoteTicks, eighthNoteTicks],
      98,
    ),
    {
      durationTicks: (PPQ * 11) / 4,
      pitches: [38, 50, 53, 57, 59, 64],
      startTick: bar12,
      velocity: 86,
    },
    {
      durationTicks: eighthNoteTicks,
      pitches: [38, 50, 53, 62],
      startTick: bar12 + (PPQ * 13) / 4,
      velocity: 106,
    },
  ]
  const melodyGestures: readonly NoteGesture[] = [
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: eighthNoteTicks, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: PPQ, velocity: 94 },
    { durationTicks: PPQ, pitch: 76, startTick: PPQ + eighthNoteTicks, velocity: 82 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: (PPQ * 11) / 4, velocity: 102 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: (PPQ * 13) / 4, velocity: 78 },

    { durationTicks: sixteenthNoteTicks, pitch: 70, startTick: bar2 + sixteenthNoteTicks, velocity: 88 },
    { durationTicks: sixteenthNoteTicks, pitch: 69, startTick: bar2 + eighthNoteTicks, velocity: 80 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar2 + (PPQ * 3) / 4, velocity: 98 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar2 + (PPQ * 5) / 2, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar2 + (PPQ * 3), velocity: 100 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar2 + (PPQ * 7) / 2, velocity: 84 },

    { durationTicks: PPQ, pitch: 74, startTick: bar3 + eighthNoteTicks, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar3 + (PPQ * 7) / 4, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar3 + (PPQ * 9) / 4, velocity: 78 },
    { durationTicks: (PPQ * 3) / 4, pitch: 73, startTick: bar3 + (PPQ * 3), velocity: 100 },

    { durationTicks: sixteenthNoteTicks, pitch: 81, startTick: bar4, velocity: 108 },
    { durationTicks: sixteenthNoteTicks, pitch: 79, startTick: bar4 + eighthNoteTicks, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar4 + (PPQ * 3) / 2, velocity: 104 },
    { durationTicks: sixteenthNoteTicks, pitch: 74, startTick: bar4 + (PPQ * 9) / 4, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar4 + (PPQ * 13) / 4, velocity: 80 },

    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar5 + sixteenthNoteTicks, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar5 + (PPQ * 3) / 4, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 81, startTick: bar5 + (PPQ * 5) / 4, velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar5 + (PPQ * 9) / 4, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar5 + (PPQ * 13) / 4, velocity: 100 },

    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar6, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar6 + (PPQ * 3) / 4, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar6 + (PPQ * 3) / 2, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 82, startTick: bar6 + (PPQ * 2), velocity: 106 },
    { durationTicks: eighthNoteTicks, pitch: 81, startTick: bar6 + (PPQ * 5) / 2, velocity: 98 },
    { durationTicks: eighthNoteTicks, pitch: 85, startTick: bar6 + (PPQ * 3), velocity: 110 },
    { durationTicks: eighthNoteTicks, pitch: 82, startTick: bar6 + (PPQ * 7) / 2, velocity: 92 },

    // The theme's F natural becomes F sharp over the borrowed D-major sonority.
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar7 + eighthNoteTicks, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar7 + PPQ, velocity: 108 },
    { durationTicks: PPQ, pitch: 76, startTick: bar7 + (PPQ * 3) / 2, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar7 + (PPQ * 5) / 2, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar7 + (PPQ * 3), velocity: 82 },

    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar8, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar8 + eighthNoteTicks, velocity: 102 },
    { durationTicks: eighthNoteTicks, pitch: 81, startTick: bar8 + PPQ, velocity: 106 },
    { durationTicks: PPQ, pitch: 74, startTick: bar8 + (PPQ * 2), velocity: 84 },
    { durationTicks: sixteenthNoteTicks, pitch: 73, startTick: bar8 + (PPQ * 11) / 4, velocity: 98 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar8 + (PPQ * 13) / 4, velocity: 80 },

    { durationTicks: eighthNoteTicks, pitch: 67, startTick: bar9 + sixteenthNoteTicks, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar9 + (PPQ * 3) / 4, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar9 + (PPQ * 5) / 4, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar9 + (PPQ * 2), velocity: 100 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar9 + (PPQ * 5) / 2, velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar9 + (PPQ * 7) / 2, velocity: 108 },

    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar10, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar10 + eighthNoteTicks, velocity: 102 },
    { durationTicks: eighthNoteTicks, pitch: 81, startTick: bar10 + PPQ, velocity: 106 },
    { durationTicks: eighthNoteTicks, pitch: 86, startTick: bar10 + (PPQ * 2), velocity: 110 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar10 + (PPQ * 3), velocity: 86 },

    { durationTicks: sixteenthNoteTicks, pitch: 81, startTick: bar11, velocity: 110 },
    { durationTicks: sixteenthNoteTicks, pitch: 82, startTick: bar11 + eighthNoteTicks, velocity: 100 },
    { durationTicks: sixteenthNoteTicks, pitch: 79, startTick: bar11 + (PPQ * 5) / 4, velocity: 94 },
    { durationTicks: sixteenthNoteTicks, pitch: 85, startTick: bar11 + (PPQ * 7) / 4, velocity: 112 },
    { durationTicks: sixteenthNoteTicks, pitch: 88, startTick: bar11 + (PPQ * 5) / 2, velocity: 108 },
    { durationTicks: sixteenthNoteTicks, pitch: 82, startTick: bar11 + (PPQ * 3), velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar11 + (PPQ * 7) / 2, velocity: 104 },

    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar12, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar12 + eighthNoteTicks, velocity: 102 },
    { durationTicks: PPQ, pitch: 76, startTick: bar12 + PPQ, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar12 + (PPQ * 5) / 2, velocity: 106 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar12 + (PPQ * 13) / 4, velocity: 114 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `cut_glass_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `cut_glass_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'cut_glass_section_tail',
          lengthTicks: barTicks * 4,
          name: 'The Tail',
          startTick: 0,
        }),
        createSection({
          id: 'cut_glass_section_false_daylight',
          lengthTicks: barTicks * 4,
          name: 'False Daylight',
          startTick: bar5,
        }),
        createSection({
          id: 'cut_glass_section_hard_cut',
          lengthTicks: barTicks * 4,
          name: 'Hard Cut',
          startTick: bar9,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.006,
          decay: 0.45,
          release: 0.28,
          sustain: 0.28,
        },
        filter: {
          cutoffHz: 2800,
          resonance: 5,
          type: 'lowpass',
        },
        id: 'cut_glass_harmony',
        name: 'Broken Marquee Piano',
        oscilators: [
          createSynthOscillator({ level: 0.65, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -5, level: 0.25, octave: -1 }),
          createSynthOscillator({ detuneCents: 7, level: 0.1, octave: 1, waveform: 'square' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.015,
          decay: 0.12,
          release: 0.08,
          sustain: 0.52,
        },
        filter: {
          cutoffHz: 2100,
          resonance: 7,
          type: 'bandpass',
        },
        id: 'cut_glass_melody',
        name: 'Wiretap Reed',
        oscilators: [
          createSynthOscillator({ level: 0.55, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -8, level: 0.25, waveform: 'square' }),
          createSynthOscillator({ detuneCents: 9, level: 0.2, octave: 1, waveform: 'sawtooth' }),
        ],
        soundId: 'reed.wiretap',
      }),
      createDrumInstrument({
        id: 'cut_glass_drums',
        name: 'Dry Editing-Room Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.045,
            pitchSemitones: 2,
            soundId: 'drums.closedHat.default',
            volumeDb: -12,
          }),
          crash: createDrumPieceSound({
            durationSeconds: 0.28,
            pitchSemitones: -3,
            soundId: 'drums.crash.default',
            volumeDb: -9,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.25,
            pitchSemitones: -5,
            soundId: 'drums.kick.default',
            volumeDb: 7,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.18,
            pitchSemitones: -4,
            soundId: 'drums.lowTom.default',
            volumeDb: -2,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.16,
            pitchSemitones: 1,
            soundId: 'drums.ride.default',
            volumeDb: -11,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.16,
            pitchSemitones: 3,
            soundId: 'drums.snare.default',
            volumeDb: -5,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: harmonyTrack.mixChannelId, pan: -0.18, volumeDb: -5 }),
        createMixChannel({ id: melodyTrack.mixChannelId, pan: 0.2, volumeDb: 3 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0, volumeDb: 9 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createNoteEvents(
          'cut_glass_event_harmony',
          materializeChordGestures(harmonyGestures),
        ),
        id: 'cut_glass_pattern_chords',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar seven borrows Dmaj6 (I6) from parallel D major; F sharp replaces the cue\'s recurring F natural.',
          progression: 'Dm(add9) · Ebmaj7(#11) · Gm6/Bb · A7(b9) · Dm(add9) · C#dim7 → A7(b9) · Dmaj6 · Bbmaj7(#11) · Gm(add9) · Ebmaj7(#11) · A7(b9) · Dm6/9',
        },
        name: 'Twelve Frames of Noir',
      }),
      createPattern({
        events: createNoteEvents(
          'cut_glass_event_melody',
          materializeNoteGestures(melodyGestures),
        ),
        id: 'cut_glass_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'An angular D–F–E–C# cell is cut into fragments, widened by octave jumps, and transformed to D–F#–E–B over the borrowed major chord.',
        },
        name: 'Alibi in Negative',
      }),
      createPattern({
        events: createDrumEvents(),
        id: 'cut_glass_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'Dry stop-start hits alternate with crooked ride figures and an accelerating final cut.',
        },
        name: 'Splice Marks',
      }),
    ]),
    project: createProject({
      id: 'project_cut_glass_alibi',
      metadata: createProjectMetadata({
        description: 'An original twelve-bar cut-up chamber-noir cue with abrupt edits, angular reed lines, dry percussion, and a flash of borrowed major harmony.',
        tags: ['avant-jazz', 'chamber-noir', 'soundtrack', 'modal-interchange'],
      }),
      name: 'Cut Glass Alibi',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'cut_glass_key',
          key: { mode: 'minor', tonic: 2 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'cut_glass_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 142,
          id: 'cut_glass_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createStabGestures(
  barStartTick: number,
  pitches: readonly MidiNote[],
  beatOffsets: readonly number[],
  durations: readonly number[],
  velocity: number,
): ChordGesture[] {
  return beatOffsets.map((beatOffset, index) => ({
    durationTicks: durations[index],
    pitches,
    startTick: barStartTick + (PPQ * beatOffset),
    velocity: velocity - (index * 4),
  }))
}

function materializeChordGestures(
  gestures: readonly ChordGesture[],
): NoteEvent[] {
  return gestures.flatMap((gesture, gestureIndex) => gesture.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: gesture.durationTicks,
    id: `cut_glass_chord_seed_${gestureIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: gesture.startTick,
    velocity: gesture.velocity - (pitchIndex * 2),
  })))
}

function materializeNoteGestures(
  gestures: readonly NoteGesture[],
): NoteEvent[] {
  return gestures.map((gesture, index) => createNoteEvent({
    durationTicks: gesture.durationTicks,
    id: `cut_glass_note_seed_${index + 1}`,
    pitch: gesture.pitch,
    timeTick: gesture.startTick,
    velocity: gesture.velocity,
  }))
}

function createDrumEvents(): DrumHitEvent[] {
  const drumBars: readonly (readonly DrumGesture[])[] = [
    [
      { beat: 0, piece: 'kick', velocity: 108 },
      { beat: 0.5, piece: 'closedHat', velocity: 48 },
      { beat: 1.5, piece: 'snare', velocity: 88 },
      { beat: 2, piece: 'closedHat', velocity: 42 },
      { beat: 2.75, piece: 'kick', velocity: 94 },
      { beat: 3.25, piece: 'snare', velocity: 82 },
      { beat: 3.75, piece: 'lowTom', velocity: 78 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 98 },
      { beat: 0.75, piece: 'closedHat', velocity: 48 },
      { beat: 1, piece: 'snare', velocity: 84 },
      { beat: 1.75, piece: 'kick', velocity: 90 },
      { beat: 2.5, piece: 'closedHat', velocity: 44 },
      { beat: 3, piece: 'snare', velocity: 94 },
      { beat: 3.75, piece: 'kick', velocity: 86 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 104 },
      { beat: 0.5, piece: 'ride', velocity: 50 },
      { beat: 1.5, piece: 'ride', velocity: 58 },
      { beat: 2, piece: 'snare', velocity: 88 },
      { beat: 2.5, piece: 'ride', velocity: 48 },
      { beat: 3, piece: 'kick', velocity: 90 },
      { beat: 3.5, piece: 'ride', velocity: 62 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 110 },
      { beat: 0.5, piece: 'snare', velocity: 88 },
      { beat: 1.5, piece: 'kick', velocity: 92 },
      { beat: 2, piece: 'lowTom', velocity: 82 },
      { beat: 2.5, piece: 'snare', velocity: 96 },
      { beat: 3, piece: 'lowTom', velocity: 88 },
      { beat: 3.5, piece: 'snare', velocity: 102 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 106 },
      { beat: 0.5, piece: 'closedHat', velocity: 44 },
      { beat: 1.25, piece: 'snare', velocity: 84 },
      { beat: 2.25, piece: 'kick', velocity: 92 },
      { beat: 2.75, piece: 'closedHat', velocity: 54 },
      { beat: 3.5, piece: 'snare', velocity: 96 },
    ],
    [
      { beat: 0, piece: 'lowTom', velocity: 92 },
      { beat: 0.75, piece: 'snare', velocity: 82 },
      { beat: 1.5, piece: 'lowTom', velocity: 86 },
      { beat: 2, piece: 'kick', velocity: 108 },
      { beat: 2.5, piece: 'closedHat', velocity: 48 },
      { beat: 3, piece: 'snare', velocity: 100 },
      { beat: 3.75, piece: 'kick', velocity: 90 },
    ],
    [
      { beat: 0, piece: 'crash', velocity: 90 },
      { beat: 0, piece: 'kick', velocity: 112 },
      { beat: 1.5, piece: 'ride', velocity: 52 },
      { beat: 2, piece: 'snare', velocity: 94 },
      { beat: 2.5, piece: 'ride', velocity: 58 },
      { beat: 3, piece: 'kick', velocity: 88 },
      { beat: 3.5, piece: 'ride', velocity: 64 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 102 },
      { beat: 0.5, piece: 'snare', velocity: 78 },
      { beat: 1, piece: 'closedHat', velocity: 46 },
      { beat: 1.75, piece: 'kick', velocity: 92 },
      { beat: 2.25, piece: 'snare', velocity: 90 },
      { beat: 3, piece: 'lowTom', velocity: 86 },
      { beat: 3.5, piece: 'snare', velocity: 98 },
      { beat: 3.75, piece: 'lowTom', velocity: 92 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 104 },
      { beat: 0.75, piece: 'ride', velocity: 48 },
      { beat: 1.5, piece: 'snare', velocity: 86 },
      { beat: 2.25, piece: 'ride', velocity: 56 },
      { beat: 2.75, piece: 'kick', velocity: 94 },
      { beat: 3.5, piece: 'snare', velocity: 98 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 108 },
      { beat: 0.5, piece: 'closedHat', velocity: 48 },
      { beat: 1, piece: 'snare', velocity: 88 },
      { beat: 1.75, piece: 'lowTom', velocity: 84 },
      { beat: 2.5, piece: 'kick', velocity: 94 },
      { beat: 3, piece: 'snare', velocity: 100 },
      { beat: 3.75, piece: 'lowTom', velocity: 90 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 110 },
      { beat: 0.5, piece: 'snare', velocity: 90 },
      { beat: 1, piece: 'kick', velocity: 96 },
      { beat: 1.5, piece: 'lowTom', velocity: 86 },
      { beat: 2, piece: 'snare', velocity: 100 },
      { beat: 2.5, piece: 'kick', velocity: 98 },
      { beat: 3, piece: 'lowTom', velocity: 92 },
      { beat: 3.5, piece: 'snare', velocity: 106 },
    ],
    [
      { beat: 0, piece: 'kick', velocity: 112 },
      { beat: 0.75, piece: 'lowTom', velocity: 88 },
      { beat: 1.5, piece: 'snare', velocity: 96 },
      { beat: 2.5, piece: 'kick', velocity: 102 },
      { beat: 3, piece: 'snare', velocity: 108 },
      { beat: 3.25, piece: 'crash', velocity: 100 },
      { beat: 3.25, piece: 'kick', velocity: 114 },
    ],
  ]
  const events = drumBars.flatMap((bar, barIndex) => bar.map((gesture, gestureIndex) => createDrumHitEvent({
    id: `cut_glass_drum_seed_${barIndex + 1}_${gestureIndex + 1}`,
    piece: gesture.piece,
    timeTick: (barIndex * PPQ * 4) + (gesture.beat * PPQ),
    velocity: gesture.velocity,
  })))

  return createDrumHitEvents('cut_glass_event_drums', events)
}
