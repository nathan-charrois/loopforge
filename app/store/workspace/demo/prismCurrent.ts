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
  createPattern,
  createProject,
  createProjectMetadata,
  createSection,
  createTempoEvent,
  createThorInstrument,
  createTimeline,
  createTrack,
  type DurationTicks,
  type Instrument,
  type MidiNote,
  type NoteEvent,
  type Pattern,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type PianoBar = {
  bassPitch: MidiNote
  cell: readonly MidiNote[]
  velocityOffset: number
}

type StringPhrase = {
  durationTicks: DurationTicks
  pitches: readonly MidiNote[]
  startTick: number
  velocity: number
}

export function prismCurrent(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 16
  const segmentTicks = barTicks * 4
  const pulseTicks = PPQ / 4
  const noteGapTicks = PPQ / 16
  const pianoColor = '#4dabf7'
  const stringsColor = '#da77f2'
  const beatColor = '#fd7e14'
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
  const bar13 = barTicks * 12
  const bar14 = barTicks * 13
  const bar15 = barTicks * 14
  const bar16 = barTicks * 15
  const pianoTrack = createTrack({
    color: pianoColor,
    id: 'prism_current_track_piano',
    instrumentId: 'piano.default',
    name: 'Piano',
    role: 'melody',
  })
  const stringsTrack = createTrack({
    accepts: ['note'],
    color: stringsColor,
    id: 'prism_current_track_strings',
    instrumentId: 'strings.default',
    name: 'Strings',
    role: 'chords',
  })
  const beatTrack = createTrack({
    color: beatColor,
    id: 'prism_current_track_beat',
    instrumentId: 'drums.default',
    name: 'Slow Pulse',
    role: 'drums',
  })
  const tracks = [pianoTrack, stringsTrack, beatTrack]
  const pianoBars: readonly PianoBar[] = [
    { bassPitch: 38, cell: [50, 57, 62, 65, 64], velocityOffset: 0 },
    { bassPitch: 38, cell: [50, 57, 62, 65, 64, 69], velocityOffset: 2 },
    { bassPitch: 34, cell: [46, 53, 57, 62, 65, 69], velocityOffset: 4 },
    { bassPitch: 36, cell: [48, 55, 60, 62, 64, 67, 64], velocityOffset: 5 },
    { bassPitch: 38, cell: [50, 57, 62, 64, 65, 69, 74], velocityOffset: 7 },
    { bassPitch: 31, cell: [43, 50, 53, 57, 60, 62, 65], velocityOffset: 8 },
    { bassPitch: 33, cell: [45, 52, 57, 62, 64, 67, 61, 64], velocityOffset: 10 },
    { bassPitch: 38, cell: [50, 57, 62, 65, 64, 69, 74, 69, 50, 57, 62, 66, 64, 69, 74, 69], velocityOffset: 0 },

    // Bars 9–16 rotate and contract the cells while the harmony borrows brighter modes.
    { bassPitch: 31, cell: [43, 50, 55, 59, 62, 66, 69], velocityOffset: 4 },
    { bassPitch: 42, cell: [54, 57, 62, 64, 66, 69, 74], velocityOffset: 5 },
    { bassPitch: 34, cell: [46, 53, 57, 62, 60, 65], velocityOffset: 3 },
    { bassPitch: 39, cell: [51, 58, 63, 67, 62, 70, 74], velocityOffset: 7 },
    { bassPitch: 31, cell: [43, 50, 53, 57, 60, 65], velocityOffset: 8 },
    { bassPitch: 33, cell: [45, 52, 57, 62, 65, 64, 69], velocityOffset: 4 },
    { bassPitch: 33, cell: [45, 52, 57, 62, 64, 67, 61, 70], velocityOffset: 10 },
    { bassPitch: 38, cell: [50, 57, 62, 65, 64, 69, 74, 69], velocityOffset: -4 },
  ]
  const stringPhrases: readonly StringPhrase[] = [
    {
      durationTicks: (barTicks * 2) - noteGapTicks,
      pitches: [50, 57, 62, 65],
      startTick: 0,
      velocity: 55,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [46, 53, 57, 62],
      startTick: bar3,
      velocity: 58,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [48, 55, 59, 62, 64],
      startTick: bar4,
      velocity: 60,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [50, 57, 62, 65, 69],
      startTick: bar5,
      velocity: 64,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 53, 57, 60],
      startTick: bar6,
      velocity: 68,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 57, 62],
      startTick: bar7,
      velocity: 70,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 55, 61],
      startTick: bar7 + (PPQ * 2),
      velocity: 72,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [50, 57, 62, 64, 65, 69],
      startTick: bar8,
      velocity: 62,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [50, 57, 62, 64, 66, 69],
      startTick: bar8 + (PPQ * 2),
      velocity: 64,
    },

    // Borrowed Light: the bar-eight F-natural/F-sharp pivot opens into G major.
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 55, 59, 62, 66, 69],
      startTick: bar9,
      velocity: 64,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [42, 50, 57, 62, 64, 66, 69],
      startTick: bar10,
      velocity: 66,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [46, 53, 57, 62, 65],
      startTick: bar11,
      velocity: 62,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [39, 46, 51, 55, 58, 62],
      startTick: bar12,
      velocity: 68,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [43, 50, 53, 57, 60, 62],
      startTick: bar13,
      velocity: 70,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [45, 50, 57, 62, 64, 65],
      startTick: bar14,
      velocity: 64,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 57, 62, 67],
      startTick: bar15,
      velocity: 72,
    },
    {
      durationTicks: (PPQ * 2) - noteGapTicks,
      pitches: [45, 52, 55, 61, 64, 70],
      startTick: bar15 + (PPQ * 2),
      velocity: 74,
    },
    {
      durationTicks: barTicks - noteGapTicks,
      pitches: [38, 50, 57, 62, 64, 65, 69],
      startTick: bar16,
      velocity: 64,
    },
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_1',
          lengthTicks: segmentTicks,
          name: 'First Light',
          patternId: 'prism_current_pattern_piano_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_2',
          lengthTicks: segmentTicks,
          name: 'Widening Current',
          patternId: 'prism_current_pattern_piano_2',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_3',
          lengthTicks: segmentTicks,
          name: 'Borrowed Light',
          patternId: 'prism_current_pattern_piano_3',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: pianoColor,
          id: 'prism_current_block_piano_4',
          lengthTicks: segmentTicks,
          name: 'Shadow Return',
          patternId: 'prism_current_pattern_piano_4',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: pianoTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_1',
          lengthTicks: segmentTicks,
          name: 'First Refraction',
          patternId: 'prism_current_pattern_strings_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_2',
          lengthTicks: segmentTicks,
          name: 'Rising Field',
          patternId: 'prism_current_pattern_strings_2',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_3',
          lengthTicks: segmentTicks,
          name: 'Borrowed Light',
          patternId: 'prism_current_pattern_strings_3',
          playbackMode: 'oneShot',
          startTick: bar9,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: stringsColor,
          id: 'prism_current_block_strings_4',
          lengthTicks: segmentTicks,
          name: 'Minor Return',
          patternId: 'prism_current_pattern_strings_4',
          playbackMode: 'oneShot',
          startTick: bar13,
          trackId: stringsTrack.id,
        }),
        createBlock({
          color: beatColor,
          id: 'prism_current_block_beat',
          lengthTicks: totalTicks,
          name: 'Half-Speed Gravity',
          patternId: 'prism_current_pattern_beat',
          playbackMode: 'loop',
          startTick: 0,
          trackId: beatTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'prism_current_section_first_light',
          lengthTicks: barTicks * 2,
          name: 'First Light',
          startTick: 0,
        }),
        createSection({
          id: 'prism_current_section_refraction',
          lengthTicks: barTicks * 2,
          name: 'Refraction',
          startTick: bar3,
        }),
        createSection({
          id: 'prism_current_section_widening',
          lengthTicks: barTicks * 2,
          name: 'Widening Current',
          startTick: bar5,
        }),
        createSection({
          id: 'prism_current_section_return',
          lengthTicks: barTicks * 2,
          name: 'Turn Home',
          startTick: bar7,
        }),
        createSection({
          id: 'prism_current_section_borrowed_light',
          lengthTicks: barTicks * 8,
          name: 'Borrowed Light',
          startTick: bar9,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        id: 'piano.default',
        name: 'Concert Piano',
        soundId: 'keys.default',
      }),
      createThorInstrument({
        id: 'strings.default',
        name: 'Chamber Strings',
        soundId: 'strings.default',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Soft Pulse Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            durationSeconds: 0.05,
            pitchSemitones: -11,
            soundId: 'drums.closedHat.default',
            volumeDb: -11,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.46,
            pitchSemitones: -10,
            soundId: 'drums.kick.default',
            volumeDb: 9,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.31,
            pitchSemitones: -11,
            soundId: 'drums.openHat.default',
            volumeDb: -21,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.26,
            pitchSemitones: -7,
            soundId: 'drums.snare.default',
            volumeDb: -9,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: pianoTrack.mixChannelId,
          pan: -0.25,
          volumeDb: -9,
        }),
        createMixChannel({
          id: stringsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: -6,
        }),
        createMixChannel({
          id: beatTrack.mixChannelId,
          pan: 0,
          volumeDb: 9,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: 5,
      },
    }),
    patterns: createEntityStore([
      ...splitPattern(createPattern({
        events: createPianoEvents(pianoBars, barTicks, pulseTicks, noteGapTicks),
        id: 'prism_current_pattern_piano',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          harmony: 'Dm(add9) · Bbmaj7 · Cmaj9 · Dm(add9) · Gm11 · A7sus4 → A7 · Dm(add9) → D(add9) · Gmaj9 · D(add9)/F# · Bbmaj7 · Ebmaj7 · Gm11 · Dm/A · A7sus4 → A7b9 · Dm(add9)',
          process: 'Five-note cells expand, then return as rotated and subtractive variations.',
        },
        name: 'Additive Current',
      }), segmentTicks, [
        'First Light',
        'Widening Current',
        'Borrowed Light',
        'Shadow Return',
      ]),
      ...splitPattern(createPattern({
        events: createStringEvents(stringPhrases),
        id: 'prism_current_pattern_strings',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bar eight pivots from F natural to F sharp, opening into G major before the minor-key return.',
          movement: 'Slow voice-leading broadens beneath the piano pulse, then rises into brighter inversions.',
        },
        name: 'Slow Refraction',
      }), segmentTicks, [
        'First Refraction',
        'Rising Field',
        'Borrowed Light',
        'Minor Return',
      ]),
      createPattern({
        events: createDrumHitEvents('prism_current_event_beat', [
          // A sparse four-bar pulse that makes 108 BPM feel closer to 54.
          createDrumHitEvent({ id: 'beat_1', piece: 'kick', timeTick: 0, velocity: 92 }),
          createDrumHitEvent({ id: 'beat_2', piece: 'snare', timeTick: PPQ * 2, velocity: 58 }),

          createDrumHitEvent({ id: 'beat_3', piece: 'kick', timeTick: barTicks + (PPQ / 2), velocity: 76 }),
          createDrumHitEvent({ id: 'beat_4', piece: 'snare', timeTick: barTicks + (PPQ * 2), velocity: 56 }),
          createDrumHitEvent({ id: 'beat_5', piece: 'closedHat', timeTick: barTicks + (PPQ * 3), velocity: 28 }),

          createDrumHitEvent({ id: 'beat_6', piece: 'kick', timeTick: bar3, velocity: 88 }),
          createDrumHitEvent({ id: 'beat_7', piece: 'snare', timeTick: bar3 + (PPQ * 2), velocity: 60 }),

          createDrumHitEvent({ id: 'beat_8', piece: 'kick', timeTick: bar4 + (PPQ / 2), velocity: 78 }),
          createDrumHitEvent({ id: 'beat_9', piece: 'snare', timeTick: bar4 + (PPQ * 2), velocity: 56 }),
          createDrumHitEvent({ id: 'beat_10', piece: 'openHat', timeTick: bar4 + (PPQ * 7) / 2, velocity: 32 }),
        ]),
        id: 'prism_current_pattern_beat',
        kind: 'drum',
        lengthTicks: segmentTicks,
        metadata: {
          feel: 'super sparse half-time pulse',
          perceivedBpm: 54,
        },
        name: 'Four-Bar Slow Pulse',
      }),
    ]),
    project: createProject({
      id: 'project_prism_current',
      metadata: createProjectMetadata({
        description: 'An original sixteen-bar minimalist study built from additive piano cells, modal interchange, shifting strings, and a sparse half-time beat.',
        tags: ['minimalist', 'additive-process', 'modal-interchange', 'piano', 'strings', 'slow-beat'],
      }),
      name: 'Prism Current',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          id: 'prism_current_key',
          key: { mode: 'minor', tonic: 2 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'prism_current_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 108,
          id: 'prism_current_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createPianoEvents(
  bars: readonly PianoBar[],
  barTicks: DurationTicks,
  pulseTicks: DurationTicks,
  noteGapTicks: DurationTicks,
): NoteEvent[] {
  return bars.flatMap((bar, barIndex) => {
    const barStartTick = barIndex * barTicks
    const pulseCount = barTicks / pulseTicks
    const pulses = Array.from({ length: pulseCount }, (_, pulseIndex) => {
      const beginsCell = pulseIndex % bar.cell.length === 0
      const beginsBeat = pulseIndex % 4 === 0

      return createNoteEvent({
        durationTicks: pulseTicks - noteGapTicks,
        id: `prism_current_event_piano_${barIndex + 1}_${pulseIndex + 1}`,
        pitch: bar.cell[pulseIndex % bar.cell.length],
        timeTick: barStartTick + (pulseIndex * pulseTicks),
        velocity: (beginsCell ? 88 : beginsBeat ? 80 : 68) + bar.velocityOffset,
      })
    })

    return [
      createNoteEvent({
        durationTicks: barTicks - (noteGapTicks * 2),
        id: `prism_current_event_piano_bass_${barIndex + 1}`,
        pitch: bar.bassPitch,
        timeTick: barStartTick,
        velocity: 72 + bar.velocityOffset,
      }),
      ...pulses,
    ]
  })
}

function createStringEvents(phrases: readonly StringPhrase[]): NoteEvent[] {
  return phrases.flatMap((phrase, phraseIndex) => phrase.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: phrase.durationTicks,
    id: `prism_current_event_strings_${phraseIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: phrase.startTick,
    velocity: phrase.velocity - (pitchIndex * 2),
  })))
}

function splitPattern(
  pattern: Pattern,
  segmentLengthTicks: DurationTicks,
  segmentNames: readonly string[],
): Pattern[] {
  const segmentCount = Math.ceil(pattern.lengthTicks / segmentLengthTicks)

  if (segmentNames.length !== segmentCount) {
    throw new Error(`Pattern ${pattern.id} requires ${segmentCount} segment names.`)
  }

  return segmentNames.map((name, index) => {
    const startTick = index * segmentLengthTicks
    const endTick = startTick + segmentLengthTicks

    return createPattern({
      events: [...pattern.events]
        .filter(event => event.timeTick >= startTick && event.timeTick < endTick)
        .map(event => ({
          ...event,
          timeTick: event.timeTick - startTick,
        })),
      id: `${pattern.id}_${index + 1}`,
      kind: pattern.kind,
      lengthTicks: segmentLengthTicks,
      metadata: {
        ...pattern.metadata,
        sourcePatternId: pattern.id,
      },
      name,
    })
  })
}
