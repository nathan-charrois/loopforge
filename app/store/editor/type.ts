import type {
  Block,
  BlockId,
  BlockPlaybackMode,
  Section,
  SectionId,
} from '~/domain/arrangement'
import type { ChordSymbol, Key } from '~/domain/harmony'
import type { Tick } from '~/domain/musicPrimitives'
import type { PatternEventId } from '~/domain/patternEvents'
import type { TimelineEvent, TimelineEventId, TimeSignatureDenominator } from '~/domain/timeline'
import type { TrackId } from '~/domain/tracks'

export const ACTIVE_TOOLS = [
  'select',
  'hand',
  'drawBlock',
  'drawSection',
  'erase',
  'split',
  'resize',
  'move',
  'mute',
  'tempo',
  'meter',
  'key',
] as const
export type ActiveTool = typeof ACTIVE_TOOLS[number]

export const INSPECTOR_PANELS = ['project', 'track', 'block', 'pattern', 'event'] as const
export type InspectorPanel = typeof INSPECTOR_PANELS[number]

export type SelectionState = {
  selectedBlockIds: BlockId[]
  selectedPatternEventIds: PatternEventId[]
  selectedTrackIds: TrackId[]
  selectedSectionIds: SectionId[]
  selectedTimelineEventIds: TimelineEventId[]
}

export type ClipboardState = {
  blockIds: BlockId[]
  patternEventIds: PatternEventId[]
}

export type InspectorState = {
  open: boolean
  panel?: InspectorPanel
}

export type ViewportState = {
  scrollX: number
  scrollY: number
  pixelsPerTick: number
  minPixelsPerTick: number
  maxPixelsPerTick: number
  laneHeight: number
  sectionLaneHeight: number
  rulerHeight: number
}

export type DragState
  = | {
    currentTick: Tick
    kind: 'drawBlock'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
    trackId: TrackId
  }
  | {
    currentTick: Tick
    kind: 'drawSection'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentRow: number
    currentTick: Tick
    kind: 'selectRange'
    pointerId: number
    startClientX: number
    startClientY: number
    startRow: number
    startTick: Tick
  }
  | {
    blockIds: BlockId[]
    currentTick: Tick
    currentTrackId?: TrackId
    kind: 'moveBlock'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    block: Block
    currentTick: Tick
    edge: 'left' | 'right'
    kind: 'resizeBlock'
    pointerId: number
    startClientX: number
    startClientY: number
  }
  | {
    currentTick: Tick
    kind: 'moveSection'
    pointerId: number
    section: Section
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentTick: Tick
    edge: 'left' | 'right'
    kind: 'resizeSection'
    pointerId: number
    section: Section
    startClientX: number
    startClientY: number
  }
  | {
    currentTick: Tick
    event: TimelineEvent
    kind: 'moveTimelineEvent'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }

export type TimelineEventDraft = {
  keyMode: Key['mode']
  keyTick: number
  keyTonic: number
  meterDenominator: TimeSignatureDenominator
  meterNumerator: number
  meterTick: number
  tempoBpm: number
  tempoTick: number
}

export type InspectorDraft = TimelineEventDraft & {
  blockColor: string
  blockMuted: boolean
  blockName: string
  blockPlaybackMode: BlockPlaybackMode
  sectionName: string
}

export type Editor = {
  activeTool: ActiveTool
  clipboard: ClipboardState
  focusedBlockId?: BlockId
  hoveredChord?: ChordSymbol
  inspector: InspectorState
  selection: SelectionState
}
