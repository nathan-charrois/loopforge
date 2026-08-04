import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import {
  type BlockPlaybackMode,
  createBlock,
  createChordEvent,
  createChordSymbol,
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
  type Instrument,
  type Pattern,
  type PatternMetadata,
  PPQ,
  type Track,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type PatternDetails = {
  id: string
  lengthTicks: number
  metadata?: PatternMetadata
  name: string
}

type ChordSeed = Omit<Parameters<typeof createChordEvent>[0], 'id'>
type DrumSeed = Omit<Parameters<typeof createDrumHitEvent>[0], 'id'>
type NoteSeed = Omit<Parameters<typeof createNoteEvent>[0], 'id'>

type BlockSeed = {
  id: string
  lengthTicks: number
  muted?: boolean
  name: string
  patternId: string
  playbackMode: BlockPlaybackMode
  startTick: number
  track: Track
}

const BAR_START_TICKS = [
  0,
  PPQ * 4,
  PPQ * 8,
  (PPQ * 23) / 2,
  PPQ * 15,
  PPQ * 18,
  PPQ * 21,
  PPQ * 26,
] as const

export function eightfoldParallax(): Workspace {
  const harmonyTrack = createTrack({
    color: '#7950f2',
    id: 'eightfold_track_harmony',
    instrumentId: 'eightfold_instrument_harmony',
    name: 'Prismatic Harmony',
    role: 'chords',
  })
  const bassTrack = createTrack({
    color: '#20c997',
    id: 'eightfold_track_bass',
    instrumentId: 'eightfold_instrument_bass',
    name: 'Gravity Bass',
    role: 'bass',
  })
  const leadTrack = createTrack({
    color: '#f06595',
    id: 'eightfold_track_lead',
    instrumentId: 'eightfold_instrument_lead',
    name: 'Signal Lead',
    role: 'melody',
  })
  const arpeggioTrack = createTrack({
    accepts: ['chord', 'note'],
    color: '#4dabf7',
    id: 'eightfold_track_arpeggio',
    instrumentId: 'eightfold_instrument_arpeggio',
    name: 'Clockwork Arpeggios',
    role: 'melody',
  })
  const drumTrack = createTrack({
    color: '#fd7e14',
    id: 'eightfold_track_drums',
    instrumentId: 'eightfold_instrument_drums',
    name: 'Main Reactor',
    role: 'drums',
  })
  const percussionTrack = createTrack({
    color: '#fcc419',
    id: 'eightfold_track_percussion',
    instrumentId: 'eightfold_instrument_percussion',
    name: 'Orbiting Percussion',
    role: 'drums',
  })
  const tracks = [
    harmonyTrack,
    bassTrack,
    leadTrack,
    arpeggioTrack,
    drumTrack,
    percussionTrack,
  ]

  const patterns: Pattern[] = [
    createChordPattern({
      events: [
        chord(0, PPQ * 2, 2, 'minor', ['7', '9', '11'], [], { bassNote: 2, octave: 3, spread: 1, type: 'drop2' }, { gate: 0.92, style: 'block' }),
        chord(PPQ * 2, PPQ * 2, 10, 'major', ['maj7', '9'], ['#11'], { bassNote: 10, inversion: 1, octave: 3, spread: 1, type: 'open' }, { gate: 0.86, microStaggerTicks: 16, style: 'strum' }),
        chord(PPQ * 4, PPQ * 2, 5, 'add2', ['6'], [], { bassNote: 5, inversion: 2, octave: 3, type: 'spread' }, { gate: 0.82, recipeId: 'pop_ostinato', stepTicks: PPQ / 2, style: 'pattern' }),
        chord(PPQ * 6, PPQ * 2, 0, 'sus2', ['7', '9'], [], { bassNote: 0, octave: 3, spread: 1, type: 'closed' }, { gate: 0.78, recipeId: 'arp_down', stepTicks: PPQ / 4, style: 'arpeggio' }),
      ],
      id: 'eightfold_pattern_harmony_44',
      lengthTicks: PPQ * 8,
      metadata: {
        harmony: 'Dm11 · Bbmaj9(#11) · F6(add2) · C9sus2',
        meter: '4/4',
      },
      name: 'Four-Sided Prism',
    }),
    createChordPattern({
      events: [
        chord(0, (PPQ * 7) / 4, 7, 'minor', ['7', '9'], [], { bassNote: 7, octave: 3, type: 'drop2' }, { gate: 0.84, recipeId: 'arp_up', stepTicks: PPQ / 4, style: 'arpeggio' }),
        chord((PPQ * 7) / 4, (PPQ * 7) / 4, 3, 'major', ['maj7', '9'], [], { bassNote: 3, inversion: 1, octave: 3, spread: 1, type: 'open' }, { gate: 0.9, microStaggerTicks: 12, style: 'strum' }),
        chord((PPQ * 7) / 2, (PPQ * 7) / 4, 9, 'major', ['7'], ['b9'], { bassNote: 9, inversion: 2, octave: 3, type: 'closed' }, { gate: 0.72, recipeId: 'pop_ostinato', stepTicks: PPQ / 4, style: 'pattern' }),
        chord((PPQ * 21) / 4, (PPQ * 7) / 4, 10, 'major', ['maj7', '9'], ['#11'], { bassNote: 10, octave: 3, spread: 2, type: 'spread' }, { gate: 0.94, style: 'block' }),
      ],
      id: 'eightfold_pattern_harmony_78',
      lengthTicks: PPQ * 7,
      metadata: {
        grouping: '3 + 2 + 2',
        harmony: 'Gm9 · Ebmaj9 · A7(b9) · Bbmaj9(#11)',
        meter: '7/8',
      },
      name: 'Seven-Sided Turn',
    }),
    createChordPattern({
      events: [
        chord(0, (PPQ * 3) / 2, 2, 'minor', ['7', '9'], [], { bassNote: 2, inversion: 1, octave: 3, type: 'drop2' }, { gate: 0.88, style: 'block' }),
        chord((PPQ * 3) / 2, (PPQ * 3) / 2, 7, 'sus4', ['7', '9', '13'], [], { bassNote: 7, octave: 3, spread: 1, type: 'open' }, { gate: 0.76, recipeId: 'arp_up', stepTicks: PPQ / 4, style: 'arpeggio' }),
        chord(PPQ * 3, (PPQ * 3) / 2, 3, 'major', ['maj7', '9'], [], { bassNote: 3, inversion: 2, octave: 3, spread: 1, type: 'spread' }, { gate: 0.9, microStaggerTicks: 20, style: 'strum' }),
        chord((PPQ * 9) / 2, (PPQ * 3) / 2, 9, 'augmented', ['7'], ['b9'], { bassNote: 9, octave: 3, type: 'closed' }, { gate: 0.7, recipeId: 'pop_ostinato', stepTicks: PPQ / 4, style: 'pattern' }),
      ],
      id: 'eightfold_pattern_harmony_34',
      lengthTicks: PPQ * 6,
      metadata: {
        modalInterchange: 'Ebmaj9 is the borrowed bII from D Phrygian; Aaug7(b9) pulls it back toward D.',
        meter: '3/4',
      },
      name: 'Three-Sided Refraction',
    }),
    createChordPattern({
      events: [
        chord(0, (PPQ * 5) / 2, 2, 'minor', ['7', '9', '11'], [], { bassNote: 2, octave: 3, spread: 1, type: 'drop2' }, { gate: 0.94, recipeId: 'arp_down', stepTicks: PPQ / 2, style: 'arpeggio' }),
        chord((PPQ * 5) / 2, (PPQ * 5) / 2, 5, 'major', ['maj7', '9'], [], { bassNote: 5, inversion: 1, octave: 3, type: 'open' }, { gate: 0.88, style: 'block' }),
        chord(PPQ * 5, (PPQ * 5) / 4, 10, 'major', ['maj7', '9'], [], { bassNote: 10, inversion: 2, octave: 3, spread: 1, type: 'spread' }, { gate: 0.78, microStaggerTicks: 14, style: 'strum' }),
        chord((PPQ * 25) / 4, (PPQ * 5) / 4, 9, 'major', ['7', '9'], ['b9', '#5'], { bassNote: 9, octave: 3, type: 'closed' }, { gate: 0.68, recipeId: 'pop_ostinato', stepTicks: PPQ / 4, style: 'pattern' }),
        chord((PPQ * 15) / 2, (PPQ * 5) / 2, 2, 'minor', ['6', '9'], [], { bassNote: 2, octave: 3, spread: 2, type: 'spread' }, { gate: 0.96, style: 'block' }),
      ],
      id: 'eightfold_pattern_harmony_54',
      lengthTicks: PPQ * 10,
      metadata: {
        grouping: '3 + 2',
        harmony: 'Dm11 · Fmaj9 · Bbmaj9 · A7(b9,#5) · Dm6/9',
        meter: '5/4',
      },
      name: 'Five-Sided Landing',
    }),
    createChordPattern({
      events: [chord(0, PPQ, 0, 'add4', ['6'], [], { inversion: 2, octave: 4, type: 'spread' }, { gate: 0.72, style: 'block' })],
      id: 'eightfold_pattern_harmony_stab_add4',
      lengthTicks: PPQ,
      name: 'Add-Four Halo',
    }),
    createChordPattern({
      events: [chord(0, PPQ, 2, 'sus2', ['6', '9'], [], { bassNote: 2, octave: 4, spread: 1, type: 'open' }, { gate: 0.8, recipeId: 'arp_down', stepTicks: PPQ / 8, style: 'arpeggio' })],
      id: 'eightfold_pattern_harmony_stab_sus2',
      lengthTicks: PPQ,
      name: 'Suspended Beacon',
    }),
    createNotePattern({
      events: bassPulse([38, 45, 48, 50, 34, 41, 45, 48], PPQ / 2),
      id: 'eightfold_pattern_bass_44',
      lengthTicks: PPQ * 4,
      metadata: { contour: 'D–A–C–D answering Bb–F–A–C' },
      name: 'Four-Step Gravity',
    }),
    createNotePattern({
      events: bassPulse([43, 50, 53, 46, 33, 40, 45], PPQ / 2),
      id: 'eightfold_pattern_bass_78',
      lengthTicks: (PPQ * 7) / 2,
      metadata: { contour: 'Seven eighth-note cells reinforce the 3+2+2 grouping.' },
      name: 'Seven-Step Gravity',
    }),
    createNotePattern({
      events: bassPulse([38, 45, 41, 39, 45, 33], PPQ / 2),
      id: 'eightfold_pattern_bass_34',
      lengthTicks: PPQ * 3,
      metadata: { contour: 'A compact waltz orbit under the borrowed bII.' },
      name: 'Three-Step Gravity',
    }),
    createNotePattern({
      events: bassPulse([38, 45, 50, 41, 45, 46, 41, 33, 45, 38], PPQ / 2),
      id: 'eightfold_pattern_bass_54',
      lengthTicks: PPQ * 5,
      metadata: { contour: 'A ten-cell 5/4 line resolves through A to a low D.' },
      name: 'Five-Step Gravity',
    }),
    createNotePattern({
      events: [
        note(0, PPQ / 4, 45, 82),
        note(PPQ / 4, PPQ / 4, 48, 88),
        note(PPQ / 2, PPQ / 4, 52, 94),
        note((PPQ * 3) / 4, PPQ / 4, 57, 102),
      ],
      id: 'eightfold_pattern_bass_fill',
      lengthTicks: PPQ,
      name: 'Gravity Slingshot',
    }),

    createNotePattern({
      events: motif([74, 77, 81, 79, 77, 74, 72, 69], PPQ / 2, 72),
      id: 'eightfold_pattern_lead_44',
      lengthTicks: PPQ * 4,
      metadata: { motif: 'D–F–A–G–F–D–C–A, the core parallax signal.' },
      name: 'Signal A',
    }),
    createNotePattern({
      events: motif([74, 77, 79, 82, 81, 77, 76], PPQ / 2, 74),
      id: 'eightfold_pattern_lead_78',
      lengthTicks: (PPQ * 7) / 2,
      name: 'Signal B · Crooked',
    }),
    createNotePattern({
      events: motif([86, 84, 81, 79, 77, 76], PPQ / 2, 70),
      id: 'eightfold_pattern_lead_34',
      lengthTicks: PPQ * 3,
      name: 'Signal C · Falling',
    }),
    createNotePattern({
      events: motif([74, 81, 77, 84, 82, 79, 77, 76, 74, 69], PPQ / 2, 76),
      id: 'eightfold_pattern_lead_54',
      lengthTicks: PPQ * 5,
      name: 'Signal D · Expanded',
    }),
    createNotePattern({
      events: [
        note(0, PPQ / 4, 69, 62),
        note(PPQ / 4, PPQ / 4, 72, 68),
        note(PPQ / 2, PPQ / 4, 74, 74),
        note((PPQ * 3) / 4, PPQ / 4, 77, 80),
      ],
      id: 'eightfold_pattern_lead_pickup',
      lengthTicks: PPQ,
      name: 'Signal Pickup',
    }),
    createNotePattern({
      events: [
        note(0, PPQ / 2, 86, 80),
        note(PPQ / 2, PPQ / 4, 84, 74),
        note((PPQ * 3) / 4, PPQ / 4, 81, 70),
        note(PPQ, PPQ / 2, 74, 84),
      ],
      id: 'eightfold_pattern_lead_answer',
      lengthTicks: (PPQ * 3) / 2,
      name: 'Signal Answer',
    }),

    createChordPattern({
      events: [chord(0, PPQ * 4, 2, 'minor', ['7', '9'], [], { octave: 4, spread: 2, type: 'spread' }, { gate: 0.56, recipeId: 'arp_up', stepTicks: PPQ / 4, style: 'arpeggio' })],
      id: 'eightfold_pattern_arp_up',
      lengthTicks: PPQ * 4,
      name: 'Ascending Clock',
    }),
    createChordPattern({
      events: [chord(0, (PPQ * 7) / 2, 10, 'major', ['maj7', '9'], ['#11'], { inversion: 1, octave: 4, type: 'drop2' }, { gate: 0.48, recipeId: 'arp_down', stepTicks: PPQ / 4, style: 'arpeggio' })],
      id: 'eightfold_pattern_arp_down',
      lengthTicks: (PPQ * 7) / 2,
      name: 'Descending Clock',
    }),
    createChordPattern({
      events: [chord(0, PPQ * 3, 3, 'major', ['maj7', '9'], [], { octave: 4, spread: 1, type: 'open' }, { gate: 0.66, microStaggerTicks: 24, recipeId: 'block_staggered', style: 'strum' })],
      id: 'eightfold_pattern_arp_strum',
      lengthTicks: PPQ * 3,
      name: 'Fanned Clock',
    }),
    createChordPattern({
      events: [chord(0, PPQ * 5, 2, 'minor', ['6', '9'], [], { octave: 4, spread: 2, type: 'spread' }, { gate: 0.58, recipeId: 'pop_ostinato', stepTicks: PPQ / 2, style: 'pattern' })],
      id: 'eightfold_pattern_arp_ostinato',
      lengthTicks: PPQ * 5,
      name: 'Ostinato Clock',
    }),
    createNotePattern({
      events: [
        note(0, PPQ / 4, 86, 58),
        note(PPQ / 2, PPQ / 4, 89, 64),
        note(PPQ, PPQ / 4, 93, 70),
        note((PPQ * 3) / 2, PPQ / 4, 96, 76),
      ],
      id: 'eightfold_pattern_arp_sparks',
      lengthTicks: PPQ * 2,
      name: 'Clock Sparks',
    }),

    createDrumPattern({
      events: mainGroove(PPQ * 4, [0, 2, 4, 5.5], [2, 6], 8),
      id: 'eightfold_pattern_drums_44',
      lengthTicks: PPQ * 4,
      metadata: { feel: 'Syncopated 16ths around a firm two-and-four backbeat.' },
      name: 'Reactor Four',
    }),
    createDrumPattern({
      events: mainGroove((PPQ * 7) / 2, [0, 3, 5], [3, 5.5], 7),
      id: 'eightfold_pattern_drums_78',
      lengthTicks: (PPQ * 7) / 2,
      metadata: { feel: 'A 3+2+2 kick contour with displaced snares.' },
      name: 'Reactor Seven',
    }),
    createDrumPattern({
      events: mainGroove(PPQ * 3, [0, 3.5], [2, 4], 6),
      id: 'eightfold_pattern_drums_34',
      lengthTicks: PPQ * 3,
      metadata: { feel: 'Half-time waltz pressure.' },
      name: 'Reactor Three',
    }),
    createDrumPattern({
      events: mainGroove(PPQ * 5, [0, 3, 6, 8.5], [2, 6, 9], 10),
      id: 'eightfold_pattern_drums_54',
      lengthTicks: PPQ * 5,
      metadata: { feel: 'A 3+2 finale with an extra kick before the turn.' },
      name: 'Reactor Five',
    }),
    createDrumPattern({
      events: [
        drum(0, 'snare', 58),
        drum(PPQ / 4, 'snare', 70),
        drum(PPQ / 2, 'snare', 84),
        drum((PPQ * 3) / 4, 'snare', 102),
      ],
      id: 'eightfold_pattern_drums_fill_snare',
      lengthTicks: PPQ,
      name: 'Snare Singularity',
    }),
    createDrumPattern({
      events: [
        drum(0, 'kick', 96),
        drum(PPQ / 4, 'lowTom', 72),
        drum(PPQ / 2, 'midTom', 82),
        drum((PPQ * 3) / 4, 'highTom', 94),
      ],
      id: 'eightfold_pattern_drums_fill_toms',
      lengthTicks: PPQ,
      name: 'Tom Gravity Well',
    }),

    createDrumPattern({
      events: percussionOrbit(PPQ * 4, 8, 'ride'),
      id: 'eightfold_pattern_percussion_44',
      lengthTicks: PPQ * 4,
      name: 'Ride Orbit',
    }),
    createDrumPattern({
      events: percussionOrbit((PPQ * 7) / 2, 7, 'closedHat'),
      id: 'eightfold_pattern_percussion_78',
      lengthTicks: (PPQ * 7) / 2,
      name: 'Seven Orbit',
    }),
    createDrumPattern({
      events: percussionOrbit(PPQ * 3, 6, 'openHat'),
      id: 'eightfold_pattern_percussion_34',
      lengthTicks: PPQ * 3,
      name: 'Open Orbit',
    }),
    createDrumPattern({
      events: percussionOrbit(PPQ * 5, 10, 'ride'),
      id: 'eightfold_pattern_percussion_54',
      lengthTicks: PPQ * 5,
      name: 'Wide Orbit',
    }),
    createDrumPattern({
      events: [
        drum(0, 'crash', 96),
        drum(PPQ / 2, 'clap', 74),
      ],
      id: 'eightfold_pattern_percussion_crash',
      lengthTicks: PPQ,
      name: 'Crash Comet',
    }),
    createDrumPattern({
      events: [
        drum(0, 'lowTom', 68),
        drum(PPQ / 4, 'midTom', 76),
        drum(PPQ / 2, 'highTom', 86),
        drum((PPQ * 3) / 4, 'clap', 98),
      ],
      id: 'eightfold_pattern_percussion_tom_comet',
      lengthTicks: PPQ,
      name: 'Tom Comet',
    }),

    createNotePattern({
      events: pad([50, 57, 64, 69], PPQ * 8, 42),
      id: 'eightfold_pattern_texture_44',
      lengthTicks: PPQ * 8,
      name: 'Violet Glass',
    }),
    createNotePattern({
      events: pad([46, 53, 62, 69], PPQ * 7, 44),
      id: 'eightfold_pattern_texture_78',
      lengthTicks: PPQ * 7,
      name: 'Crooked Glass',
    }),
    createNotePattern({
      events: pad([39, 51, 58, 65], PPQ * 6, 46),
      id: 'eightfold_pattern_texture_34',
      lengthTicks: PPQ * 6,
      name: 'Phrygian Glass',
    }),
    createNotePattern({
      events: pad([38, 50, 57, 64, 69], PPQ * 10, 48),
      id: 'eightfold_pattern_texture_54',
      lengthTicks: PPQ * 10,
      name: 'Homeward Glass',
    }),
    createChordPattern({
      events: [chord(0, PPQ * 2, 9, 'sus4', ['9', '13'], [], { octave: 5, spread: 2, type: 'spread' }, { gate: 0.9, microStaggerTicks: 28, style: 'strum' })],
      id: 'eightfold_pattern_texture_chord',
      lengthTicks: PPQ * 2,
      name: 'Glass Crown',
    }),
    createNotePattern({
      events: [
        note(0, PPQ / 2, 98, 42),
        note(PPQ / 2, PPQ / 2, 93, 46),
        note(PPQ, PPQ / 2, 89, 50),
        note((PPQ * 3) / 2, PPQ / 2, 86, 54),
      ],
      id: 'eightfold_pattern_texture_shards',
      lengthTicks: PPQ * 2,
      name: 'Falling Shards',
    }),
  ]

  const blocks = [
    block('harmony_44', harmonyTrack, 'eightfold_pattern_harmony_44', 0, PPQ * 8, 'oneShot', 'Four-Sided Prism'),
    block('harmony_78', harmonyTrack, 'eightfold_pattern_harmony_78', bar(3), PPQ * 7, 'oneShot', 'Seven-Sided Turn'),
    block('harmony_34', harmonyTrack, 'eightfold_pattern_harmony_34', bar(5), PPQ * 6, 'oneShot', 'Three-Sided Refraction'),
    block('harmony_54', harmonyTrack, 'eightfold_pattern_harmony_54', bar(7), PPQ * 10, 'oneShot', 'Five-Sided Landing'),

    block('harmony_stab_add4', harmonyTrack, 'eightfold_pattern_harmony_stab_add4', bar(6) + (PPQ * 2), PPQ, 'oneShot', 'Overlap · Add-Four Halo'),
    block('harmony_stab_sus2', harmonyTrack, 'eightfold_pattern_harmony_stab_sus2', bar(8) + (PPQ * 4), PPQ, 'stretch', 'Overlap · Suspended Beacon'),

    block('bass_44', bassTrack, 'eightfold_pattern_bass_44', bar(1), PPQ * 8, 'loop', 'Gravity · 4/4 Loop'),
    block('bass_78', bassTrack, 'eightfold_pattern_bass_78', bar(3), PPQ * 7, 'loop', 'Gravity · 7/8 Loop'),
    block('bass_34', bassTrack, 'eightfold_pattern_bass_34', bar(5), PPQ * 6, 'stretch', 'Gravity · 3/4 Stretch'),
    block('bass_54', bassTrack, 'eightfold_pattern_bass_54', bar(7), PPQ * 10, 'loop', 'Gravity · 5/4 Loop'),
    block('bass_fill', bassTrack, 'eightfold_pattern_bass_fill', bar(8) + (PPQ * 7) / 2, (PPQ * 3) / 2, 'stretch', 'Overlap · Gravity Slingshot'),

    block('lead_44', leadTrack, 'eightfold_pattern_lead_44', bar(1), PPQ * 8, 'loop', 'Signal A · Doubled'),
    block('lead_pickup', leadTrack, 'eightfold_pattern_lead_pickup', bar(3) - PPQ, PPQ * 2, 'stretch', 'Overlap · Signal Pickup'),
    block('lead_78', leadTrack, 'eightfold_pattern_lead_78', bar(3), PPQ * 7, 'loop', 'Signal B · Crooked'),
    block('lead_34', leadTrack, 'eightfold_pattern_lead_34', bar(5), PPQ * 6, 'stretch', 'Signal C · Falling'),
    block('lead_54', leadTrack, 'eightfold_pattern_lead_54', bar(7), PPQ * 10, 'loop', 'Signal D · Expanded'),
    block('lead_answer', leadTrack, 'eightfold_pattern_lead_answer', bar(8) + (PPQ * 7) / 2, (PPQ * 3) / 2, 'oneShot', 'Overlap · Signal Answer'),

    block('arp_up', arpeggioTrack, 'eightfold_pattern_arp_up', bar(1), PPQ * 8, 'loop', 'Ascending Clock'),
    block('arp_down', arpeggioTrack, 'eightfold_pattern_arp_down', bar(3), PPQ * 7, 'loop', 'Descending Clock'),
    block('arp_strum', arpeggioTrack, 'eightfold_pattern_arp_strum', bar(5), PPQ * 6, 'loop', 'Fanned Clock'),
    block('arp_ostinato', arpeggioTrack, 'eightfold_pattern_arp_ostinato', bar(7), PPQ * 10, 'loop', 'Ostinato Clock'),
    block('arp_sparks_a', arpeggioTrack, 'eightfold_pattern_arp_sparks', bar(4) + PPQ, PPQ * 2, 'oneShot', 'Overlap · Clock Sparks A'),
    block('arp_sparks_b', arpeggioTrack, 'eightfold_pattern_arp_sparks', bar(8) + PPQ * 3, PPQ * 2, 'stretch', 'Overlap · Clock Sparks B'),

    block('drums_44', drumTrack, 'eightfold_pattern_drums_44', bar(1), PPQ * 8, 'loop', 'Reactor Four'),
    block('drums_78', drumTrack, 'eightfold_pattern_drums_78', bar(3), PPQ * 7, 'loop', 'Reactor Seven'),
    block('drums_34', drumTrack, 'eightfold_pattern_drums_34', bar(5), PPQ * 6, 'loop', 'Reactor Three'),
    block('drums_54', drumTrack, 'eightfold_pattern_drums_54', bar(7), PPQ * 10, 'loop', 'Reactor Five'),
    block('drums_fill_a', drumTrack, 'eightfold_pattern_drums_fill_snare', bar(2) + PPQ * 3, PPQ, 'oneShot', 'Overlap · Snare Singularity'),
    block('drums_fill_b', drumTrack, 'eightfold_pattern_drums_fill_toms', bar(4) + (PPQ * 5) / 2, PPQ, 'stretch', 'Overlap · Tom Gravity Well'),
    block('drums_fill_c', drumTrack, 'eightfold_pattern_drums_fill_snare', bar(6) + PPQ * 2, PPQ, 'loop', 'Overlap · Snare Return'),
    block('drums_fill_d', drumTrack, 'eightfold_pattern_drums_fill_toms', bar(8) + PPQ * 4, PPQ, 'oneShot', 'Overlap · Final Gravity Well'),

    block('percussion_44', percussionTrack, 'eightfold_pattern_percussion_44', bar(1), PPQ * 8, 'loop', 'Ride Orbit'),
    block('percussion_78', percussionTrack, 'eightfold_pattern_percussion_78', bar(3), PPQ * 7, 'loop', 'Seven Orbit'),
    block('percussion_34', percussionTrack, 'eightfold_pattern_percussion_34', bar(5), PPQ * 6, 'loop', 'Open Orbit'),
    block('percussion_54', percussionTrack, 'eightfold_pattern_percussion_54', bar(7), PPQ * 10, 'loop', 'Wide Orbit'),
    block('percussion_crash_a', percussionTrack, 'eightfold_pattern_percussion_crash', bar(3), PPQ, 'oneShot', 'Overlap · Crash Comet A'),
    block('percussion_crash_b', percussionTrack, 'eightfold_pattern_percussion_crash', bar(5), PPQ, 'stretch', 'Overlap · Crash Comet B'),
    block('percussion_toms', percussionTrack, 'eightfold_pattern_percussion_tom_comet', bar(7) - PPQ, PPQ * 2, 'stretch', 'Overlap · Tom Comet'),
  ]

  return createWorkspace({
    arrangement: {
      blocks,
      sections: [
        createSection({
          id: 'eightfold_section_square',
          lengthTicks: PPQ * 8,
          name: 'I · Square Portal · 4/4',
          startTick: bar(1),
        }),
        createSection({
          id: 'eightfold_section_heptagon',
          lengthTicks: PPQ * 7,
          name: 'II · Heptagon Engine · 7/8',
          startTick: bar(3),
        }),
        createSection({
          id: 'eightfold_section_triangle',
          lengthTicks: PPQ * 6,
          name: 'III · Triangle Mirror · 3/4',
          startTick: bar(5),
        }),
        createSection({
          id: 'eightfold_section_pentagon',
          lengthTicks: PPQ * 10,
          name: 'IV · Pentagon Return · 5/4',
          startTick: bar(7),
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: { attack: 0.02, decay: 0.7, release: 1.4, sustain: 0.54 },
        filter: { cutoffHz: 2600, resonance: 2.6, type: 'lowpass' },
        id: harmonyTrack.instrumentId,
        name: 'Prismatic Poly-Synth',
        oscilators: [
          createSynthOscillator({ level: 0.52, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -7, level: 0.24, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 7, level: 0.18, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'keys.prismatic',
      }),
      createThorInstrument({
        envelope: { attack: 0.008, decay: 0.34, release: 0.24, sustain: 0.68 },
        filter: { cutoffHz: 820, resonance: 4.2, type: 'lowpass' },
        id: bassTrack.instrumentId,
        name: 'Subgravity Engine',
        oscilators: [
          createSynthOscillator({ level: 0.62, octave: -1, waveform: 'sine' }),
          createSynthOscillator({ level: 0.38, octave: -1, waveform: 'sine' }),
        ],
        soundId: 'bass.subgravity',
      }),
      createThorInstrument({
        envelope: { attack: 0.004, decay: 0.28, release: 0.38, sustain: 0.34 },
        filter: { cutoffHz: 3200, resonance: 7.4, type: 'bandpass' },
        id: leadTrack.instrumentId,
        name: 'Signal Beacon',
        oscilators: [
          createSynthOscillator({ level: 0.46, waveform: 'square' }),
          createSynthOscillator({ detuneCents: 9, level: 0.34, waveform: 'triangle' }),
          createSynthOscillator({ level: 0.2, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'lead.signal',
      }),
      createThorInstrument({
        envelope: { attack: 0.002, decay: 0.18, release: 0.16, sustain: 0.16 },
        filter: { cutoffHz: 4800, resonance: 5.6, type: 'highpass' },
        id: arpeggioTrack.instrumentId,
        name: 'Clockwork Pluck',
        oscilators: [
          createSynthOscillator({ detuneCents: -5, level: 0.56, waveform: 'sawtooth' }),
          createSynthOscillator({ detuneCents: 5, level: 0.28, waveform: 'square' }),
          createSynthOscillator({ level: 0.16, octave: 1, waveform: 'triangle' }),
        ],
        soundId: 'pluck.clockwork',
      }),
      createDrumInstrument({
        id: drumTrack.instrumentId,
        name: 'Main Reactor Kit',
        pieces: {
          closedHat: createDrumPieceSound({ durationSeconds: 0.055, pitchSemitones: -2, soundId: 'drums.closedHat.default', volumeDb: -9 }),
          highTom: createDrumPieceSound({ durationSeconds: 0.2, pitchSemitones: 3, soundId: 'drums.highTom.default', volumeDb: -3 }),
          kick: createDrumPieceSound({ durationSeconds: 0.42, pitchSemitones: -7, soundId: 'drums.kick.default', volumeDb: 8 }),
          lowTom: createDrumPieceSound({ durationSeconds: 0.32, pitchSemitones: -5, soundId: 'drums.lowTom.default', volumeDb: -2 }),
          midTom: createDrumPieceSound({ durationSeconds: 0.26, pitchSemitones: -1, soundId: 'drums.midTom.default', volumeDb: -2 }),
          openHat: createDrumPieceSound({ durationSeconds: 0.24, pitchSemitones: -3, soundId: 'drums.openHat.default', volumeDb: -8 }),
          snare: createDrumPieceSound({ durationSeconds: 0.13, pitchSemitones: -2, soundId: 'drums.snare.default', volumeDb: -4 }),
        },
      }),
      createDrumInstrument({
        id: percussionTrack.instrumentId,
        name: 'Orbital Metals and Toms',
        pieces: {
          clap: createDrumPieceSound({ durationSeconds: 0.15, pitchSemitones: -2, soundId: 'drums.clap.default', volumeDb: -5 }),
          closedHat: createDrumPieceSound({ durationSeconds: 0.04, pitchSemitones: 3, soundId: 'drums.closedHat.default', volumeDb: -12 }),
          crash: createDrumPieceSound({ durationSeconds: 0.72, pitchSemitones: -4, soundId: 'drums.crash.default', volumeDb: -10 }),
          highTom: createDrumPieceSound({ durationSeconds: 0.18, pitchSemitones: 5, soundId: 'drums.highTom.default', volumeDb: -4 }),
          lowTom: createDrumPieceSound({ durationSeconds: 0.34, pitchSemitones: -7, soundId: 'drums.lowTom.default', volumeDb: -3 }),
          midTom: createDrumPieceSound({ durationSeconds: 0.26, pitchSemitones: -1, soundId: 'drums.midTom.default', volumeDb: -4 }),
          openHat: createDrumPieceSound({ durationSeconds: 0.2, pitchSemitones: 1, soundId: 'drums.openHat.default', volumeDb: -11 }),
          ride: createDrumPieceSound({ durationSeconds: 0.38, pitchSemitones: -2, soundId: 'drums.ride.default', volumeDb: -12 }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: harmonyTrack.mixChannelId, pan: -0.18, volumeDb: -12 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: 0 }),
        createMixChannel({ id: leadTrack.mixChannelId, pan: 0.2, volumeDb: -12, muted: true }),
        createMixChannel({ id: arpeggioTrack.mixChannelId, pan: -0.52, volumeDb: -17, muted: true }),
        createMixChannel({ id: drumTrack.mixChannelId, pan: 0, volumeDb: 3 }),
        createMixChannel({ id: percussionTrack.mixChannelId, pan: 0.58, volumeDb: -12 }),
      ]),
      master: { muted: false, volumeDb: 0 },
    }),
    patterns: createEntityStore(patterns),
    project: createProject({
      id: 'project_eightfold_parallax',
      metadata: createProjectMetadata({
        description: 'An eight-bar mixed-meter maximalist demo: nine Tracks, every Track role and PatternEvent kind, layered same-Track overlaps, all Block playback modes, two instrument kinds, all ten drum pieces, four oscillator waveforms, three filter types, three automation targets, and a deliberately muted alternate Block.',
        tags: ['3/4', '4/4', '5/4', '7/8', 'automation', 'complex', 'demo', 'mixed-meter', 'overlapping-blocks'],
      }),
      name: 'Eightfold Parallax',
    }),
    timeline: createTimeline({
      grid: 'thirtySecondNote',
      keyEvents: [
        createKeyEvent({ id: 'eightfold_key_d_dorian', key: { mode: 'dorian', tonic: 2 }, tick: bar(1) }),
        createKeyEvent({ id: 'eightfold_key_bb_lydian', key: { mode: 'lydian', tonic: 10 }, tick: bar(3) }),
        createKeyEvent({ id: 'eightfold_key_d_phrygian', key: { mode: 'phrygian', tonic: 2 }, tick: bar(5) }),
        createKeyEvent({ id: 'eightfold_key_d_minor', key: { mode: 'minor', tonic: 2 }, tick: bar(7) }),
      ],
      meterEvents: [
        createMeterEvent({ id: 'eightfold_meter_44', tick: bar(1), timeSignature: { denominator: 4, numerator: 4 } }),
        createMeterEvent({ id: 'eightfold_meter_78', tick: bar(3), timeSignature: { denominator: 8, numerator: 7 } }),
        createMeterEvent({ id: 'eightfold_meter_34', tick: bar(5), timeSignature: { denominator: 4, numerator: 3 } }),
        createMeterEvent({ id: 'eightfold_meter_54', tick: bar(7), timeSignature: { denominator: 4, numerator: 5 } }),
      ],
      tempoEvents: [
        createTempoEvent({ bpm: 112, id: 'eightfold_tempo_112', tick: bar(1) }),
        createTempoEvent({ bpm: 126, id: 'eightfold_tempo_126', tick: bar(3) }),
        createTempoEvent({ bpm: 96, id: 'eightfold_tempo_96', tick: bar(5) }),
        createTempoEvent({ bpm: 118, id: 'eightfold_tempo_118', tick: bar(7) }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function bar(barNumber: number): number {
  return BAR_START_TICKS[barNumber - 1]
}

function block(
  id: string,
  track: Track,
  patternId: string,
  startTick: number,
  lengthTicks: number,
  playbackMode: BlockPlaybackMode,
  name: string,
  muted = false,
) {
  return createDemoBlock({
    id,
    lengthTicks,
    muted,
    name,
    patternId,
    playbackMode,
    startTick,
    track,
  })
}

function chord(
  timeTick: number,
  durationTicks: number,
  root: Parameters<typeof createChordSymbol>[0]['root'],
  quality: Parameters<typeof createChordSymbol>[0]['quality'],
  extensions: Parameters<typeof createChordSymbol>[0]['extensions'],
  alterations: Parameters<typeof createChordSymbol>[0]['alterations'],
  voicing: NonNullable<ChordSeed['voicing']>,
  playback: NonNullable<ChordSeed['playback']>,
  velocity = 72,
): ChordSeed {
  return {
    chord: createChordSymbol({ alterations, extensions, quality, root }),
    durationTicks,
    playback,
    timeTick,
    velocity,
    voicing,
  }
}

function drum(timeTick: number, piece: DrumSeed['piece'], velocity: number): DrumSeed {
  return { piece, timeTick, velocity }
}

function note(timeTick: number, durationTicks: number, pitch: number, velocity: number): NoteSeed {
  return { durationTicks, pitch, timeTick, velocity }
}

function bassPulse(pitches: readonly number[], stepTicks: number): NoteSeed[] {
  return pitches.map((pitch, index) => note(
    index * stepTicks,
    stepTicks - (PPQ / 16),
    pitch,
    76 + ((index % 4) * 4),
  ))
}

function mainGroove(
  lengthTicks: number,
  kickSteps: readonly number[],
  snareSteps: readonly number[],
  eighthCount: number,
): DrumSeed[] {
  const events = [
    ...kickSteps.map((step, index) => drum(step * (PPQ / 2), 'kick', index === 0 ? 112 : 88 - ((index % 3) * 5))),
    ...snareSteps.map((step, index) => drum(step * (PPQ / 2), 'snare', index % 2 === 0 ? 102 : 64)),
  ]

  for (let eighth = 0; eighth < eighthCount; eighth += 1) {
    events.push(drum(eighth * (PPQ / 2), 'closedHat', eighth % 2 === 0 ? 54 : 42))

    if (eighth < eighthCount - 1) {
      events.push(drum((eighth * (PPQ / 2)) + (PPQ / 4), 'closedHat', 30 + ((eighth % 3) * 4)))
    }
  }

  events.push(drum(lengthTicks - (PPQ / 2), 'openHat', 62))

  return events
}

function motif(pitches: readonly number[], stepTicks: number, velocity: number): NoteSeed[] {
  return pitches.map((pitch, index) => note(
    index * stepTicks,
    stepTicks - (PPQ / 16),
    pitch,
    velocity + ((index % 4) * 4),
  ))
}

function pad(pitches: readonly number[], durationTicks: number, velocity: number): NoteSeed[] {
  return pitches.map((pitch, index) => note(
    0,
    durationTicks - (PPQ / 8),
    pitch,
    velocity - (index * 2),
  ))
}

function percussionOrbit(
  lengthTicks: number,
  eighthCount: number,
  cymbal: 'closedHat' | 'openHat' | 'ride',
): DrumSeed[] {
  const events: DrumSeed[] = []

  for (let eighth = 0; eighth < eighthCount; eighth += 1) {
    events.push(drum(eighth * (PPQ / 2), cymbal, 38 + ((eighth % 4) * 5)))

    if (eighth % 2 === 1) {
      events.push(drum((eighth * (PPQ / 2)) - (PPQ / 8), 'clap', 34 + ((eighth % 3) * 4)))
    }
  }

  events.push(drum(lengthTicks - (PPQ / 2), 'lowTom', 54))
  events.push(drum(lengthTicks - (PPQ / 4), 'midTom', 62))

  return events
}

function createChordPattern(input: PatternDetails & { events: readonly ChordSeed[] }): Pattern {
  return createPattern({
    events: input.events.map((event, index) => createChordEvent({
      ...event,
      id: `${input.id}_event_${index + 1}`,
    })),
    id: input.id,
    kind: 'chord',
    lengthTicks: input.lengthTicks,
    metadata: input.metadata,
    name: input.name,
  })
}

function createDemoBlock(input: BlockSeed) {
  return createBlock({
    color: input.track.color,
    id: `eightfold_block_${input.id}`,
    lengthTicks: input.lengthTicks,
    muted: input.muted,
    name: input.name,
    patternId: input.patternId,
    playbackMode: input.playbackMode,
    startTick: input.startTick,
    trackId: input.track.id,
  })
}

function createDrumPattern(input: PatternDetails & { events: readonly DrumSeed[] }): Pattern {
  const seedEvents = input.events.map((event, index) => createDrumHitEvent({
    ...event,
    id: `${input.id}_seed_${index + 1}`,
  }))

  return createPattern({
    events: createDrumHitEvents(`${input.id}_event`, seedEvents),
    id: input.id,
    kind: 'drum',
    lengthTicks: input.lengthTicks,
    metadata: input.metadata,
    name: input.name,
  })
}

function createNotePattern(input: PatternDetails & { events: readonly NoteSeed[] }): Pattern {
  const seedEvents = input.events.map((event, index) => createNoteEvent({
    ...event,
    id: `${input.id}_seed_${index + 1}`,
  }))

  return createPattern({
    events: createNoteEvents(`${input.id}_event`, seedEvents),
    id: input.id,
    kind: 'note',
    lengthTicks: input.lengthTicks,
    metadata: input.metadata,
    name: input.name,
  })
}
