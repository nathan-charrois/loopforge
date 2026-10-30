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
  type DelayEffect,
  type DrumHitEvent,
  type DrumPiece,
  type Effect,
  type Instrument,
  type MidiNote,
  type NoteEvent,
  PPQ,
  type ReverbEffect,
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
  const melodyColor = '#4dabf7'
  const atmosphereColor = '#74c0fc'
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
  const melodyTrack = createTrack({
    color: melodyColor,
    id: 'fifth_floor_rain_track_balcony_light',
    instrumentId: 'fifth_floor_rain_balcony_light',
    name: 'Balcony Light',
    role: 'melody',
  })
  const atmosphereTrack = createTrack({
    accepts: ['note'],
    color: atmosphereColor,
    id: 'fifth_floor_rain_track_hallway_mist',
    instrumentId: 'fifth_floor_rain_hallway_mist',
    name: 'Hallway Mist',
    role: 'chords',
  })
  const tracks = [drumsTrack, rhodesTrack, melodyTrack, atmosphereTrack]
  const melodyCompressor: CompressorEffect = {
    attackSeconds: 0.025,
    enabled: true,
    id: 'fifth_floor_rain_effect_melody_compressor',
    kneeDb: 16,
    kind: 'compressor',
    name: 'Balcony Light Leveling',
    ratio: 3,
    releaseSeconds: 0.24,
    thresholdDb: -22,
  }
  const melodyReverb: ReverbEffect = {
    decaySeconds: 2.8,
    enabled: true,
    id: 'fifth_floor_rain_effect_melody_reverb',
    kind: 'reverb',
    name: 'Balcony Reflections',
    preDelaySeconds: 0.045,
    wet: 0.24,
  }
  const atmosphereCompressor: CompressorEffect = {
    attackSeconds: 0.008,
    enabled: true,
    id: 'fifth_floor_rain_effect_atmosphere_compressor',
    kneeDb: 10,
    kind: 'compressor',
    name: 'Stairwell Breathing',
    ratio: 7,
    releaseSeconds: 0.42,
    sidechainSourceMixChannelId: drumsTrack.mixChannelId,
    thresholdDb: -30,
  }
  const atmosphereDelay: DelayEffect = {
    delaySeconds: 0.385,
    enabled: true,
    feedback: 0.22,
    id: 'fifth_floor_rain_effect_atmosphere_delay',
    kind: 'delay',
    name: 'Five-Floor Echo',
    wet: 0.14,
  }
  const atmosphereReverb: ReverbEffect = {
    decaySeconds: 5.2,
    enabled: true,
    id: 'fifth_floor_rain_effect_atmosphere_reverb',
    kind: 'reverb',
    name: 'Empty Hallway',
    preDelaySeconds: 0.075,
    wet: 0.46,
  }
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
  const balconyMelody: readonly MelodyNote[] = [
    { durationTicks: PPQ + eighthNoteTicks, pitch: 75, startTick: bar(1) + eighthNoteTicks, velocity: 76 },
    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(1) + (PPQ * 5) / 2, velocity: 70 },
    { durationTicks: PPQ + chordGapTicks, pitch: 80, startTick: bar(1) + (PPQ * 7) / 2, velocity: 78 },

    { durationTicks: PPQ, pitch: 82, startTick: bar(2), velocity: 80 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 80, startTick: bar(2) + (PPQ * 3) / 2, velocity: 74 },
    { durationTicks: PPQ + chordGapTicks, pitch: 77, startTick: bar(2) + (PPQ * 7) / 2, velocity: 70 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 80, startTick: bar(3) + eighthNoteTicks, velocity: 76 },
    { durationTicks: PPQ, pitch: 77, startTick: bar(3) + (PPQ * 5) / 2, velocity: 72 },
    { durationTicks: PPQ + chordGapTicks, pitch: 75, startTick: bar(3) + (PPQ * 15) / 4, velocity: 68 },

    { durationTicks: PPQ, pitch: 82, startTick: bar(4), velocity: 80 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 80, startTick: bar(4) + (PPQ * 3) / 2, velocity: 74 },
    { durationTicks: PPQ + chordGapTicks, pitch: 72, startTick: bar(4) + (PPQ * 7) / 2, velocity: 66 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 77, startTick: bar(5) + eighthNoteTicks, velocity: 74 },
    { durationTicks: eighthNoteTicks, pitch: 82, startTick: bar(5) + (PPQ * 5) / 2, velocity: 82 },
    { durationTicks: PPQ + chordGapTicks, pitch: 85, startTick: bar(5) + (PPQ * 7) / 2, velocity: 86 },

    { durationTicks: PPQ, pitch: 81, startTick: bar(6), velocity: 78 },
    { durationTicks: PPQ, pitch: 85, startTick: bar(6) + (PPQ * 3) / 2, velocity: 84 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 88, startTick: bar(6) + (PPQ * 3), velocity: 88 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 87, startTick: bar(7) + eighthNoteTicks, velocity: 84 },
    { durationTicks: PPQ, pitch: 84, startTick: bar(7) + (PPQ * 5) / 2, velocity: 78 },
    { durationTicks: PPQ + chordGapTicks, pitch: 82, startTick: bar(7) + (PPQ * 15) / 4, velocity: 74 },

    { durationTicks: PPQ, pitch: 89, startTick: bar(8), velocity: 88 },
    { durationTicks: PPQ, pitch: 87, startTick: bar(8) + (PPQ * 3) / 2, velocity: 82 },
    { durationTicks: PPQ * 2, pitch: 85, startTick: bar(8) + (PPQ * 3), velocity: 76 },
  ]
  const atmosphereVoicings: readonly VoicingGesture[] = [
    { durationTicks: barTicks - chordGapTicks, pitches: [34, 46, 53, 58, 61, 65, 70], startTick: 0, velocity: 34 },
    { durationTicks: barTicks - chordGapTicks, pitches: [44, 56, 58, 61, 63, 65, 70], startTick: bar(2), velocity: 36 },
    { durationTicks: barTicks - chordGapTicks, pitches: [41, 53, 56, 60, 63, 68, 73], startTick: bar(3), velocity: 35 },
    { durationTicks: barTicks - chordGapTicks, pitches: [42, 54, 58, 61, 65, 68, 72], startTick: bar(4), velocity: 37 },
    { durationTicks: barTicks - chordGapTicks, pitches: [46, 53, 58, 61, 65, 70, 73], startTick: bar(5), velocity: 38 },
    { durationTicks: barTicks - chordGapTicks, pitches: [42, 52, 57, 61, 64, 68, 73], startTick: bar(6), velocity: 34 },
    { durationTicks: barTicks - chordGapTicks, pitches: [44, 54, 58, 60, 64, 70, 75], startTick: bar(7), velocity: 37 },
    { durationTicks: barTicks - chordGapTicks, pitches: [37, 49, 56, 61, 65, 68, 73, 77], startTick: bar(8), velocity: 40 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: drumsTrack.color,
          id: 'fifth_floor_rain_block_drums',
          lengthTicks: totalTicks,
          name: drumsTrack.name,
          patternId: 'fifth_floor_rain_pattern_drums',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: rhodesTrack.color,
          id: 'fifth_floor_rain_block_melody',
          lengthTicks: totalTicks,
          name: rhodesTrack.name,
          patternId: 'fifth_floor_rain_pattern_melody',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: rhodesTrack.id,
        }),
        createBlock({
          color: melodyTrack.color,
          id: 'fifth_floor_rain_block_balcony_light',
          lengthTicks: totalTicks,
          name: melodyTrack.name,
          patternId: 'fifth_floor_rain_pattern_balcony_light',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: melodyTrack.id,
        }),
        createBlock({
          color: atmosphereTrack.color,
          id: 'fifth_floor_rain_block_hallway_mist',
          lengthTicks: totalTicks,
          name: atmosphereTrack.name,
          patternId: 'fifth_floor_rain_pattern_hallway_mist',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: atmosphereTrack.id,
        }),
      ],
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
    effects: createEntityStore<Effect>([
      melodyCompressor,
      melodyReverb,
      atmosphereCompressor,
      atmosphereDelay,
      atmosphereReverb,
    ]),
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
        oscillators: [
          createSynthOscillator({ level: 0.64, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -5, level: 0.24, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 6, level: 0.12, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        effectIds: [melodyCompressor.id, melodyReverb.id],
        envelope: {
          attack: 0.028,
          decay: 0.72,
          release: 1.9,
          sustain: 0.58,
        },
        filter: {
          cutoffHz: 2900,
          resonance: 3.4,
          type: 'lowpass',
        },
        id: melodyTrack.instrumentId,
        name: 'Balcony Light Lead',
        oscillators: [
          createSynthOscillator({ level: 0.52, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -7, level: 0.3, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 8, level: 0.14, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'lead.balcony-light',
      }),
      createThorInstrument({
        effectIds: [
          atmosphereCompressor.id,
          atmosphereDelay.id,
          atmosphereReverb.id,
        ],
        envelope: {
          attack: 1.6,
          decay: 2.4,
          release: 5.5,
          sustain: 0.76,
        },
        filter: {
          cutoffHz: 1150,
          resonance: 1.8,
          type: 'lowpass',
        },
        id: atmosphereTrack.instrumentId,
        name: 'Hallway Mist Pad',
        oscillators: [
          createSynthOscillator({ level: 0.38, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -12, level: 0.24, octave: 1, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 11, level: 0.18, octave: -1, waveform: 'sine' }),
        ],
        soundId: 'pad.hallway-mist',
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.08, volumeDb: -1 }),
        createMixChannel({ id: rhodesTrack.mixChannelId, pan: -0.08, volumeDb: -7 }),
        createMixChannel({ id: melodyTrack.mixChannelId, pan: 0.24, volumeDb: -11 }),
        createMixChannel({ id: atmosphereTrack.mixChannelId, pan: -0.28, volumeDb: -20 }),
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
      createPattern({
        events: createMelodyEvents('fifth_floor_rain_event_balcony_light', balconyMelody),
        id: 'fifth_floor_rain_pattern_balcony_light',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          contour: 'A patient line rises from Eb through Ab and Bb, reaches a high F over the borrowed chord, then descends into Db.',
          phrasing: 'Long tones and half-beat entrances float across the underlying 3+2 pulse instead of doubling the Rhodes raindrops.',
        },
        name: 'Balcony Light',
      }),
      createPattern({
        events: createAtmosphereEvents(atmosphereVoicings),
        id: 'fifth_floor_rain_pattern_hallway_mist',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          dynamics: 'Very low-velocity sustained voicings sit at -20 dB and breathe beneath the drum channel through sidechain compression.',
          texture: 'Slow sine and triangle partials feed a quiet eighth-note echo and long hallway reverb.',
        },
        name: 'Hallway Mist',
      }),
    ]),
    project: createProject({
      id: 'project_fifth_floor_rain',
      metadata: createProjectMetadata({
        description: 'An eight-bar lo-fi piece in 5/4, pairing a loose drum pocket and warm Rhodes with a lyrical balcony melody and a quietly sidechained hallway atmosphere.',
        tags: ['5/4', 'atmospheric', 'chill', 'lo-fi', 'modal-interchange', 'rhodes'],
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

function createMelodyEvents(id: string, melody: readonly MelodyNote[]): NoteEvent[] {
  const notes = melody.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `${id}_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents(id, notes)
}

function createAtmosphereEvents(voicings: readonly VoicingGesture[]): NoteEvent[] {
  const notes = voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `fifth_floor_rain_atmosphere_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex, 6),
  })))

  return createNoteEvents('fifth_floor_rain_event_hallway_mist', notes)
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
