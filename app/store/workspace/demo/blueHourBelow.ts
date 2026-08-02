import { createWorkspace } from '../factory'
import type { Workspace } from '../type'
import { createBlock, createDrumHitEvent, createDrumInstrument, createDrumPieceSound, createKeyEvent, createMelodicInstrument, createMeterEvent, createMixChannel, createMixer, createNoteEvent, createPattern, createProject, createProjectMetadata, createSection, createTempoEvent, createTimeline, createTrack, type DrumPiece, type DurationTicks, type Instrument, type MidiNote, type Pattern, PPQ, type Tick, type Velocity } from '~/domain'
import { createEntityStore } from '~/store/type'

export function blueHourBelow(): Workspace {
  const barTicks = PPQ * 4
  const totalTicks = barTicks * 8
  const drumBlockTicks = barTicks * 2
  const halfBeatTicks = PPQ / 2
  const quarterBeatTicks = PPQ / 4
  const sustainedChordTicks = PPQ * 3
  const sustainedBassTicks = sustainedChordTicks + halfBeatTicks
  const melodyColor = '#7950f2'
  const drumsColor = '#fd7e14'
  const bar2 = barTicks
  const bar3 = barTicks * 2
  const bar4 = barTicks * 3
  const bar5 = barTicks * 4
  const bar6 = barTicks * 5
  const bar7 = barTicks * 6
  const bar8 = barTicks * 7
  const keysTrack = createTrack({
    color: melodyColor,
    id: 'blue_hour_track_keys',
    instrumentId: 'keys.default',
    name: 'Submerged Rhodes',
    role: 'melody',
  })
  const drumsTrack = createTrack({
    color: drumsColor,
    id: 'blue_hour_track_drums',
    instrumentId: 'drums.default',
    name: 'Deep Pocket',
    role: 'drums',
  })
  const tracks = [keysTrack, drumsTrack]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: melodyColor,
          id: 'blue_hour_block_keys',
          lengthTicks: totalTicks,
          name: 'Rhodes — C minor after dark',
          patternId: 'blue_hour_pattern_keys',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: keysTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_1',
          lengthTicks: drumBlockTicks,
          name: 'Drums — Sink In',
          patternId: 'blue_hour_pattern_drums_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_2',
          lengthTicks: drumBlockTicks,
          name: 'Drums — Modal Lift',
          patternId: 'blue_hour_pattern_drums_2',
          playbackMode: 'oneShot',
          startTick: bar3,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_3',
          lengthTicks: drumBlockTicks,
          name: 'Drums — Open Pocket',
          patternId: 'blue_hour_pattern_drums_3',
          playbackMode: 'oneShot',
          startTick: bar5,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: drumsColor,
          id: 'blue_hour_block_drums_4',
          lengthTicks: drumBlockTicks,
          name: 'Drums — Turn Home',
          patternId: 'blue_hour_pattern_drums_4',
          playbackMode: 'oneShot',
          startTick: bar7,
          trackId: drumsTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'blue_hour_section_sink',
          lengthTicks: barTicks * 4,
          name: 'Sink In',
          startTick: 0,
        }),
        createSection({
          id: 'blue_hour_section_surface',
          lengthTicks: barTicks * 4,
          name: 'Surface',
          startTick: bar5,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createMelodicInstrument({
        id: 'keys.default',
        name: 'Submerged Rhodes',
        soundId: 'keys.default',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Deep Dust Kit',
        pieces: {
          closedHat: createDrumPieceSound({
            soundId: 'drums.closedHat.default',
            volumeDb: -12,
          }),
          crash: createDrumPieceSound({
            durationSeconds: 0.48,
            pitchSemitones: -3,
            soundId: 'drums.crash.default',
            volumeDb: -9,
          }),
          kick: createDrumPieceSound({
            durationSeconds: 0.42,
            pitchSemitones: -9,
            soundId: 'drums.kick.default',
            volumeDb: 12,
          }),
          lowTom: createDrumPieceSound({
            durationSeconds: 0.32,
            pitchSemitones: -7,
            soundId: 'drums.lowTom.default',
            volumeDb: 0,
          }),
          openHat: createDrumPieceSound({
            durationSeconds: 0.38,
            pitchSemitones: -2,
            soundId: 'drums.openHat.default',
            volumeDb: -10,
          }),
          ride: createDrumPieceSound({
            durationSeconds: 0.36,
            pitchSemitones: -3,
            soundId: 'drums.ride.default',
            volumeDb: -10,
          }),
          snare: createDrumPieceSound({
            durationSeconds: 0.18,
            pitchSemitones: -4,
            soundId: 'drums.snare.default',
            volumeDb: -3,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: keysTrack.mixChannelId,
          pan: -0.25,
          volumeDb: -4,
        }),
        createMixChannel({
          id: drumsTrack.mixChannelId,
          pan: 0.25,
          volumeDb: 4,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: 0,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: createNoteEvents('blue_hour_event_keys', [
          // Bar 1: Cm9 — open fifth, seventh, ninth, and a close D/Eb glow.
          [0, 36, sustainedBassTicks, 74],
          [0, 55, sustainedChordTicks, 58],
          [0, 58, sustainedChordTicks, 62],
          [0, 62, sustainedChordTicks, 54],
          [0, 63, sustainedChordTicks, 60],
          [(PPQ * 5) / 2, 67, halfBeatTicks, 68],
          [(PPQ * 13) / 4, 70, quarterBeatTicks, 60],

          // Bar 2: Abmaj9 — the upper voices barely move.
          [bar2, 44, sustainedBassTicks, 72],
          [bar2, 55, sustainedChordTicks, 56],
          [bar2, 58, sustainedChordTicks, 60],
          [bar2, 60, sustainedChordTicks, 54],
          [bar2, 63, sustainedChordTicks, 62],
          [bar2 + (PPQ * 2), 75, halfBeatTicks, 66],
          [bar2 + (PPQ * 13) / 4, 72, halfBeatTicks, 58],

          // Bar 3: Ebmaj9/G — a soft inversion keeps the bass line afloat.
          [bar3, 43, sustainedBassTicks, 72],
          [bar3, 53, sustainedChordTicks, 54],
          [bar3, 58, sustainedChordTicks, 60],
          [bar3, 62, sustainedChordTicks, 56],
          [bar3, 63, sustainedChordTicks, 62],
          [bar3 + (PPQ * 2), 74, halfBeatTicks, 68],
          [bar3 + (PPQ * 3), 67, halfBeatTicks, 58],

          // Bar 4: F9/A — borrowed from C Dorian for the modal lift.
          [bar4, 45, sustainedBassTicks, 76],
          [bar4, 51, sustainedChordTicks, 54],
          [bar4, 55, sustainedChordTicks, 58],
          [bar4, 57, sustainedChordTicks, 62],
          [bar4, 60, sustainedChordTicks, 56],
          [bar4, 65, sustainedChordTicks, 60],
          [bar4 + (PPQ * 5) / 2, 72, halfBeatTicks, 66],
          [bar4 + (PPQ * 7) / 2, 67, halfBeatTicks, 60],

          // Bar 5: Cm11 — deeper and wider on the return.
          [bar5, 36, sustainedBassTicks, 78],
          [bar5, 43, sustainedBassTicks, 50],
          [bar5, 58, sustainedChordTicks, 60],
          [bar5, 62, sustainedChordTicks, 54],
          [bar5, 63, sustainedChordTicks, 58],
          [bar5, 65, sustainedChordTicks, 62],
          [bar5 + (PPQ * 3) / 2, 67, halfBeatTicks, 68],
          [bar5 + (PPQ * 5) / 2, 70, halfBeatTicks, 64],
          [bar5 + (PPQ * 7) / 2, 77, halfBeatTicks, 58],

          // Bar 6: Abmaj9/C — suspended above a warm first-inversion bass.
          [bar6, 48, sustainedBassTicks, 72],
          [bar6, 55, sustainedChordTicks, 54],
          [bar6, 58, sustainedChordTicks, 60],
          [bar6, 63, sustainedChordTicks, 58],
          [bar6, 68, sustainedChordTicks, 62],
          [bar6 + (PPQ * 2), 75, halfBeatTicks, 68],
          [bar6 + (PPQ * 3), 72, halfBeatTicks, 60],

          // Bar 7: Fm9 — back inside natural minor before the turnaround.
          [bar7, 41, sustainedBassTicks, 76],
          [bar7, 51, sustainedChordTicks, 54],
          [bar7, 55, sustainedChordTicks, 58],
          [bar7, 56, sustainedChordTicks, 62],
          [bar7, 60, sustainedChordTicks, 56],
          [bar7, 65, sustainedChordTicks, 60],
          [bar7 + (PPQ * 2), 72, halfBeatTicks, 66],
          [bar7 + (PPQ * 11) / 4, 75, quarterBeatTicks, 62],
          [bar7 + (PPQ * 7) / 2, 79, halfBeatTicks, 58],

          // Bar 8: G7b9 resolves to a compact Cm9 on beat four.
          [bar8, 43, sustainedChordTicks, 80],
          [bar8, 53, sustainedChordTicks, 56],
          [bar8, 56, sustainedChordTicks, 60],
          [bar8, 59, sustainedChordTicks, 64],
          [bar8, 62, sustainedChordTicks, 58],
          [bar8, 67, sustainedChordTicks, 54],
          [bar8 + (PPQ * 2), 68, halfBeatTicks, 66],
          [bar8 + (PPQ * 5) / 2, 67, halfBeatTicks, 60],
          [bar8 + (PPQ * 3), 48, PPQ, 74],
          [bar8 + (PPQ * 3), 55, PPQ, 54],
          [bar8 + (PPQ * 3), 58, PPQ, 60],
          [bar8 + (PPQ * 3), 62, PPQ, 56],
          [bar8 + (PPQ * 3), 63, PPQ, 62],
        ]),
        id: 'blue_hour_pattern_keys',
        kind: 'note',
        lengthTicks: totalTicks,
        metadata: {
          progression: 'Cm9 · Abmaj9 · Ebmaj9/G · F9/A · Cm11 · Abmaj9/C · Fm9 · G7b9 → Cm9',
        },
        name: 'Blue Hour Voicings',
      }),
      ...splitPattern(createPattern({
        events: createDrumHitEvents('blue_hour_event_drums', [
          // Bar 1: establish the heavy halftime pocket.
          [0, 'kick', 118],
          [PPQ + halfBeatTicks, 'kick', 82],
          [PPQ * 2, 'snare', 106],
          [(PPQ * 11) / 4, 'kick', 76],
          [(PPQ * 15) / 4, 'snare', 38],

          // Bar 2: a late kick pulls against the straight hats.
          [bar2, 'kick', 112],
          [bar2 + (PPQ * 5) / 4, 'snare', 34],
          [bar2 + (PPQ * 3) / 2, 'kick', 80],
          [bar2 + (PPQ * 2), 'snare', 108],
          [bar2 + (PPQ * 5) / 2, 'kick', 88],
          [bar2 + (PPQ * 15) / 4, 'kick', 70],

          // Bar 3: leave air after the backbeat.
          [bar3, 'kick', 114],
          [bar3 + (PPQ * 5) / 4, 'kick', 76],
          [bar3 + (PPQ * 2), 'snare', 104],
          [bar3 + (PPQ * 9) / 4, 'kick', 84],
          [bar3 + (PPQ * 13) / 4, 'snare', 36],

          // Bar 4: low toms answer the modal-interchange chord.
          [bar4, 'kick', 116],
          [bar4 + (PPQ * 3) / 2, 'kick', 80],
          [bar4 + (PPQ * 2), 'snare', 108],
          [bar4 + (PPQ * 3), 'lowTom', 72],
          [bar4 + (PPQ * 13) / 4, 'closedHat', 44],
          [bar4 + (PPQ * 13) / 4, 'lowTom', 78],
          [bar4 + (PPQ * 7) / 2, 'lowTom', 86],
          [bar4 + (PPQ * 15) / 4, 'closedHat', 50],
          [bar4 + (PPQ * 15) / 4, 'lowTom', 94],

          // Bar 5: the ride opens the second half without losing weight.
          [bar5, 'kick', 120],
          [bar5, 'ride', 54],
          [bar5 + (PPQ * 7) / 4, 'kick', 78],
          [bar5 + (PPQ * 2), 'snare', 110],
          [bar5 + (PPQ * 11) / 4, 'kick', 86],
          [bar5 + (PPQ * 15) / 4, 'snare', 40],

          // Bar 6: a busier kick phrase, still tucked behind the snare.
          [bar6, 'kick', 114],
          [bar6 + (PPQ * 5) / 4, 'kick', 76],
          [bar6 + (PPQ * 7) / 4, 'snare', 34],
          [bar6 + (PPQ * 2), 'snare', 108],
          [bar6 + (PPQ * 5) / 2, 'kick', 88],
          [bar6 + (PPQ * 13) / 4, 'kick', 72],

          // Bar 7: strip back before the final turn.
          [bar7, 'kick', 116],
          [bar7 + (PPQ * 5) / 4, 'snare', 36],
          [bar7 + (PPQ * 2), 'snare', 106],
          [bar7 + (PPQ * 3), 'kick', 86],
          [bar7 + (PPQ * 7) / 2, 'ride', 48],

          // Bar 8: the deepest kick and a compact tom fill into the loop.
          [bar8, 'crash', 58],
          [bar8, 'kick', 122],
          [bar8 + (PPQ * 3) / 2, 'kick', 84],
          [bar8 + (PPQ * 2), 'snare', 112],
          [bar8 + (PPQ * 11) / 4, 'kick', 90],
          [bar8 + (PPQ * 13) / 4, 'snare', 38],
          [bar8 + (PPQ * 13) / 4, 'lowTom', 76],
          [bar8 + (PPQ * 7) / 2, 'lowTom', 86],
          [bar8 + (PPQ * 15) / 4, 'lowTom', 98],

          ...createClosedHatPulse(totalTicks, true),
        ]),
        id: 'blue_hour_pattern_drums',
        kind: 'drum',
        lengthTicks: totalTicks,
        metadata: {
          feel: 'half-time, deep, loose',
        },
        name: 'Eight Bars Below',
      }), drumBlockTicks, [
        'Pocket I — Sink In',
        'Pocket II — Modal Lift',
        'Pocket III — Open Up',
        'Pocket IV — Turn Home',
      ]),
    ]),
    project: createProject({
      id: 'project_blue_hour_below',
      metadata: createProjectMetadata({
        description: 'An eight-bar, drum-forward deep beat in C minor, lifted for one bar by C Dorian.',
        tags: ['chill', 'deep-beat', 'drum-focused', 'modal-interchange'],
      }),
      name: 'Blue Hour Below',
    }),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({
          key: { mode: 'minor', tonic: 0 },
          tick: 0,
        }),
      ],
      meterEvents: [
        createMeterEvent({
          id: 'blue_hour_meter',
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({
          bpm: 76,
          id: 'blue_hour_tempo',
          tick: 0,
        }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
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

type DrumHitSeed = readonly [
  timeTick: Tick,
  piece: DrumPiece,
  velocity: Velocity,
]

function createDrumHitEvents(
  idPrefix: string,
  hits: readonly DrumHitSeed[],
) {
  return hits.map(([timeTick, piece, velocity], index) => createDrumHitEvent({
    id: `${idPrefix}_${index + 1}`,
    piece,
    timeTick,
    velocity,
  }))
}

type NoteSeed = readonly [
  timeTick: Tick,
  pitch: MidiNote,
  durationTicks: DurationTicks,
  velocity: Velocity,
]

function createNoteEvents(
  idPrefix: string,
  notes: readonly NoteSeed[],
) {
  return notes.map(([timeTick, pitch, durationTicks, velocity], index) => createNoteEvent({
    durationTicks,
    id: `${idPrefix}_${index + 1}`,
    pitch,
    timeTick,
    velocity,
  }))
}

function createClosedHatPulse(
  lengthTicks: DurationTicks,
  openFinalHit = false,
): DrumHitSeed[] {
  const stepTicks = PPQ / 2
  const hitCount = Math.floor(lengthTicks / stepTicks)

  return Array.from({ length: hitCount }, (_, index) => [
    index * stepTicks,
    openFinalHit && index === hitCount - 1
      ? 'openHat'
      : 'closedHat',
    index % 2 === 0 ? 36 : 46,
  ])
}
