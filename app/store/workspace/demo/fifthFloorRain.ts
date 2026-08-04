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

type MelodyNote = {
  durationTicks: number
  pitch: MidiNote
  startTick: number
  velocity: number
}

type DrumBar = {
  ghostSnares: readonly number[]
  hats: readonly number[]
  kicks: readonly number[]
  lowToms?: readonly number[]
}

const DRUM_BARS: readonly DrumBar[] = [
  {
    ghostSnares: [1.75],
    hats: [0.625, 1, 1.625, 2.625, 3, 3.625, 4.625],
    kicks: [0, 1.625, 3, 4.625],
  },
  {
    ghostSnares: [3.75],
    hats: [0.625, 1.625, 2, 2.625, 3.625, 4, 4.625],
    kicks: [0, 1.25, 3, 4.25],
  },
  {
    ghostSnares: [1.625],
    hats: [0.625, 1, 1.625, 2.625, 3.625, 4, 4.625],
    kicks: [0, 1.625, 2.75, 3.5],
  },
  {
    ghostSnares: [3.625],
    hats: [0.625, 1.625, 2.625, 3, 3.625, 4.625],
    kicks: [0, 1.5, 3, 4.5],
    lowToms: [4.25, 4.625],
  },
  {
    ghostSnares: [1.75],
    hats: [0.625, 1, 1.625, 2.625, 3, 3.625, 4.625],
    kicks: [0, 1.25, 3.25, 4.625],
  },
  {
    ghostSnares: [3.75],
    hats: [0.625, 1.625, 2.625, 3.625, 4.625],
    kicks: [0, 3.25],
  },
  {
    ghostSnares: [1.625, 3.75],
    hats: [0.625, 1, 1.625, 2.625, 3, 3.625, 4.625],
    kicks: [0, 1.625, 3, 4.25],
  },
  {
    ghostSnares: [1.75],
    hats: [0.625, 1.625, 2.625, 3.625],
    kicks: [0, 1.5, 3],
    lowToms: [4, 4.25, 4.625],
  },
]

export function fifthFloorRain(): Workspace {
  const barTicks = PPQ * 5
  const totalTicks = barTicks * 8
  const eighthNoteTicks = PPQ / 2
  const chordGapTicks = PPQ / 4
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const drumsColor = '#fd7e14'
  const rhodesColor = '#7950f2'
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'fifth_floor_rain_track_drums',
    instrumentId: 'fifth_floor_rain_drums',
    name: 'Stairwell Pocket',
    role: 'drums',
  })
  const rhodesTrack = createTrack({
    color: rhodesColor,
    id: 'fifth_floor_rain_track_rhodes',
    instrumentId: 'fifth_floor_rain_rhodes',
    name: 'Rain-Worn Rhodes',
    role: 'melody',
  })
  const tracks = [drumsTrack, rhodesTrack]
  const voicings: readonly VoicingGesture[] = [
    // Ebm9 opens above a wide root-fifth shell, then exhales into Ebm11 on beat four.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [39, 46, 54, 61, 65, 70], startTick: bar(1), velocity: 76 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [54, 58, 61, 65, 68], startTick: bar(1) + (PPQ * 3), velocity: 68 },

    // Ab13sus4 resolves only its inner voice, keeping the ninth and thirteenth floating.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [44, 54, 58, 61, 63, 65], startTick: bar(2), velocity: 74 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [54, 58, 60, 65, 70], startTick: bar(2) + (PPQ * 3), velocity: 70 },

    // Dbmaj9/F lifts the bass by step while the upper cluster barely moves.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [41, 56, 60, 61, 63, 68], startTick: bar(3), velocity: 72 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [56, 60, 63, 65, 68], startTick: bar(3) + (PPQ * 3), velocity: 66 },

    // Gbmaj9 gains a diatonic C-natural #11 in the short half of the bar.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [42, 53, 56, 58, 61, 65], startTick: bar(4), velocity: 74 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [53, 56, 58, 60, 61, 65], startTick: bar(4) + (PPQ * 3), velocity: 68 },

    // Bbm11 begins the second phrase with the melody suspended above its fifth.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [46, 53, 56, 61, 63, 65], startTick: bar(5), velocity: 76 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [56, 61, 63, 65, 70], startTick: bar(5) + (PPQ * 3), velocity: 68 },

    // Gbm9 is the borrowed minor iv from parallel Db minor: one A-natural changes the weather.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [42, 52, 57, 61, 64, 68], startTick: bar(6), velocity: 78 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [52, 56, 57, 61, 64], startTick: bar(6) + (PPQ * 3), velocity: 70 },

    // The dominant returns suspended, then reveals C and Fb as an Ab7(b13) turnaround.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [44, 54, 58, 61, 63, 65], startTick: bar(7), velocity: 74 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [44, 54, 58, 60, 64, 70], startTick: bar(7) + (PPQ * 3), velocity: 76 },

    // Db6/9 lands softly; the second voicing leaves space above for the final raindrop motif.
    { durationTicks: (PPQ * 3) - chordGapTicks, pitches: [37, 53, 58, 61, 63, 65, 68], startTick: bar(8), velocity: 78 },
    { durationTicks: (PPQ * 2) - chordGapTicks, pitches: [49, 56, 58, 63, 65, 73], startTick: bar(8) + (PPQ * 3), velocity: 68 },
  ]
  const melody: readonly MelodyNote[] = [
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(1) + (PPQ * 3) / 2, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(1) + (PPQ * 17) / 4, velocity: 60 },

    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(2) + (PPQ * 7) / 4, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(2) + (PPQ * 17) / 4, velocity: 58 },

    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(3) + (PPQ * 3) / 2, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(3) + (PPQ * 4), velocity: 58 },

    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar(4) + (PPQ * 5) / 4, velocity: 60 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(4) + (PPQ * 2), velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(4) + (PPQ * 4), velocity: 68 },

    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(5) + (PPQ * 3) / 2, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(5) + (PPQ * 17) / 4, velocity: 60 },

    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(6) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(6) + (PPQ * 5) / 2, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(6) + (PPQ * 17) / 4, velocity: 56 },

    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(7) + (PPQ * 3) / 2, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 72, startTick: bar(7) + (PPQ * 5) / 2, velocity: 60 },
    { durationTicks: eighthNoteTicks, pitch: 70, startTick: bar(7) + (PPQ * 17) / 4, velocity: 58 },

    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(8) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(8) + (PPQ * 5) / 2, velocity: 62 },
    { durationTicks: PPQ - chordGapTicks, pitch: 72, startTick: bar(8) + (PPQ * 4), velocity: 58 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `fifth_floor_rain_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `fifth_floor_rain_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'fifth_floor_rain_section_window_fog',
          lengthTicks: barTicks * 4,
          name: 'Window Fog',
          startTick: bar(1),
        }),
        createSection({
          id: 'fifth_floor_rain_section_borrowed_rain',
          lengthTicks: barTicks * 4,
          name: 'Borrowed Rain',
          startTick: bar(5),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createDrumInstrument({
        id: 'fifth_floor_rain_drums',
        name: 'Blanket-Damped Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.045,
            pitchSemitones: -5,
            soundId: 'drums.closedHat.default',
            volumeDb: -14,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.46,
            pitchSemitones: -8,
            soundId: 'drums.kick.default',
            volumeDb: 5,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.32,
            pitchSemitones: -6,
            soundId: 'drums.lowTom.default',
            volumeDb: -4,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.18,
            pitchSemitones: -3,
            soundId: 'drums.snare.default',
            volumeDb: -2,
          }),
        },
      }),
      createThorInstrument({
        envelope: {
          attack: 0.018,
          decay: 0.9,
          release: 1.35,
          sustain: 0.46,
        },
        filter: {
          cutoffHz: 2300,
          resonance: 2.8,
          type: 'lowpass',
        },
        id: 'fifth_floor_rain_rhodes',
        name: 'Rain-Worn Rhodes',
        oscilators: [
          createSynthOscillator({ level: 0.64, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -5, level: 0.24, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 6, level: 0.12, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'keys.default',
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.08, volumeDb: -1 }),
        createMixChannel({ id: rhodesTrack.mixChannelId, pan: -0.08, volumeDb: -7 }),
      ]),
      master: {
        muted: false,
        volumeDb: -2,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createDrumEvents(barTicks),
        id: 'fifth_floor_rain_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'A loose 3+2 pocket in 5/4, with late swung hats, blanket-damped backbeats on beats three and five, and a deliberately sparse borrowed-chord bar.',
        },
        name: 'Stairwell Pocket',
      }),
      createPattern({
        events: createRhodesEvents(voicings, melody),
        id: 'fifth_floor_rain_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar six borrows Gbm9, the minor iv, from parallel Db minor before the dominant turns home.',
          motif: 'A soft F–Eb–Db raindrop figure keeps returning in new positions above the changing inner voices.',
          progression: 'Ebm9 · Ab13sus4 → Ab13 · Dbmaj9/F · Gbmaj9(#11) · Bbm11 · Gbm9 · Ab13sus4 → Ab7(b13) · Db6/9',
        },
        name: 'Fogged-Glass Voicings',
      }),
    ]),
    project: createProject({
      id: 'project_fifth_floor_rain',
      metadata: createProjectMetadata({
        description: 'An eight-bar, two-track lo-fi beat in 5/4, pairing a loose 3+2 drum pocket with warm Rhodes bass, extended voicings, and a small descending raindrop motif.',
        tags: ['5/4', 'chill', 'lo-fi', 'modal-interchange', 'rhodes', 'two-track'],
      }),
      name: 'Fifth Floor Rain',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'fifth_floor_rain_key',
          key: { mode: 'major', tonic: 1 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'fifth_floor_rain_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 5 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 78,
          id: 'fifth_floor_rain_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createRhodesEvents(
  voicings: readonly VoicingGesture[],
  melody: readonly MelodyNote[],
): NoteEvent[] {
  const chordEvents = voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `fifth_floor_rain_voicing_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex * 2, 10),
  })))
  const melodyEvents = melody.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `fifth_floor_rain_melody_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('fifth_floor_rain_event_rhodes', [
    ...chordEvents,
    ...melodyEvents,
  ])
}

function createDrumEvents(barTicks: number): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []

  DRUM_BARS.forEach((drumBar, barIndex) => {
    const barStartTick = barTicks * barIndex
    const addHits = (
      piece: DrumPiece,
      beatOffsets: readonly number[],
      velocity: (hitIndex: number, beatOffset: number) => number,
    ) => beatOffsets.forEach((beatOffset, hitIndex) => hits.push(createDrumHitEvent({
      id: `fifth_floor_rain_drum_seed_${barIndex + 1}_${piece}_${hitIndex + 1}`,
      piece,
      timeTick: barStartTick + (PPQ * beatOffset),
      velocity: velocity(hitIndex, beatOffset),
    })))

    addHits('kick', drumBar.kicks, hitIndex => hitIndex === 0 ? 108 : 80 - ((hitIndex - 1) * 4))
    addHits('snare', [2, 4], hitIndex => hitIndex === 0 ? 94 : 88)
    addHits('snare', drumBar.ghostSnares, () => 34 + ((barIndex % 3) * 3))
    addHits('closedHat', drumBar.hats, (hitIndex, beatOffset) => {
      if (beatOffset % 1 === 0) return 48
      return 35 + ((hitIndex % 3) * 3)
    })
    addHits('lowTom', drumBar.lowToms ?? [], hitIndex => 54 + (hitIndex * 8))
  })

  return createDrumHitEvents('fifth_floor_rain_event_drums', hits)
}
