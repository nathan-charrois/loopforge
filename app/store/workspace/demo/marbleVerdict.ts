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

type PianoPhrase = {
  lengthTicks: number
  pitches: readonly MidiNote[]
  startTick: number
  variation: number
  velocity: number
}

type NoteGesture = {
  durationTicks: number
  pitch: MidiNote
  startTick: number
  velocity: number
}

type VoicingGesture = {
  durationTicks: number
  pitches: readonly MidiNote[]
  startTick: number
  velocity: number
}

type DrumBar = {
  crash?: boolean
  ghostSnares: readonly number[]
  hats: readonly number[]
  kicks: readonly number[]
  lowToms?: readonly number[]
}

const DRUM_BARS: readonly DrumBar[] = [
  {
    ghostSnares: [3.75],
    hats: [0.5, 1.5, 2.5, 3.5],
    kicks: [0, 2.75],
  },
  {
    ghostSnares: [1.75, 3.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.5],
    kicks: [0, 1.75, 3.25],
  },
  {
    ghostSnares: [1.75],
    hats: [0.5, 1.5, 2, 2.5, 3.5],
    kicks: [0, 2.5, 3.5],
  },
  {
    ghostSnares: [3.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.5],
    kicks: [0, 1.5, 3.25],
    lowToms: [3, 3.5],
  },
  {
    crash: true,
    ghostSnares: [1.75, 3.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.5],
    kicks: [0, 1.75, 2.75],
  },
  {
    ghostSnares: [3.75],
    hats: [0.5, 1.5, 2.5, 3.5],
    kicks: [0, 2.75],
  },
  {
    ghostSnares: [1.75, 3.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.5],
    kicks: [0, 1.5, 2.75, 3.5],
  },
  {
    ghostSnares: [1.75],
    hats: [0.5, 1, 1.5, 2.5, 3.5],
    kicks: [0, 1.75, 2.75],
    lowToms: [3, 3.5, 3.75],
  },
]

const PIANO_ORDERS = [
  [0, 2, 3, 4, 2, 5, 4, 3, 1, 3, 4, 5, 3, 2, 4, 1],
  [0, 3, 1, 4, 2, 5, 3, 4, 1, 2, 4, 5, 3, 1, 4, 2],
  [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 4, 2, 3, 1, 4],
  [0, 1, 3, 5, 4, 2, 3, 1, 0, 2, 4, 5, 3, 4, 2, 1],
] as const

export function marbleVerdict(): Workspace {
  const sixteenthNoteTicks = PPQ / 4
  const eighthNoteTicks = PPQ / 2
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const noteGapTicks = PPQ / 32
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const pianoColor = '#7950f2'
  const stringsColor = '#4c6ef5'
  const bassColor = '#40c057'
  const drumsColor = '#fd7e14'
  const pianoTrack = createTrack({
    color: pianoColor,
    id: 'marble_verdict_track_piano',
    instrumentId: 'marble_verdict_piano',
    name: 'Ivory Gavel',
    role: 'melody',
  })
  const stringsTrack = createTrack({
    accepts: ['note'],
    color: stringsColor,
    id: 'marble_verdict_track_strings',
    instrumentId: 'marble_verdict_strings',
    name: 'Proxy Strings',
    role: 'chords',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'marble_verdict_track_bass',
    instrumentId: 'marble_verdict_bass',
    name: 'Majority Bass',
    role: 'bass',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'marble_verdict_track_drums',
    instrumentId: 'marble_verdict_drums',
    name: 'Boardroom Weight',
    role: 'drums',
  })
  const tracks = [pianoTrack, stringsTrack, bassTrack, drumsTrack]

  const pianoPhrases: readonly PianoPhrase[] = [
    { lengthTicks: barTicks, pitches: [41, 53, 56, 60, 67, 72], startTick: bar(1), variation: 0, velocity: 72 },
    { lengthTicks: barTicks, pitches: [41, 49, 53, 56, 60, 65], startTick: bar(2), variation: 1, velocity: 70 },
    { lengthTicks: barTicks, pitches: [39, 51, 56, 60, 63, 70], startTick: bar(3), variation: 2, velocity: 74 },
    { lengthTicks: barTicks, pitches: [36, 48, 52, 55, 58, 61], startTick: bar(4), variation: 3, velocity: 78 },
    { lengthTicks: barTicks, pitches: [36, 48, 53, 56, 67, 68], startTick: bar(5), variation: 3, velocity: 80 },
    { lengthTicks: barTicks, pitches: [37, 46, 53, 56, 60, 63], startTick: bar(6), variation: 0, velocity: 82 },
    // Gdim7/Db stays inside F harmonic minor and compresses the harmony toward C7(b9).
    { lengthTicks: barTicks, pitches: [37, 43, 46, 52, 55, 58], startTick: bar(7), variation: 2, velocity: 86 },
    { lengthTicks: barTicks / 2, pitches: [36, 48, 52, 55, 58, 61], startTick: bar(8), variation: 3, velocity: 86 },
    { lengthTicks: barTicks / 2, pitches: [41, 48, 53, 56, 67, 68], startTick: bar(8) + (barTicks / 2), variation: 1, velocity: 76 },
  ]
  const pianoMotif: readonly NoteGesture[] = [
    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(1) + (PPQ * 5) / 4, velocity: 84 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 80, startTick: bar(1) + (PPQ * 2), velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar(1) + (PPQ * 11) / 4, velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(1) + (PPQ * 7) / 2, velocity: 88 },

    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(2) + PPQ, velocity: 82 },
    { durationTicks: eighthNoteTicks, pitch: 85, startTick: bar(2) + (PPQ * 7) / 4, velocity: 86 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 80, startTick: bar(2) + (PPQ * 5) / 2, velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(2) + (PPQ * 7) / 2, velocity: 74 },

    { durationTicks: eighthNoteTicks, pitch: 87, startTick: bar(3) + (PPQ * 5) / 4, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(3) + (PPQ * 2), velocity: 82 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 82, startTick: bar(3) + (PPQ * 11) / 4, velocity: 78 },
    { durationTicks: eighthNoteTicks, pitch: 80, startTick: bar(3) + (PPQ * 7) / 2, velocity: 76 },

    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar(4) + PPQ, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 82, startTick: bar(4) + (PPQ * 7) / 4, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 85, startTick: bar(4) + (PPQ * 5) / 2, velocity: 92 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 84, startTick: bar(4) + (PPQ * 13) / 4, velocity: 86 },

    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(5) + (PPQ * 3) / 4, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 80, startTick: bar(5) + (PPQ * 3) / 2, velocity: 86 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 79, startTick: bar(5) + (PPQ * 9) / 4, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(5) + (PPQ * 13) / 4, velocity: 82 },
    { durationTicks: sixteenthNoteTicks, pitch: 84, startTick: bar(5) + (PPQ * 15) / 4, velocity: 94 },

    { durationTicks: eighthNoteTicks, pitch: 85, startTick: bar(6) + (PPQ * 3) / 4, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(6) + (PPQ * 3) / 2, velocity: 90 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 80, startTick: bar(6) + (PPQ * 9) / 4, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 82, startTick: bar(6) + (PPQ * 13) / 4, velocity: 88 },
    { durationTicks: sixteenthNoteTicks, pitch: 77, startTick: bar(6) + (PPQ * 15) / 4, velocity: 82 },

    { durationTicks: eighthNoteTicks, pitch: 85, startTick: bar(7) + (PPQ * 3) / 4, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 82, startTick: bar(7) + (PPQ * 3) / 2, velocity: 92 },
    { durationTicks: sixteenthNoteTicks * 3, pitch: 79, startTick: bar(7) + (PPQ * 9) / 4, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(7) + (PPQ * 13) / 4, velocity: 90 },
    { durationTicks: sixteenthNoteTicks, pitch: 85, startTick: bar(7) + (PPQ * 15) / 4, velocity: 98 },

    { durationTicks: sixteenthNoteTicks, pitch: 79, startTick: bar(8) + (PPQ / 2), velocity: 92 },
    { durationTicks: sixteenthNoteTicks, pitch: 82, startTick: bar(8) + PPQ, velocity: 96 },
    { durationTicks: sixteenthNoteTicks, pitch: 85, startTick: bar(8) + (PPQ * 3) / 2, velocity: 100 },
    { durationTicks: sixteenthNoteTicks, pitch: 88, startTick: bar(8) + (PPQ * 7) / 4, velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 84, startTick: bar(8) + (PPQ * 2), velocity: 92 },
    { durationTicks: eighthNoteTicks, pitch: 80, startTick: bar(8) + (PPQ * 11) / 4, velocity: 86 },
    { durationTicks: sixteenthNoteTicks, pitch: 79, startTick: bar(8) + (PPQ * 13) / 4, velocity: 82 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(8) + (PPQ * 7) / 2, velocity: 80 },
  ]
  const stringVoicings: readonly VoicingGesture[] = [
    { durationTicks: barTicks - noteGapTicks, pitches: [41, 48, 53, 56, 60, 67], startTick: bar(1), velocity: 58 },
    { durationTicks: barTicks - noteGapTicks, pitches: [41, 49, 53, 56, 60, 68], startTick: bar(2), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [39, 51, 56, 60, 63, 70], startTick: bar(3), velocity: 62 },
    { durationTicks: barTicks - noteGapTicks, pitches: [36, 48, 52, 55, 58, 61, 67], startTick: bar(4), velocity: 66 },
    { durationTicks: barTicks - noteGapTicks, pitches: [36, 48, 53, 56, 60, 67, 68], startTick: bar(5), velocity: 68 },
    { durationTicks: barTicks - noteGapTicks, pitches: [37, 46, 53, 56, 60, 63, 65], startTick: bar(6), velocity: 72 },
    { durationTicks: barTicks - noteGapTicks, pitches: [37, 43, 46, 49, 52, 55, 58, 61], startTick: bar(7), velocity: 78 },
    { durationTicks: (barTicks / 2) - noteGapTicks, pitches: [36, 48, 52, 55, 58, 61, 67], startTick: bar(8), velocity: 80 },
    { durationTicks: (barTicks / 2) - noteGapTicks, pitches: [41, 48, 53, 56, 60, 67, 68], startTick: bar(8) + (barTicks / 2), velocity: 68 },
  ]
  const bassGestures: readonly NoteGesture[] = [
    { durationTicks: PPQ * 2, pitch: 29, startTick: bar(1), velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 36, startTick: bar(1) + (PPQ * 11) / 4, velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 41, startTick: bar(1) + (PPQ * 7) / 2, velocity: 90 },

    { durationTicks: PPQ * 2, pitch: 29, startTick: bar(2), velocity: 102 },
    { durationTicks: eighthNoteTicks, pitch: 37, startTick: bar(2) + (PPQ * 5) / 2, velocity: 86 },
    { durationTicks: PPQ, pitch: 32, startTick: bar(2) + (PPQ * 3), velocity: 88 },

    { durationTicks: PPQ * 2, pitch: 39, startTick: bar(3), velocity: 106 },
    { durationTicks: eighthNoteTicks, pitch: 44, startTick: bar(3) + (PPQ * 5) / 2, velocity: 84 },
    { durationTicks: PPQ, pitch: 36, startTick: bar(3) + (PPQ * 3), velocity: 90 },

    { durationTicks: PPQ * 2, pitch: 36, startTick: bar(4), velocity: 110 },
    { durationTicks: eighthNoteTicks, pitch: 31, startTick: bar(4) + (PPQ * 5) / 2, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 34, startTick: bar(4) + (PPQ * 13) / 4, velocity: 92 },
    { durationTicks: eighthNoteTicks, pitch: 37, startTick: bar(4) + (PPQ * 7) / 2, velocity: 96 },

    { durationTicks: PPQ * 2, pitch: 36, startTick: bar(5), velocity: 112 },
    { durationTicks: eighthNoteTicks, pitch: 41, startTick: bar(5) + (PPQ * 5) / 2, velocity: 90 },
    { durationTicks: PPQ, pitch: 29, startTick: bar(5) + (PPQ * 3), velocity: 98 },

    { durationTicks: PPQ * 2, pitch: 37, startTick: bar(6), velocity: 114 },
    { durationTicks: eighthNoteTicks, pitch: 34, startTick: bar(6) + (PPQ * 5) / 2, velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 36, startTick: bar(6) + (PPQ * 3), velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 41, startTick: bar(6) + (PPQ * 7) / 2, velocity: 100 },

    { durationTicks: PPQ * 2, pitch: 37, startTick: bar(7), velocity: 116 },
    { durationTicks: eighthNoteTicks, pitch: 31, startTick: bar(7) + (PPQ * 9) / 4, velocity: 96 },
    { durationTicks: eighthNoteTicks, pitch: 34, startTick: bar(7) + (PPQ * 11) / 4, velocity: 100 },
    { durationTicks: eighthNoteTicks, pitch: 40, startTick: bar(7) + (PPQ * 13) / 4, velocity: 104 },
    { durationTicks: sixteenthNoteTicks, pitch: 37, startTick: bar(7) + (PPQ * 15) / 4, velocity: 108 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 36, startTick: bar(8), velocity: 118 },
    { durationTicks: sixteenthNoteTicks, pitch: 31, startTick: bar(8) + (PPQ * 3) / 2, velocity: 100 },
    { durationTicks: sixteenthNoteTicks, pitch: 37, startTick: bar(8) + (PPQ * 7) / 4, velocity: 104 },
    { durationTicks: PPQ * 2, pitch: 29, startTick: bar(8) + (PPQ * 2), velocity: 108 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `marble_verdict_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `marble_verdict_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'marble_verdict_section_terms_of_power',
          lengthTicks: barTicks * 4,
          name: 'Terms of Power',
          startTick: bar(1),
        }),
        createSection({
          id: 'marble_verdict_section_final_vote',
          lengthTicks: barTicks * 4,
          name: 'Final Vote',
          startTick: bar(5),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.006,
          decay: 0.74,
          release: 0.92,
          sustain: 0.3,
        },
        filter: {
          cutoffHz: 4700,
          resonance: 1.7,
          type: 'lowpass',
        },
        id: 'marble_verdict_piano',
        name: 'Ivory Gavel',
        oscilators: [
          createSynthOscillator({ level: 0.62, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -4, level: 0.24, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 5, level: 0.14, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.16,
          decay: 1.1,
          release: 2.1,
          sustain: 0.76,
        },
        filter: {
          cutoffHz: 3100,
          resonance: 1.3,
          type: 'lowpass',
        },
        id: 'marble_verdict_strings',
        name: 'Proxy Strings',
        oscilators: [
          createSynthOscillator({ level: 0.54, waveform: 'sawtooth' }),
          createSynthOscillator({ detuneCents: -7, level: 0.28, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 6, level: 0.18, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'strings.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.02,
          decay: 0.48,
          release: 0.82,
          sustain: 0.72,
        },
        filter: {
          cutoffHz: 760,
          resonance: 1.8,
          type: 'lowpass',
        },
        id: 'marble_verdict_bass',
        name: 'Majority Bass',
        oscilators: [
          createSynthOscillator({ level: 0.76, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -5, level: 0.24, waveform: 'triangle' }),
        ],
        soundId: 'bass.default',
      }),
      createDrumInstrument({
        id: 'marble_verdict_drums',
        name: 'Boardroom Weight',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.05,
            pitchSemitones: -4,
            soundId: 'drums.closedHat.default',
            volumeDb: -12,
          }),
          crash: createDrumPieceSound({
            durationSeconds: 0.72,
            pitchSemitones: -3,
            soundId: 'drums.crash.default',
            volumeDb: -9,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.52,
            pitchSemitones: -10,
            soundId: 'drums.kick.default',
            volumeDb: 6,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.4,
            pitchSemitones: -8,
            soundId: 'drums.lowTom.default',
            volumeDb: -1,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.2,
            pitchSemitones: -2,
            soundId: 'drums.snare.default',
            volumeDb: 0,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: pianoTrack.mixChannelId, pan: -0.08, volumeDb: 0 }),
        createMixChannel({ id: stringsTrack.mixChannelId, pan: 0.12, volumeDb: -6 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: -2 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.04, volumeDb: 1 }),
      ]),
      master: {
        muted: false,
        volumeDb: -1,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createPianoEvents(pianoPhrases, pianoMotif, sixteenthNoteTicks, noteGapTicks),
        id: 'marble_verdict_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'A rising C–Ab–G–C verdict cell keeps returning in sharper inversions before falling through the final cadence.',
          process: 'Low sixteenth-note arpeggios and high-register answers grow denser and louder through the second four bars.',
        },
        name: 'Ivory Gavel Argument',
      }),
      createPattern({
        events: createNoteEvents(
          'marble_verdict_event_strings',
          materializeVoicings(stringVoicings),
        ),
        id: 'marble_verdict_pattern_chords',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          harmonicDirection: 'Bars five through eight stay committed to F minor. Gdim7/Db draws on F harmonic minor and tightens directly into C7(b9) without opening into parallel major.',
          progression: 'Fm(add9) · Dbmaj7/F · Ab(add9)/Eb · C7(b9) · Fm(add9)/C · Bbm11/Db · Gdim7/Db · C7(b9) → Fm(add9)',
          voicing: 'Wide low shells support close upper sevenths, ninths, and semitone inner movement while leaving the piano in front.',
        },
        name: 'Unanimous Dissent',
      }),
      createPattern({
        events: createNoteEvents(
          'marble_verdict_event_bass',
          materializeNoteGestures(bassGestures),
        ),
        id: 'marble_verdict_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Long sub fundamentals give way to a Db–G–Bb–E diminished climb that locks the final cadence into F harmonic minor.',
        },
        name: 'Majority Pulse',
      }),
      createPattern({
        events: createDrumEvents(barTicks),
        id: 'marble_verdict_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'A restrained half-time hip-hop frame grows into oversized kicks and low-tom punctuation without covering the piano.',
        },
        name: 'Boardroom Weight',
      }),
    ]),
    project: createProject({
      id: 'project_marble_verdict',
      metadata: createProjectMetadata({
        description: 'An original eight-bar piano-led chamber drama: crooked classical arpeggios, tense strings, sub-bass weight, and a sparse oversized beat commit to an unbroken minor-key escalation.',
        tags: ['cinematic', 'piano', 'chamber', 'hip-hop', 'harmonic-minor', 'eight-bar'],
      }),
      name: 'Marble Verdict',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'marble_verdict_key',
          key: { mode: 'minor', tonic: 5 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'marble_verdict_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 100,
          id: 'marble_verdict_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createPianoEvents(
  phrases: readonly PianoPhrase[],
  motif: readonly NoteGesture[],
  stepTicks: number,
  noteGapTicks: number,
): NoteEvent[] {
  const arpeggioEvents = phrases.flatMap((phrase, phraseIndex) => {
    const pitchOrder = PIANO_ORDERS[phrase.variation % PIANO_ORDERS.length]
    const stepCount = phrase.lengthTicks / stepTicks

    return Array.from({ length: stepCount }, (_, stepIndex) => createNoteEvent({
      durationTicks: stepIndex % 4 === 0
        ? (stepTicks * 2) - noteGapTicks
        : stepTicks - noteGapTicks,
      id: `marble_verdict_piano_seed_${phraseIndex + 1}_${stepIndex + 1}`,
      pitch: phrase.pitches[pitchOrder[stepIndex % pitchOrder.length]],
      timeTick: phrase.startTick + (stepIndex * stepTicks),
      velocity: phrase.velocity + (stepIndex % 4 === 0 ? 8 : 0) - (stepIndex % 2 === 1 ? 4 : 0),
    }))
  })

  return createNoteEvents('marble_verdict_event_piano', [
    ...arpeggioEvents,
    ...materializeNoteGestures(motif),
  ])
}

function materializeNoteGestures(gestures: readonly NoteGesture[]): NoteEvent[] {
  return gestures.map((gesture, gestureIndex) => createNoteEvent({
    durationTicks: gesture.durationTicks,
    id: `marble_verdict_note_seed_${gestureIndex + 1}`,
    pitch: gesture.pitch,
    timeTick: gesture.startTick,
    velocity: gesture.velocity,
  }))
}

function materializeVoicings(voicings: readonly VoicingGesture[]): NoteEvent[] {
  return voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `marble_verdict_voicing_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex * 2, 10),
  })))
}

function createDrumEvents(barTicks: number): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []

  DRUM_BARS.forEach((drumBar, barIndex) => {
    const barStartTick = barTicks * barIndex
    const addHits = (
      piece: DrumPiece,
      beatOffsets: readonly number[],
      velocity: (hitIndex: number) => number,
    ) => beatOffsets.forEach((beatOffset, hitIndex) => hits.push(createDrumHitEvent({
      id: `marble_verdict_drum_seed_${barIndex + 1}_${piece}_${hitIndex + 1}`,
      piece,
      timeTick: barStartTick + (PPQ * beatOffset),
      velocity: velocity(hitIndex),
    })))

    addHits('kick', drumBar.kicks, hitIndex => hitIndex === 0 ? 112 : 92 + (hitIndex * 4))
    addHits('snare', [2], () => barIndex >= 4 ? 106 : 98)
    addHits('snare', drumBar.ghostSnares, hitIndex => 38 + (hitIndex * 4))
    addHits('closedHat', drumBar.hats, hitIndex => 42 + ((hitIndex % 3) * 5))
    addHits('lowTom', drumBar.lowToms ?? [], hitIndex => 68 + (hitIndex * 10))

    if (drumBar.crash) {
      addHits('crash', [0], () => 76)
    }
  })

  return createDrumHitEvents('marble_verdict_event_drums', hits)
}
