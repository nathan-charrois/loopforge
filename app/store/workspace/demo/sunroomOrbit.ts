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
  { hats: [0, 2, 4, 6], kicks: [0], pulse: 'closedHat', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 5.5], pulse: 'closedHat', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 6], pulse: 'closedHat', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 3.5], lowToms: [7], pulse: 'closedHat', snares: [4] },
  { hats: [0, 1, 2, 3, 4, 5, 6, 7], kicks: [0, 5.5], pulse: 'ride', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 3], pulse: 'ride', snares: [4] },
  { hats: [0, 2, 4, 6], kicks: [0, 6], pulse: 'ride', snares: [4] },
  { hats: [0, 1, 2, 3, 4, 5, 6, 7], kicks: [0, 3.5, 6], lowToms: [6, 7], pulse: 'closedHat', snares: [4] },
]

export function sunroomOrbit(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const halfBarTicks = barTicks / 2
  const eighthNoteTicks = PPQ / 2
  const noteGapTicks = PPQ / 10
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const guitarColor = '#f5b942'
  const defaultColor = '#080808'
  const guitarTrack = createTrack({
    accepts: ['note'],
    color: guitarColor,
    id: 'sunroom_orbit_track_guitar',
    instrumentId: 'sunroom_orbit_guitar',
    name: 'Sunbleached Six-String',
    role: 'chords',
  })
  const leadTrack = createTrack({
    color: defaultColor,
    id: 'sunroom_orbit_track_lead',
    instrumentId: 'sunroom_orbit_lead',
    name: 'Windowlight Guitar',
    role: 'melody',
  })
  const bassTrack = createTrack({
    color: defaultColor,
    id: 'sunroom_orbit_track_bass',
    instrumentId: 'sunroom_orbit_bass',
    name: 'Warm Tape Bass',
    role: 'bass',
  })
  const drumsTrack = createTrack({
    color: defaultColor,
    id: 'sunroom_orbit_track_drums',
    instrumentId: 'sunroom_orbit_drums',
    name: 'Porch Dust Kit',
    role: 'drums',
  })
  const tracks = [guitarTrack, leadTrack, bassTrack, drumsTrack]
  const voicings: readonly VoicingGesture[] = [
    // Dmaj9: a low D-A frame supports every chord tone in a ringing upper spread.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [38, 45, 50, 54, 57, 61, 64, 69],
      startTick: bar(1),
      velocity: 66,
    },
    // Aadd9/C# keeps A and E ringing while the bass moves down by semitone.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [37, 45, 52, 57, 59, 61, 64, 69],
      startTick: bar(2),
      velocity: 64,
    },
    // Bm11 fills in the vi chord without crowding its low third.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [35, 42, 47, 50, 57, 61, 64, 66],
      startTick: bar(3),
      velocity: 66,
    },
    // Gmaj9 opens the register and preserves D, F#, and A from Bm11.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 55, 59, 66, 69, 74],
      startTick: bar(4),
      velocity: 68,
    },
    // D6/9/F# makes the tonic return feel airborne instead of final.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [42, 45, 50, 54, 59, 64, 69],
      startTick: bar(5),
      velocity: 70,
    },
    // Gmaj9 turns briefly to borrowed Gm6/9; only B falls to Bb.
    {
      durationTicks: halfBarTicks - noteGapTicks,
      pitches: [43, 50, 55, 59, 66, 69, 74],
      startTick: bar(6),
      velocity: 70,
    },
    {
      durationTicks: halfBarTicks - noteGapTicks,
      pitches: [43, 50, 55, 58, 64, 69, 74],
      startTick: bar(6) + halfBarTicks,
      velocity: 72,
    },
    // Em9 moves through A13sus4 with D, E, F#, G, and B as common tones.
    {
      durationTicks: halfBarTicks - noteGapTicks,
      pitches: [40, 47, 52, 55, 59, 62, 66, 71],
      startTick: bar(7),
      velocity: 70,
    },
    {
      durationTicks: halfBarTicks - noteGapTicks,
      pitches: [45, 52, 55, 59, 62, 66, 69],
      startTick: bar(7) + halfBarTicks,
      velocity: 72,
    },
    // C# replaces D in A13 before the full Dmaj9 lands on beat three.
    {
      durationTicks: halfBarTicks - noteGapTicks,
      pitches: [45, 52, 55, 59, 61, 66, 71],
      startTick: bar(8),
      velocity: 74,
    },
    {
      durationTicks: halfBarTicks - noteGapTicks,
      pitches: [38, 45, 50, 54, 57, 61, 64, 69],
      startTick: bar(8) + halfBarTicks,
      velocity: 66,
    },
  ]
  const leadMelody: readonly NoteGesture[] = [
    { durationTicks: PPQ, pitch: 69, startTick: bar(1) + halfBarTicks, velocity: 58 },
    { durationTicks: PPQ, pitch: 76, startTick: bar(1) + (PPQ * 3), velocity: 62 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 76, startTick: bar(2) + eighthNoteTicks, velocity: 58 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(2) + halfBarTicks, velocity: 54 },
    { durationTicks: PPQ, pitch: 73, startTick: bar(2) + (PPQ * 3), velocity: 60 },

    { durationTicks: PPQ + eighthNoteTicks, pitch: 74, startTick: bar(3), velocity: 60 },
    { durationTicks: eighthNoteTicks, pitch: 78, startTick: bar(3) + halfBarTicks, velocity: 64 },
    { durationTicks: PPQ, pitch: 76, startTick: bar(3) + (PPQ * 3), velocity: 58 },

    { durationTicks: PPQ, pitch: 71, startTick: bar(4) + eighthNoteTicks, velocity: 56 },
    { durationTicks: PPQ, pitch: 69, startTick: bar(4) + halfBarTicks, velocity: 54 },
    { durationTicks: PPQ, pitch: 66, startTick: bar(4) + (PPQ * 3), velocity: 52 },

    { durationTicks: eighthNoteTicks, pitch: 69, startTick: bar(5) + PPQ, velocity: 58 },
    { durationTicks: eighthNoteTicks, pitch: 71, startTick: bar(5) + (PPQ * 3) / 2, velocity: 60 },
    { durationTicks: PPQ, pitch: 73, startTick: bar(5) + halfBarTicks, velocity: 64 },
    { durationTicks: PPQ, pitch: 76, startTick: bar(5) + (PPQ * 3), velocity: 68 },

    { durationTicks: PPQ, pitch: 74, startTick: bar(6), velocity: 62 },
    { durationTicks: PPQ, pitch: 71, startTick: bar(6) + PPQ, velocity: 58 },
    { durationTicks: PPQ, pitch: 70, startTick: bar(6) + halfBarTicks, velocity: 66 },
    { durationTicks: PPQ, pitch: 69, startTick: bar(6) + (PPQ * 3), velocity: 56 },

    { durationTicks: PPQ, pitch: 71, startTick: bar(7) + eighthNoteTicks, velocity: 58 },
    { durationTicks: PPQ, pitch: 74, startTick: bar(7) + halfBarTicks, velocity: 62 },
    { durationTicks: PPQ, pitch: 78, startTick: bar(7) + (PPQ * 3), velocity: 68 },

    { durationTicks: eighthNoteTicks, pitch: 76, startTick: bar(8) + eighthNoteTicks, velocity: 62 },
    { durationTicks: eighthNoteTicks, pitch: 73, startTick: bar(8) + PPQ, velocity: 66 },
    { durationTicks: PPQ, pitch: 71, startTick: bar(8) + (PPQ * 3) / 2, velocity: 58 },
    { durationTicks: PPQ + eighthNoteTicks, pitch: 69, startTick: bar(8) + halfBarTicks, velocity: 54 },
  ]
  const bassLine: readonly NoteGesture[] = [
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 38, startTick: bar(1), velocity: 80 },
    { durationTicks: PPQ - noteGapTicks, pitch: 45, startTick: bar(1) + halfBarTicks, velocity: 70 },
    { durationTicks: PPQ - noteGapTicks, pitch: 49, startTick: bar(1) + (PPQ * 3), velocity: 72 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 37, startTick: bar(2), velocity: 80 },
    { durationTicks: PPQ - noteGapTicks, pitch: 40, startTick: bar(2) + halfBarTicks, velocity: 70 },
    { durationTicks: PPQ - noteGapTicks, pitch: 45, startTick: bar(2) + (PPQ * 3), velocity: 74 },
    { durationTicks: (PPQ * 3) - noteGapTicks, pitch: 35, startTick: bar(3), velocity: 82 },
    { durationTicks: PPQ - noteGapTicks, pitch: 42, startTick: bar(3) + (PPQ * 3), velocity: 72 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 31, startTick: bar(4), velocity: 82 },
    { durationTicks: PPQ - noteGapTicks, pitch: 38, startTick: bar(4) + halfBarTicks, velocity: 72 },
    { durationTicks: PPQ - noteGapTicks, pitch: 45, startTick: bar(4) + (PPQ * 3), velocity: 74 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 42, startTick: bar(5), velocity: 84 },
    { durationTicks: PPQ - noteGapTicks, pitch: 45, startTick: bar(5) + halfBarTicks, velocity: 72 },
    { durationTicks: PPQ - noteGapTicks, pitch: 47, startTick: bar(5) + (PPQ * 3), velocity: 76 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 31, startTick: bar(6), velocity: 82 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 43, startTick: bar(6) + halfBarTicks, velocity: 74 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 40, startTick: bar(7), velocity: 82 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 45, startTick: bar(7) + halfBarTicks, velocity: 84 },
    { durationTicks: halfBarTicks - noteGapTicks, pitch: 33, startTick: bar(8), velocity: 84 },
    { durationTicks: PPQ - noteGapTicks, pitch: 37, startTick: bar(8) + halfBarTicks, velocity: 74 },
    { durationTicks: PPQ - noteGapTicks, pitch: 38, startTick: bar(8) + (PPQ * 3), velocity: 80 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: tracks.map(track => createBlock({
        color: track.color,
        id: `sunroom_orbit_block_${track.role}`,
        lengthTicks: totalTicks,
        name: track.name,
        patternId: `sunroom_orbit_pattern_${track.role}`,
        playbackMode: 'oneShot',
        startTick: 0,
        trackId: track.id,
      })),
      sections: [
        createSection({
          id: 'sunroom_orbit_section_open_curtains',
          lengthTicks: barTicks * 4,
          name: 'Open Curtains',
          startTick: bar(1),
        }),
        createSection({
          id: 'sunroom_orbit_section_dust_in_the_light',
          lengthTicks: barTicks * 4,
          name: 'Dust in the Light',
          startTick: bar(5),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.008,
          decay: 1.35,
          release: 2.7,
          sustain: 0.3,
        },
        filter: {
          cutoffHz: 3100,
          resonance: 2.1,
          type: 'lowpass',
        },
        id: 'sunroom_orbit_guitar',
        name: 'Sunbleached Six-String',
        oscilators: [
          createSynthOscillator({ detuneCents: -7, level: 0.5, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 6, level: 0.24, waveform: 'sawtooth' }),
          createSynthOscillator({ detuneCents: -3, level: 0.18, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ level: 0.08, octave: -1, waveform: 'triangle' }),
        ],
        soundId: 'guitar.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.02,
          decay: 1.1,
          release: 3.1,
          sustain: 0.22,
        },
        filter: {
          cutoffHz: 4200,
          resonance: 2.8,
          type: 'lowpass',
        },
        id: 'sunroom_orbit_lead',
        name: 'Windowlight Guitar',
        oscilators: [
          createSynthOscillator({ detuneCents: -5, level: 0.52, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 8, level: 0.3, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.18, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'guitar.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.028,
          decay: 0.72,
          release: 1.2,
          sustain: 0.62,
        },
        filter: {
          cutoffHz: 760,
          resonance: 1.4,
          type: 'lowpass',
        },
        id: 'sunroom_orbit_bass',
        name: 'Warm Tape Bass',
        oscilators: [
          createSynthOscillator({ level: 0.7, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -4, level: 0.22, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.08, octave: -1, waveform: 'sine' }),
        ],
        soundId: 'bass.default',
      }),
      createDrumInstrument({
        id: 'sunroom_orbit_drums',
        name: 'Porch Dust Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.05,
            pitchSemitones: -5,
            soundId: 'drums.closedHat.default',
            volumeDb: -15,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.42,
            pitchSemitones: -7,
            soundId: 'drums.kick.default',
            volumeDb: 7,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.38,
            pitchSemitones: -6,
            soundId: 'drums.lowTom.default',
            volumeDb: -7,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.3,
            pitchSemitones: -4,
            soundId: 'drums.ride.default',
            volumeDb: -17,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.22,
            pitchSemitones: -4,
            soundId: 'drums.snare.default',
            volumeDb: -3,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: guitarTrack.mixChannelId, pan: -0.38, volumeDb: -12 }),
        createMixChannel({ id: leadTrack.mixChannelId, pan: 0.42, volumeDb: -9 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: 1 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.06, volumeDb: 2 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createVoicingEvents(voicings),
        id: 'sunroom_orbit_pattern_chords',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar six borrows Gm6/9, the minor iv, from parallel D minor; B falls to Bb while G, D, E, and A remain in the voicing.',
          progression: 'Dmaj9 · Aadd9/C# · Bm11 · Gmaj9 · D6/9/F# · Gmaj9 → Gm6/9 · Em9 → A13sus4 · A13 → Dmaj9',
          voicing: 'Full chord-tone spreads use low root-fifth shells, open middle voices, and ringing ninths. Common-tone motion keeps the changes playable and connected.',
        },
        name: 'Curtain-Glow Voicings',
      }),
      createPattern({
        events: createMelodyEvents(leadMelody),
        id: 'sunroom_orbit_pattern_melody',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'A patient A-E call gradually climbs, bends through Bb over the borrowed minor iv, and settles from E through B to A above the final tonic.',
        },
        name: 'Dust-Mote Melody',
      }),
      createPattern({
        events: createBassEvents(bassLine),
        id: 'sunroom_orbit_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'A warm melodic bass traces D-C#-B-G, lifts through F# and G, then makes the functional E-A-D cadence unmistakable.',
        },
        name: 'Warm Tape Bassline',
      }),
      createPattern({
        events: createDrumEvents(eighthNoteTicks),
        id: 'sunroom_orbit_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'A loose half-time pocket stays behind the guitars, opens onto a soft ride in the second phrase, and uses a short floor-tom turn to carry the loop home.',
        },
        name: 'Porch Dust Pocket',
      }),
    ]),
    project: createProject({
      id: 'project_sunroom_orbit',
      metadata: createProjectMetadata({
        description: 'An original eight-bar sunny slowcore and space-rock miniature with detuned strummed guitars, full extended voicings, melodic bass, and a patient half-time kit.',
        tags: ['slowcore', 'space-rock', 'sunny', 'detuned-guitars', 'modal-interchange'],
      }),
      name: 'Sunroom Orbit',
    }),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({
          id: 'sunroom_orbit_key',
          key: { mode: 'major', tonic: 2 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'sunroom_orbit_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 72,
          id: 'sunroom_orbit_tempo',
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
      id: `sunroom_orbit_voicing_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
      pitch,
      timeTick: voicing.startTick + strumOffset,
      velocity: voicing.velocity - Math.min(pitchIndex * 2, 10),
    })
  }))

  return createNoteEvents('sunroom_orbit_event_chords', notes)
}

function createMelodyEvents(melody: readonly NoteGesture[]): NoteEvent[] {
  const notes = melody.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `sunroom_orbit_lead_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('sunroom_orbit_event_lead', notes)
}

function createBassEvents(bassLine: readonly NoteGesture[]): NoteEvent[] {
  const notes = bassLine.map((note, noteIndex) => createNoteEvent({
    durationTicks: note.durationTicks,
    id: `sunroom_orbit_bass_seed_${noteIndex + 1}`,
    pitch: note.pitch,
    timeTick: note.startTick,
    velocity: note.velocity,
  }))

  return createNoteEvents('sunroom_orbit_event_bass', notes)
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
      id: `sunroom_orbit_drum_seed_${barIndex + 1}_${piece}_${hitIndex + 1}`,
      piece,
      timeTick: barStartTick + (eighthOffset * eighthNoteTicks),
      velocity: velocity(hitIndex),
    })))

    addHits('kick', drumBar.kicks, hitIndex => hitIndex === 0 ? 92 : 70 - (hitIndex * 3))
    addHits('snare', drumBar.snares, () => barIndex >= 4 ? 76 : 68)
    addHits(drumBar.pulse, drumBar.hats, hitIndex => 30 + ((hitIndex % 4) * 4))
    addHits('lowTom', drumBar.lowToms ?? [], hitIndex => 52 + (hitIndex * 10))
  })

  return createDrumHitEvents('sunroom_orbit_event_drums', hits)
}
