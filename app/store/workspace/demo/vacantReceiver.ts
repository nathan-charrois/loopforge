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
  { hats: [2, 6], kicks: [0], pulse: 'closedHat', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 5], pulse: 'closedHat', snares: [4] },
  { hats: [0, 1, 2, 3, 4, 5, 6, 7], kicks: [0, 3, 6], pulse: 'closedHat', snares: [4] },
  { hats: [0, 1, 2, 3, 4, 5, 6, 7], kicks: [0, 6.5], lowToms: [7], pulse: 'closedHat', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 3, 6], pulse: 'ride', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 5], pulse: 'ride', snares: [4] },
  { hats: [0, 6], kicks: [0], lowToms: [5], pulse: 'ride', snares: [4] },
  { hats: [0, 1, 2, 3, 4, 5, 6, 7], kicks: [0, 3, 6], lowToms: [6.5, 7, 7.5], pulse: 'closedHat', snares: [4] },
]

export function vacantReceiver(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const eighthNoteTicks = PPQ / 2
  const noteGapTicks = PPQ / 10
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const guitarColor = '#7950f2'
  const leadColor = '#4dabf7'
  const bassColor = '#2f9e44'
  const drumsColor = '#e67700'
  const guitarTrack = createTrack({
    accepts: ['note'],
    color: guitarColor,
    id: 'vacant_receiver_track_guitar',
    instrumentId: 'vacant_receiver_guitar',
    name: 'Oxide Guitar',
    role: 'chords',
  })
  const leadTrack = createTrack({
    color: leadColor,
    id: 'vacant_receiver_track_lead',
    instrumentId: 'vacant_receiver_lead',
    name: 'Hallway Harmonics',
    role: 'melody',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'vacant_receiver_track_bass',
    instrumentId: 'vacant_receiver_bass',
    name: 'Basement Wire',
    role: 'bass',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'vacant_receiver_track_drums',
    instrumentId: 'vacant_receiver_drums',
    name: 'Half-Awake Kit',
    role: 'drums',
  })
  const tracks = [guitarTrack, leadTrack, bassTrack, drumsTrack]
  const voicings: readonly VoicingGesture[] = [
    // Am(add9)/E: the fifth in the floor and a close B-C rub establish the unease.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [40, 45, 52, 59, 60, 64, 69],
      startTick: bar(1),
      velocity: 64,
    },
    // Fmaj7(#11)/C keeps E and B ringing while the lower shell falls by step.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [36, 41, 48, 52, 57, 59, 64],
      startTick: bar(2),
      velocity: 60,
    },
    // Cmaj9/G opens the middle without releasing the shared B-E upper frame.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 48, 55, 59, 62, 64, 67],
      startTick: bar(3),
      velocity: 62,
    },
    // The suspended dominant exposes A against F before G# arrives underneath it.
    {
      durationTicks: (barTicks / 2) - noteGapTicks,
      pitches: [35, 40, 45, 50, 53, 59, 64],
      startTick: bar(4),
      velocity: 66,
    },
    {
      durationTicks: (barTicks / 2) - noteGapTicks,
      pitches: [35, 40, 44, 50, 53, 59, 64],
      startTick: bar(4) + (barTicks / 2),
      velocity: 68,
    },
    // Am11/E returns wider and darker, adding G and D around the original cluster.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [40, 45, 52, 55, 59, 60, 62, 69],
      startTick: bar(5),
      velocity: 66,
    },
    // Dmaj9/F# is borrowed IVmaj9 from parallel A major: a brief fluorescent lift.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [42, 45, 50, 52, 54, 57, 61, 64],
      startTick: bar(6),
      velocity: 70,
    },
    // F# falls to F as C# rises to D in Dm6/9/F while A and E refuse to move.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [41, 45, 50, 53, 57, 59, 64],
      startTick: bar(7),
      velocity: 68,
    },
    // The last bar leaves the dominant unresolved so the loop exhales into Am/E.
    {
      durationTicks: (barTicks / 2) - noteGapTicks,
      pitches: [35, 40, 45, 50, 53, 59, 64],
      startTick: bar(8),
      velocity: 66,
    },
    {
      durationTicks: (barTicks / 2) - noteGapTicks,
      pitches: [35, 40, 44, 50, 53, 59, 64],
      startTick: bar(8) + (barTicks / 2),
      velocity: 70,
    },
  ]
  const leadMelody: readonly NoteGesture[] = [
    { durationTicks: PPQ + eighthNoteTicks, pitch: 76, startTick: bar(1) + PPQ, velocity: 58 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(1) + (PPQ * 3), velocity: 52 },

    { durationTicks: PPQ, pitch: 69, startTick: bar(2) + eighthNoteTicks, velocity: 54 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(2) + (PPQ * 2), velocity: 58 },
    { durationTicks: PPQ, pitch: 76, startTick: bar(2) + (PPQ * 3), velocity: 56 },

    { durationTicks: PPQ, pitch: 67, startTick: bar(3), velocity: 54 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(3) + (PPQ * 2), velocity: 58 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 74, startTick: bar(3) + (PPQ * 5) / 2, velocity: 62 },

    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(4) + eighthNoteTicks, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(4) + PPQ, velocity: 58 },
    { durationTicks: PPQ, pitch: 74, startTick: bar(4) + (PPQ * 2), velocity: 56 },
    { durationTicks: PPQ, pitch: 68, startTick: bar(4) + (PPQ * 3), velocity: 64 },

    { durationTicks: PPQ, pitch: 76, startTick: bar(5) + PPQ, velocity: 58 },
    { durationTicks: eighthNoteTicks, pitch: 79, startTick: bar(5) + (PPQ * 2), velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(5) + (PPQ * 5) / 2, velocity: 52 },
    { durationTicks: PPQ, pitch: 72, startTick: bar(5) + (PPQ * 3), velocity: 58 },

    { durationTicks: PPQ, pitch: 78, startTick: bar(6) + eighthNoteTicks, velocity: 68 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(6) + (PPQ * 2), velocity: 60 },
    { durationTicks: PPQ, pitch: 73, startTick: bar(6) + (PPQ * 5) / 2, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(6) + (PPQ * 7) / 2, velocity: 54 },

    { durationTicks: PPQ, pitch: 77, startTick: bar(7), velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(7) + (PPQ * 3) / 2, velocity: 58 },
    { durationTicks: PPQ, pitch: 71, startTick: bar(7) + (PPQ * 5) / 2, velocity: 56 },
    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(7) + (PPQ * 7) / 2, velocity: 52 },

    { durationTicks: eighthNoteTicks, pitch: 77, startTick: bar(8) + eighthNoteTicks, velocity: 66 },
    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(8) + PPQ, velocity: 58 },
    { durationTicks: eighthNoteTicks, pitch: 74, startTick: bar(8) + (PPQ * 2), velocity: 56 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 68, startTick: bar(8) + (PPQ * 5) / 2, velocity: 64 },
  ]
  const bassLine: readonly NoteGesture[] = [
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 40, startTick: bar(1), velocity: 80 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 45, startTick: bar(1) + (PPQ * 2), velocity: 70 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 36, startTick: bar(2), velocity: 78 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 41, startTick: bar(2) + (PPQ * 2), velocity: 70 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 43, startTick: bar(3), velocity: 82 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 48, startTick: bar(3) + (PPQ * 2), velocity: 70 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 35, startTick: bar(4), velocity: 82 },
    { durationTicks: PPQ - noteGapTicks, pitch: 40, startTick: bar(4) + (PPQ * 2), velocity: 72 },
    { durationTicks: PPQ - noteGapTicks, pitch: 44, startTick: bar(4) + (PPQ * 3), velocity: 78 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 40, startTick: bar(5), velocity: 82 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 45, startTick: bar(5) + (PPQ * 2), velocity: 72 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 42, startTick: bar(6), velocity: 86 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 45, startTick: bar(6) + (PPQ * 2), velocity: 74 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 41, startTick: bar(7), velocity: 84 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 45, startTick: bar(7) + (PPQ * 2), velocity: 72 },
    { durationTicks: (PPQ * 2) - noteGapTicks, pitch: 35, startTick: bar(8), velocity: 84 },
    { durationTicks: PPQ - noteGapTicks, pitch: 40, startTick: bar(8) + (PPQ * 2), velocity: 72 },
    { durationTicks: PPQ - noteGapTicks, pitch: 44, startTick: bar(8) + (PPQ * 3), velocity: 80 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `vacant_receiver_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `vacant_receiver_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'vacant_receiver_section_no_answer',
          lengthTicks: barTicks * 4,
          name: 'No Answer',
          startTick: bar(1),
        }),
        createSection({
          id: 'vacant_receiver_section_green_light',
          lengthTicks: barTicks * 4,
          name: 'Green Light in an Empty Room',
          startTick: bar(5),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.012,
          decay: 1.5,
          release: 3.2,
          sustain: 0.34,
        },
        filter: {
          cutoffHz: 2300,
          resonance: 2.6,
          type: 'lowpass',
        },
        id: 'vacant_receiver_guitar',
        name: 'Oxide Guitar',
        oscilators: [
          createSynthOscillator({ detuneCents: -9, level: 0.48, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 7, level: 0.2, waveform: 'sawtooth' }),
          createSynthOscillator({ detuneCents: -4, level: 0.22, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ level: 0.1, octave: -1, waveform: 'triangle' }),
        ],
        soundId: 'guitar.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.025,
          decay: 0.95,
          release: 2.8,
          sustain: 0.24,
        },
        filter: {
          cutoffHz: 3600,
          resonance: 3.4,
          type: 'lowpass',
        },
        id: 'vacant_receiver_lead',
        name: 'Hallway Harmonics',
        oscilators: [
          createSynthOscillator({ detuneCents: -6, level: 0.5, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 8, level: 0.32, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.18, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'guitar.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.035,
          decay: 0.65,
          release: 1.1,
          sustain: 0.66,
        },
        filter: {
          cutoffHz: 680,
          resonance: 1.7,
          type: 'lowpass',
        },
        id: 'vacant_receiver_bass',
        name: 'Basement Wire',
        oscilators: [
          createSynthOscillator({ level: 0.72, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -5, level: 0.2, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.08, octave: -1, waveform: 'sine' }),
        ],
        soundId: 'bass.default',
      }),
      createDrumInstrument({
        id: 'vacant_receiver_drums',
        name: 'Half-Awake Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.045,
            pitchSemitones: -7,
            soundId: 'drums.closedHat.default',
            volumeDb: -14,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.46,
            pitchSemitones: -9,
            soundId: 'drums.kick.default',
            volumeDb: 9,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.4,
            pitchSemitones: -8,
            soundId: 'drums.lowTom.default',
            volumeDb: -6,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.24,
            pitchSemitones: -6,
            soundId: 'drums.ride.default',
            volumeDb: -18,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.24,
            pitchSemitones: -5,
            soundId: 'drums.snare.default',
            volumeDb: -2,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: guitarTrack.mixChannelId, pan: -0.4, volumeDb: -11 }),
        createMixChannel({ id: leadTrack.mixChannelId, pan: 0.4, volumeDb: -8 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0.02, volumeDb: 2 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.08, volumeDb: 4 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createVoicingEvents(voicings),
        id: 'vacant_receiver_pattern_chords',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar six borrows Dmaj9/F# (IVmaj9) from parallel A major; F# falls to F while C# rises to D in Dm6/9/F.',
          progression: 'Am(add9)/E · Fmaj7(#11)/C · Cmaj9/G · E7sus4(b9)/B → E7(b9)/B · Am11/E · Dmaj9/F# · Dm6/9/F · E7sus4(b9)/B → E7(b9)/B',
          voicing: 'Low inversion shells carry close upper seconds. B-E stays nearly fixed until the borrowed D major lights up C#, then F#-C# collapses to F-D over common A-E.',
        },
        name: 'Oxide Voicings',
      }),
      createPattern({
        events: createMelodyEvents(leadMelody),
        id: 'vacant_receiver_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'A distant E-B call keeps returning in different rooms; F-natural haunts both dominant bars while F# marks the borrowed flash in bar six.',
        },
        name: 'Signal Behind the Wall',
      }),
      createPattern({
        events: createBassEvents(bassLine),
        id: 'vacant_receiver_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Two long notes per bar trace E-C-G-B, repeat E, then slip F#-F before the B-E-G# dominant pickup closes the loop.',
        },
        name: 'Basement Wire',
      }),
      createPattern({
        events: createDrumEvents(eighthNoteTicks),
        id: 'vacant_receiver_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'Blanket-damped half-time drums wake gradually, turn to a low ride under the borrowed chord, nearly disappear in bar seven, and stumble through a floor-tom turnaround.',
        },
        name: 'Half-Awake Beat',
      }),
    ]),
    project: createProject({
      id: 'project_vacant_receiver',
      metadata: createProjectMetadata({
        description: 'An original eight-bar slowcore transmission made from detuned guitar clusters, lonely harmonics, patient bass, and a blanket-damped half-time kit.',
        tags: ['slowcore', 'lo-fi', 'detuned-guitars', 'haunting', 'modal-interchange'],
      }),
      name: 'Vacant Receiver',
    }),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({
          id: 'vacant_receiver_key',
          key: { mode: 'minor', tonic: 9 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'vacant_receiver_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 72,
          id: 'vacant_receiver_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createVoicingEvents(voicings: readonly VoicingGesture[]): NoteEvent[] {
  const strumTicks = PPQ / 20
  const notes = voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => {
    const strumOffset = pitchIndex * strumTicks

    return createNoteEvent({
      durationTicks: voicing.durationTicks - strumOffset,
      id: `vacant_receiver_voicing_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
      pitch,
      timeTick: voicing.startTick + strumOffset,
      velocity: voicing.velocity - Math.min(pitchIndex * 2, 10),
    })
  }))

  return createNoteEvents('vacant_receiver_event_chords', notes)
}

function createMelodyEvents(melody: readonly NoteGesture[]): NoteEvent[] {
  const notes = melody.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `vacant_receiver_lead_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('vacant_receiver_event_lead', notes)
}

function createBassEvents(bassLine: readonly NoteGesture[]): NoteEvent[] {
  const notes = bassLine.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `vacant_receiver_bass_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('vacant_receiver_event_bass', notes)
}

function createDrumEvents(eighthNoteTicks: number): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []

  DRUM_BARS.forEach((drumBar, barIndex) => {
    const barStartTick = barIndex * eighthNoteTicks * 8
    const addHits = (
      piece: DrumPiece,
      eighthOffsets: readonly number[],
      velocity: (hitIndex: number) => number,
    ) => eighthOffsets.forEach((eighthOffset, hitIndex) => hits.push(createDrumHitEvent({
      id: `vacant_receiver_drum_seed_${barIndex + 1}_${piece}_${hitIndex + 1}`,
      piece,
      timeTick: barStartTick + (eighthOffset * eighthNoteTicks),
      velocity: velocity(hitIndex),
    })))

    addHits('kick', drumBar.kicks, hitIndex => hitIndex === 0 ? 96 : 72 - (hitIndex * 4))
    addHits('snare', drumBar.snares, () => barIndex >= 4 ? 78 : 70)
    addHits(drumBar.pulse, drumBar.hats, hitIndex => 32 + ((hitIndex % 4) * 4))
    addHits('lowTom', drumBar.lowToms ?? [], hitIndex => 50 + (hitIndex * 10))
  })

  return createDrumHitEvents('vacant_receiver_event_drums', hits)
}
