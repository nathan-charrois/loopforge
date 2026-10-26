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
  type Effect,
  type Instrument,
  type NoteEvent,
  PPQ,
} from '~/domain'
import { createEntityStore } from '~/store/type'

const BAR_TICKS = PPQ * 4
const PHRASE_TICKS = BAR_TICKS * 4
const TOTAL_TICKS = PHRASE_TICKS * 2

export function sidechainABLab(): Workspace {
  const kickTrack = createTrack({
    color: '#ff6b6b',
    id: 'sidechain_ab_track_kick',
    instrumentId: 'sidechain_ab_instrument_kick',
    name: 'Kick · Sidechain Key',
    role: 'drums',
  })
  const dryPadTrack = createTrack({
    accepts: ['note'],
    color: '#868e96',
    id: 'sidechain_ab_track_dry_pad',
    instrumentId: 'sidechain_ab_instrument_dry_pad',
    name: 'A · Pad Without Sidechain',
    role: 'chords',
  })
  const sidechainedPadTrack = createTrack({
    accepts: ['note'],
    color: '#22b8cf',
    id: 'sidechain_ab_track_sidechained_pad',
    instrumentId: 'sidechain_ab_instrument_sidechained_pad',
    name: 'B · Pad With Sidechain',
    role: 'chords',
  })
  const tracks = [kickTrack, dryPadTrack, sidechainedPadTrack]
  const sidechainCompressor: CompressorEffect = {
    attackSeconds: 0.002,
    enabled: true,
    id: 'sidechain_ab_compressor',
    kneeDb: 3,
    kind: 'compressor',
    name: 'Kick Pump · Sidechain Demo',
    ratio: 20,
    releaseSeconds: 0.28,
    sidechainSourceMixChannelId: kickTrack.mixChannelId,
    thresholdDb: -30,
  }

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: kickTrack.color,
          id: 'sidechain_ab_block_kick',
          lengthTicks: TOTAL_TICKS,
          name: 'Four-on-the-floor sidechain key',
          patternId: 'sidechain_ab_pattern_kick',
          playbackMode: 'loop',
          startTick: 0,
          trackId: kickTrack.id,
        }),
        createBlock({
          color: dryPadTrack.color,
          id: 'sidechain_ab_block_dry_pad',
          lengthTicks: PHRASE_TICKS,
          name: 'A · Steady level',
          patternId: 'sidechain_ab_pattern_pad',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: dryPadTrack.id,
        }),
        createBlock({
          color: sidechainedPadTrack.color,
          id: 'sidechain_ab_block_sidechained_pad',
          lengthTicks: PHRASE_TICKS,
          name: 'B · Ducks on every kick',
          patternId: 'sidechain_ab_pattern_pad',
          playbackMode: 'oneShot',
          startTick: PHRASE_TICKS,
          trackId: sidechainedPadTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'sidechain_ab_section_dry',
          lengthTicks: PHRASE_TICKS,
          name: 'A · No sidechain — steady pad',
          startTick: 0,
        }),
        createSection({
          id: 'sidechain_ab_section_ducked',
          lengthTicks: PHRASE_TICKS,
          name: 'B · Sidechain on — audible pumping',
          startTick: PHRASE_TICKS,
        }),
      ],
    },
    effects: createEntityStore<Effect>([sidechainCompressor]),
    instruments: createEntityStore<Instrument>([
      createDrumInstrument({
        id: kickTrack.instrumentId,
        name: 'Sidechain Key Kick',
        pieces: {
          kick: createDrumPieceSound({
            durationSeconds: 0.32,
            pitchSemitones: -5,
            soundId: 'drums.kick.default',
            volumeDb: 0,
          }),
        },
      }),
      createDemoPadInstrument(dryPadTrack.instrumentId, 'Uncompressed Demo Pad'),
      createDemoPadInstrument(
        sidechainedPadTrack.instrumentId,
        'Sidechained Demo Pad',
        [sidechainCompressor.id],
      ),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({ id: kickTrack.mixChannelId, volumeDb: -7 }),
        createMixChannel({ id: dryPadTrack.mixChannelId, volumeDb: -14 }),
        createMixChannel({ id: sidechainedPadTrack.mixChannelId, volumeDb: -14 }),
      ]),
      master: { muted: false, volumeDb: -6 },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createDrumHitEvents('sidechain_ab_kick_event', [0, 1, 2, 3].map(beat => (
          createDrumHitEvent({
            id: `sidechain_ab_kick_seed_${beat}`,
            piece: 'kick',
            timeTick: beat * PPQ,
            velocity: beat === 0 ? 120 : 112,
          })
        ))),
        id: 'sidechain_ab_pattern_kick',
        kind: 'drum',
        lengthTicks: BAR_TICKS,
        metadata: {
          purpose: 'This constant quarter-note kick is both audible and routed to the compressor detector on the B pad.',
        },
        name: 'Sidechain Key · Quarter Notes',
      }),
      createPattern({
        events: createPadEvents(),
        id: 'sidechain_ab_pattern_pad',
        kind: 'note',
        lengthTicks: PHRASE_TICKS,
        metadata: {
          comparison: 'The exact same pattern plays dry in section A and sidechained in section B, making the gain reduction easy to compare.',
        },
        name: 'Identical Four-Bar Pad Phrase',
      }),
    ]),
    project: createProject({
      id: 'project_sidechain_ab_lab',
      metadata: createProjectMetadata({
        description: 'An eight-bar A/B demonstration: four bars of a steady sustained pad, followed by the identical pad aggressively ducked from the kick track.',
        tags: ['a-b-test', 'compression', 'demo', 'sidechain'],
      }),
      name: 'Sidechain A/B Lab',
    }),
    timeline: createTimeline({
      grid: 'quarterNote',
      keyEvents: [
        createKeyEvent({
          id: 'sidechain_ab_key',
          key: { mode: 'minor', tonic: 0 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'sidechain_ab_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 120,
          id: 'sidechain_ab_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

function createDemoPadInstrument(
  id: string,
  name: string,
  effectIds: string[] = [],
): Instrument {
  return createThorInstrument({
    effectIds,
    envelope: {
      attack: 0.04,
      decay: 0.2,
      release: 0.35,
      sustain: 0.92,
    },
    filter: {
      cutoffHz: 1350,
      resonance: 2.5,
      type: 'lowpass',
    },
    id,
    name,
    oscillators: [
      createSynthOscillator({ level: 0.34, waveform: 'sawtooth' }),
      createSynthOscillator({ detuneCents: -8, level: 0.21, waveform: 'sawtooth' }),
      createSynthOscillator({ detuneCents: 8, level: 0.15, waveform: 'triangle' }),
    ],
    soundId: 'strings.default',
  })
}

function createPadEvents(): NoteEvent[] {
  const chordPitches = [
    [48, 55, 60, 63],
    [44, 51, 56, 60],
    [41, 48, 53, 56],
    [43, 50, 55, 58],
  ]

  return createNoteEvents('sidechain_ab_pad_event', chordPitches.flatMap((pitches, barIndex) => (
    pitches.map((pitch, pitchIndex) => createNoteEvent({
      durationTicks: BAR_TICKS - (PPQ / 8),
      id: `sidechain_ab_pad_seed_${barIndex}_${pitchIndex}`,
      pitch,
      timeTick: barIndex * BAR_TICKS,
      velocity: 82 - (pitchIndex * 3),
    }))
  )))
}
