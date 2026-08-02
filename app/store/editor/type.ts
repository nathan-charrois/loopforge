import type {
  Block,
  BlockId,
  BlockPlaybackMode,
  Section,
  SectionId,
} from '~/domain/arrangement'
import type { ChordSymbol, Key } from '~/domain/harmony'
import type { DrumPiece, InstrumentId } from '~/domain/instrument'
import type { MixChannelId } from '~/domain/mixer'
import type { MidiNote, Tick } from '~/domain/musicPrimitives'
import type { NoteEvent, PatternEventId, PatternEventKind } from '~/domain/patternEvents'
import type { PatternId, PatternKind } from '~/domain/patterns'
import type { ChordPlayback } from '~/domain/playback'
import type { TimelineEvent, TimelineEventId, TimeSignatureDenominator } from '~/domain/timeline'
import type { TrackId, TrackRole } from '~/domain/tracks'
import type { ChordVoicing } from '~/domain/voicing'

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

export const ACTIVE_PATTERN_PANEL_TOOLS = [
  'draw',
  'select',
  'delete',
] as const
export type ActivePatternPanelTool = typeof ACTIVE_PATTERN_PANEL_TOOLS[number]

export const INSPECTOR_PANELS = ['project', 'track', 'instrument', 'block', 'pattern', 'event'] as const
export type InspectorPanel = typeof INSPECTOR_PANELS[number]

export type SelectionState = {
  selectedBlockIds: BlockId[]
  selectedInstrumentIds: InstrumentId[]
  selectedMixChannelIds: MixChannelId[]
  selectedPatternIds: PatternId[]
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
    currentTick: Tick
    kind: 'drawPatternEvent'
    patternId: PatternId
    pitch: MidiNote
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentPitch: MidiNote
    currentTick: Tick
    event: NoteEvent
    kind: 'movePatternEvent'
    patternId: PatternId
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

export type BlockDraft = {
  blockColor: string
  blockMuted: boolean
  blockName: string
  blockPatternId: PatternId
  blockPlaybackMode: BlockPlaybackMode
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

export type PatternEventDraft = {
  patternEventChord: ChordSymbol
  patternEventDurationTicks: number
  patternEventKind: PatternEventKind
  patternEventParameter: string
  patternEventPiece: DrumPiece
  patternEventPitch: MidiNote
  patternEventPlayback: ChordPlayback
  patternEventTimeTick: number
  patternEventValue: string
  patternEventVelocity: number
  patternEventVoicing: ChordVoicing
}

export type InstrumentDraft = {
  instrumentName: string
}

export type InspectorDraft = BlockDraft & InstrumentDraft & PatternEventDraft & TimelineEventDraft & {
  mixChannelMuted: boolean
  mixChannelPan: number
  mixChannelSoloed: boolean
  mixChannelVolumeDb: number
  patternKind: PatternKind
  patternLengthTicks: number
  patternName: string
  sectionName: string
  trackAccepts: PatternKind[]
  trackColor: string
  trackName: string
  trackRole: TrackRole
}

export type Editor = {
  activeTool: ActiveTool
  activePatternPanelTool: ActivePatternPanelTool
  clipboard: ClipboardState
  focusedBlockId?: BlockId
  hoveredChord?: ChordSymbol
  inspector: InspectorState
  selection: SelectionState
}
