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
  createSubtractorInstrument,
  createSynthOscillator,
  createTempoEvent,
  createThorInstrument,
  createTimeline,
  createTrack,
  type DrumHitEvent,
  type DrumPiece,
  type DurationTicks,
  type Instrument,
  type MidiNote,
  type NoteEvent,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type PulseBar = {
  cell: readonly MidiNote[]
  pulseCount?: number
  velocityOffset: number
}

type VoicingGesture = {
  durationTicks: DurationTicks
  pitches: readonly MidiNote[]
  startTick: number
  velocity: number
}

type BassBar = {
  approachPitch: MidiNote
  rootPitch: MidiNote
  velocity: number
}

export function vesperCircuit(): Workspace {
  const barTicks = PPQ * 4
  const passTicks = barTicks * 16
  const totalTicks = passTicks * 2
  const pulseTicks = PPQ / 4
  const noteGapTicks = PPQ / 16
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const pulseColor = '#fcc419'
  const padColor = '#9775fa'
  const bassColor = '#20c997'
  const drumsColor = '#ff6b6b'
  const driveColor = '#66d9e8'
  const pulseTrack = createTrack({
    color: pulseColor,
    id: 'vesper_circuit_track_pulse',
    instrumentId: 'vesper_circuit_pulse',
    name: 'Clockglass Pulse',
    role: 'melody',
  })
  const padTrack = createTrack({
    accepts: ['note'],
    color: padColor,
    id: 'vesper_circuit_track_pad',
    instrumentId: 'vesper_circuit_pad',
    name: 'Vesper Glass',
    role: 'chords',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'vesper_circuit_track_bass',
    instrumentId: 'vesper_circuit_bass',
    name: 'Understory Current',
    role: 'bass',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'vesper_circuit_track_drums',
    instrumentId: 'vesper_circuit_drums',
    name: 'Soft Relay',
    role: 'drums',
  })
  const driveTrack = createTrack({
    color: driveColor,
    id: 'vesper_circuit_track_drive',
    instrumentId: 'vesper_circuit_drive',
    name: 'Velvet Drive',
    role: 'bass',
  })
  const tracks = [pulseTrack, padTrack, bassTrack, driveTrack, drumsTrack]
  const firstPassPulseBars: readonly PulseBar[] = [
    { cell: [69, 76, 73, 76, 78], velocityOffset: 0 },
    { cell: [69, 76, 73, 76, 80], velocityOffset: 1 },
    { cell: [66, 73, 69, 73, 76], velocityOffset: 2 },
    { cell: [64, 71, 68, 71, 73], velocityOffset: 1 },

    // The cell expands by one note and begins reaching into the upper octave.
    { cell: [69, 76, 73, 80, 78, 76], velocityOffset: 4 },
    { cell: [62, 69, 66, 73, 71, 69], velocityOffset: 3 },
    { cell: [66, 73, 69, 76, 78, 81, 76], velocityOffset: 5 },
    { cell: [64, 71, 68, 73, 76, 80, 83], velocityOffset: 6 },

    // Parallel A minor supplies bVI and iv: F and C natural enter the repeated cell.
    { cell: [65, 72, 69, 76, 74, 72], velocityOffset: 4 },
    { cell: [62, 69, 65, 72, 76, 74], velocityOffset: 5 },
    { cell: [64, 69, 73, 76, 81, 76, 73], velocityOffset: 6 },
    { cell: [64, 71, 68, 74, 77, 80, 74], velocityOffset: 7 },

    // The homeward section contracts the cell before the final pattern stops mid-bar.
    { cell: [69, 76, 73, 78, 81], velocityOffset: 6 },
    { cell: [62, 69, 66, 73, 78], velocityOffset: 5 },
    { cell: [62, 69, 65, 72, 76], velocityOffset: 7 },
    { cell: [69, 76, 73, 76, 81], pulseCount: 8, velocityOffset: 2 },
  ]
  const secondPassPulseBars: readonly PulseBar[] = firstPassPulseBars.map((pulseBar, barIndex) => {
    const rotation = (barIndex + 1) % pulseBar.cell.length
    const rotatedCell = [
      ...pulseBar.cell.slice(rotation),
      ...pulseBar.cell.slice(0, rotation),
    ]

    return {
      ...pulseBar,
      cell: rotatedCell.map(pitch => pitch + (barIndex >= 8 ? 12 : 0)),
      velocityOffset: pulseBar.velocityOffset + 2,
    }
  })
  const pulseBars = [...firstPassPulseBars, ...secondPassPulseBars]
  const firstPassVoicings: readonly VoicingGesture[] = [
    { durationTicks: barTicks - noteGapTicks, pitches: [45, 52, 57, 61, 64, 71], startTick: bar(1), velocity: 54 },
    { durationTicks: barTicks - noteGapTicks, pitches: [45, 52, 57, 61, 64, 69], startTick: bar(2), velocity: 52 },
    { durationTicks: barTicks - noteGapTicks, pitches: [42, 49, 57, 61, 64, 69], startTick: bar(3), velocity: 54 },
    { durationTicks: barTicks - noteGapTicks, pitches: [40, 47, 56, 59, 62, 66], startTick: bar(4), velocity: 52 },

    { durationTicks: barTicks - noteGapTicks, pitches: [45, 52, 57, 61, 64, 69, 76], startTick: bar(5), velocity: 58 },
    { durationTicks: barTicks - noteGapTicks, pitches: [38, 45, 54, 57, 61, 64, 69], startTick: bar(6), velocity: 56 },
    { durationTicks: barTicks - noteGapTicks, pitches: [42, 49, 57, 61, 64, 69, 73], startTick: bar(7), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [40, 47, 56, 59, 62, 66, 73], startTick: bar(8), velocity: 62 },

    { durationTicks: barTicks - noteGapTicks, pitches: [41, 48, 53, 57, 60, 64, 69], startTick: bar(9), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [38, 45, 53, 57, 60, 64, 69], startTick: bar(10), velocity: 62 },
    { durationTicks: barTicks - noteGapTicks, pitches: [40, 45, 52, 57, 61, 64, 69], startTick: bar(11), velocity: 58 },
    { durationTicks: barTicks - noteGapTicks, pitches: [40, 47, 56, 62, 65, 68, 74], startTick: bar(12), velocity: 64 },

    { durationTicks: barTicks - noteGapTicks, pitches: [45, 52, 57, 61, 64, 69, 76], startTick: bar(13), velocity: 62 },
    { durationTicks: barTicks - noteGapTicks, pitches: [38, 45, 54, 57, 61, 66, 69], startTick: bar(14), velocity: 60 },
    { durationTicks: barTicks - noteGapTicks, pitches: [38, 45, 53, 57, 60, 64, 69], startTick: bar(15), velocity: 66 },
    { durationTicks: barTicks - noteGapTicks, pitches: [45, 52, 57, 61, 64, 69, 73, 76], startTick: bar(16), velocity: 58 },
  ]
  const secondPassVoicings: readonly VoicingGesture[] = firstPassVoicings.map((voicing, barIndex) => ({
    ...voicing,
    pitches: voicing.pitches.map(pitch => pitch >= 52 ? pitch + (barIndex >= 8 ? 12 : 0) : pitch),
    startTick: voicing.startTick + passTicks,
    velocity: voicing.velocity + 2,
  }))
  const voicings = [...firstPassVoicings, ...secondPassVoicings]
  const firstPassBassBars: readonly BassBar[] = [
    { approachPitch: 40, rootPitch: 33, velocity: 76 },
    { approachPitch: 40, rootPitch: 33, velocity: 74 },
    { approachPitch: 37, rootPitch: 30, velocity: 78 },
    { approachPitch: 35, rootPitch: 28, velocity: 74 },
    { approachPitch: 40, rootPitch: 33, velocity: 80 },
    { approachPitch: 33, rootPitch: 26, velocity: 78 },
    { approachPitch: 37, rootPitch: 30, velocity: 82 },
    { approachPitch: 35, rootPitch: 28, velocity: 80 },
    { approachPitch: 36, rootPitch: 29, velocity: 78 },
    { approachPitch: 33, rootPitch: 26, velocity: 80 },
    { approachPitch: 40, rootPitch: 28, velocity: 76 },
    { approachPitch: 35, rootPitch: 28, velocity: 84 },
    { approachPitch: 40, rootPitch: 33, velocity: 82 },
    { approachPitch: 33, rootPitch: 26, velocity: 80 },
    { approachPitch: 33, rootPitch: 26, velocity: 84 },
    { approachPitch: 45, rootPitch: 33, velocity: 78 },
  ]
  const bassBars: readonly BassBar[] = [
    ...firstPassBassBars,
    ...firstPassBassBars.map((bassBar, barIndex) => ({
      ...bassBar,
      approachPitch: bassBar.approachPitch + (barIndex >= 8 ? 12 : 0),
      velocity: bassBar.velocity + 2,
    })),
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: pulseColor,
          id: 'vesper_circuit_block_pulse',
          lengthTicks: totalTicks,
          name: 'Cell in Motion',
          patternId: 'vesper_circuit_pattern_pulse',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: pulseTrack.id,
        }),
        createBlock({
          color: padColor,
          id: 'vesper_circuit_block_pad',
          lengthTicks: totalTicks,
          name: 'Borrowed Horizon',
          patternId: 'vesper_circuit_pattern_pad',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: padTrack.id,
        }),
        createBlock({
          color: bassColor,
          id: 'vesper_circuit_block_bass',
          lengthTicks: totalTicks,
          name: 'Ground Relay',
          patternId: 'vesper_circuit_pattern_bass',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: driveColor,
          id: 'vesper_circuit_block_drive',
          lengthTicks: totalTicks,
          name: 'Velvet Motor',
          patternId: 'vesper_circuit_pattern_drive',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: driveTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'vesper_circuit_block_drums',
          lengthTicks: totalTicks,
          name: 'Soft Relay',
          patternId: 'vesper_circuit_pattern_drums',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({ id: 'vesper_circuit_section_seed', lengthTicks: barTicks * 4, name: 'I · Seed Pattern', startTick: bar(1) }),
        createSection({ id: 'vesper_circuit_section_widening', lengthTicks: barTicks * 4, name: 'II · Widening Orbit', startTick: bar(5) }),
        createSection({ id: 'vesper_circuit_section_borrowed', lengthTicks: barTicks * 4, name: 'III · Borrowed Dusk', startTick: bar(9) }),
        createSection({ id: 'vesper_circuit_section_home', lengthTicks: barTicks * 4, name: 'IV · Circuit Closes', startTick: bar(13) }),
        createSection({ id: 'vesper_circuit_section_restart', lengthTicks: barTicks * 4, name: 'V · Circuit Reopens', startTick: bar(17) }),
        createSection({ id: 'vesper_circuit_section_motor', lengthTicks: barTicks * 4, name: 'VI · Velvet Motor', startTick: bar(21) }),
        createSection({ id: 'vesper_circuit_section_upper_dusk', lengthTicks: barTicks * 4, name: 'VII · Dusk Above', startTick: bar(25) }),
        createSection({ id: 'vesper_circuit_section_final', lengthTicks: barTicks * 4, name: 'VIII · Relay at Rest', startTick: bar(29) }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: { attack: 0.004, decay: 0.22, release: 0.18, sustain: 0.18 },
        filter: { cutoffHz: 3900, resonance: 4.8, type: 'lowpass' },
        id: pulseTrack.instrumentId,
        name: 'Clockglass Pluck',
        oscillators: [
          createSynthOscillator({ detuneCents: -5, level: 0.38, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 6, level: 0.18, waveform: 'sawtooth' }),
          createSynthOscillator({ level: 0.09, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'pluck.clockglass',
      }),
      createThorInstrument({
        envelope: { attack: 0.18, decay: 1.4, release: 2.8, sustain: 0.62 },
        filter: { cutoffHz: 1850, resonance: 2.2, type: 'lowpass' },
        id: padTrack.instrumentId,
        name: 'Vesper Glass Pad',
        oscillators: [
          createSynthOscillator({ level: 0.3, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: -9, level: 0.18, octave: 1, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: 8, level: 0.11, waveform: 'sine' }),
        ],
        soundId: 'pad.vesper-glass',
      }),
      createThorInstrument({
        envelope: { attack: 0.018, decay: 0.38, release: 0.6, sustain: 0.7 },
        filter: { cutoffHz: 760, resonance: 2.4, type: 'lowpass' },
        id: bassTrack.instrumentId,
        name: 'Understory Bass',
        oscillators: [
          createSynthOscillator({ level: 0.5, waveform: 'sine' }),
          createSynthOscillator({ level: 0.17, octave: 1, waveform: 'triangle' }),
        ],
        soundId: 'bass.default',
      }),
      createSubtractorInstrument({
        envelope: { attack: 0.035, decay: 0.5, release: 0.42, sustain: 0.68 },
        filter: { cutoffHz: 1050, resonance: 3.2, type: 'lowpass' },
        glideSeconds: 0.028,
        id: driveTrack.instrumentId,
        mono: true,
        name: 'Velvet Dynamo',
        oscillatorMix: 0.24,
        oscillators: [
          createSynthOscillator({ level: 0.44, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 5, level: 0.24, octave: -1, waveform: 'sawtooth' }),
        ],
        soundId: 'drive.velvet-dynamo',
      }),
      createDrumInstrument({
        id: drumsTrack.instrumentId,
        name: 'Soft Relay Kit',
        pieces: {
          closedHat: createDrumPieceSound({ durationSeconds: 0.05, pitchSemitones: -3, soundId: 'drums.closedHat.default', volumeDb: -16 }),
          kick: createDrumPieceSound({ durationSeconds: 0.38, pitchSemitones: -6, soundId: 'drums.kick.default', volumeDb: 0 }),
          lowTom: createDrumPieceSound({ durationSeconds: 0.3, pitchSemitones: -4, soundId: 'drums.lowTom.default', volumeDb: -8 }),
          openHat: createDrumPieceSound({ durationSeconds: 0.3, pitchSemitones: -2, soundId: 'drums.openHat.default', volumeDb: -20 }),
          snare: createDrumPieceSound({ durationSeconds: 0.2, pitchSemitones: -2, soundId: 'drums.snare.default', volumeDb: -7 }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: pulseTrack.mixChannelId, pan: -0.22, volumeDb: -14 }),
        createMixChannel({ id: padTrack.mixChannelId, pan: 0.24, volumeDb: -18 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: -10 }),
        createMixChannel({ id: driveTrack.mixChannelId, pan: -0.06, volumeDb: -15 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.04, volumeDb: -9 }),
      ]),
      master: { muted: false, volumeDb: -5 },
    }),
    patterns: createEntityStore([
      createPattern({
        events: [
          ...createPulseEvents(pulseBars, barTicks, pulseTicks, noteGapTicks),
          ...createConclusionEvents(bar(16), noteGapTicks),
          ...createConclusionEvents(bar(32), noteGapTicks),
        ],
        id: 'vesper_circuit_pattern_pulse',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          evolution: 'The sixteen-bar cell cycle repeats with rotated note order, then lifts an octave through the second borrowed-dusk section.',
          repetition: 'The pulse completes two related circuits, pausing halfway through bars 16 and 32 for harmonic landings.',
        },
        name: 'Cell in Motion',
      }),
      createPattern({
        events: createVoicingEvents(voicings),
        id: 'vesper_circuit_pattern_pad',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bars 9–10 and 25–26 borrow Fmaj9 (bVI) and Dm9 (iv) from parallel A minor; bars 15 and 31 recall iv before A6/9.',
          progression: 'The sixteen-bar A-major/modal-minor progression repeats in wider voicings, with its final borrowed harmony lifted into the upper register.',
        },
        name: 'Borrowed Horizon',
      }),
      createPattern({
        events: createBassEvents(bassBars, barTicks, noteGapTicks),
        id: 'vesper_circuit_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Root-and-approach pairs repeat beneath each bar, with the final A held across the complete closing bar.',
        },
        name: 'Ground Relay',
      }),
      createPattern({
        events: createDriveEvents(bassBars, barTicks, noteGapTicks),
        id: 'vesper_circuit_pattern_drive',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          character: 'A soft triangle-led subtractor voice reinforces the motor rhythm without competing with the sub-bass.',
          repetition: 'Four-note cells repeat twice per bar, rotate in the second circuit, and stop halfway through the final bar.',
        },
        name: 'Velvet Motor',
      }),
      createPattern({
        events: createDrumEvents(barTicks),
        id: 'vesper_circuit_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          conclusion: 'The first circuit briefly thins at bar 16; the true final bar removes the back half of the groove.',
          feel: 'The straight-eighth relay repeats for 32 bars with displaced kicks, recurring fills, and slightly brighter second-pass hats.',
        },
        name: 'Soft Relay',
      }),
    ]),
    project: createProject({
      id: 'project_vesper_circuit',
      metadata: createProjectMetadata({
        description: 'A thirty-two-bar evolving-pattern study in A major: two related circuits of pluck, glass pad, soft drums, and a velvet driving tone pass through modal interchange before coming to rest.',
        tags: ['32-bars', 'driving', 'evolving-pattern', 'modal-interchange', 'repetition', 'synth'],
      }),
      name: 'Vesper Circuit',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [createKeyEvent({ id: 'vesper_circuit_key', key: { mode: 'major', tonic: 9 }, tick: 0 })],
      meterEvents: [createMeterEvent({ id: 'vesper_circuit_meter', tick: 0, timeSignature: { denominator: 4, numerator: 4 } })],
      tempoEvents: [createTempoEvent({ bpm: 104, id: 'vesper_circuit_tempo', tick: 0 })],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createPulseEvents(
  bars: readonly PulseBar[],
  barTicks: DurationTicks,
  pulseTicks: DurationTicks,
  noteGapTicks: DurationTicks,
): NoteEvent[] {
  return bars.flatMap((pulseBar, barIndex) => Array.from(
    { length: pulseBar.pulseCount ?? barTicks / pulseTicks },
    (_, pulseIndex) => createNoteEvent({
      durationTicks: pulseTicks - noteGapTicks,
      id: `vesper_circuit_event_pulse_${barIndex + 1}_${pulseIndex + 1}`,
      pitch: pulseBar.cell[pulseIndex % pulseBar.cell.length],
      timeTick: (barIndex * barTicks) + (pulseIndex * pulseTicks),
      velocity: (pulseIndex % pulseBar.cell.length === 0 ? 82 : pulseIndex % 4 === 0 ? 74 : 64)
        + pulseBar.velocityOffset,
    }),
  ))
}

function createConclusionEvents(startTick: number, noteGapTicks: DurationTicks): NoteEvent[] {
  return [57, 64, 69, 73, 76, 81].map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: (PPQ * 2) - noteGapTicks,
    id: `vesper_circuit_event_conclusion_${pitchIndex + 1}`,
    pitch,
    timeTick: startTick + (PPQ * 2),
    velocity: 72 - pitchIndex,
  }))
}

function createVoicingEvents(voicings: readonly VoicingGesture[]): NoteEvent[] {
  return voicings.flatMap((voicing, voicingIndex) => voicing.pitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: voicing.durationTicks,
    id: `vesper_circuit_event_pad_${voicingIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: voicing.startTick,
    velocity: voicing.velocity - Math.min(pitchIndex, 8),
  })))
}

function createBassEvents(
  bassBars: readonly BassBar[],
  barTicks: DurationTicks,
  noteGapTicks: DurationTicks,
): NoteEvent[] {
  return bassBars.flatMap((bassBar, barIndex) => {
    const startTick = barIndex * barTicks

    if (barIndex === bassBars.length - 1) {
      return [createNoteEvent({
        durationTicks: barTicks - noteGapTicks,
        id: 'vesper_circuit_event_bass_final',
        pitch: bassBar.rootPitch,
        timeTick: startTick,
        velocity: bassBar.velocity,
      })]
    }

    return [
      createNoteEvent({
        durationTicks: (PPQ * 2) - noteGapTicks,
        id: `vesper_circuit_event_bass_${barIndex + 1}_root`,
        pitch: bassBar.rootPitch,
        timeTick: startTick,
        velocity: bassBar.velocity,
      }),
      createNoteEvent({
        durationTicks: (PPQ * 2) - noteGapTicks,
        id: `vesper_circuit_event_bass_${barIndex + 1}_approach`,
        pitch: bassBar.approachPitch,
        timeTick: startTick + (PPQ * 2),
        velocity: bassBar.velocity - 8,
      }),
    ]
  })
}

function createDriveEvents(
  bassBars: readonly BassBar[],
  barTicks: DurationTicks,
  noteGapTicks: DurationTicks,
): NoteEvent[] {
  const stepTicks = PPQ / 2

  return bassBars.flatMap((bassBar, barIndex) => {
    const firstCircuitCell = [
      bassBar.rootPitch + 12,
      bassBar.approachPitch + 12,
      bassBar.rootPitch + 19,
      bassBar.approachPitch + 12,
    ]
    const cell = barIndex < 16
      ? firstCircuitCell
      : [firstCircuitCell[0], firstCircuitCell[2], firstCircuitCell[1], bassBar.rootPitch + 24]
    const pulseCount = barIndex === bassBars.length - 1 ? 4 : barTicks / stepTicks

    return Array.from({ length: pulseCount }, (_, pulseIndex) => createNoteEvent({
      durationTicks: stepTicks - noteGapTicks,
      id: `vesper_circuit_event_drive_${barIndex + 1}_${pulseIndex + 1}`,
      pitch: cell[pulseIndex % cell.length],
      timeTick: (barIndex * barTicks) + (pulseIndex * stepTicks),
      velocity: 54 + Math.min(14, Math.floor(barIndex / 4) * 2) + (pulseIndex % 4 === 0 ? 6 : 0),
    }))
  })
}

function createDrumEvents(barTicks: DurationTicks): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []
  const kickPatterns = [
    [0, 2.5],
    [0, 2.75],
    [0, 2, 3.5],
    [0, 2.5],
  ] as const
  const addHits = (
    barIndex: number,
    piece: DrumPiece,
    beatOffsets: readonly number[],
    velocity: (hitIndex: number) => number,
  ) => beatOffsets.forEach((beatOffset, hitIndex) => hits.push(createDrumHitEvent({
    id: `vesper_circuit_event_drums_${barIndex + 1}_${piece}_${hitIndex + 1}`,
    piece,
    timeTick: (barIndex * barTicks) + (beatOffset * PPQ),
    velocity: velocity(hitIndex),
  })))

  Array.from({ length: 32 }, (_, barIndex) => {
    const finalBar = barIndex === 31
    const turnaroundBar = barIndex === 15
    const shortBar = finalBar || turnaroundBar
    const sectionIndex = Math.floor(barIndex / 4)
    const hats = shortBar ? [0, 0.5, 1, 1.5] : Array.from({ length: 8 }, (_, index) => index / 2)

    addHits(barIndex, 'kick', shortBar ? [0] : kickPatterns[barIndex % 4], hitIndex => hitIndex === 0 ? 96 : 74)
    addHits(barIndex, 'snare', shortBar ? [1] : [1, 3], hitIndex => 76 - (hitIndex * 4))
    addHits(barIndex, 'closedHat', hats, hitIndex => 32 + ((hitIndex % 2) * 7) + (sectionIndex * 2))

    if (!shortBar && barIndex % 4 === 3) {
      addHits(barIndex, 'openHat', [3.5], () => 42 + (sectionIndex * 3))
    }

    if (barIndex % 16 === 7 || barIndex % 16 === 11) {
      addHits(barIndex, 'lowTom', [3.25, 3.5, 3.75], hitIndex => 48 + (hitIndex * 8))
    }
  })

  return createDrumHitEvents('vesper_circuit_event_drums', hits)
}
