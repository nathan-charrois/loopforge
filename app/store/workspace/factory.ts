import { createEmptyEntityStore, createEntityStore, type EntityStore } from '../type'
import { addBlock, addPattern } from './operations'
import { selectTracks } from './selector'
import type { Workspace } from './type'
import { type Block, createBlock, createDefaultArrangement, createSection } from '~/domain/arrangement'
import { createChordSymbol, createDefaultKey } from '~/domain/harmony'
import {
  createDrumInstrument,
  createDrumPieceSound,
  createMelodicInstrument,
  type DrumPiece,
  type Instrument,
} from '~/domain/instrument'
import { createMixChannel, createMixer } from '~/domain/mixer'
import type {
  DurationTicks,
  MidiNote,
  PitchClass,
  Tick,
  Velocity,
} from '~/domain/musicPrimitives'
import { createChordEvent, createDrumHitEvent, createNoteEvent } from '~/domain/patternEvents'
import { createPattern, createSeedPatternEvents, type Pattern } from '~/domain/patterns'
import { createProject, createProjectMetadata, createProjectVersion, touchProject } from '~/domain/project'
import {
  createDefaultTimeline,
  createKeyEvent,
  createMeterEvent,
  createTempoEvent,
  createTimeline,
  PPQ,
  type TimeSignatureDenominator,
} from '~/domain/timeline'
import { createDefaultTracks, createTrack, getPatternKindForTrack, type Track, type TrackRole } from '~/domain/tracks'

export function createWorkspace(input: Partial<Workspace> = {}): Workspace {
  const tracks = normalizeEntityStore(input.tracks, createEntityStore(createDefaultTracks()))

  return {
    arrangement: input.arrangement ?? createDefaultArrangement(),
    mixer: input.mixer ?? createMixerForTracks(tracks),
    patterns: normalizeEntityStore(input.patterns, createEmptyEntityStore<Pattern>()),
    project: input.project ?? createProject(),
    timeline: input.timeline ?? createDefaultTimeline(),
    tracks,
    instruments: normalizeEntityStore(input.instruments, createEmptyEntityStore<Instrument>()),
  }
}

export function createWorkspaceForPlayback(input: {
  bpm: number
  denominator: TimeSignatureDenominator
  name: string
  numerator: number
}): Workspace {
  const now = new Date().toISOString()

  return createWorkspace({
    project: createProject({
      createdAt: now,
      updatedAt: now,
      id: `project_${Date.now()}`,
      metadata: createProjectMetadata({
        tags: ['playback'],
      }),
      name: input.name,
      version: createProjectVersion(),
    }),
    timeline: createTimeline({
      keyEvents: [createKeyEvent({ key: createDefaultKey(), tick: 0 })],
      meterEvents: [createMeterEvent({
        tick: 0,
        timeSignature: {
          denominator: input.denominator,
          numerator: input.numerator,
        },
      })],
      tempoEvents: [createTempoEvent({ bpm: input.bpm, tick: 0 })],
    }),

  })
}

export function createDemoLoopWorkspace(sourceWorkspace: Workspace): {
  blockId: string
  patternId: string
  workspace: Workspace
} {
  const chordPattern = createPattern({
    events: [
      createChordEvent({
        chord: createChordSymbol({ quality: 'minor', root: 0 }),
        durationTicks: 960,
        id: 'event_chord_1',
        timeTick: 0,
        velocity: 96,
      }),
      createChordEvent({
        chord: createChordSymbol({ quality: 'major', root: 5 }),
        durationTicks: 960,
        id: 'event_chord_2',
        timeTick: 960,
        velocity: 92,
      }),
    ],
    id: createEntityId('pattern_chord', sourceWorkspace.patterns.allIds.length),
    kind: 'chord',
    lengthTicks: 1920,
    metadata: { generatedBy: 'workspace factory' },
    name: 'Two Chord Loop',
  })
  const tracks = selectTracks(sourceWorkspace)
  const chordTrack = tracks.find(track => track.role === 'chords') ?? tracks[0]
  const block = createBlock({
    color: chordTrack?.color ?? '#9b51e0',
    id: createEntityId('block', sourceWorkspace.arrangement.blocks.length),
    lengthTicks: 3840,
    name: 'Seed Loop',
    patternId: chordPattern.id,
    startTick: 0,
    trackId: chordTrack?.id ?? 'track_chords',
  })
  const workspace = addBlock(addPattern(sourceWorkspace, chordPattern), block)

  return {
    blockId: block.id,
    patternId: chordPattern.id,
    workspace,
  }
}

export function createLargeSketchWorkspace(sourceWorkspace: Workspace): Workspace {
  const tracks: Track[] = []
  const patterns: Pattern[] = []
  const blocks: Block[] = []
  const roles: TrackRole[] = ['chords', 'bass', 'melody', 'drums']

  for (let index = 0; index < 10; index += 1) {
    const role = roles[index % roles.length]

    tracks.push(createTrack({
      id: `stress_track_${index + 1}`,
      name: `Track ${index + 1}`,
      role,
    }))
  }

  for (let index = 0; index < tracks.length; index += 1) {
    const track = tracks[index]
    const kind = getPatternKindForTrack(track)
    const pattern = createPattern({
      events: createSeedPatternEvents(kind, 960, {
        chordQuality: index % 2 === 0 ? 'minor' : 'major',
        chordRoot: (index % 12) as PitchClass,
        drumPiece: index % 2 === 0 ? 'kick' : 'openHat',
        notePitch: 48 + (index % 24),
      }),
      id: `stress_pattern_${index + 1}`,
      kind,
      lengthTicks: 960,
      metadata: { generatedBy: 'playback stress seed' },
      name: `Pattern ${index + 1}`,
    })

    patterns.push(pattern)
  }

  for (let index = 0; index < 100; index += 1) {
    const track = tracks[index % tracks.length]
    const pattern = patterns[index % patterns.length]
    const barIndex = Math.floor(index / tracks.length)

    blocks.push(createBlock({
      color: track.color,
      id: `stress_block_${index + 1}`,
      lengthTicks: 960,
      muted: index % 23 === 0,
      name: `Block ${index + 1}`,
      patternId: pattern.id,
      playbackMode: index % 17 === 0 ? 'stretch' : 'loop',
      startTick: barIndex * 960,
      trackId: track.id,
    }))
  }

  return {
    ...sourceWorkspace,
    arrangement: {
      blocks,
      sections: [
        createSection({
          id: 'stress_section_1',
          lengthTicks: 20 * 4 * PPQ,
          name: 'Stress Section',
          startTick: 0,
        }),
      ],
    },
    patterns: createEntityStore(patterns),
    project: touchProject(sourceWorkspace.project),
    mixer: {
      ...sourceWorkspace.mixer,
      channels: createEntityStore(tracks.map(track => createMixChannel({
        id: track.mixChannelId,
        volumeDb: track.role === 'drums' ? -3 : -6,
      }))),
    },
    tracks: createEntityStore(tracks),
  }
}

export function createInitialWorkspace(): Workspace {
  const barTicks = PPQ * 4
  const twoBarsTicks = barTicks * 2
  const chordsTrack = createTrack({
    id: 'debug_track_chords',
    name: 'Chords',
    role: 'chords',
  })
  const drumsTrack = createTrack({
    id: 'debug_track_drums',
    name: 'Drums',
    role: 'drums',
  })
  const bassTrack = createTrack({
    id: 'debug_track_bass',
    name: 'Bass',
    role: 'bass',
  })
  const leadTrack = createTrack({
    id: 'debug_track_lead',
    name: 'Lead',
    role: 'melody',
  })
  const tracks = [
    chordsTrack,
    drumsTrack,
    bassTrack,
    leadTrack,
  ]

  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: '#4c6ef5',
          id: 'debug_block_chords_statement',
          lengthTicks: twoBarsTicks,
          name: 'Dust Chords — Statement',
          patternId: 'debug_pattern_chords_statement',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: chordsTrack.id,
        }),
        createBlock({
          color: '#5f3dc4',
          id: 'debug_block_chords_response',
          lengthTicks: twoBarsTicks,
          name: 'Dust Chords — Response',
          patternId: 'debug_pattern_chords_response',
          playbackMode: 'oneShot',
          startTick: twoBarsTicks,
          trackId: chordsTrack.id,
        }),
        createBlock({
          color: '#f59f00',
          id: 'debug_block_drums_bar_1',
          lengthTicks: barTicks,
          name: 'Pocket — Establish',
          patternId: 'debug_pattern_drums_bar_1',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#f08c00',
          id: 'debug_block_drums_bar_2',
          lengthTicks: barTicks,
          name: 'Pocket — Lean',
          patternId: 'debug_pattern_drums_bar_2',
          playbackMode: 'oneShot',
          startTick: barTicks,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#e67700',
          id: 'debug_block_drums_bar_3',
          lengthTicks: barTicks,
          name: 'Pocket — Drag',
          patternId: 'debug_pattern_drums_bar_3',
          playbackMode: 'oneShot',
          startTick: twoBarsTicks,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#d9480f',
          id: 'debug_block_drums_bar_4',
          lengthTicks: barTicks,
          name: 'Pocket — Turnaround',
          patternId: 'debug_pattern_drums_bar_4',
          playbackMode: 'oneShot',
          startTick: barTicks * 3,
          trackId: drumsTrack.id,
        }),
        createBlock({
          color: '#15aabf',
          id: 'debug_block_bass_statement',
          lengthTicks: twoBarsTicks,
          name: 'Low Counterline — Statement',
          patternId: 'debug_pattern_bass_statement',
          playbackMode: 'oneShot',
          startTick: 0,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#1098ad',
          id: 'debug_block_bass_response',
          lengthTicks: twoBarsTicks,
          name: 'Low Counterline — Response',
          patternId: 'debug_pattern_bass_response',
          playbackMode: 'oneShot',
          startTick: twoBarsTicks,
          trackId: bassTrack.id,
        }),
        createBlock({
          color: '#40c057',
          id: 'debug_block_lead_bar_2',
          lengthTicks: barTicks,
          name: 'Lead — First Answer',
          patternId: 'debug_pattern_lead_bar_2',
          playbackMode: 'oneShot',
          startTick: barTicks,
          trackId: leadTrack.id,
        }),
        createBlock({
          color: '#2f9e44',
          id: 'debug_block_lead_bar_4',
          lengthTicks: barTicks,
          name: 'Lead — Final Answer',
          patternId: 'debug_pattern_lead_bar_4',
          playbackMode: 'oneShot',
          startTick: barTicks * 3,
          trackId: leadTrack.id,
        }),
      ],
      sections: [
        createSection({
          id: 'debug_section_statement',
          lengthTicks: twoBarsTicks,
          name: 'Statement',
          startTick: 0,
        }),
        createSection({
          id: 'debug_section_response',
          lengthTicks: twoBarsTicks,
          name: 'Response',
          startTick: twoBarsTicks,
        }),
      ],
    },
    instruments: createEntityStore<Instrument>([
      createMelodicInstrument({
        id: 'keys.default',
        name: 'Default Keys',
        soundId: 'keys.default',
      }),
      createMelodicInstrument({
        id: 'bass.default',
        name: 'Default Bass',
        soundId: 'bass.default',
      }),
      createMelodicInstrument({
        id: 'lead.default',
        name: 'Default Lead',
        soundId: 'lead.default',
      }),
      createDrumInstrument({
        id: 'drums.default',
        name: 'Default Drums',
        pieces: {
          closedHat: createDrumPieceSound({
            soundId: 'drums.closedHat.default',
            volumeDb: -7,
          }),
          kick: createDrumPieceSound({
            pitchSemitones: -1,
            soundId: 'drums.kick.default',
            volumeDb: 1,
          }),
          lowTom: createDrumPieceSound({
            pitchSemitones: -2,
            soundId: 'drums.lowTom.default',
            volumeDb: -3,
          }),
          midTom: createDrumPieceSound({
            soundId: 'drums.midTom.default',
            volumeDb: -4,
          }),
          openHat: createDrumPieceSound({
            soundId: 'drums.openHat.default',
            volumeDb: -6,
          }),
          snare: createDrumPieceSound({
            pitchSemitones: -2,
            soundId: 'drums.snare.default',
            volumeDb: -2,
          }),
        },
      }),
    ]),
    mixer: createMixer({
      channels: createEntityStore([
        createMixChannel({
          id: chordsTrack.mixChannelId,
          pan: 0.30,
          volumeDb: -5,
        }),
        createMixChannel({
          id: drumsTrack.mixChannelId,
          pan: -0.30,
          volumeDb: 6.5,
        }),
        createMixChannel({
          id: bassTrack.mixChannelId,
          pan: -0.17,
          volumeDb: -5,
        }),
        createMixChannel({
          id: leadTrack.mixChannelId,
          pan: 0.17,
          volumeDb: -10,
        }),
      ]),
      master: {
        muted: false,
        volumeDb: -9.5,
      },
    }),
    patterns: createEntityStore([
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['9'],
              quality: 'minor',
              root: 0,
            }),
            durationTicks: barTicks,
            id: 'debug_event_chord_statement_1',
            playback: { recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 86,
            voicing: {
              register: 'low',
              type: 'drop2',
            },
          }),
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['maj7'],
              quality: 'major',
              root: 8,
            }),
            durationTicks: barTicks,
            id: 'debug_event_chord_statement_2',
            playback: { recipeId: 'block_staggered' },
            timeTick: barTicks,
            velocity: 80,
            voicing: {
              inversion: 1,
              register: 'low',
              type: 'drop2',
            },
          }),
        ],
        id: 'debug_pattern_chords_statement',
        kind: 'chord',
        lengthTicks: twoBarsTicks,
        name: 'Dust Chords — Statement',
      }),
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({
              extensions: ['9'],
              quality: 'minor',
              root: 5,
            }),
            durationTicks: barTicks,
            id: 'debug_event_chord_response_1',
            playback: { recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 84,
            voicing: {
              register: 'low',
              type: 'drop2',
            },
          }),
          createChordEvent({
            chord: createChordSymbol({
              alterations: ['b9'],
              extensions: ['7'],
              quality: 'sus4',
              root: 7,
            }),
            durationTicks: barTicks,
            id: 'debug_event_chord_response_2',
            playback: { recipeId: 'block_staggered' },
            timeTick: barTicks,
            velocity: 82,
            voicing: {
              inversion: 1,
              register: 'low',
              type: 'drop2',
            },
          }),
        ],
        id: 'debug_pattern_chords_response',
        kind: 'chord',
        lengthTicks: twoBarsTicks,
        name: 'Dust Chords — Response',
      }),
      createPattern({
        events: createNoteEvents('debug_event_bass_statement', [
          [0, 0, PPQ + (PPQ / 2), 116],
          [PPQ + (PPQ * 3 / 4), 7, PPQ / 2, 90],
          [PPQ * 3, 10, PPQ * 3 / 4, 101],
          [barTicks, 8, PPQ + (PPQ / 2), 110],
          [barTicks + PPQ + (PPQ * 3 / 4), 7, PPQ / 2, 92],
          [barTicks + (PPQ * 3), 0, PPQ * 3 / 4, 104],
        ]),
        id: 'debug_pattern_bass_statement',
        kind: 'note',
        lengthTicks: twoBarsTicks,
        name: 'Low Counterline — Statement',
      }),
      createPattern({
        events: createNoteEvents('debug_event_bass_response', [
          [0, 5, PPQ + (PPQ / 2), 114],
          [PPQ + (PPQ * 3 / 4), 0, PPQ / 2, 91],
          [PPQ * 3, 3, PPQ * 3 / 4, 100],
          [barTicks, 7, PPQ + (PPQ / 4), 112],
          [barTicks + (PPQ + PPQ / 2), 8, PPQ / 2, 88],
          [barTicks + (PPQ * 2) + (PPQ / 2), 10, PPQ * 3 / 4, 96],
          [twoBarsTicks - (PPQ / 2), 0, PPQ / 2, 106],
        ]),
        id: 'debug_pattern_bass_response',
        kind: 'note',
        lengthTicks: twoBarsTicks,
        name: 'Low Counterline — Response',
      }),
      createPattern({
        events: createDrumHitEvents('debug_event_drum_bar_1', [
          [0, 'kick', 124],
          [PPQ / 2, 'closedHat', 54],
          [PPQ + (PPQ / 2), 'kick', 108],
          [PPQ + (PPQ / 2), 'closedHat', 60],
          [PPQ * 2, 'snare', 116],
          [(PPQ * 2) + (PPQ / 2), 'closedHat', 64],
          [(PPQ * 3) + (PPQ / 4), 'kick', 102],
          [barTicks - (PPQ / 4), 'openHat', 70],
        ]),
        id: 'debug_pattern_drums_bar_1',
        kind: 'drum',
        lengthTicks: barTicks,
        name: 'Pocket — Establish',
      }),
      createPattern({
        events: createDrumHitEvents('debug_event_drum_bar_2', [
          [0, 'kick', 122],
          [PPQ / 2, 'closedHat', 56],
          [PPQ + (PPQ / 4), 'kick', 108],
          [PPQ + (PPQ / 2), 'closedHat', 60],
          [PPQ * 2, 'snare', 118],
          [(PPQ * 2) + (PPQ / 2), 'closedHat', 66],
          [PPQ * 3, 'kick', 98],
          [(PPQ * 3) + (PPQ / 2), 'closedHat', 58],
          [barTicks - (PPQ / 4), 'openHat', 74],
        ]),
        id: 'debug_pattern_drums_bar_2',
        kind: 'drum',
        lengthTicks: barTicks,
        name: 'Pocket — Lean',
      }),
      createPattern({
        events: createDrumHitEvents('debug_event_drum_bar_3', [
          [0, 'kick', 125],
          [PPQ * 3 / 4, 'closedHat', 50],
          [PPQ + (PPQ * 3 / 4), 'kick', 111],
          [PPQ * 2, 'snare', 120],
          [(PPQ * 2) + (PPQ / 2), 'closedHat', 64],
          [(PPQ * 2) + (PPQ * 3 / 4), 'snare', 48],
          [(PPQ * 3) + (PPQ / 2), 'kick', 104],
          [barTicks - (PPQ / 4), 'openHat', 68],
        ]),
        id: 'debug_pattern_drums_bar_3',
        kind: 'drum',
        lengthTicks: barTicks,
        name: 'Pocket — Drag',
      }),
      createPattern({
        events: createDrumHitEvents('debug_event_drum_bar_4', [
          [0, 'kick', 125],
          [PPQ / 2, 'closedHat', 58],
          [PPQ + (PPQ / 4), 'kick', 106],
          [PPQ * 2, 'snare', 120],
          [(PPQ * 2) + (PPQ / 2), 'closedHat', 66],
          [PPQ * 3, 'lowTom', 92],
          [(PPQ * 3) + (PPQ / 4), 'midTom', 88],
          [(PPQ * 3) + (PPQ / 2), 'lowTom', 96],
          [barTicks - (PPQ / 4), 'openHat', 78],
        ]),
        id: 'debug_pattern_drums_bar_4',
        kind: 'drum',
        lengthTicks: barTicks,
        name: 'Pocket — Turnaround',
      }),
      createPattern({
        events: createNoteEvents('debug_event_lead_bar_2', [
          [PPQ / 2, 3, PPQ, 82],
          [PPQ + (PPQ / 2), 7, PPQ * 3 / 4, 76],
          [(PPQ * 2) + (PPQ * 3 / 4), 10, PPQ * 3 / 4, 80],
          [(PPQ * 3) + (PPQ / 2), 0, PPQ / 2, 86],
        ]),
        id: 'debug_pattern_lead_bar_2',
        kind: 'note',
        lengthTicks: barTicks,
        name: 'Lead — First Answer',
      }),
      createPattern({
        events: createNoteEvents('debug_event_lead_bar_4', [
          [PPQ / 2, 5, PPQ * 3 / 4, 84],
          [PPQ + (PPQ / 2), 3, PPQ * 3 / 4, 78],
          [(PPQ * 2) + (PPQ / 2), 7, PPQ / 2, 82],
          [(PPQ * 3) + (PPQ / 4), 0, PPQ * 3 / 4, 88],
        ]),
        id: 'debug_pattern_lead_bar_4',
        kind: 'note',
        lengthTicks: barTicks,
        name: 'Lead — Final Answer',
      }),
    ]),
    timeline: createTimeline({
      grid: 'sixteenthNote',
      keyEvents: [
        createKeyEvent({ key: { mode: 'minor', tonic: 0 }, tick: 0 }),
      ],
      meterEvents: [
        createMeterEvent({
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({ bpm: 72, tick: 0 }),
      ],
    }),
    tracks: createEntityStore(tracks),
  })
}

export function summarizeWorkspaceAction(workspace: Workspace): Record<string, number | string> {
  return {
    blocks: workspace.arrangement.blocks.length,
    mixChannels: workspace.mixer.channels.allIds.length,
    patterns: workspace.patterns.allIds.length,
    projectId: workspace.project.id,
    sections: workspace.arrangement.sections.length,
    tracks: workspace.tracks.allIds.length,
    updatedAt: workspace.project.updatedAt,
  }
}

function createMixerForTracks(tracks: EntityStore<Track>) {
  return createMixer({
    channels: createEntityStore(tracks.allIds.map(trackId => createMixChannel({
      id: tracks.byId[trackId].mixChannelId,
    }))),
  })
}

function normalizeEntityStore<TEntity extends { id: string }>(
  input: EntityStore<TEntity> | readonly TEntity[] | undefined,
  fallback: EntityStore<TEntity>,
): EntityStore<TEntity> {
  if (input === undefined) {
    return fallback
  }

  if (isEntityStore(input)) {
    return input
  }

  return createEntityStore(input)
}

function isEntityStore<TEntity extends { id: string }>(
  input: EntityStore<TEntity> | readonly TEntity[],
): input is EntityStore<TEntity> {
  return !Array.isArray(input)
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

function createEntityId(prefix: string, existingCount: number): string {
  return `${prefix}_${existingCount + 1}`
}
