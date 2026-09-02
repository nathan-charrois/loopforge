import {
  createCopySelectionCommand,
  createSelectBlockCommand,
  createSelectEffectCommand,
  createSelectInstrumentCommand,
  createSelectMixChannelCommand,
  createSelectPatternCommand,
  createSelectPatternEventCommand,
  createSelectSectionCommand,
  createSelectTimelineEventCommand,
  createSelectTrackCommand,
  createSetActivePatternPanelToolCommand,
  createSetActiveToolCommand,
  createSetClipboardCommand,
  createSetFocusedBlockIdCommand,
  createSetHoveredChordCommand,
  createSetInspectorCommand,
  createSetSelectionCommand,
} from './commands'
import {
  createArrangementBlockDraft,
  createArrangementPatternDraft,
  createArrangementPatternEventDraft,
  createArrangementSectionDraft,
  createInspectorState,
  createSelectionFromTickRange,
  createSelectionState,
} from './factory'
import {
  snapToGridMinimumTimelineRange,
  snapToMinimumTimelineRange,
} from './snap'
import {
  type ActivePatternPanelTool,
  type ActiveTool,
  type ClipboardState,
  type DragState,
  type Editor,
  type InspectorDraft,
  type PatternEventDraft,
  type SelectionState,
  type TimelineEventDraft,
} from './type'
import {
  type Block,
  type BlockId,
  createAutomationEvent,
  createChordEvent,
  createChordSymbol,
  createDraftEntityId,
  createDrumHitEvent,
  createKeyEvent,
  createLoopEvent,
  createMeterEvent,
  createNoteEvent,
  createPattern,
  createSeedPatternEvents,
  createSubtractorInstrument,
  createSynthOscillator,
  createTempoEvent,
  createThorInstrument,
  type EffectId,
  getKeyAtTick,
  getLoopEventEndTick,
  getMeterAtTick,
  getPatternEventEndTick,
  getSectionEndTick,
  getTempoAtTick,
  type Instrument,
  type InstrumentId,
  isKeyEvent,
  isLoopEvent,
  isMeterEvent,
  isTempoEvent,
  type Key,
  type MixChannel,
  type MixChannelId,
  type Pattern,
  type PatternEvent,
  type PatternEventId,
  type PatternId,
  type Section,
  type SectionId,
  type Tick,
  type TimelineEvent,
  type TimelineEventId,
  type Track,
  type TrackId,
} from '~/domain'
import type { Command, EditorCommand } from '~/store/session'
import {
  addBlockAction,
  addPatternAction,
  addPatternEventAction,
  addSectionAction,
  addTimelineEventAction,
  deleteBlockAction,
  deleteEffectAction,
  deleteInstrumentAction,
  deleteMixChannelAction,
  deletePatternAction,
  deletePatternEventAction,
  deleteSectionAction,
  deleteTimelineEventAction,
  deleteTrackAction,
  duplicateBlockAction,
  duplicateSectionAction,
  moveAutomationPatternEventAction,
  moveBlockAction,
  moveDrumPatternEventAction,
  moveNotePatternEventAction,
  moveSectionAction,
  resizeBlockAction,
  resizeNotePatternEventAction,
  resizeSectionAction,
  selectBlock,
  selectPatternByPatternEventId,
  selectTimelineEventIds,
  splitBlockAction,
  splitSectionAction,
  updateBlockAction,
  updateInstrumentAction,
  updateMixChannelAction,
  updatePatternAction,
  updatePatternEventAction,
  updateSectionAction,
  updateTimelineEventAction,
  updateTrackAction,
  type Workspace,
} from '~/store/workspace'

export function selectBlockAction(
  blockId: BlockId,
  additive = false,
): EditorCommand {
  return createSelectBlockCommand(blockId, additive)
}

export function selectEffectAction(
  effectId: EffectId,
  additive = false,
): EditorCommand {
  return createSelectEffectCommand(effectId, additive)
}

export function selectInstrumentAction(
  instrumentId: InstrumentId,
  additive = false,
): EditorCommand {
  return createSelectInstrumentCommand(instrumentId, additive)
}

export function selectMixChannelAction(
  mixChannelId: MixChannelId,
  additive = false,
): EditorCommand {
  return createSelectMixChannelCommand(mixChannelId, additive)
}

export function selectPatternAction(
  patternId: PatternId,
  additive = false,
): EditorCommand {
  return createSelectPatternCommand(patternId, additive)
}

export function selectPatternEventAction(
  patternEventId: PatternEventId,
  additive = false,
): EditorCommand {
  return createSelectPatternEventCommand(patternEventId, additive)
}

export function selectSectionAction(
  sectionId: SectionId,
  additive = false,
): EditorCommand {
  return createSelectSectionCommand(sectionId, additive)
}

export function selectTimelineEventAction(
  timelineEventId: TimelineEventId,
  additive = false,
): EditorCommand {
  return createSelectTimelineEventCommand(timelineEventId, additive)
}

export function selectTrackAction(
  trackId: TrackId,
  additive = false,
): EditorCommand {
  return createSelectTrackCommand(trackId, additive)
}

export function copySelectionAction(): EditorCommand {
  return createCopySelectionCommand()
}

export function setActiveToolAction(tool: ActiveTool): EditorCommand {
  return createSetActiveToolCommand(tool)
}

export function setActivePatternPanelToolAction(tool: ActivePatternPanelTool): EditorCommand {
  return createSetActivePatternPanelToolCommand(tool)
}

export function setHoveredChordAction(
  hoveredChord: Editor['hoveredChord'],
): EditorCommand {
  return createSetHoveredChordCommand(hoveredChord)
}

export function setClipboardAction(clipboard: ClipboardState): EditorCommand {
  return createSetClipboardCommand(clipboard)
}

export function setFocusedBlockIdAction(blockId?: BlockId): EditorCommand {
  return createSetFocusedBlockIdCommand(blockId)
}

export function closeInspectorAction(): EditorCommand {
  return createSetInspectorCommand('Close inspector', createInspectorState())
}

export function setSelectionAction(selection: SelectionState): EditorCommand {
  return createSetSelectionCommand(selection)
}

export function unfocusSelectionAction(focusedBlockId?: BlockId): EditorCommand {
  return focusedBlockId === undefined
    ? createSetSelectionCommand(createSelectionState(), 'Clear selection')
    : createSetFocusedBlockIdCommand()
}

export function deleteSelectionAction(selection: SelectionState): readonly Command[] {
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(deleteBlockAction(selection.selectedBlockIds))
  }

  if (selection.selectedTrackIds.length > 0) {
    commands.push(deleteTrackAction(selection.selectedTrackIds))
  }

  if (selection.selectedInstrumentIds.length > 0) {
    commands.push(deleteInstrumentAction(selection.selectedInstrumentIds))
  }

  if (selection.selectedEffectIds.length > 0) {
    commands.push(deleteEffectAction(selection.selectedEffectIds))
  }

  if (selection.selectedMixChannelIds.length > 0) {
    commands.push(deleteMixChannelAction(selection.selectedMixChannelIds))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(deleteSectionAction(selection.selectedSectionIds))
  }

  if (selection.selectedPatternIds.length > 0) {
    commands.push(deletePatternAction(selection.selectedPatternIds[0]))
  }

  if (selection.selectedPatternEventIds.length > 0) {
    commands.push(deletePatternEventAction(selection.selectedPatternEventIds))
  }

  if (selection.selectedTimelineEventIds.length > 0) {
    commands.push(deleteTimelineEventAction(selection.selectedTimelineEventIds))
  }

  return commands
}

export function duplicateSelectionAction(
  selection: SelectionState,
  offsetTicks: number,
): readonly Command[] {
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(duplicateBlockAction(selection.selectedBlockIds, offsetTicks))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(duplicateSectionAction(selection.selectedSectionIds, offsetTicks))
  }

  return commands
}

export function pasteClipboardAction(clipboard: ClipboardState, offsetTicks: number): readonly Command[] {
  if (clipboard.blockIds.length === 0) {
    return []
  }

  return [duplicateBlockAction(clipboard.blockIds, offsetTicks)]
}

export function applyBlockToolAction(input: {
  block: Block
  focusedBlockId?: BlockId
  tick: Tick
  tool: ActiveTool
}): readonly Command[] {
  const { block, focusedBlockId, tick, tool } = input

  if (tool === 'erase') {
    return [
      deleteBlockAction([block.id]),
      ...(focusedBlockId === block.id ? [setFocusedBlockIdAction()] : []),
    ]
  }

  if (tool === 'split') {
    return [splitBlockAction(block.id, tick)]
  }

  return []
}

export function applySectionToolAction(input: {
  section: Section
  tick: Tick
  tool: ActiveTool
}): readonly Command[] {
  const { section, tick, tool } = input

  if (tool === 'erase') {
    return [deleteSectionAction([section.id])]
  }

  if (tool === 'split') {
    return [splitSectionAction(section.id, tick)]
  }

  return []
}

export function completeDragAction(input: {
  dragState: DragState
  endTick: Tick
  movementX: number
  movementY: number
  targetTrackId?: TrackId
  threshold: number
  workspace: Workspace
}): readonly Command[] {
  const {
    dragState,
    endTick,
    movementX,
    movementY,
    targetTrackId,
    threshold,
    workspace,
  } = input

  if (dragState.kind === 'drawAutomationPatternEvent') {
    const range = snapToGridMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const patternEvent = createArrangementPatternEventDraft({
      workspace,
      lengthTicks: range.lengthTicks,
      parameter: dragState.parameter,
      patternId: dragState.patternId,
      startTick: range.startTick,
      value: dragState.value,
    })

    return [
      addPatternEventAction(dragState.patternId, patternEvent),
      setSelectionAction({
        ...createSelectionState(),
        selectedPatternEventIds: [patternEvent.id],
      }),
    ]
  }

  if (dragState.kind === 'drawNotePatternEvent') {
    const range = snapToGridMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const patternEvent = createArrangementPatternEventDraft({
      workspace,
      lengthTicks: range.lengthTicks,
      patternId: dragState.patternId,
      pitch: dragState.pitch,
      startTick: range.startTick,
    })

    return [
      addPatternEventAction(dragState.patternId, patternEvent),
      setSelectionAction({
        ...createSelectionState(),
        selectedPatternEventIds: [patternEvent.id],
      }),
    ]
  }

  if (dragState.kind === 'drawDrumPatternEvent') {
    const range = snapToGridMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const patternEvent = createArrangementPatternEventDraft({
      workspace,
      lengthTicks: range.lengthTicks,
      patternId: dragState.patternId,
      piece: dragState.piece,
      startTick: range.startTick,
    })

    return [
      addPatternEventAction(dragState.patternId, patternEvent),
      setSelectionAction({
        ...createSelectionState(),
        selectedPatternEventIds: [patternEvent.id],
      }),
    ]
  }

  if (dragState.kind === 'drawBlock') {
    const range = snapToMinimumTimelineRange(
      workspace.timeline,
      dragState.startTick,
      endTick,
    )

    const pattern = createArrangementPatternDraft(workspace, {
      lengthTicks: range.lengthTicks,
      trackId: dragState.trackId,
    })

    const block = createArrangementBlockDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
      trackId: dragState.trackId,
      patternId: pattern.id,
    })

    return [
      addPatternAction(pattern),
      addBlockAction(block),
      setSelectionAction({
        ...createSelectionState(),
        selectedBlockIds: [block.id],
      }),
      setActiveToolAction('select'),
    ]
  }

  if (dragState.kind === 'drawSection') {
    const range = snapToMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const section = createArrangementSectionDraft(workspace, {
      lengthTicks: range.lengthTicks,
      startTick: range.startTick,
    })

    return [
      addSectionAction(section),
      setSelectionAction({
        ...createSelectionState(),
        selectedSectionIds: [section.id],
      }),
      setActiveToolAction('select'),
    ]
  }

  if (dragState.kind === 'drawLoop') {
    const range = snapToMinimumTimelineRange(workspace.timeline, dragState.startTick, endTick)
    const currentLoop = workspace.timeline.loopEvents[0]
    const loopEvent = createLoopEvent({
      id: currentLoop?.id ?? createDraftEntityId('loopEvent', selectTimelineEventIds(workspace)),
      lengthTicks: range.lengthTicks,
      tick: range.startTick,
    })

    return [
      currentLoop === undefined
        ? addTimelineEventAction(loopEvent)
        : updateTimelineEventAction(loopEvent),
      setSelectionAction({
        ...createSelectionState(),
        selectedTimelineEventIds: [loopEvent.id],
      }),
      setActiveToolAction('select'),
    ]
  }

  if (dragState.kind === 'selectRange') {
    return isPointerDrag(movementX, movementY, threshold)
      ? [createSetSelectionCommand(createSelectionFromTickRange(
          workspace,
          dragState.startTick,
          endTick,
          dragState.startRow,
          dragState.currentRow,
        ), 'Select range')]
      : [createSetSelectionCommand(createSelectionState(), 'Clear selection')]
  }

  if (dragState.kind === 'moveAutomationPatternEvent') {
    const timeTick = Math.max(0, dragState.event.timeTick + endTick - dragState.startTick)

    return dragState.currentParameter === dragState.event.parameter
      && timeTick === dragState.event.timeTick
      ? []
      : [moveAutomationPatternEventAction(
          dragState.patternId,
          dragState.event.id,
          timeTick,
          dragState.currentParameter,
        )]
  }

  if (dragState.kind === 'moveNotePatternEvent') {
    const timeTick = Math.max(0, dragState.event.timeTick + endTick - dragState.startTick)

    return dragState.currentPitch === dragState.event.pitch
      && timeTick === dragState.event.timeTick
      ? []
      : [moveNotePatternEventAction(
          dragState.patternId,
          dragState.event.id,
          timeTick,
          dragState.currentPitch,
        )]
  }

  if (dragState.kind === 'moveDrumPatternEvent') {
    const timeTick = Math.max(0, dragState.event.timeTick + endTick - dragState.startTick)

    return dragState.currentPiece === dragState.event.piece
      && timeTick === dragState.event.timeTick
      ? []
      : [moveDrumPatternEventAction(
          dragState.patternId,
          dragState.event.id,
          timeTick,
          dragState.currentPiece,
        )]
  }

  if (!isPointerDrag(movementX, movementY, threshold)) {
    return []
  }

  if (dragState.kind === 'resizeNotePatternEvent') {
    const { event } = dragState
    const currentEndTick = getPatternEventEndTick(event)

    if (dragState.edge === 'left') {
      const timeTick = Math.min(endTick, currentEndTick - 1)
      return [resizeNotePatternEventAction(
        dragState.patternId,
        event.id,
        timeTick,
        currentEndTick - timeTick,
      )]
    }

    const nextEndTick = Math.max(endTick, event.timeTick + 1)
    return [resizeNotePatternEventAction(
      dragState.patternId,
      event.id,
      event.timeTick,
      nextEndTick - event.timeTick,
    )]
  }

  if (dragState.kind === 'moveBlock') {
    const deltaTicks = endTick - dragState.startTick

    return dragState.blockIds.flatMap((blockId) => {
      const block = selectBlock(workspace, blockId)

      return block === undefined
        ? []
        : [moveBlockAction(
            block.id,
            Math.max(0, block.startTick + deltaTicks),
            targetTrackId ?? block.trackId,
          )]
    })
  }

  if (dragState.kind === 'resizeBlock') {
    const { block } = dragState

    if (dragState.edge === 'left') {
      const nextStartTick = Math.min(endTick, block.startTick + block.lengthTicks - 1)
      return [resizeBlockAction(
        block.id,
        nextStartTick,
        block.startTick + block.lengthTicks - nextStartTick,
      )]
    }

    const nextEndTick = Math.max(endTick, block.startTick + 1)
    return [resizeBlockAction(block.id, block.startTick, nextEndTick - block.startTick)]
  }

  if (dragState.kind === 'moveSection') {
    const deltaTicks = endTick - dragState.startTick
    return [moveSectionAction(
      dragState.section.id,
      Math.max(0, dragState.section.startTick + deltaTicks),
    )]
  }

  if (dragState.kind === 'resizeSection') {
    const { section } = dragState
    const sectionEndTick = getSectionEndTick(section)

    if (dragState.edge === 'left') {
      const nextStartTick = Math.min(endTick, sectionEndTick - 1)
      return [resizeSectionAction(
        section.id,
        nextStartTick,
        sectionEndTick - nextStartTick,
      )]
    }

    const nextEndTick = Math.max(endTick, section.startTick + 1)
    return [resizeSectionAction(section.id, section.startTick, nextEndTick - section.startTick)]
  }

  if (dragState.kind === 'moveTimelineEvent') {
    const deltaTicks = endTick - dragState.startTick
    return [updateTimelineEventAction({
      ...dragState.event,
      tick: Math.max(0, dragState.event.tick + deltaTicks),
    })]
  }

  if (dragState.kind === 'moveLoop') {
    const deltaTicks = endTick - dragState.startTick

    return [updateTimelineEventAction(createLoopEvent({
      ...dragState.event,
      tick: Math.max(0, dragState.event.tick + deltaTicks),
    }))]
  }

  if (dragState.kind === 'resizeLoop') {
    const currentEndTick = getLoopEventEndTick(dragState.event)

    if (dragState.edge === 'left') {
      const tick = Math.min(endTick, currentEndTick - 1)

      return [updateTimelineEventAction(createLoopEvent({
        ...dragState.event,
        lengthTicks: currentEndTick - tick,
        tick,
      }))]
    }

    return [updateTimelineEventAction(createLoopEvent({
      ...dragState.event,
      lengthTicks: Math.max(1, endTick - dragState.event.tick),
    }))]
  }

  return []
}

export function updateBlockFromInspectorAction(input: {
  block: Block
  draft: InspectorDraft
}): Command {
  const { block, draft } = input

  return updateBlockAction({
    ...block,
    color: draft.blockColor,
    muted: draft.blockMuted,
    name: draft.blockName.trim() || block.name,
    patternId: draft.blockPatternId,
    playbackMode: draft.blockPlaybackMode,
  })
}

export function updateSectionFromInspectorAction(input: {
  draft: InspectorDraft
  section: Section
}): Command {
  return updateSectionAction({
    ...input.section,
    name: input.draft.sectionName.trim() || input.section.name,
  })
}

export function updateTrackFromInspectorAction(input: {
  draft: InspectorDraft
  track: Track
}): Command {
  return updateTrackAction({
    ...input.track,
    accepts: [...input.draft.trackAccepts],
    color: input.draft.trackColor,
    name: input.draft.trackName.trim() || input.track.name,
    role: input.draft.trackRole,
  })
}

export function updateInstrumentFromInspectorAction(input: {
  draft: InspectorDraft
  instrument: Instrument
}): Command {
  switch (input.draft.instrumentKind) {
    case 'subtractor': {
      return updateInstrumentAction(createSubtractorInstrument({
        ...input.instrument,
        envelope: input.draft.instrumentSynthEnvelope,
        filter: input.draft.instrumentSubtractorFilter,
        glideSeconds: input.draft.instrumentSubtractorGlideSeconds,
        mono: input.draft.instrumentSubtractorMono,
        name: input.draft.instrumentName,
        oscillatorMix: input.draft.instrumentSubtractorOscillatorMix,
        oscillators: input.draft.instrumentSynthOscillators
          ? [
              createSynthOscillator(input.draft.instrumentSynthOscillators[0]),
              createSynthOscillator(input.draft.instrumentSynthOscillators[1]),
            ]
          : [
              createSynthOscillator(),
              createSynthOscillator(),
            ],
      }))
    }
    case 'thor':
      return updateInstrumentAction(createThorInstrument({
        ...input.instrument,
        name: input.draft.instrumentName,
        envelope: input.draft.instrumentSynthEnvelope,
        oscillators: input.draft.instrumentSynthOscillators,
      }))
    default: {
      return updateInstrumentAction({
        ...input.instrument,
        name: input.draft.instrumentName.trim() || input.instrument.name,
      })
    }
  }
}

export function updateMixChannelFromInspectorAction(input: {
  draft: InspectorDraft
  mixChannel: MixChannel
}): Command {
  return updateMixChannelAction({
    ...input.mixChannel,
    muted: input.draft.mixChannelMuted,
    pan: input.draft.mixChannelPan,
    soloed: input.draft.mixChannelSoloed,
    volumeDb: input.draft.mixChannelVolumeDb,
  })
}

export function updatePatternFromInspectorAction(input: {
  draft: InspectorDraft
  pattern: Pattern
}): Command {
  const { draft, pattern } = input

  return updatePatternAction(createPattern({
    ...pattern,
    events: pattern.events.length
      ? pattern.events
      : createSeedPatternEvents(draft.patternKind, draft.patternLengthTicks, {
          chordQuality: 'sus2',
          chordRoot: 0,
          drumPiece: 'clap',
          notePitch: 60,
        }),
    kind: draft.patternKind,
    lengthTicks: draft.patternLengthTicks,
    name: draft.patternName.trim() || pattern.name,
  }))
}

export function updatePatternEventFromInspectorAction(input: {
  draft: InspectorDraft
  patternEvent: PatternEvent
  workspace: Workspace
}): Command | undefined {
  const { draft, patternEvent, workspace } = input
  const patternId = selectPatternByPatternEventId(workspace, patternEvent.id)

  if (patternId === undefined) {
    return undefined
  }

  const common = {
    id: patternEvent.id,
    timeTick: draft.patternEventTimeTick,
  }

  switch (draft.patternEventKind) {
    case 'automation':
      return updatePatternEventAction(patternId, createAutomationEvent({
        ...common,
        parameter: draft.patternEventParameter,
        value: draft.patternEventValue,
      }))
    case 'chord':
      return updatePatternEventAction(patternId, createChordEvent({
        ...(patternEvent.kind === 'chord'
          ? patternEvent
          : { chord: createChordSymbol({ root: 0 }) }),
        ...common,
        chord: draft.patternEventChord,
        durationTicks: draft.patternEventDurationTicks,
        playback: draft.patternEventPlayback,
        velocity: draft.patternEventVelocity,
        voicing: draft.patternEventVoicing,
      }))
    case 'drumHit':
      return updatePatternEventAction(patternId, createDrumHitEvent({
        ...common,
        piece: draft.patternEventPiece,
        velocity: draft.patternEventVelocity,
      }))
    case 'note':
      return updatePatternEventAction(patternId, createNoteEvent({
        ...common,
        durationTicks: draft.patternEventDurationTicks,
        pitch: draft.patternEventPitch,
        velocity: draft.patternEventVelocity,
      }))
  }
}

export function updatePatternEventFromDraftAction(input: {
  patternEvent: PatternEvent
  draft: Partial<PatternEventDraft>
  workspace: Workspace
}): Command | undefined {
  const { draft, patternEvent, workspace } = input
  const patternId = selectPatternByPatternEventId(workspace, patternEvent.id)

  if (patternId === undefined) {
    return undefined
  }

  if (patternEvent.kind === 'chord') {
    if (
      draft.patternEventChord === undefined
      && draft.patternEventPlayback === undefined
      && draft.patternEventVelocity === undefined
      && draft.patternEventVoicing === undefined
    ) {
      return
    }

    return updatePatternEventAction(patternId, {
      ...patternEvent,
      chord: draft.patternEventChord ?? patternEvent.chord,
      playback: draft.patternEventPlayback ?? patternEvent.playback,
      velocity: draft.patternEventVelocity ?? patternEvent.velocity,
      voicing: draft.patternEventVoicing ?? patternEvent.voicing,
    })
  }

  if (patternEvent.kind === 'automation') {
    if (
      draft.patternEventParameter === undefined
      && draft.patternEventValue === undefined
    ) {
      return
    }

    return updatePatternEventAction(patternId, {
      ...patternEvent,
      parameter: draft.patternEventParameter ?? patternEvent.parameter,
      value: draft.patternEventValue ?? patternEvent.value,
    })
  }

  if (draft.patternEventVelocity === undefined) {
    return
  }

  return updatePatternEventAction(patternId, {
    ...patternEvent,
    velocity: draft.patternEventVelocity,
  })
}

export function applyTimelineEventToolAction(
  workspace: Workspace,
  tool: ActiveTool,
  tick: Tick,
): readonly Command[] {
  const existingIds = selectTimelineEventIds(workspace)

  if (tool === 'tempo') {
    return [addTimelineEventAction(createTempoEvent({
      id: createDraftEntityId('tempoEvent', existingIds),
      bpm: getTempoAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  if (tool === 'meter') {
    return [addTimelineEventAction(createMeterEvent({
      id: createDraftEntityId('meterEvent', existingIds),
      timeSignature: getMeterAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  if (tool === 'key') {
    return [addTimelineEventAction(createKeyEvent({
      id: createDraftEntityId('keyEvent', existingIds),
      key: getKeyAtTick(workspace.timeline, tick),
      tick,
    }))]
  }

  return []
}

export function updateTimelineEventFromInspectorAction(input: {
  draft: TimelineEventDraft
  timelineEvent: TimelineEvent
}): Command {
  const { draft, timelineEvent } = input

  if (isTempoEvent(timelineEvent)) {
    return updateTimelineEventAction(createTempoEvent({
      bpm: draft.tempoBpm,
      id: timelineEvent.id,
      tick: draft.tempoTick,
    }))
  }

  if (isMeterEvent(timelineEvent)) {
    return updateTimelineEventAction(createMeterEvent({
      id: timelineEvent.id,
      tick: draft.meterTick,
      timeSignature: {
        denominator: draft.meterDenominator,
        numerator: draft.meterNumerator,
      },
    }))
  }

  if (isKeyEvent(timelineEvent)) {
    return updateTimelineEventAction(createKeyEvent({
      id: timelineEvent.id,
      key: {
        mode: draft.keyMode,
        tonic: draft.keyTonic as Key['tonic'],
      },
      tick: draft.keyTick,
    }))
  }

  if (isLoopEvent(timelineEvent)) {
    return updateTimelineEventAction(createLoopEvent({
      id: timelineEvent.id,
      lengthTicks: draft.loopLengthTicks,
      tick: draft.loopTick,
    }))
  }

  throw new Error('Unsupported timeline event.')
}

function isPointerDrag(movementX: number, movementY: number, threshold: number): boolean {
  return movementX >= threshold || movementY >= threshold
}
