import { createEmptyEntityStore, createEntityStore, type EntityStore } from '../type'
import { addBlock, addPattern } from './command'
import { selectTracks } from './selector'
import type { Workspace } from './type'
import { type Block, createBlock, createDefaultArrangement, createSection } from '~/domain/arrangement'
import { createChordSymbol, createDefaultKey } from '~/domain/harmony'
import type { PitchClass } from '~/domain/musicPrimitives'
import { createChordEvent } from '~/domain/patternEvents'
import { createPattern, createSeedPatternEvents, type Pattern } from '~/domain/patterns'
import { createProject, createProjectMetadata, createProjectVersion, type ProjectMetadata, type ProjectVersion, touchProject } from '~/domain/project'
import {
  createDefaultTimeline,
  createKeyEvent,
  createMeterEvent,
  createTempoEvent,
  createTimeline,
  PPQ,
  type Timeline,
  type TimeSignatureDenominator,
} from '~/domain/timeline'
import { createDefaultTracks, createTrack, getPatternKindForTrack, type Track, type TrackRole } from '~/domain/tracks'

export type CreateBlankWorkspaceInput = {
  name: string
  id?: string
  createdAt?: string
  updatedAt?: string
  metadata?: ProjectMetadata
  version?: ProjectVersion
  timeline?: Timeline
  arrangement?: Workspace['arrangement']
  tracks?: EntityStore<Track> | readonly Track[]
  patterns?: EntityStore<Pattern> | readonly Pattern[]
}

export function createBlankWorkspace(input: CreateBlankWorkspaceInput): Workspace {
  const project = createProject({
    createdAt: input.createdAt,
    id: input.id,
    metadata: input.metadata,
    name: input.name,
    updatedAt: input.updatedAt,
    version: input.version,
  })

  return {
    arrangement: input.arrangement ?? createDefaultArrangement(),
    patterns: normalizeEntityStore(input.patterns, createEmptyEntityStore<Pattern>()),
    project,
    timeline: input.timeline ?? createDefaultTimeline(),
    tracks: normalizeEntityStore(input.tracks, createDefaultTrackStore()),
  }
}

export function createWorkspaceDraft(input: {
  bpm: number
  denominator: TimeSignatureDenominator
  name: string
  numerator: number
}): Workspace {
  const now = new Date().toISOString()

  return createBlankWorkspace({
    createdAt: now,
    id: `project_${Date.now()}`,
    metadata: createProjectMetadata({
      tags: ['playback'],
    }),
    name: input.name,
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
    updatedAt: now,
    version: createProjectVersion(),
  })
}

export function createDefaultTrackStore(): EntityStore<Track> {
  return createEntityStore(createDefaultTracks())
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
      volume: role === 'drums' ? 0.72 : 0.58,
    }))
  }

  for (let index = 0; index < tracks.length; index += 1) {
    const track = tracks[index]
    const kind = getPatternKindForTrack(track)
    const pattern = createPattern({
      events: createSeedPatternEvents(kind, 960, {
        chordQuality: index % 2 === 0 ? 'minor' : 'major',
        chordRoot: (index % 12) as PitchClass,
        drumPiece: index % 2 === 0 ? 'kick' : 'hat',
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
    tracks: createEntityStore(tracks),
  }
}

export function summarizeWorkspaceAction(workspace: Workspace): Record<string, number | string> {
  return {
    blocks: workspace.arrangement.blocks.length,
    patterns: workspace.patterns.allIds.length,
    projectId: workspace.project.id,
    sections: workspace.arrangement.sections.length,
    tracks: workspace.tracks.allIds.length,
    updatedAt: workspace.project.updatedAt,
  }
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
