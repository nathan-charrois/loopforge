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
  type Instrument,
} from '~/domain/instrument'
import { createMixChannel, createMixer } from '~/domain/mixer'
import type { PitchClass } from '~/domain/musicPrimitives'
import { createAutomationEvent, createChordEvent, createDrumHitEvent, createNoteEvent } from '~/domain/patternEvents'
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
  return createWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: '#4c6ef5',
          id: 'debug_block_intro_chords',
          lengthTicks: 3840,
          name: 'Intro Chords',
          patternId: 'debug_pattern_chords',
          playbackMode: 'loop',
          startTick: 0,
          trackId: 'debug_track_chords',
        }),
        createBlock({
          color: '#15aabf',
          id: 'debug_block_verse_bass',
          lengthTicks: 3840,
          name: 'Verse Bass',
          patternId: 'debug_pattern_bass',
          playbackMode: 'stretch',
          startTick: 3840,
          trackId: 'debug_track_bass',
        }),
        createBlock({
          color: '#f59f00',
          id: 'debug_block_verse_drums',
          lengthTicks: 3840,
          name: 'Verse Drums',
          patternId: 'debug_pattern_drums',
          playbackMode: 'loop',
          startTick: 3840,
          trackId: 'debug_track_drums',
        }),
        createBlock({
          color: '#40c057',
          id: 'debug_block_bridge_lead',
          lengthTicks: 3840,
          name: 'Bridge Lead',
          patternId: 'debug_pattern_lead',
          playbackMode: 'oneShot',
          startTick: 7680,
          trackId: 'debug_track_lead',
        }),
        createBlock({
          color: '#7950f2',
          id: 'debug_block_bridge_filter',
          lengthTicks: 3840,
          name: 'Bridge Filter',
          patternId: 'debug_pattern_filter',
          playbackMode: 'stretch',
          startTick: 7680,
          trackId: 'debug_track_automation',
        }),
        createBlock({
          color: '#f25086',
          id: 'debug_block_outro_chords_1',
          lengthTicks: 1920,
          name: 'Outro Lead',
          patternId: 'debug_pattern_chords',
          playbackMode: 'stretch',
          startTick: 11520,
          trackId: 'debug_track_chords',
        }),
        createBlock({
          color: '#f25086',
          id: 'debug_block_outro_chords_2',
          lengthTicks: 1920,
          name: 'Outro Lead',
          patternId: 'debug_pattern_chords',
          playbackMode: 'stretch',
          startTick: 13440,
          trackId: 'debug_track_chords',
        }),
        createBlock({
          color: '#f25086',
          id: 'debug_block_outro_chords_3',
          lengthTicks: 1920,
          name: 'Outro Lead',
          patternId: 'debug_pattern_chords',
          playbackMode: 'stretch',
          startTick: 15360,
          trackId: 'debug_track_chords',
        }),
      ],
      sections: [
        createSection({
          id: 'debug_section_intro',
          lengthTicks: 3840,
          name: 'Intro',
          startTick: 0,
        }),
        createSection({
          id: 'debug_section_verse',
          lengthTicks: 3840,
          name: 'Verse',
          startTick: 3840,
        }),
        createSection({
          id: 'debug_section_bridge',
          lengthTicks: 3840,
          name: 'Bridge',
          startTick: 7680,
        }),
        createSection({
          id: 'debug_section_outro',
          lengthTicks: 5760,
          name: 'Outro',
          startTick: 11520,
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
          }),
          kick: createDrumPieceSound({
            soundId: 'drums.kick.default',
          }),
          openHat: createDrumPieceSound({
            soundId: 'drums.openHat.default',
          }),
          snare: createDrumPieceSound({
            soundId: 'drums.snare.default',
          }),
        },
      }),
    ]),
    patterns: createEntityStore([
      createPattern({
        events: [
          createChordEvent({
            chord: createChordSymbol({ extensions: ['7'], quality: 'minor', root: 0 }),
            durationTicks: PPQ * 2,
            id: 'debug_event_chord_1',
            playback: { recipeId: 'block_staggered' },
            timeTick: 0,
            velocity: 96,
          }),
          createChordEvent({
            chord: createChordSymbol({ quality: 'major', root: 5 }),
            durationTicks: PPQ * 2,
            id: 'debug_event_chord_2',
            playback: { recipeId: 'pop_ostinato' },
            timeTick: PPQ * 2,
            velocity: 90,
          }),
        ],
        id: 'debug_pattern_chords',
        kind: 'chord',
        lengthTicks: PPQ * 4,
        name: 'Two Chord Recipe',
      }),
      createPattern({
        events: [
          createNoteEvent({
            durationTicks: PPQ / 4,
            id: 'debug_event_bass_1',
            pitch: 0,
            timeTick: 0,
            velocity: 100,
          }),
          createNoteEvent({
            durationTicks: PPQ / 4,
            id: 'debug_event_bass_2',
            pitch: 1,
            timeTick: PPQ / 4,
            velocity: 92,
          }),
          createNoteEvent({
            durationTicks: PPQ / 4,
            id: 'debug_event_bass_3',
            pitch: 2,
            timeTick: PPQ / 2,
            velocity: 86,
          }),
          createNoteEvent({
            durationTicks: PPQ / 4,
            id: 'debug_event_bass_4',
            pitch: 3,
            timeTick: PPQ - (PPQ / 4),
            velocity: 80,
          }),
        ],
        id: 'debug_pattern_bass',
        kind: 'note',
        lengthTicks: PPQ,
        name: 'Bass Pulse',
      }),
      createPattern({
        events: [
          createDrumHitEvent({
            id: 'debug_event_drum_1',
            piece: 'kick',
            timeTick: 0,
            velocity: 118,
          }),
          createDrumHitEvent({
            id: 'debug_event_drum_2',
            piece: 'closedHat',
            timeTick: PPQ / 2,
            velocity: 72,
          }),
          createDrumHitEvent({
            id: 'debug_event_drum_3',
            piece: 'snare',
            timeTick: PPQ,
            velocity: 104,
          }),
          createDrumHitEvent({
            id: 'debug_event_drum_4',
            piece: 'openHat',
            timeTick: PPQ + (PPQ / 2),
            velocity: 76,
          }),
        ],
        id: 'debug_pattern_drums',
        kind: 'drum',
        lengthTicks: PPQ * 2,
        name: 'Backbeat',
      }),
      createPattern({
        events: [
          createNoteEvent({
            durationTicks: PPQ,
            id: 'debug_event_lead_1',
            pitch: 1,
            timeTick: 0,
            velocity: 88,
          }),
          createNoteEvent({
            durationTicks: PPQ,
            id: 'debug_event_lead_2',
            pitch: 2,
            timeTick: PPQ,
            velocity: 84,
          }),
        ],
        id: 'debug_pattern_lead',
        kind: 'note',
        lengthTicks: PPQ * 5,
        name: 'Lead One Shot',
      }),
      createPattern({
        events: [
          createAutomationEvent({
            id: 'debug_event_filter_1',
            parameter: 'filterCutoff',
            timeTick: 0,
            value: 0.28,
          }),
          createAutomationEvent({
            id: 'debug_event_filter_2',
            parameter: 'filterCutoff',
            timeTick: PPQ * 2,
            value: 0.72,
          }),
        ],
        id: 'debug_pattern_filter',
        kind: 'automation',
        lengthTicks: PPQ * 5,
        name: 'Filter Rise',
      }),
    ]),
    timeline: createTimeline({
      grid: 'eighthNote',
      keyEvents: [
        createKeyEvent({ key: { mode: 'major', tonic: 0 }, tick: 0 }),
      ],
      meterEvents: [
        createMeterEvent({
          tick: 0,
          timeSignature: { denominator: 4, numerator: 4 },
        }),
      ],
      tempoEvents: [
        createTempoEvent({ bpm: 120, tick: 0 }),
      ],
    }),
    tracks: createEntityStore([
      createTrack({
        id: 'debug_track_chords',
        name: 'Chords',
        role: 'chords',
      }),
      createTrack({
        id: 'debug_track_bass',
        name: 'Bass',
        role: 'bass',
      }),
      createTrack({
        id: 'debug_track_drums',
        name: 'Drums',
        role: 'drums',
      }),
      createTrack({
        id: 'debug_track_lead',
        name: 'Lead',
        role: 'melody',
      }),
      createTrack({
        accepts: ['automation'],
        id: 'debug_track_automation',
        name: 'Automation',
        role: 'melody',
      }),
    ]),
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

function createEntityId(prefix: string, existingCount: number): string {
  return `${prefix}_${existingCount + 1}`
}
