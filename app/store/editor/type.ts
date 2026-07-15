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
    kind: 'drawBlock'
    pointerId: number
    startTick: Tick
    currentTick: Tick
    trackId: TrackId
    startClientX: number
    startClientY: number
  }
  | {
    kind: 'drawSection'
    pointerId: number
    startTick: Tick
    currentTick: Tick
    startClientX: number
    startClientY: number
  }
  | {
    kind: 'marquee'
    pointerId: number
    startTick: Tick
    currentTick: Tick
    startClientX: number
    startClientY: number
  }
  | {
    blockIds: BlockId[]
    kind: 'moveBlock'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
    currentTick: Tick
    currentTrackId?: TrackId
  }
  | {
    block: Block
    currentTick: Tick
    edge: 'left' | 'right'
    kind: 'resizeBlock'
    pointerId: number
    startClientX: number
  }
  | {
    kind: 'moveSection'
    pointerId: number
    section: Section
    startClientX: number
    startTick: Tick
    currentTick: Tick
  }
  | {
    currentTick: Tick
    edge: 'left' | 'right'
    kind: 'resizeSection'
    pointerId: number
    section: Section
    startClientX: number
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

export type EditorState = {
  activeTool: ActiveTool
  clipboard: ClipboardState
  dragState?: DragState
  focusedBlockId?: BlockId
  hoveredChord?: ChordSymbol
  inspector: InspectorState
  selection: SelectionState
}
