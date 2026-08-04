import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  createBlock,
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
  type Instrument,
  type MidiNote,
  type NoteEvent,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type ArpeggioPhrase = {
  lengthTicks: number
  pitches: readonly MidiNote[]
  startTick: number
  variation: number
  velocity: number
}

type BassBar = {
  pitches: readonly [MidiNote, MidiNote, MidiNote, MidiNote]
  startTick: number
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

export function tidalCathedral(): Workspace {
  const eighthNoteTicks = PPQ / 2
  const dottedQuarterTicks = (PPQ * 3) / 2
  const barTicks = PPQ * 6
  const totalTicks = barTicks * 16
  const noteGapTicks = PPQ / 16
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const pianoColor = '#4dabf7'
  const choirColor = '#da77f2'
  const bassColor = '#20c997'
  const bellColor = '#fcc419'
  const pianoTrack = createTrack({
    color: pianoColor,
    id: 'tidal_cathedral_track_piano',
    instrumentId: 'tidal_cathedral_piano',
    name: 'Turning Water Piano',
    role: 'melody',
  })
  const choirTrack = createTrack({
    accepts: ['note'],
    color: choirColor,
    id: 'tidal_cathedral_track_choir',
    instrumentId: 'tidal_cathedral_choir',
    name: 'Breathing Vault',
    role: 'chords',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'tidal_cathedral_track_bass',
    instrumentId: 'tidal_cathedral_bass',
    name: 'Deep Current',
    role: 'bass',
  })
  const bellTrack = createTrack({
    color: bellColor,
    id: 'tidal_cathedral_track_bell',
    instrumentId: 'tidal_cathedral_bell',
    name: 'High Window',
    role: 'melody',
  })
  const tracks = [pianoTrack, choirTrack, bassTrack, bellTrack]

  const arpeggioPhrases: readonly ArpeggioPhrase[] = [
    { lengthTicks: barTicks, pitches: [50, 57, 61, 64, 66, 69], startTick: bar(1), variation: 0, velocity: 68 },
    { lengthTicks: barTicks, pitches: [49, 52, 57, 59, 61, 66], startTick: bar(2), variation: 1, velocity: 66 },
    { lengthTicks: barTicks, pitches: [47, 54, 57, 61, 64, 66], startTick: bar(3), variation: 0, velocity: 70 },
    { lengthTicks: barTicks, pitches: [50, 55, 59, 62, 66, 69], startTick: bar(4), variation: 2, velocity: 68 },

    { lengthTicks: barTicks, pitches: [50, 57, 59, 64, 66, 69], startTick: bar(5), variation: 1, velocity: 72 },
    { lengthTicks: barTicks, pitches: [47, 52, 55, 59, 62, 66], startTick: bar(6), variation: 3, velocity: 70 },
    { lengthTicks: barTicks, pitches: [50, 54, 57, 59, 64, 69], startTick: bar(7), variation: 2, velocity: 74 },
    { lengthTicks: barTicks / 2, pitches: [52, 55, 59, 62, 66, 69], startTick: bar(8), variation: 3, velocity: 74 },
    { lengthTicks: barTicks / 2, pitches: [52, 55, 59, 61, 66, 69], startTick: bar(8) + (barTicks / 2), variation: 1, velocity: 76 },

    { lengthTicks: barTicks, pitches: [47, 50, 54, 57, 64, 66], startTick: bar(9), variation: 3, velocity: 76 },
    { lengthTicks: barTicks, pitches: [52, 56, 59, 61, 66, 69], startTick: bar(10), variation: 1, velocity: 72 },
    { lengthTicks: barTicks, pitches: [50, 54, 57, 59, 62, 66], startTick: bar(11), variation: 2, velocity: 76 },
    { lengthTicks: barTicks, pitches: [50, 57, 61, 64, 66, 73], startTick: bar(12), variation: 3, velocity: 74 },

    { lengthTicks: barTicks, pitches: [47, 50, 54, 55, 57, 62], startTick: bar(13), variation: 1, velocity: 72 },
    { lengthTicks: barTicks, pitches: [50, 54, 57, 59, 64, 69], startTick: bar(14), variation: 2, velocity: 78 },
    // Parallel D minor lends its iv chord: B natural falls to Bb while D, E, and A remain suspended.
    { lengthTicks: barTicks, pitches: [50, 52, 57, 58, 62, 69], startTick: bar(15), variation: 0, velocity: 80 },
    { lengthTicks: barTicks, pitches: [50, 54, 57, 59, 64, 66], startTick: bar(16), variation: 3, velocity: 70 },
  ]
  const choirVoicings: readonly VoicingGesture[] = [
    { durationTicks: barTicks - noteGapTicks, pitches: [50, 57, 61, 64, 66, 69], startTick: bar(1), velocity: 52 },
    { durationTicks: barTicks - noteGapTicks, pitches: [49, 52, 57, 59, 61, 66], startTick: bar(2), velocity: 50 },
    { durationTicks: barTicks - noteGapTicks, pitches: [47, 54, 57, 61, 64, 66], startTick: bar(3), velocity: 54 },
    { durationTicks: barTicks - noteGapTicks, pitches: [50, 55, 59, 62, 66, 69], startTick: bar(4), velocity: 52 },
    { durationTicks: barTicks - noteGapTicks, pitches: [42, 50, 57, 59, 64, 66], startTick: bar(5), velocity: 54 },
    { durationTicks: barTicks - noteGapTicks, pitches: [47, 52, 55, 59, 62, 66], startTick: bar(6), velocity: 56 },
    { durationTicks: barTicks - noteGapTicks, pitches: [43, 50, 54, 57, 59, 64, 69], startTick: bar(7), velocity: 58 },
    { durationTicks: (barTicks / 2) - noteGapTicks, pitches: [45, 52, 55, 59, 62, 66], startTick: bar(8), velocity: 58 },
    { durationTicks: (barTicks / 2) - noteGapTicks, pitches: [45, 52, 55, 59, 61, 66], startTick: bar(8) + (barTicks / 2), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [42, 47, 50, 54, 57, 64], startTick: bar(9), velocity: 58 },
    { durationTicks: barTicks - noteGapTicks, pitches: [45, 52, 56, 59, 61, 64, 66], startTick: bar(10), velocity: 56 },
    { durationTicks: barTicks - noteGapTicks, pitches: [43, 50, 54, 57, 59, 62, 66], startTick: bar(11), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [45, 50, 57, 61, 64, 66], startTick: bar(12), velocity: 58 },
    { durationTicks: barTicks - noteGapTicks, pitches: [40, 47, 50, 54, 55, 57, 62], startTick: bar(13), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [43, 50, 54, 57, 59, 64, 69], startTick: bar(14), velocity: 64 },
    { durationTicks: barTicks - noteGapTicks, pitches: [43, 50, 52, 57, 58, 62, 69], startTick: bar(15), velocity: 68 },
    { durationTicks: barTicks - noteGapTicks, pitches: [45, 50, 54, 57, 59, 64, 66], startTick: bar(16), velocity: 58 },
  ]
  const bassBars: readonly BassBar[] = [
    { pitches: [33, 38, 42, 45], startTick: bar(1), velocity: 76 },
    { pitches: [37, 40, 45, 40], startTick: bar(2), velocity: 72 },
    { pitches: [35, 42, 45, 42], startTick: bar(3), velocity: 76 },
    { pitches: [38, 43, 47, 45], startTick: bar(4), velocity: 72 },
    { pitches: [30, 38, 45, 42], startTick: bar(5), velocity: 78 },
    { pitches: [35, 40, 43, 42], startTick: bar(6), velocity: 74 },
    { pitches: [31, 38, 42, 45], startTick: bar(7), velocity: 78 },
    { pitches: [33, 40, 43, 49], startTick: bar(8), velocity: 80 },
    { pitches: [30, 35, 38, 42], startTick: bar(9), velocity: 78 },
    { pitches: [33, 37, 40, 44], startTick: bar(10), velocity: 74 },
    { pitches: [31, 38, 42, 45], startTick: bar(11), velocity: 78 },
    { pitches: [33, 38, 42, 45], startTick: bar(12), velocity: 76 },
    { pitches: [28, 35, 38, 42], startTick: bar(13), velocity: 78 },
    { pitches: [31, 38, 42, 47], startTick: bar(14), velocity: 82 },
    { pitches: [31, 38, 40, 46], startTick: bar(15), velocity: 86 },
    { pitches: [38, 45, 50, 42], startTick: bar(16), velocity: 76 },
  ]
  const bellGestures: readonly NoteGesture[] = [
    { durationTicks: dottedQuarterTicks, pitch: 78, startTick: bar(2) + (dottedQuarterTicks * 2), velocity: 60 },
    { durationTicks: dottedQuarterTicks, pitch: 76, startTick: bar(3) + dottedQuarterTicks, velocity: 58 },
    { durationTicks: dottedQuarterTicks, pitch: 78, startTick: bar(3) + (dottedQuarterTicks * 3), velocity: 62 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(4) + dottedQuarterTicks, velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(4) + (dottedQuarterTicks * 3), velocity: 60 },

    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(5), velocity: 62 },
    { durationTicks: dottedQuarterTicks, pitch: 78, startTick: bar(5) + (dottedQuarterTicks * 2), velocity: 58 },
    { durationTicks: dottedQuarterTicks, pitch: 76, startTick: bar(6) + dottedQuarterTicks, velocity: 60 },
    { durationTicks: dottedQuarterTicks, pitch: 78, startTick: bar(6) + (dottedQuarterTicks * 3), velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(7), velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(7) + dottedQuarterTicks, velocity: 60 },
    { durationTicks: dottedQuarterTicks, pitch: 78, startTick: bar(7) + (dottedQuarterTicks * 3), velocity: 62 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(8) + dottedQuarterTicks, velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 85, startTick: bar(8) + (dottedQuarterTicks * 3), velocity: 68 },

    { durationTicks: dottedQuarterTicks, pitch: 86, startTick: bar(9), velocity: 68 },
    { durationTicks: dottedQuarterTicks, pitch: 85, startTick: bar(9) + (dottedQuarterTicks * 2), velocity: 62 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(10) + dottedQuarterTicks, velocity: 60 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(10) + (dottedQuarterTicks * 3), velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(11), velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(11) + dottedQuarterTicks, velocity: 66 },
    { durationTicks: dottedQuarterTicks, pitch: 86, startTick: bar(11) + (dottedQuarterTicks * 2), velocity: 70 },
    { durationTicks: dottedQuarterTicks, pitch: 90, startTick: bar(11) + (dottedQuarterTicks * 3), velocity: 72 },
    { durationTicks: dottedQuarterTicks, pitch: 88, startTick: bar(12), velocity: 68 },
    { durationTicks: dottedQuarterTicks, pitch: 85, startTick: bar(12) + (dottedQuarterTicks * 2), velocity: 64 },

    { durationTicks: dottedQuarterTicks, pitch: 79, startTick: bar(13), velocity: 62 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(13) + dottedQuarterTicks, velocity: 64 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(13) + (dottedQuarterTicks * 2), velocity: 66 },
    { durationTicks: dottedQuarterTicks, pitch: 86, startTick: bar(13) + (dottedQuarterTicks * 3), velocity: 70 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(14), velocity: 68 },
    { durationTicks: dottedQuarterTicks, pitch: 86, startTick: bar(14) + dottedQuarterTicks, velocity: 70 },
    { durationTicks: dottedQuarterTicks, pitch: 88, startTick: bar(14) + (dottedQuarterTicks * 2), velocity: 72 },
    { durationTicks: dottedQuarterTicks, pitch: 90, startTick: bar(14) + (dottedQuarterTicks * 3), velocity: 74 },
    { durationTicks: dottedQuarterTicks, pitch: 83, startTick: bar(15), velocity: 70 },
    { durationTicks: dottedQuarterTicks, pitch: 82, startTick: bar(15) + dottedQuarterTicks, velocity: 74 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(15) + (dottedQuarterTicks * 2), velocity: 68 },
    { durationTicks: dottedQuarterTicks, pitch: 86, startTick: bar(15) + (dottedQuarterTicks * 3), velocity: 72 },
    { durationTicks: dottedQuarterTicks, pitch: 81, startTick: bar(16), velocity: 66 },
    { durationTicks: dottedQuarterTicks, pitch: 78, startTick: bar(16) + dottedQuarterTicks, velocity: 62 },
    { durationTicks: dottedQuarterTicks * 2, pitch: 86, startTick: bar(16) + (dottedQuarterTicks * 2), velocity: 70 },
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: pianoColor,
          id: 'tidal_cathedral_block_piano',
          lengthTicks: totalTicks,
          name: 'Twelve Ripples',
          patternId: 'tidal_cathedral_pattern_piano',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: choirColor,
          id: 'tidal_cathedral_block_choir',
          lengthTicks: totalTicks,
          name: 'Impossible Arches',
          patternId: 'tidal_cathedral_pattern_choir',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: choirTrack.id,
        }),
        createBlock({
          color: bassColor,
          id: 'tidal_cathedral_block_bass',
          lengthTicks: totalTicks,
          name: 'Four Deep Bells',
          patternId: 'tidal_cathedral_pattern_bass',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: bellColor,
          id: 'tidal_cathedral_block_bell',
          lengthTicks: totalTicks,
          name: 'The Returning Star',
          patternId: 'tidal_cathedral_pattern_bell',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: bellTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'tidal_cathedral_section_first_turning',
          lengthTicks: barTicks * 4,
          name: 'First Turning',
          startTick: bar(1),
        }),
        createSection({
          id: 'tidal_cathedral_section_widening_rings',
          lengthTicks: barTicks * 4,
          name: 'Widening Rings',
          startTick: bar(5),
        }),
        createSection({
          id: 'tidal_cathedral_section_high_window',
          lengthTicks: barTicks * 4,
          name: 'High Window',
          startTick: bar(9),
        }),
        createSection({
          id: 'tidal_cathedral_section_borrowed_dawn',
          lengthTicks: barTicks * 4,
          name: 'Borrowed Dawn',
          startTick: bar(13),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: {
          attack: 0.004,
          decay: 0.58,
          release: 0.46,
          sustain: 0.18,
        },
        filter: {
          cutoffHz: 5200,
          resonance: 1.2,
          type: 'lowpass',
        },
        id: 'tidal_cathedral_piano',
        name: 'Turning Water Piano',
        oscilators: [
          createSynthOscillator({ level: 0.56, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -4, level: 0.26, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 5, level: 0.18, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'keys.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.72,
          decay: 1.2,
          release: 2.4,
          sustain: 0.78,
        },
        filter: {
          cutoffHz: 2600,
          resonance: 1.1,
          type: 'lowpass',
        },
        id: 'tidal_cathedral_choir',
        name: 'Breathing Vault',
        oscilators: [
          createSynthOscillator({ level: 0.52, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -7, level: 0.3, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 6, level: 0.18, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'strings.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.06,
          decay: 0.5,
          release: 0.9,
          sustain: 0.7,
        },
        filter: {
          cutoffHz: 900,
          resonance: 1.5,
          type: 'lowpass',
        },
        id: 'tidal_cathedral_bass',
        name: 'Deep Current',
        oscilators: [
          createSynthOscillator({ level: 0.72, waveform: 'sine' }),
          createSynthOscillator({ level: 0.28, waveform: 'triangle' }),
        ],
        soundId: 'bass.default',
      }),
      createThorInstrument({
        envelope: {
          attack: 0.002,
          decay: 0.9,
          release: 1.5,
          sustain: 0.12,
        },
        filter: {
          cutoffHz: 6500,
          resonance: 2,
          type: 'lowpass',
        },
        id: 'tidal_cathedral_bell',
        name: 'High Window',
        oscilators: [
          createSynthOscillator({ level: 0.58, waveform: 'sine' }),
          createSynthOscillator({ level: 0.28, octave: 1, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 4, level: 0.14, octave: 2, waveform: 'sine' }),
        ],
        soundId: 'sine.soft',
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: pianoTrack.mixChannelId, pan: -0.22, volumeDb: 0 }),
        createMixChannel({ id: choirTrack.mixChannelId, pan: 0.18, volumeDb: -4 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: 4 }),
        createMixChannel({ id: bellTrack.mixChannelId, pan: 0.28, volumeDb: -9 }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createArpeggioEvents(arpeggioPhrases, eighthNoteTicks, noteGapTicks),
        id: 'tidal_cathedral_pattern_piano',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          process: 'Six-note cells rotate, split at the central dominant, climb in register, then become transparent for the cadence.',
        },
        name: 'Twelve Ripples',
      }),
      createPattern({
        events: createNoteEvents(
          'tidal_cathedral_event_choir',
          materializeVoicings(choirVoicings),
        ),
        id: 'tidal_cathedral_pattern_choir',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bars fourteen through sixteen move Gmaj13 → Gm6/9 → D6/9. Gm6/9 is iv6/9 borrowed from parallel D minor; D, E, and A remain as common tones while B falls to Bb and resolves to A.',
          progression: 'Dmaj9/A · A6/9/C# · Bm11 · Gmaj9/D · D6/9/F# · Em9/B · Gmaj13 · A13sus4 → A13 · Bm11/F# · F#m11/A · Gmaj9 · Dmaj9/A · Em11 · Gmaj13 · Gm6/9 · D6/9/A',
          voicing: 'Open tenths in the lower voices support close ninths, sixths, and common-tone suspensions above middle C.',
        },
        name: 'Impossible Arches',
      }),
      createPattern({
        events: createBassEvents(bassBars, dottedQuarterTicks, noteGapTicks),
        id: 'tidal_cathedral_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Four dotted-quarter tones per bar form a slow counter-current beneath the twelve-note piano cells.',
        },
        name: 'Four Deep Bells',
      }),
      createPattern({
        events: createNoteEvents(
          'tidal_cathedral_event_bell',
          materializeNoteGestures(bellGestures),
        ),
        id: 'tidal_cathedral_pattern_bell',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          motif: 'A two-note F#–E glint grows by addition into an ascending window; the climax traces B → Bb → A across the borrowed-minor cadence.',
        },
        name: 'The Returning Star',
      }),
    ]),
    project: createProject({
      id: 'project_tidal_cathedral',
      metadata: createProjectMetadata({
        description: 'An original sixteen-bar minimalist chamber study in 12/8, built from interlocking piano cells, slowly breathing harmony, deep bell-like bass, and a luminous borrowed-minor cadence.',
        tags: ['minimalism', 'chamber', '12-8', 'modal-interchange', 'additive-process'],
      }),
      name: 'Tidal Cathedral',
    }),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({
          id: 'tidal_cathedral_key',
          key: { mode: 'major', tonic: 2 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'tidal_cathedral_meter',
          tick: 0,
          timeSignature: { denominator: 8, numerator: 12 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 96,
          id: 'tidal_cathedral_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createArpeggioEvents(
  phrases: readonly ArpeggioPhrase[],
  eighthNoteTicks: number,
  noteGapTicks: number,
): NoteEvent[] {
  const pitchOrders = [
    [0, 2, 4, 1, 3, 5, 0, 3, 4, 2, 5, 3],
    [0, 1, 3, 5, 2, 4, 0, 2, 5, 3, 4, 1],
    [0, 3, 4, 2, 5, 1, 0, 2, 4, 3, 5, 1],
    [0, 2, 5, 3, 1, 4, 0, 3, 5, 2, 4, 1],
  ] as const
  const notes = phrases.flatMap((phrase, phraseIndex) => {
    const pitchOrder = pitchOrders[phrase.variation % pitchOrders.length]
    const stepCount = phrase.lengthTicks / eighthNoteTicks

    return Array.from({ length: stepCount }, (_, stepIndex) => createNoteEvent({
      durationTicks: eighthNoteTicks + (stepIndex % 3 === 0 ? noteGapTicks * 2 : -noteGapTicks),
      id: `tidal_cathedral_arpeggio_seed_${phraseIndex + 1}_${stepIndex + 1}`,
      pitch: phrase.pitches[pitchOrder[stepIndex % pitchOrder.length]],
      timeTick: phrase.startTick + (stepIndex * eighthNoteTicks),
      velocity: phrase.velocity + (stepIndex % 6 === 0 ? 6 : 0) - (stepIndex % 2 === 1 ? 4 : 0),
    }))
  })

  return createNoteEvents('tidal_cathedral_event_piano', notes)
}

function createBassEvents(
  bars: readonly BassBar[],
  dottedQuarterTicks: number,
  noteGapTicks: number,
): NoteEvent[] {
  const notes = bars.flatMap((bassBar, barIndex) => bassBar.pitches.map((pitch, noteIndex) => createNoteEvent({
    durationTicks: dottedQuarterTicks - noteGapTicks,
    id: `tidal_cathedral_bass_seed_${barIndex + 1}_${noteIndex + 1}`,
    pitch,
    timeTick: bassBar.startTick + (noteIndex * dottedQuarterTicks),
    velocity: bassBar.velocity - (noteIndex % 2 === 1 ? 6 : 0),
  })))

  return createNoteEvents('tidal_cathedral_event_bass', notes)
}

function materializeNoteGestures(gestures: readonly NoteGesture[]): NoteEvent[] {
  return gestures.map((gesture, gestureIndex) => createNoteEvent({
    durationTicks: gesture.durationTicks,
    id: `tidal_cathedral_bell_seed_${gestureIndex + 1}`,
    pitch: gesture.pitch,
    timeTick: gesture.startTick,
    velocity: gesture.velocity,
  }))
}

function materializeVoicings(voicings: readonly VoicingGesture[]): NoteEvent[] {
  return voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `tidal_cathedral_choir_seed_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex * 2, 8),
  })))
}
