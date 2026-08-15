import type {
  Block,
  BlockId,
  BlockPlaybackMode,
  Section,
  SectionId,
} from '~/domain/arrangement'
import type { EffectId } from '~/domain/effect'
import type { ChordSymbol, Key } from '~/domain/harmony'
import type { DrumPiece, InstrumentId } from '~/domain/instrument'
import type { SynthEnvelope, SynthFilter, SynthOscillator } from '~/domain/instrument/synth'
import type { MixChannelId } from '~/domain/mixer'
import type { MidiNote, Tick } from '~/domain/musicPrimitives'
import type {
  AutomationEvent,
  AutomationValue,
  DrumHitEvent,
  NoteEvent,
  PatternEventId,
  PatternEventKind,
} from '~/domain/patternEvents'
import type { PatternId, PatternKind } from '~/domain/patterns'
import type { ChordPlayback } from '~/domain/playback'
import type { LoopEvent, TimelineEvent, TimelineEventId, TimeSignatureDenominator } from '~/domain/timeline'
import type { TrackId, TrackRole } from '~/domain/tracks'
import type { ChordVoicing } from '~/domain/voicing'

export const ACTIVE_TOOLS = [
  'select',
  'draw',
  'erase',
  'split',
  'resize',
  'move',
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

export const INSPECTOR_PANELS = ['project', 'track', 'instrument', 'effect', 'block', 'pattern', 'event'] as const
export type InspectorPanel = typeof INSPECTOR_PANELS[number]

export type SelectionState = {
  selectedBlockIds: BlockId[]
  selectedEffectIds: EffectId[]
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
    kind: 'drawLoop'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentTick: Tick
    kind: 'drawAutomationPatternEvent'
    parameter: string
    patternId: PatternId
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
    value: AutomationValue
  }
  | {
    currentTick: Tick
    kind: 'drawDrumPatternEvent'
    patternId: PatternId
    piece: DrumPiece
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentTick: Tick
    kind: 'drawNotePatternEvent'
    patternId: PatternId
    pitch: MidiNote
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentParameter: string
    currentTick: Tick
    event: AutomationEvent
    kind: 'moveAutomationPatternEvent'
    patternId: PatternId
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentPiece: DrumPiece
    currentTick: Tick
    event: DrumHitEvent
    kind: 'moveDrumPatternEvent'
    patternId: PatternId
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentPitch: MidiNote
    currentTick: Tick
    event: NoteEvent
    kind: 'moveNotePatternEvent'
    patternId: PatternId
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentTick: Tick
    edge: 'left' | 'right'
    event: NoteEvent
    kind: 'resizeNotePatternEvent'
    patternId: PatternId
    pointerId: number
    startClientX: number
    startClientY: number
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
  | {
    currentTick: Tick
    event: LoopEvent
    kind: 'moveLoop'
    pointerId: number
    startClientX: number
    startClientY: number
    startTick: Tick
  }
  | {
    currentTick: Tick
    edge: 'left' | 'right'
    event: LoopEvent
    kind: 'resizeLoop'
    pointerId: number
    startClientX: number
    startClientY: number
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
  loopLengthTicks: number
  loopTick: number
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
  patternEventValue: AutomationValue
  patternEventVelocity: number
  patternEventVoicing: ChordVoicing
}

export type InstrumentDraft = {
  instrumentName: string
  instrumentSubtractorFilter?: SynthFilter
  instrumentSubtractorGlideSeconds?: number
  instrumentSubtractorMono?: boolean
  instrumentSubtractorOscillatorMix?: number
  instrumentSynthEnvelope?: SynthEnvelope
  instrumentSynthOscillators?: SynthOscillator[]
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
