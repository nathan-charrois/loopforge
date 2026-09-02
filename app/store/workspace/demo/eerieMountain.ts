import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  createBlock,
  createChordEvent,
  createChordSymbol,
  createDrumHitEvent,
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

type DrumHitSeed = {
  bar: number
  eighth: number
  piece: DrumPiece
  velocity: number
}

type NoteSeed = {
  bar: number
  durationEighths: number
  eighth: number
  pitch: MidiNote
  velocity: number
}

export function eerieMountain(): Workspace {
  const eighthNoteTicks = PPQ / 2
  const barTicks = eighthNoteTicks * 6
  const halfBarTicks = barTicks / 2
  const chordGapTicks = PPQ / 8
  const patternTicks = barTicks * 4
  const totalTicks = patternTicks * 2
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const chordsColor = '#7950f2'
  const melodyColor = '#4dabf7'
  const drumsColor = '#fd7e14'
  const chordsTrack = createTrack({
    accepts: ['chord'],
    color: chordsColor,
    id: 'eerie_mountain_track_chords',
    instrumentId: 'eerie_mountain_harmonium',
    name: 'Weathered Harmonium',
    role: 'chords',
  })
  const melodyTrack = createTrack({
    color: melodyColor,
    id: 'eerie_mountain_track_melody',
    instrumentId: 'eerie_mountain_signal',
    name: 'Signal Through the Pines',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'eerie_mountain_track_drums',
    instrumentId: 'eerie_mountain_drums',
    name: 'Distant Floorboards',
    role: 'drums',
  })

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: chordsTrack.color,
          id: 'eerie_mountain_block_chords_ridge',
          lengthTicks: patternTicks,
          name: 'Clouds Below the Ridge',
          patternId: 'eerie_mountain_pattern_chords_ridge',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: chordsTrack.id,
        }),
        createBlock({
          color: chordsTrack.color,
          id: 'eerie_mountain_block_chords_snow',
          lengthTicks: patternTicks,
          name: 'Snow in the Doorway',
          patternId: 'eerie_mountain_pattern_chords_snow',
          playbackMode: 'oneShot',
          startTick: patternTicks,
          trackId: chordsTrack.id,
        }),
        createBlock({
          color: melodyTrack.color,
          id: 'eerie_mountain_block_melody',
          lengthTicks: totalTicks,
          name: 'The Path Remembers',
          patternId: 'eerie_mountain_pattern_melody',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: melodyTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'eerie_mountain_block_drums_ridge',
          lengthTicks: patternTicks,
          name: 'Footsteps Under Fog',
          patternId: 'eerie_mountain_pattern_drums_ridge',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsTrack.color,
          id: 'eerie_mountain_block_drums_snow',
          lengthTicks: patternTicks,
          name: 'Timber Settling',
          patternId: 'eerie_mountain_pattern_drums_snow',
          playbackMode: 'oneShot',
          startTick: patternTicks,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'eerie_mountain_section_ridge',
          lengthTicks: patternTicks,
          name: 'Clouds Below the Ridge',
          startTick: 0,
        }),
        createSection({
          id: 'eerie_mountain_section_snow',
          lengthTicks: patternTicks,
          name: 'Snow in the Doorway',
          startTick: patternTicks,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.03,
          decay: 0.2,
          release: 0.5,
          sustain: 0.62,
        },
        filter: {
          cutoffHz: 1750,
          resonance: 1.4,
          type: 'lowpass',
        },
        id: 'eerie_mountain_harmonium',
        name: 'Weathered Harmonium',
        oscillators: [
          createSynthOscillator({ detuneCents: -7, level: 0.52, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 5, level: 0.3, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 2, level: 0.12, octave: -1, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -3, level: 0.06, octave: 1, waveform: 'triangle' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.015,
          decay: 0.72,
          release: 1.35,
          sustain: 0.2,
        },
        filter: {
          cutoffHz: 2650,
          resonance: 2.2,
          type: 'lowpass',
        },
        id: 'eerie_mountain_signal',
        name: 'Signal Through the Pines',
        oscillators: [
          createSynthOscillator({ detuneCents: -5, level: 0.58, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 6, level: 0.3, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -2, level: 0.12, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'sine.soft',
      }),
      createDrumInstrument({
        id: 'eerie_mountain_drums',
        name: 'Distant Floorboards',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.06,
            pitchSemitones: -4,
            soundId: 'drums.closedHat.default',
            volumeDb: -18,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.5,
            pitchSemitones: -7,
            soundId: 'drums.kick.default',
            volumeDb: 11,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.42,
            pitchSemitones: -5,
            soundId: 'drums.lowTom.default',
            volumeDb: 7,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.24,
            pitchSemitones: -3,
            soundId: 'drums.snare.default',
            volumeDb: 3,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: chordsTrack.mixChannelId, pan: -0.08, volumeDb: 2 }),
        createMixChannel({ id: melodyTrack.mixChannelId, pan: 0.16, volumeDb: 3 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.12, volumeDb: 12 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['7', '9'],
              quality: 'minor',
              root: 4,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_ridge_1',
            playback: { gate: 0.94, recipeId: 'block' },
            timeTick: bar(1),
            velocity: 58,
            voicing: { bassNote: 11, octave: 3, register: 'mid', type: 'closed' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['#11'],
              extensions: ['maj7'],
              quality: 'major',
              root: 0,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_ridge_2',
            playback: { gate: 0.94, recipeId: 'block' },
            timeTick: bar(2),
            velocity: 56,
            voicing: { bassNote: 7, octave: 3, register: 'mid', type: 'closed' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['6', '9'],
              quality: 'major',
              root: 7,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_ridge_3',
            playback: { gate: 0.94, recipeId: 'block' },
            timeTick: bar(3),
            velocity: 60,
            voicing: { bassNote: 2, octave: 3, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['7', '11'],
              quality: 'minor',
              root: 9,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_ridge_4',
            playback: { gate: 0.94, recipeId: 'block' },
            timeTick: bar(4),
            velocity: 58,
            voicing: { bassNote: 4, octave: 3, register: 'mid', type: 'drop2' },
          }),
        ],
        id: 'eerie_mountain_pattern_chords_ridge',
        kind: 'chord',
        lengthTicks: patternTicks,
        metadata: {
          progression: 'Em9/B · Cmaj7(#11)/G · G6/9/D · Am11/E',
          voicing: 'Low pedal tones support wide, sustained upper voices.',
        },
        name: 'Clouds Below the Ridge',
      }),
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['7', '11'],
              quality: 'minor',
              root: 4,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_snow_1',
            playback: { gate: 0.95, recipeId: 'block' },
            timeTick: bar(1),
            velocity: 62,
            voicing: { bassNote: 7, octave: 3, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['#11'],
              extensions: ['maj7'],
              quality: 'major',
              root: 5,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_snow_2',
            playback: { gate: 0.95, recipeId: 'block' },
            timeTick: bar(2),
            velocity: 64,
            voicing: { bassNote: 0, octave: 3, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['maj7', '9'],
              quality: 'major',
              root: 0,
            }),
            durationTicks: barTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_snow_3',
            playback: { gate: 0.95, recipeId: 'block' },
            timeTick: bar(3),
            velocity: 60,
            voicing: { bassNote: 7, octave: 3, register: 'mid', type: 'closed' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'sus4',
              root: 11,
            }),
            durationTicks: halfBarTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_snow_4',
            playback: { gate: 0.94, recipeId: 'block' },
            timeTick: bar(4),
            velocity: 62,
            voicing: { bassNote: 6, octave: 3, register: 'mid', type: 'drop2' },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'major',
              root: 11,
            }),
            durationTicks: halfBarTicks - chordGapTicks,
            id: 'eerie_mountain_event_chords_snow_5',
            playback: { gate: 0.96, recipeId: 'block' },
            timeTick: bar(4) + halfBarTicks,
            velocity: 66,
            voicing: { bassNote: 6, octave: 3, register: 'mid', type: 'drop2' },
          }),
        ],
        id: 'eerie_mountain_pattern_chords_snow',
        kind: 'chord',
        lengthTicks: patternTicks,
        metadata: {
          modalInterchange: 'Bar six borrows Fmaj7(#11), the flat-II color from E Phrygian.',
          progression: 'Em11/G · Fmaj7(#11)/C · Cmaj9/G · B7sus4(b9)/F# → B7(b9)/F#',
        },
        name: 'Snow in the Doorway',
      }),
      createPattern({
        events: createNotePatternEvents('eerie_mountain_event_melody', barTicks, eighthNoteTicks, [
          // The five-note call returns in bar five, so the second half feels remembered rather than repeated.
          { bar: 1, durationEighths: 0.75, eighth: 0, pitch: 71, velocity: 74 },
          { bar: 1, durationEighths: 0.75, eighth: 1, pitch: 76, velocity: 82 },
          { bar: 1, durationEighths: 1, eighth: 2.5, pitch: 79, velocity: 88 },
          { bar: 1, durationEighths: 0.5, eighth: 4, pitch: 78, velocity: 78 },
          { bar: 1, durationEighths: 1, eighth: 5, pitch: 76, velocity: 84 },

          { bar: 2, durationEighths: 1, eighth: 0, pitch: 71, velocity: 76 },
          { bar: 2, durationEighths: 1, eighth: 1, pitch: 74, velocity: 80 },
          { bar: 2, durationEighths: 1, eighth: 2, pitch: 76, velocity: 84 },
          { bar: 2, durationEighths: 1.5, eighth: 3, pitch: 71, velocity: 74 },
          { bar: 2, durationEighths: 1, eighth: 5, pitch: 67, velocity: 72 },

          { bar: 3, durationEighths: 0.75, eighth: 0, pitch: 71, velocity: 76 },
          { bar: 3, durationEighths: 0.75, eighth: 1, pitch: 74, velocity: 82 },
          { bar: 3, durationEighths: 1, eighth: 2.5, pitch: 76, velocity: 86 },
          { bar: 3, durationEighths: 0.5, eighth: 4, pitch: 74, velocity: 76 },
          { bar: 3, durationEighths: 1, eighth: 5, pitch: 71, velocity: 80 },

          { bar: 4, durationEighths: 1, eighth: 0, pitch: 69, velocity: 74 },
          { bar: 4, durationEighths: 1, eighth: 1, pitch: 72, velocity: 80 },
          { bar: 4, durationEighths: 1, eighth: 2, pitch: 76, velocity: 86 },
          { bar: 4, durationEighths: 1, eighth: 3, pitch: 74, velocity: 80 },
          { bar: 4, durationEighths: 0.5, eighth: 4, pitch: 71, velocity: 76 },
          { bar: 4, durationEighths: 1, eighth: 5, pitch: 69, velocity: 72 },

          { bar: 5, durationEighths: 0.75, eighth: 0, pitch: 71, velocity: 76 },
          { bar: 5, durationEighths: 0.75, eighth: 1, pitch: 76, velocity: 84 },
          { bar: 5, durationEighths: 1, eighth: 2.5, pitch: 79, velocity: 90 },
          { bar: 5, durationEighths: 0.5, eighth: 4, pitch: 78, velocity: 80 },
          { bar: 5, durationEighths: 1, eighth: 5, pitch: 76, velocity: 86 },

          { bar: 6, durationEighths: 1, eighth: 0, pitch: 71, velocity: 78 },
          { bar: 6, durationEighths: 1, eighth: 1, pitch: 72, velocity: 82 },
          { bar: 6, durationEighths: 1, eighth: 2, pitch: 76, velocity: 86 },
          { bar: 6, durationEighths: 1.5, eighth: 3, pitch: 71, velocity: 76 },
          { bar: 6, durationEighths: 1, eighth: 5, pitch: 69, velocity: 74 },

          { bar: 7, durationEighths: 0.75, eighth: 0, pitch: 67, velocity: 74 },
          { bar: 7, durationEighths: 0.75, eighth: 1, pitch: 72, velocity: 80 },
          { bar: 7, durationEighths: 1, eighth: 2.5, pitch: 76, velocity: 86 },
          { bar: 7, durationEighths: 0.5, eighth: 4, pitch: 74, velocity: 78 },
          { bar: 7, durationEighths: 1, eighth: 5, pitch: 71, velocity: 82 },

          { bar: 8, durationEighths: 1, eighth: 0, pitch: 66, velocity: 76 },
          { bar: 8, durationEighths: 0.75, eighth: 1, pitch: 71, velocity: 82 },
          { bar: 8, durationEighths: 0.75, eighth: 2, pitch: 72, velocity: 86 },
          { bar: 8, durationEighths: 1, eighth: 3, pitch: 69, velocity: 78 },
          { bar: 8, durationEighths: 0.75, eighth: 4, pitch: 75, velocity: 90 },
          { bar: 8, durationEighths: 0.75, eighth: 5, pitch: 71, velocity: 84 },
        ]),
        id: 'eerie_mountain_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          hook: 'B–E–G–F#–E returns over Em, while each answer follows the changing harmony.',
          shape: 'Short-short-long gestures leave pockets for the backbeat and make the phrase easy to remember.',
        },
        name: 'The Path Remembers',
      }),
      createPattern({
        events: createDrumPatternEvents('eerie_mountain_event_drums_ridge', barTicks, eighthNoteTicks, [
          ...createSixEightHatPulse([
            [38, 22, 28, 42, 24, 30],
            [36, 20, 27, 40, 23, 32],
            [40, 23, 30, 44, 25, 34],
            [42, 24, 32, 46, 28, 36],
          ]),
          { bar: 1, eighth: 0, piece: 'kick', velocity: 104 },
          { bar: 1, eighth: 2, piece: 'lowTom', velocity: 68 },
          { bar: 1, eighth: 3, piece: 'snare', velocity: 88 },
          { bar: 1, eighth: 5, piece: 'kick', velocity: 74 },
          { bar: 2, eighth: 0, piece: 'kick', velocity: 100 },
          { bar: 2, eighth: 2, piece: 'kick', velocity: 70 },
          { bar: 2, eighth: 2.75, piece: 'snare', velocity: 32 },
          { bar: 2, eighth: 3, piece: 'snare', velocity: 86 },
          { bar: 2, eighth: 4.5, piece: 'lowTom', velocity: 64 },
          { bar: 3, eighth: 0, piece: 'kick', velocity: 106 },
          { bar: 3, eighth: 1, piece: 'lowTom', velocity: 56 },
          { bar: 3, eighth: 2, piece: 'lowTom', velocity: 72 },
          { bar: 3, eighth: 3, piece: 'snare', velocity: 90 },
          { bar: 3, eighth: 5, piece: 'kick', velocity: 76 },
          { bar: 4, eighth: 0, piece: 'kick', velocity: 102 },
          { bar: 4, eighth: 2, piece: 'lowTom', velocity: 70 },
          { bar: 4, eighth: 2.75, piece: 'snare', velocity: 34 },
          { bar: 4, eighth: 3, piece: 'snare', velocity: 92 },
          { bar: 4, eighth: 4, piece: 'lowTom', velocity: 68 },
          { bar: 4, eighth: 5, piece: 'lowTom', velocity: 78 },
        ]),
        id: 'eerie_mountain_pattern_drums_ridge',
        kind: 'drum',
        lengthTicks: patternTicks,
        metadata: {
          feel: 'A low, breathing 6/8 groove with a steady backbeat and soft pre-snare flams.',
        },
        name: 'Footsteps Under Fog',
      }),
      createPattern({
        events: createDrumPatternEvents('eerie_mountain_event_drums_snow', barTicks, eighthNoteTicks, [
          ...createSixEightHatPulse([
            [42, 25, 32, 46, 28, 36],
            [44, 26, 34, 48, 30, 38],
            [46, 28, 35, 50, 30, 40],
            [48, 28, 38, 52, 34, 44],
          ]),
          { bar: 1, eighth: 0, piece: 'kick', velocity: 108 },
          { bar: 1, eighth: 2, piece: 'lowTom', velocity: 74 },
          { bar: 1, eighth: 3, piece: 'snare', velocity: 94 },
          { bar: 1, eighth: 5, piece: 'kick', velocity: 82 },
          { bar: 2, eighth: 0, piece: 'kick', velocity: 108 },
          { bar: 2, eighth: 2, piece: 'kick', velocity: 76 },
          { bar: 2, eighth: 2.75, piece: 'snare', velocity: 36 },
          { bar: 2, eighth: 3, piece: 'snare', velocity: 94 },
          { bar: 2, eighth: 4, piece: 'lowTom', velocity: 68 },
          { bar: 2, eighth: 5, piece: 'lowTom', velocity: 78 },
          { bar: 3, eighth: 0, piece: 'kick', velocity: 112 },
          { bar: 3, eighth: 1, piece: 'lowTom', velocity: 62 },
          { bar: 3, eighth: 2, piece: 'lowTom', velocity: 78 },
          { bar: 3, eighth: 3, piece: 'snare', velocity: 98 },
          { bar: 3, eighth: 4.5, piece: 'kick', velocity: 72 },
          { bar: 3, eighth: 5, piece: 'kick', velocity: 84 },
          { bar: 4, eighth: 0, piece: 'kick', velocity: 110 },
          { bar: 4, eighth: 2, piece: 'lowTom', velocity: 76 },
          { bar: 4, eighth: 2.75, piece: 'snare', velocity: 38 },
          { bar: 4, eighth: 3, piece: 'snare', velocity: 100 },
          { bar: 4, eighth: 4, piece: 'lowTom', velocity: 82 },
          { bar: 4, eighth: 5, piece: 'lowTom', velocity: 92 },
        ]),
        id: 'eerie_mountain_pattern_drums_snow',
        kind: 'drum',
        lengthTicks: patternTicks,
        metadata: {
          feel: 'The same live-kit motif grows heavier and closes with a rising floor-tom answer.',
        },
        name: 'Timber Settling',
      }),
    ]),
    project: createProject({
      id: 'project_eerie_mountain',
      metadata: createProjectMetadata({
        description: 'An original eight-bar 6/8 lament with weathered harmonium, a recurring signal melody, and distant live drums.',
        tags: ['slowcore', 'indie-folk', 'melancholic', 'six-eight', 'modal-interchange', 'melodic'],
      }),
      name: 'Eerie Mountain',
    }),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({
          id: 'eerie_mountain_key',
          key: { mode: 'minor', tonic: 4 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'eerie_mountain_meter',
          tick: 0,
          timeSignature: { denominator: 8, numerator: 6 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 72,
          id: 'eerie_mountain_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore([chordsTrack, melodyTrack, drumsTrack]),
  })
}

function createDrumPatternEvents(
  id: string,
  barTicks: number,
  eighthNoteTicks: number,
  hits: readonly DrumHitSeed[],
): DrumHitEvent[] {
  return hits.map((hit, index) => createDrumHitEvent({
    id: `${id}_${index + 1}`,
    piece: hit.piece,
    timeTick: ((hit.bar - 1) * barTicks) + (hit.eighth * eighthNoteTicks),
    velocity: hit.velocity,
  }))
}

function createNotePatternEvents(
  id: string,
  barTicks: number,
  eighthNoteTicks: number,
  notes: readonly NoteSeed[],
): NoteEvent[] {
  return notes.map((note, index) => createNoteEvent({
    durationTicks: note.durationEighths * eighthNoteTicks,
    id: `${id}_${index + 1}`,
    pitch: note.pitch,
    timeTick: ((note.bar - 1) * barTicks) + (note.eighth * eighthNoteTicks),
    velocity: note.velocity,
  }))
}

function createSixEightHatPulse(
  velocitiesByBar: readonly (readonly number[])[],
): DrumHitSeed[] {
  return velocitiesByBar.flatMap((velocities, barIndex) => velocities.map((velocity, eighth) => ({
    bar: barIndex + 1,
    eighth,
    piece: 'closedHat',
    velocity,
  })))
}
