import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  createBlock,
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

export function neonOrchard(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const eighthNoteTicks = PPQ / 2
  const sixteenthNoteTicks = PPQ / 4
  const chordGapTicks = PPQ / 8
  const bar2 = barTicks
  const bar3 = barTicks * 2
  const bar4 = barTicks * 3
  const bar5 = barTicks * 4
  const bar6 = barTicks * 5
  const bar7 = barTicks * 6
  const bar8 = barTicks * 7
  const chordsColor = '#e64980'
  const bassColor = '#20c997'
  const leadColor = '#7950f2'
  const drumsColor = '#fd7e14'
  const chordsTrack = createTrack({
    accepts: ['note'],
    color: chordsColor,
    id: 'neon_orchard_track_chords',
    instrumentId: 'neon_orchard_chords',
    name: 'Glasshouse Poly',
    role: 'chords',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'neon_orchard_track_bass',
    instrumentId: 'neon_orchard_bass',
    name: 'Root System',
    role: 'bass',
  })
  const leadTrack = createTrack({
    color: leadColor,
    id: 'neon_orchard_track_lead',
    instrumentId: 'neon_orchard_lead',
    name: 'Prismatic Lead',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'neon_orchard_track_drums',
    instrumentId: 'neon_orchard_drums',
    name: 'Chrome Carousel',
    role: 'drums',
  })
  const tracks = [chordsTrack, bassTrack, leadTrack, drumsTrack]

  const chordGestures: readonly ChordGesture[] = [
    // Amaj9: a bright tonic with the ninth exposed at the top.
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [57, 61, 64, 68, 71],
      startTick: 0,
      velocity: 72,
    },
    // E/G#: the common tones keep the opening glide smooth.
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [56, 59, 64, 68, 71],
      startTick: bar2,
      velocity: 68,
    },
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [54, 57, 61, 64, 69],
      startTick: bar3,
      velocity: 72,
    },
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [54, 57, 61, 64, 66],
      startTick: bar4,
      velocity: 74,
    },
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [52, 57, 61, 64, 68],
      startTick: bar5,
      velocity: 76,
    },
    // Dm6 is the borrowed iv from parallel A minor; F natural darkens the loop.
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [53, 57, 59, 62, 65],
      startTick: bar6,
      velocity: 78,
    },
    {
      durationTicks: barTicks - chordGapTicks,
      pitches: [52, 57, 61, 64, 71],
      startTick: bar7,
      velocity: 74,
    },
    {
      durationTicks: (PPQ * 2) - chordGapTicks,
      pitches: [52, 57, 59, 62, 64],
      startTick: bar8,
      velocity: 72,
    },
    {
      durationTicks: (PPQ * 2) - chordGapTicks,
      pitches: [52, 56, 59, 62, 64],
      startTick: bar8 + (PPQ * 2),
      velocity: 78,
    },
  ]
  const bassGestures: readonly NoteGesture[] = [
    { durationTicks: PPQ + eighthNoteTicks, pitch: 45, startTick: 0, velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 52, startTick: PPQ * 2, velocity: 82 },
    { durationTicks: eighthNoteTicks, pitch: 44, startTick: PPQ * 3, velocity: 88 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 44, startTick: bar2, velocity: 100 },
    { durationTicks: eighthNoteTicks, pitch: 47, startTick: bar2 + (PPQ * 2), velocity: 82 },
    { durationTicks: eighthNoteTicks, pitch: 52, startTick: bar2 + (PPQ * 3), velocity: 90 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 42, startTick: bar3, velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 49, startTick: bar3 + (PPQ * 2), velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 52, startTick: bar3 + (PPQ * 3), velocity: 88 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 38, startTick: bar4, velocity: 106 },
    { durationTicks: eighthNoteTicks, pitch: 45, startTick: bar4 + (PPQ * 2), velocity: 82 },
    { durationTicks: eighthNoteTicks, pitch: 49, startTick: bar4 + (PPQ * 3), velocity: 90 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 49, startTick: bar5, velocity: 108 },
    { durationTicks: eighthNoteTicks, pitch: 52, startTick: bar5 + (PPQ * 2), velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 45, startTick: bar5 + (PPQ * 3), velocity: 92 },

    { durationTicks: PPQ, pitch: 38, startTick: bar6, velocity: 108 },
    { durationTicks: eighthNoteTicks, pitch: 45, startTick: bar6 + (PPQ * 3) / 2, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 47, startTick: bar6 + (PPQ * 5) / 2, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 41, startTick: bar6 + (PPQ * 7) / 2, velocity: 96 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 40, startTick: bar7, velocity: 104 },
    { durationTicks: eighthNoteTicks, pitch: 47, startTick: bar7 + (PPQ * 2), velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 49, startTick: bar7 + (PPQ * 3), velocity: 90 },

    { durationTicks: PPQ * 2, pitch: 40, startTick: bar8, velocity: 108 },
    { durationTicks: eighthNoteTicks, pitch: 50, startTick: bar8 + (PPQ * 2), velocity: 84 },
    { durationTicks: eighthNoteTicks, pitch: 44, startTick: bar8 + (PPQ * 3), velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 47, startTick: bar8 + (PPQ * 7) / 2, velocity: 86 },
  ]
  const leadGestures: readonly NoteGesture[] = [
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: eighthNoteTicks, velocity: 82 },
    { durationTicks: PPQ, pitch: 73, startTick: PPQ, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: (PPQ * 5) / 2, velocity: 92 },
    { durationTicks: PPQ - sixteenthNoteTicks, pitch: 73, startTick: PPQ * 3, velocity: 84 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar2, velocity: 82 },
    { durationTicks: PPQ, pitch: 68, startTick: bar2 + eighthNoteTicks, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar2 + (PPQ * 2), velocity: 92 },
    { durationTicks: PPQ, pitch: 71, startTick: bar2 + (PPQ * 5) / 2, velocity: 84 },

    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar3 + eighthNoteTicks, velocity: 84 },
    { durationTicks: PPQ, pitch: 69, startTick: bar3 + PPQ, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar3 + (PPQ * 5) / 2, velocity: 90 },
    { durationTicks: PPQ - sixteenthNoteTicks, pitch: 78, startTick: bar3 + (PPQ * 3), velocity: 96 },

    { durationTicks: PPQ, pitch: 76, startTick: bar4, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar4 + (PPQ * 3) / 2, velocity: 84 },
    { durationTicks: PPQ, pitch: 69, startTick: bar4 + (PPQ * 2), velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar4 + (PPQ * 7) / 2, velocity: 78 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar5 + eighthNoteTicks, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar5 + PPQ, velocity: 90 },
    { durationTicks: PPQ, pitch: 76, startTick: bar5 + (PPQ * 3) / 2, velocity: 94 },
    { durationTicks: PPQ - sixteenthNoteTicks, pitch: 81, startTick: bar5 + (PPQ * 3), velocity: 100 },

    { durationTicks: eighthNoteTicks, pitch: 81, startTick: bar6, velocity: 94 },
    { durationTicks: PPQ, pitch: 77, startTick: bar6 + eighthNoteTicks, velocity: 98 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar6 + (PPQ * 2), velocity: 90 },
    { durationTicks: PPQ, pitch: 71, startTick: bar6 + (PPQ * 5) / 2, velocity: 86 },

    { durationTicks: PPQ, pitch: 73, startTick: bar7, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar7 + (PPQ * 3) / 2, velocity: 94 },
    { durationTicks: PPQ, pitch: 71, startTick: bar7 + (PPQ * 2), velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar7 + (PPQ * 13) / 4, velocity: 82 },

    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar8, velocity: 86 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar8 + eighthNoteTicks, velocity: 82 },
    { durationTicks: PPQ, pitch: 68, startTick: bar8 + PPQ, velocity: 90 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar8 + (PPQ * 5) / 2, velocity: 88 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar8 + (PPQ * 3), velocity: 94 },
    { durationTicks: eighthNoteTicks, pitch: 80, startTick: bar8 + (PPQ * 7) / 2, velocity: 98 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `neon_orchard_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `neon_orchard_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'neon_orchard_section_bloom',
          lengthTicks: barTicks * 4,
          name: 'Day-Glo Bloom',
          startTick: 0,
        }),
        createSection({
          id: 'neon_orchard_section_moon_turn',
          lengthTicks: barTicks * 4,
          name: 'Moonlit Turn',
          startTick: bar5,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        id: 'neon_orchard_chords',
        name: 'Glasshouse Poly',
        soundId: 'keys.default',
      }),
      createThorInstrument({
        id: 'neon_orchard_bass',
        name: 'Root System',
        soundId: 'bass.default',
      }),
      createThorInstrument({
        id: 'neon_orchard_lead',
        name: 'Prismatic Lead',
        soundId: 'sine.soft',
      }),
      createDrumInstrument({
        id: 'neon_orchard_drums',
        name: 'Chrome Carousel',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.06,
            pitchSemitones: 3,
            soundId: 'drums.closedHat.default',
            volumeDb: -11,
          }),
          crash: createDrumPieceSound({
            durationSeconds: 0.52,
            pitchSemitones: 2,
            soundId: 'drums.crash.default',
            volumeDb: -8,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.3,
            pitchSemitones: -3,
            soundId: 'drums.kick.default',
            volumeDb: 7,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.24,
            pitchSemitones: 0,
            soundId: 'drums.lowTom.default',
            volumeDb: -2,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.24,
            pitchSemitones: 2,
            soundId: 'drums.openHat.default',
            volumeDb: -12,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.16,
            pitchSemitones: 2,
            soundId: 'drums.snare.default',
            volumeDb: -3,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: chordsTrack.mixChannelId, pan: -0.2, volumeDb: -3 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: -12 }),
        createMixChannel({ id: leadTrack.mixChannelId, pan: 0.22, volumeDb: 0 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0, volumeDb: 3 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createChordEvents('neon_orchard_event_chords', chordGestures),
        id: 'neon_orchard_pattern_chords',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar six borrows Dm6 (iv6) from parallel A minor.',
          progression: 'Amaj9 · E/G# · F#m7 · Dmaj9 · A/C# · Dm6 · A/E · E7sus4 → E7',
        },
        name: 'Glasshouse Changes',
      }),
      createPattern({
        events: createNoteEvents('neon_orchard_event_bass', bassGestures),
        id: 'neon_orchard_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Syncopated roots and approach tones trace the chromatic C#–D–E turn.',
        },
        name: 'Root System Pulse',
      }),
      createPattern({
        events: createNoteEvents('neon_orchard_event_lead', leadGestures),
        id: 'neon_orchard_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'A rising B–C#–E cell returns with F natural over the borrowed iv chord.',
        },
        name: 'Prismatic Hook',
      }),
      createPattern({
        events: createDrumEvents(barTicks, eighthNoteTicks),
        id: 'neon_orchard_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'bright four-on-the-floor pulse with an eighth-note chrome shimmer',
        },
        name: 'Chrome Carousel Beat',
      }),
    ]),
    project: createProject({
      id: 'project_neon_orchard',
      metadata: createProjectMetadata({
        description: 'An original eight-bar psychedelic synth-pop loop with a day-glo hook and a minor-key shadow in bar six.',
        tags: ['psychedelic', 'synth-pop', 'modal-interchange', 'four-on-the-floor'],
      }),
      name: 'Neon Orchard',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'neon_orchard_key',
          key: { mode: 'major', tonic: 9 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'neon_orchard_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 112,
          id: 'neon_orchard_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createChordEvents(
  id: string,
  gestures: readonly ChordGesture[],
): NoteEvent[] {
  return gestures.flatMap((gesture, gestureIndex) => gesture.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: gesture.durationTicks,
    id: `${id}_${gestureIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: gesture.startTick,
    velocity: gesture.velocity - (pitchIndex * 2),
  })))
}

function createNoteEvents(
  id: string,
  gestures: readonly NoteGesture[],
): NoteEvent[] {
  return gestures.map((gesture, index) => createNoteEvent({
    durationTicks: gesture.durationTicks,
    id: `${id}_${index + 1}`,
    pitch: gesture.pitch,
    timeTick: gesture.startTick,
    velocity: gesture.velocity,
  }))
}

function createDrumEvents(
  barTicks: number,
  eighthNoteTicks: number,
): DrumHitEvent[] {
  const events: DrumHitEvent[] = []
  let eventIndex = 0
  const addHit = (piece: DrumPiece, timeTick: number, velocity: number) => {
    eventIndex += 1
    events.push(createDrumHitEvent({
      id: `neon_orchard_event_drums_${eventIndex}`,
      piece,
      timeTick,
      velocity,
    }))
  }

  for (let barIndex = 0; barIndex < 8; barIndex += 1) {
    const barStartTick = barIndex * barTicks

    for (let beatIndex = 0; beatIndex < 4; beatIndex += 1) {
      addHit('kick', barStartTick + (beatIndex * PPQ), beatIndex === 0 ? 112 : 98)
    }

    addHit('snare', barStartTick + PPQ, 94)
    addHit('snare', barStartTick + (PPQ * 3), barIndex >= 4 ? 104 : 98)

    for (let eighthIndex = 0; eighthIndex < 8; eighthIndex += 1) {
      const isOpenHat = eighthIndex === 7 && (barIndex === 3 || barIndex === 5)
      addHit(
        isOpenHat ? 'openHat' : 'closedHat',
        barStartTick + (eighthIndex * eighthNoteTicks),
        eighthIndex % 2 === 0 ? 42 : 58,
      )
    }

    if (barIndex === 2 || barIndex === 6) {
      addHit('kick', barStartTick + (PPQ * 7) / 2, 88)
    }
  }

  addHit('crash', barTicks * 4, 74)
  addHit('lowTom', (barTicks * 8) - PPQ, 76)
  addHit('lowTom', (barTicks * 8) - (PPQ / 2), 88)
  addHit('lowTom', (barTicks * 8) - (PPQ / 4), 104)

  return events
}
