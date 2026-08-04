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
  openHats?: readonly number[]
  rides?: readonly number[]
}

const DRUM_BARS: readonly DrumBar[] = [
  {
    ghostSnares: [3.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.5],
    kicks: [0, 1.5, 3.25],
  },
  {
    ghostSnares: [1.5],
    hats: [0.25, 0.75, 1.25, 1.75, 2.5, 3, 3.25, 3.75],
    kicks: [0, 0.75, 1.75, 3.5],
    openHats: [3.5],
  },
  {
    ghostSnares: [3],
    hats: [0.5, 1, 1.5, 2.5, 3.25, 3.5, 3.75],
    kicks: [0, 1.25, 2.75],
  },
  {
    ghostSnares: [3.25],
    hats: [0.5, 1.25, 1.5, 1.75, 2.5, 3],
    kicks: [0, 1.5, 2.75, 3.5],
    lowToms: [3.25, 3.5, 3.75],
  },
  {
    ghostSnares: [1.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.5],
    kicks: [0, 0.75, 1.75, 3.25],
    rides: [0, 1, 2, 3],
  },
  {
    ghostSnares: [3],
    hats: [0.25, 0.75, 1.25, 1.75, 2.5, 3.25, 3.5],
    kicks: [0, 1.5, 2.75, 3.75],
    openHats: [3.75],
  },
  {
    ghostSnares: [1.75],
    hats: [0.5, 1, 1.5, 2.5, 3, 3.25, 3.5, 3.75],
    kicks: [0, 1.25, 2.5, 3.5],
    lowToms: [3.5],
  },
  {
    ghostSnares: [3.25],
    hats: [0.5, 1, 1.5, 2.5, 3],
    kicks: [0, 0.75, 1.5, 2.75, 3.75],
    lowToms: [3, 3.25, 3.5, 3.75],
  },
]

export function zeroKelvinBloom(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const eighthNoteTicks = PPQ / 2
  const sixteenthNoteTicks = PPQ / 4
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const drumsColor = '#228be6'
  const harmonyColor = '#845ef7'
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'zero_kelvin_track_drums',
    instrumentId: 'zero_kelvin_drums',
    name: 'Below-Zero Break',
    role: 'drums',
  })
  const harmonyTrack = createTrack({
    color: harmonyColor,
    id: 'zero_kelvin_track_harmony',
    instrumentId: 'zero_kelvin_harmony',
    name: 'Cryoglass Voicings',
    role: 'melody',
  })
  const tracks = [drumsTrack, harmonyTrack]
  const voicings: readonly VoicingGesture[] = [
    // F#m11(add9): the wide F# anchor leaves a cold E–G#–B cluster suspended above it.
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [30, 45, 52, 56, 59, 61], startTick: bar(1), velocity: 78 },
    // Dmaj9/A: only a few inner voices move, so the opening feels almost frozen in place.
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [33, 50, 54, 57, 61, 64], startTick: bar(2), velocity: 74 },
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [37, 52, 56, 57, 59, 64], startTick: bar(3), velocity: 72 },
    // B6/9 is the major IV borrowed from F# Dorian; D# is the first shaft of blue light.
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [35, 47, 54, 56, 61, 63], startTick: bar(4), velocity: 80 },
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [28, 49, 52, 54, 57, 59, 68], startTick: bar(5), velocity: 76 },
    // Gmaj7(#11)/D borrows the flat-II sonority from F# Phrygian; G natural freezes the return home.
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [38, 50, 54, 55, 59, 61, 66], startTick: bar(6), velocity: 82 },
    { durationTicks: barTicks - sixteenthNoteTicks, pitches: [33, 45, 50, 54, 61, 64, 69], startTick: bar(7), velocity: 76 },
    { durationTicks: (PPQ * 2) - sixteenthNoteTicks, pitches: [37, 47, 50, 54, 56, 59], startTick: bar(8), velocity: 80 },
    { durationTicks: (PPQ * 3) / 2 - sixteenthNoteTicks, pitches: [37, 47, 50, 53, 56, 59], startTick: bar(8) + (PPQ * 2), velocity: 84 },
    { durationTicks: eighthNoteTicks, pitches: [30, 45, 52, 56, 61], startTick: bar(8) + (PPQ * 7) / 2, velocity: 72 },
  ]
  const melody: readonly MelodyNote[] = [
    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(1) + (PPQ * 5) / 4, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(1) + (PPQ * 9) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(1) + (PPQ * 13) / 4, velocity: 66 },

    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(2) + (PPQ * 3) / 4, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(2) + (PPQ * 7) / 4, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(2) + (PPQ * 11) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(2) + (PPQ * 7) / 2, velocity: 60 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(3) + PPQ, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(3) + (PPQ * 7) / 4, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(3) + (PPQ * 11) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 80, startTick: bar(3) + (PPQ * 7) / 2, velocity: 66 },

    { durationTicks: eighthNoteTicks, pitch: 75, startTick: bar(4) + (PPQ * 3) / 4, velocity: 72 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(4) + (PPQ * 3) / 2, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(4) + (PPQ * 5) / 2, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(4) + (PPQ * 7) / 2, velocity: 58 },

    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(5) + eighthNoteTicks, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(5) + (PPQ * 3) / 2, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(5) + (PPQ * 5) / 2, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(5) + (PPQ * 7) / 2, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(6) + (PPQ * 3) / 4, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar(6) + (PPQ * 3) / 2, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 83, startTick: bar(6) + (PPQ * 9) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 85, startTick: bar(6) + (PPQ * 13) / 4, velocity: 64 },

    { durationTicks: eighthNoteTicks, pitch: 81, startTick: bar(7) + PPQ, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(7) + (PPQ * 7) / 4, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(7) + (PPQ * 11) / 4, velocity: 70 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(7) + (PPQ * 7) / 2, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(8) + (PPQ * 3) / 4, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(8) + (PPQ * 3) / 2, velocity: 64 },
    { durationTicks: eighthNoteTicks, pitch: 68, startTick: bar(8) + (PPQ * 5) / 2, velocity: 60 },
    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(8) + (PPQ * 7) / 2, velocity: 72 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `zero_kelvin_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `zero_kelvin_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'zero_kelvin_section_whiteout',
          lengthTicks: barTicks * 4,
          name: 'Whiteout',
          startTick: bar(1),
        }),
        createSection({
          id: 'zero_kelvin_section_blue_shadow',
          lengthTicks: barTicks * 4,
          name: 'Blue Shadow',
          startTick: bar(5),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createDrumInstrument({
        id: 'zero_kelvin_drums',
        name: 'Below-Zero Pressure Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.045,
            pitchSemitones: -7,
            soundId: 'drums.closedHat.default',
            volumeDb: -15,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.52,
            pitchSemitones: -10,
            soundId: 'drums.kick.default',
            volumeDb: 8,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.4,
            pitchSemitones: -9,
            soundId: 'drums.lowTom.default',
            volumeDb: -1,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.18,
            pitchSemitones: -7,
            soundId: 'drums.openHat.default',
            volumeDb: -17,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.16,
            pitchSemitones: -8,
            soundId: 'drums.ride.default',
            volumeDb: -18,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.22,
            pitchSemitones: -4,
            soundId: 'drums.snare.default',
            volumeDb: 0,
          }),
        },
      }),
      createThorInstrument({
        envelope: {
          attack: 0.025,
          decay: 0.72,
          release: 1.15,
          sustain: 0.42,
        },
        filter: {
          cutoffHz: 1900,
          resonance: 4.2,
          type: 'lowpass',
        },
        id: 'zero_kelvin_harmony',
        name: 'Cryoglass Electric Piano',
        oscilators: [
          createSynthOscillator({ level: 0.58, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -6, level: 0.22, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 7, level: 0.14, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ level: 0.06, octave: 2, waveform: 'triangle' }),
        ],
        soundId: 'keys.default',
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.08, volumeDb: 2 }),
        createMixChannel({ id: harmonyTrack.mixChannelId, pan: -0.12, volumeDb: -8 }),
      ]),
      master: {
        muted: false,
        volumeDb: -2,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createDrumEvents(barTicks),
        id: 'zero_kelvin_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'A 138 BPM halftime chill-step pocket: sub-heavy kick syncopation, one glacial snare per bar, clipped hats, and low-tom pressure cracks.',
        },
        name: 'Pressure Fractures',
      }),
      createPattern({
        events: createHarmonyEvents(voicings, melody),
        id: 'zero_kelvin_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar four borrows B6/9 (IV) from F# Dorian; bar six borrows Gmaj7(#11) (flat-II) from F# Phrygian.',
          motif: 'A three-note C#–E–G# ice-crystal shape rises, falls through D#, and returns transformed around G natural before resolving to F#.',
          progression: 'F#m11(add9) · Dmaj9/A · Amaj9/C# · B6/9 · F#m11/E · Gmaj7(#11)/D · Dmaj9/A · C#7sus4(b9) → C#7(b9) → F#m9',
        },
        name: 'Frozen Voicings',
      }),
    ]),
    project: createProject({
      id: 'project_zero_kelvin_bloom',
      metadata: createProjectMetadata({
        description: 'An eight-bar, two-track cryogenic chill-step beat with sub-heavy drums, wide F-sharp-minor voicings, a crystalline top-line, and borrowed Dorian and Phrygian harmony.',
        tags: ['chill-step', 'deep', 'drum-focused', 'ice-cold', 'modal-interchange', 'two-track'],
      }),
      name: 'Zero Kelvin Bloom',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'zero_kelvin_key',
          key: { mode: 'minor', tonic: 6 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'zero_kelvin_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 138,
          id: 'zero_kelvin_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createHarmonyEvents(
  voicings: readonly VoicingGesture[],
  melody: readonly MelodyNote[],
): NoteEvent[] {
  const chordEvents = voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `zero_kelvin_voicing_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex * 2, 10),
  })))
  const melodyEvents = melody.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `zero_kelvin_melody_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('zero_kelvin_event_harmony', [
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
      id: `zero_kelvin_drum_seed_${barIndex + 1}_${piece}_${hitIndex + 1}`,
      piece,
      timeTick: barStartTick + (PPQ * beatOffset),
      velocity: velocity(hitIndex, beatOffset),
    })))

    addHits('kick', drumBar.kicks, hitIndex => hitIndex === 0 ? 120 : 88 - ((hitIndex - 1) * 4))
    addHits('snare', [2], () => 108 + ((barIndex % 4) * 2))
    addHits('snare', drumBar.ghostSnares, () => 34 + ((barIndex % 3) * 3))
    addHits('closedHat', drumBar.hats, (hitIndex, beatOffset) => {
      if (beatOffset % 1 === 0) return 52
      if (beatOffset % 0.5 === 0) return 44
      return 34 + ((hitIndex % 3) * 3)
    })
    addHits('lowTom', drumBar.lowToms ?? [], hitIndex => 66 + (hitIndex * 8))
    addHits('openHat', drumBar.openHats ?? [], () => 48)
    addHits('ride', drumBar.rides ?? [], hitIndex => 38 + ((hitIndex % 2) * 4))
  })

  return createDrumHitEvents('zero_kelvin_event_drums', hits)
}
