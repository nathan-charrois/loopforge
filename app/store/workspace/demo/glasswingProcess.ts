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
  type Instrument,
  type MidiNote,
  type NoteEvent,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

type HarmonyBar = {
  bassPitch: MidiNote
  chordPitches: readonly MidiNote[]
  pulsePitches: readonly MidiNote[]
}

export function glasswingProcess(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 32
  const noteGapTicks = PPQ / 16
  const bar = (barNumber: number) => barTicks * (barNumber - 1)
  const pulseColor = '#4dabf7'
  const bassColor = '#51cf66'
  const choirColor = '#e599f7'
  const drumsColor = '#ffa94d'
  const pulseTrack = createTrack({
    color: pulseColor,
    id: 'glasswing_process_track_pulse',
    instrumentId: 'glasswing_process_instrument_pulse',
    name: 'Orbiting Pulse',
    role: 'melody',
  })
  const bassTrack = createTrack({
    color: bassColor,
    id: 'glasswing_process_track_bass',
    instrumentId: 'glasswing_process_instrument_bass',
    name: 'Patient Current',
    role: 'bass',
  })
  const choirTrack = createTrack({
    accepts: ['note'],
    color: choirColor,
    id: 'glasswing_process_track_choir',
    instrumentId: 'glasswing_process_instrument_choir',
    name: 'Glasswing Choir',
    role: 'chords',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'glasswing_process_track_drums',
    instrumentId: 'glasswing_process_instrument_drums',
    name: 'Measured Wings',
    role: 'drums',
  })
  const tracks = [pulseTrack, bassTrack, choirTrack, drumsTrack]
  const homeCycle: readonly HarmonyBar[] = [
    { bassPitch: 45, chordPitches: [45, 52, 56, 59, 61, 64, 68, 71], pulsePitches: [61, 64, 68, 71] },
    { bassPitch: 44, chordPitches: [44, 52, 56, 59, 64, 66, 71], pulsePitches: [59, 64, 66, 71] },
    { bassPitch: 42, chordPitches: [42, 49, 52, 57, 59, 64, 68], pulsePitches: [57, 59, 64, 68] },
    { bassPitch: 38, chordPitches: [38, 45, 49, 52, 57, 61, 64], pulsePitches: [57, 61, 64, 69] },
    { bassPitch: 37, chordPitches: [37, 45, 52, 56, 61, 64, 68], pulsePitches: [56, 61, 64, 68] },
    { bassPitch: 35, chordPitches: [35, 47, 50, 54, 57, 61, 64], pulsePitches: [57, 61, 62, 66] },
    { bassPitch: 40, chordPitches: [40, 47, 50, 54, 57, 61, 66], pulsePitches: [57, 61, 66, 71] },
    { bassPitch: 45, chordPitches: [45, 52, 57, 59, 61, 64, 66], pulsePitches: [57, 61, 64, 66] },
  ]
  const liftedCycle: readonly HarmonyBar[] = homeCycle.map((harmony, index) => ({
    bassPitch: harmony.bassPitch,
    chordPitches: harmony.chordPitches.map(pitch => pitch >= 52 ? pitch + 12 : pitch),
    pulsePitches: harmony.pulsePitches.map((_, pitchIndex, pitches) => (
      pitches[(pitchIndex + 1 + index) % pitches.length] + 12
    )),
  }))
  const borrowedCycle: readonly HarmonyBar[] = [
    { bassPitch: 45, chordPitches: [45, 52, 56, 59, 61, 64, 71], pulsePitches: [61, 64, 68, 71] },
    { bassPitch: 38, chordPitches: [38, 45, 50, 53, 57, 60, 64], pulsePitches: [62, 65, 69, 72, 76] },
    { bassPitch: 43, chordPitches: [43, 50, 54, 57, 59, 62, 66, 69], pulsePitches: [59, 62, 66, 69, 74] },
    { bassPitch: 40, chordPitches: [40, 48, 52, 55, 59, 66, 71], pulsePitches: [60, 64, 66, 71] },
    { bassPitch: 42, chordPitches: [42, 49, 52, 57, 59, 64, 68], pulsePitches: [57, 64, 68, 71] },
    { bassPitch: 45, chordPitches: [45, 50, 53, 57, 59, 62, 65], pulsePitches: [57, 59, 62, 65] },
    { bassPitch: 35, chordPitches: [35, 47, 50, 53, 57, 62], pulsePitches: [53, 57, 62, 65] },
    { bassPitch: 40, chordPitches: [40, 47, 50, 56, 62, 65], pulsePitches: [56, 62, 65, 71] },
  ]
  const conclusionCycle: readonly HarmonyBar[] = [
    { bassPitch: 45, chordPitches: [45, 52, 56, 59, 61, 64, 68, 71], pulsePitches: [61, 64, 68, 71, 76] },
    { bassPitch: 37, chordPitches: [37, 49, 52, 56, 59, 64, 68], pulsePitches: [56, 59, 64, 68, 73] },
    { bassPitch: 42, chordPitches: [42, 49, 52, 57, 61, 64, 69], pulsePitches: [57, 61, 64, 69, 73] },
    { bassPitch: 38, chordPitches: [38, 45, 49, 52, 57, 61, 64], pulsePitches: [57, 61, 64, 69, 73] },
    { bassPitch: 35, chordPitches: [35, 47, 50, 54, 57, 61, 64], pulsePitches: [57, 61, 62, 66, 71] },
    { bassPitch: 40, chordPitches: [40, 47, 50, 54, 57, 61, 66], pulsePitches: [57, 61, 66, 71, 73] },
    { bassPitch: 40, chordPitches: [40, 52, 57, 59, 61, 64, 69], pulsePitches: [57, 59, 61, 64] },
    { bassPitch: 45, chordPitches: [45, 52, 57, 59, 61, 64, 66, 69], pulsePitches: [64, 66, 69, 81] },
  ]
  const harmonicBars = [
    ...homeCycle,
    ...liftedCycle,
    ...borrowedCycle,
    ...conclusionCycle,
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: pulseColor,
          id: 'glasswing_process_block_pulse',
          lengthTicks: totalTicks,
          name: 'Thirty-Two-Bar Orbit',
          patternId: 'glasswing_process_pattern_pulse',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: pulseTrack.id,
        }),
        createBlock({
          color: bassColor,
          id: 'glasswing_process_block_bass',
          lengthTicks: totalTicks,
          name: 'Patient Current',
          patternId: 'glasswing_process_pattern_bass',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: choirColor,
          id: 'glasswing_process_block_choir',
          lengthTicks: totalTicks,
          name: 'Changing Glass',
          patternId: 'glasswing_process_pattern_choir',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: choirTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'glasswing_process_block_drums',
          lengthTicks: totalTicks,
          name: 'Measured Wings',
          patternId: 'glasswing_process_pattern_drums',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({ id: 'glasswing_process_section_seed', lengthTicks: barTicks * 8, name: 'I · Seed Pattern', startTick: bar(1) }),
        createSection({ id: 'glasswing_process_section_lift', lengthTicks: barTicks * 8, name: 'II · Wings Remember', startTick: bar(9) }),
        createSection({ id: 'glasswing_process_section_shadow', lengthTicks: barTicks * 8, name: 'III · Borrowed Shadow', startTick: bar(17) }),
        createSection({ id: 'glasswing_process_section_release', lengthTicks: barTicks * 8, name: 'IV · The Pattern Lands', startTick: bar(25) }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createThorInstrument({
        envelope: { attack: 0.006, decay: 0.26, release: 0.38, sustain: 0.3 },
        filter: { cutoffHz: 3600, resonance: 4.8, type: 'lowpass' },
        id: pulseTrack.instrumentId,
        name: 'Glasswing Pluck',
        oscillators: [
          createSynthOscillator({ detuneCents: -5, level: 0.42, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 6, level: 0.28, waveform: 'sine' }),
          createSynthOscillator({ level: 0.14, octave: 1, waveform: 'sine' }),
        ],
        soundId: 'pluck.glasswing',
      }),
      createSubtractorInstrument({
        envelope: { attack: 0.018, decay: 0.42, release: 0.7, sustain: 0.62 },
        filter: { cutoffHz: 760, resonance: 2.6, type: 'lowpass' },
        glideSeconds: 0.035,
        id: bassTrack.instrumentId,
        mono: true,
        name: 'Patient Current Bass',
        oscillatorMix: 0.3,
        oscillators: [
          createSynthOscillator({ level: 0.64, octave: -1, waveform: 'sawtooth' }),
          createSynthOscillator({ detuneCents: 4, level: 0.38, waveform: 'triangle' }),
        ],
        soundId: 'bass.patient-current',
      }),
      createThorInstrument({
        envelope: { attack: 0.65, decay: 1.8, release: 3.2, sustain: 0.66 },
        filter: { cutoffHz: 1850, resonance: 2.1, type: 'lowpass' },
        id: choirTrack.instrumentId,
        name: 'Glasswing Choir',
        oscillators: [
          createSynthOscillator({ level: 0.34, waveform: 'sine' }),
          createSynthOscillator({ detuneCents: -9, level: 0.22, octave: 1, waveform: 'triangle' }),
          createSynthOscillator({ detuneCents: 8, level: 0.16, waveform: 'sine' }),
        ],
        soundId: 'choir.glasswing',
      }),
      createDrumInstrument({
        id: drumsTrack.instrumentId,
        name: 'Measured Wings Kit',
        pieces: {
          closedHat: createDrumPieceSound({ durationSeconds: 0.05, pitchSemitones: 2, soundId: 'drums.closedHat.default', volumeDb: -15 }),
          kick: createDrumPieceSound({ durationSeconds: 0.38, pitchSemitones: -6, soundId: 'drums.kick.default', volumeDb: 1 }),
          openHat: createDrumPieceSound({ durationSeconds: 0.32, pitchSemitones: 1, soundId: 'drums.openHat.default', volumeDb: -18 }),
          snare: createDrumPieceSound({ durationSeconds: 0.2, pitchSemitones: -2, soundId: 'drums.snare.default', volumeDb: -5 }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: pulseTrack.mixChannelId, pan: -0.24, volumeDb: -12 }),
        createMixChannel({ id: bassTrack.mixChannelId, pan: 0, volumeDb: -10 }),
        createMixChannel({ id: choirTrack.mixChannelId, pan: 0.22, volumeDb: -16 }),
        createMixChannel({ id: drumsTrack.mixChannelId, pan: 0.06, volumeDb: -8 }),
      ]),
      master: { muted: false, volumeDb: -4 },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createPulseEvents(harmonicBars, barTicks, noteGapTicks),
        id: 'glasswing_process_pattern_pulse',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          evolution: 'Eight-note cells become sixteenth-note rotations, darken during the modal-interchange cycle, accelerate once more, then reduce to four final pulses.',
          repetition: 'Every bar is generated from a small recurring pitch cell whose order and register change by section.',
        },
        name: 'Thirty-Two-Bar Orbit',
      }),
      createPattern({
        events: createBassEvents(harmonicBars, barTicks, noteGapTicks),
        id: 'glasswing_process_pattern_bass',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          movement: 'Roots repeat patiently; later sections add fifths and passing tones before the last bar settles into a single sustained A.',
        },
        name: 'Patient Current',
      }),
      createPattern({
        events: createChoirEvents(harmonicBars, barTicks, noteGapTicks),
        id: 'glasswing_process_pattern_choir',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          modalInterchange: 'Bars 18–24 borrow Dm9, Gmaj9, Cmaj7(#11), Dm6/A, Bm7b5, and E7b9 from A minor before the final major-key return.',
          voicing: 'Sustained clusters rise an octave in section two, contract into darker common-tone shapes, then reopen for the conclusion.',
        },
        name: 'Changing Glass',
      }),
      createPattern({
        events: createDrumEvents(),
        id: 'glasswing_process_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          conclusion: 'The final two bars shed the repeating groove, leaving a sparse preparation and one last kick/open-hat breath.',
          evolution: 'Quarter-note hats open into eighths, fall into half-time beneath the borrowed harmony, then intensify before dissolving.',
        },
        name: 'Measured Wings',
      }),
    ]),
    project: createProject({
      id: 'project_glasswing_process',
      metadata: createProjectMetadata({
        description: 'A thirty-two-bar evolving process piece in A major: small repeating cells gather speed, pass through borrowed minor harmony, and deliberately come to rest.',
        tags: ['32-bars', 'evolving-patterns', 'modal-interchange', 'process-music', 'repetition'],
      }),
      name: 'Glasswing Process',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [createKeyEvent({ id: 'glasswing_process_key', key: { mode: 'major', tonic: 9 }, tick: 0 })],
      meterEvents: [createMeterEvent({ id: 'glasswing_process_meter', tick: 0, timeSignature: { denominator: 4, numerator: 4 } })],
      tempoEvents: [createTempoEvent({ bpm: 98, id: 'glasswing_process_tempo', tick: 0 })],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createPulseEvents(
  bars: readonly HarmonyBar[],
  barTicks: number,
  noteGapTicks: number,
): NoteEvent[] {
  return bars.flatMap((harmony, barIndex) => {
    const stepTicks = barIndex < 8
      ? PPQ / 2
      : barIndex < 16
        ? PPQ / 4
        : barIndex < 24
          ? PPQ / 2
          : barIndex < 30
            ? PPQ / 4
            : barIndex === 30 ? PPQ / 2 : PPQ
    const pulseCount = barTicks / stepTicks

    return Array.from({ length: pulseCount }, (_, pulseIndex) => createNoteEvent({
      durationTicks: stepTicks - noteGapTicks,
      id: `glasswing_process_event_pulse_${barIndex + 1}_${pulseIndex + 1}`,
      pitch: harmony.pulsePitches[pulseIndex % harmony.pulsePitches.length],
      timeTick: (barIndex * barTicks) + (pulseIndex * stepTicks),
      velocity: Math.min(108, 62 + Math.floor(barIndex / 4) + (pulseIndex % harmony.pulsePitches.length === 0 ? 12 : 0)),
    }))
  })
}

function createBassEvents(
  bars: readonly HarmonyBar[],
  barTicks: number,
  noteGapTicks: number,
): NoteEvent[] {
  return bars.flatMap((harmony, barIndex) => {
    if (barIndex === bars.length - 1) {
      return [createNoteEvent({
        durationTicks: barTicks - noteGapTicks,
        id: 'glasswing_process_event_bass_final',
        pitch: harmony.bassPitch,
        timeTick: barIndex * barTicks,
        velocity: 82,
      })]
    }

    const notes = [createNoteEvent({
      durationTicks: (PPQ * 2) - noteGapTicks,
      id: `glasswing_process_event_bass_${barIndex + 1}_1`,
      pitch: harmony.bassPitch,
      timeTick: barIndex * barTicks,
      velocity: 74 + Math.min(10, Math.floor(barIndex / 4)),
    })]

    if (barIndex >= 8) {
      notes.push(createNoteEvent({
        durationTicks: (PPQ * 2) - noteGapTicks,
        id: `glasswing_process_event_bass_${barIndex + 1}_2`,
        pitch: harmony.bassPitch + (barIndex >= 24 ? 12 : 7),
        timeTick: (barIndex * barTicks) + (PPQ * 2),
        velocity: 68 + Math.min(12, Math.floor(barIndex / 4)),
      }))
    }

    return notes
  })
}

function createChoirEvents(
  bars: readonly HarmonyBar[],
  barTicks: number,
  noteGapTicks: number,
): NoteEvent[] {
  return bars.flatMap((harmony, barIndex) => harmony.chordPitches.map((pitch, pitchIndex) => createNoteEvent({
    durationTicks: barTicks - noteGapTicks,
    id: `glasswing_process_event_choir_${barIndex + 1}_${pitchIndex + 1}`,
    pitch,
    timeTick: barIndex * barTicks,
    velocity: 52 + Math.min(18, Math.floor(barIndex / 4) * 2) - Math.min(8, pitchIndex),
  })))
}

function createDrumEvents(): DrumHitEvent[] {
  const hits: DrumHitEvent[] = []

  for (let barIndex = 0; barIndex < 32; barIndex += 1) {
    const barStartTick = barIndex * PPQ * 4
    const addHit = (piece: 'closedHat' | 'kick' | 'openHat' | 'snare', beat: number, velocity: number) => {
      hits.push(createDrumHitEvent({
        id: `glasswing_process_drum_seed_${barIndex + 1}_${piece}_${beat}`,
        piece,
        timeTick: barStartTick + (beat * PPQ),
        velocity,
      }))
    }

    if (barIndex === 31) {
      addHit('kick', 0, 88)
      addHit('openHat', 0, 54)
      continue
    }

    if (barIndex === 30) {
      addHit('kick', 0, 84)
      addHit('snare', 2, 68)
      for (const beat of [0, 1, 2, 3]) {
        addHit('closedHat', beat, 34)
      }
      continue
    }

    const isBorrowedSection = barIndex >= 16 && barIndex < 24
    const isDrivingSection = (barIndex >= 8 && barIndex < 16) || barIndex >= 24
    addHit('kick', 0, 88 + (barIndex % 4 === 0 ? 6 : 0))
    addHit('kick', isBorrowedSection ? 2.5 : 2, 72)
    addHit('snare', isBorrowedSection ? 2 : 1, 70)
    addHit('snare', 3, isBorrowedSection ? 58 : 74)

    const hatStep = isDrivingSection ? 0.5 : 1
    for (let beat = 0; beat < 4; beat += hatStep) {
      addHit('closedHat', beat, beat % 1 === 0 ? 38 : 30)
    }

    if (barIndex === 15 || barIndex === 23 || barIndex === 29) {
      addHit('openHat', 3.5, 48)
    }
  }

  return createDrumHitEvents('glasswing_process_event_drums', hits)
}
