import { addEntity, removeEntity, updateEntity } from '../type'
import type { Workspace } from './type'
import type { Block, Section } from '~/domain/arrangement'
import type { Pattern } from '~/domain/patterns'
import { touchProject } from '~/domain/project'
import type { Timeline } from '~/domain/timeline'
import type { Track } from '~/domain/tracks'

export function setTimeline(workspace: Workspace, timeline: Timeline): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    timeline,
  }
}

export function addTrack(workspace: Workspace, track: Track): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    tracks: addEntity(workspace.tracks, track),
  }
}

export function updateTrack(workspace: Workspace, track: Track): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    tracks: updateEntity(workspace.tracks, track),
  }
}

export function removeTrack(workspace: Workspace, trackId: string): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    tracks: removeEntity(workspace.tracks, trackId),
  }
}

export function addPattern(workspace: Workspace, pattern: Pattern): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    patterns: addEntity(workspace.patterns, pattern),
  }
}

export function updatePattern(workspace: Workspace, pattern: Pattern): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    patterns: updateEntity(workspace.patterns, pattern),
  }
}

export function removePattern(workspace: Workspace, patternId: string): Workspace {
  return {
    ...workspace,
    project: touchProject(workspace.project),
    patterns: removeEntity(workspace.patterns, patternId),
  }
}

export function addSection(workspace: Workspace, section: Section): Workspace {
  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      sections: [...workspace.arrangement.sections, section],
    },
    project: touchProject(workspace.project),
  }
}

export function updateSection(workspace: Workspace, section: Section): Workspace {
  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      sections: workspace.arrangement.sections.map(currentSection => currentSection.id === section.id
        ? section
        : currentSection),
    },
    project: touchProject(workspace.project),
  }
}

export function removeSection(workspace: Workspace, sectionId: string): Workspace {
  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      sections: workspace.arrangement.sections.filter(section => section.id !== sectionId),
    },
    project: touchProject(workspace.project),
  }
}

export function addBlock(workspace: Workspace, block: Block): Workspace {
  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      blocks: [...workspace.arrangement.blocks, block],
    },
    project: touchProject(workspace.project),
  }
}

export function updateBlock(workspace: Workspace, block: Block): Workspace {
  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      blocks: workspace.arrangement.blocks.map(currentBlock => currentBlock.id === block.id
        ? block
        : currentBlock),
    },
    project: touchProject(workspace.project),
  }
}

export function removeBlock(workspace: Workspace, blockId: string): Workspace {
  return {
    ...workspace,
    arrangement: {
      ...workspace.arrangement,
      blocks: workspace.arrangement.blocks.filter(block => block.id !== blockId),
    },
    project: touchProject(workspace.project),
  }
}
