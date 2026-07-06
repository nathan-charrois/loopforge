import { type Block, createBlock, createDefaultArrangement, createSection } from '../arrangement'
import { createChordSymbol, createDefaultKey } from '../harmony'
import type { PitchClass } from '../musicPrimitives'
import { createChordEvent } from '../patternEvents'
import { createPattern, createSeedPatternEvents, type Pattern } from '../patterns'
import { createDefaultTimeline, createKeyEvent, createMeterEvent, createTempoEvent, createTimeline, PPQ, type TimeSignatureDenominator } from '../timeline'
import { createDefaultTracks, createTrack, getPatternKindForTrack, type Track, type TrackRole } from '../tracks'
import type { Project, ProjectMetadata, ProjectVersion } from './index'

export function createProjectMetadata(input: Partial<ProjectMetadata> = {}): ProjectMetadata {
  return {
    description: input.description,
    tags: input.tags ?? [],
  }
}

export function createProjectVersion(input: Partial<ProjectVersion> = {}): ProjectVersion {
  return {
    revision: input.revision ?? 1,
    schemaVersion: input.schemaVersion ?? 1,
  }
}

export function createBlankProject(input: Partial<Project> = {}): Project {
  const createdAt = input.createdAt ?? '1970-01-01T00:00:00.000Z'

  return {
    arrangement: input.arrangement ?? createDefaultArrangement(),
    createdAt,
    id: input.id ?? 'project_draft',
    metadata: input.metadata ?? createProjectMetadata(),
    name: input.name ?? 'Untitled Project',
    patterns: input.patterns ?? [],
    timeline: input.timeline ?? createDefaultTimeline(),
    tracks: input.tracks ?? createDefaultTracks(),
    updatedAt: input.updatedAt ?? createdAt,
    version: input.version ?? createProjectVersion(),
  }
}

export function createProjectDraft(input: {
  bpm: number
  denominator: TimeSignatureDenominator
  name: string
  numerator: number
}): Project {
  const now = new Date().toISOString()

  return createBlankProject({
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

export function createDemoLoopProject(sourceProject: Project): {
  blockId: string
  patternId: string
  project: Project
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
    id: createEntityId('pattern_chord', sourceProject.patterns.length),
    kind: 'chord',
    lengthTicks: 1920,
    metadata: { generatedBy: 'project factory' },
    name: 'Two Chord Loop',
  })
  const chordTrack = sourceProject.tracks.find(track => track.role === 'chords') ?? sourceProject.tracks[0]
  const block = createBlock({
    color: chordTrack?.color ?? '#9b51e0',
    id: createEntityId('block', sourceProject.arrangement.blocks.length),
    lengthTicks: 3840,
    name: 'Seed Loop',
    patternId: chordPattern.id,
    startTick: 0,
    trackId: chordTrack?.id ?? 'track_chords',
  })
  const project = stampProject({
    ...sourceProject,
    arrangement: {
      ...sourceProject.arrangement,
      blocks: [...sourceProject.arrangement.blocks, block],
    },
    patterns: [...sourceProject.patterns, chordPattern],
  })

  return {
    blockId: block.id,
    patternId: chordPattern.id,
    project,
  }
}

export function createLargeSketchProject(sourceProject: Project): Project {
  const now = new Date().toISOString()
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
    ...sourceProject,
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
    createdAt: sourceProject.createdAt,
    id: sourceProject.id,
    patterns,
    tracks,
    updatedAt: now,
  }
}

export function stampProject(project: Project): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  }
}

export function summarizeProjectAction(project: Project): Record<string, number | string> {
  return {
    blocks: project.arrangement.blocks.length,
    patterns: project.patterns.length,
    projectId: project.id,
    sections: project.arrangement.sections.length,
    tracks: project.tracks.length,
    updatedAt: project.updatedAt,
  }
}

function createEntityId(prefix: string, existingCount: number): string {
  return `${prefix}_${existingCount + 1}`
}
