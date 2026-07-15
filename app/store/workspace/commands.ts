import {
  addBlock as addWorkspaceBlock,
  addPattern as addWorkspacePattern,
  addSection as addWorkspaceSection,
  addTrack as addWorkspaceTrack,
  removeBlock as removeWorkspaceBlock,
  removePattern as removeWorkspacePattern,
  removeSection as removeWorkspaceSection,
  removeTrack as removeWorkspaceTrack,
  setTimeline as setWorkspaceTimeline,
  updateBlock as updateWorkspaceBlock,
  updatePattern as updateWorkspacePattern,
  updateSection as updateWorkspaceSection,
  updateTrack as updateWorkspaceTrack,
} from './operations'
import type { Workspace } from './type'
import {
  type Block,
  type BlockId,
  type BlockPlaybackMode,
  type Command,
  type CommandHistory,
  type CommandKind,
  type CommandPayload,
  createCommand,
  getTimelineEventField,
  type GridDivision,
  type JsonValue,
  type KeyEvent,
  type MeterEvent,
  type Pattern,
  type PatternEvent,
  type PatternId,
  pushCommand as pushHistoryCommand,
  redoCommand as redoHistoryCommand,
  type Section,
  type SectionId,
  snapTickToGrid,
  sortPatternEventsByTime,
  sortTimelineEventsByTick,
  type TempoEvent,
  type Tick,
  type Timeline,
  type TimelineEvent,
  type TimelineEventField,
  type Track,
  type TrackId,
  undoCommand as undoHistoryCommand,
} from '~/domain'
import { touchProject } from '~/domain/project'

type CommandExecutionResult = {
  command?: Command
  history: CommandHistory
  workspace: Workspace
}

let commandSequence = 1

export function executeCommand(
  workspace: Workspace,
  history: CommandHistory,
  command: Command,
): CommandExecutionResult {
  return {
    command,
    history: pushHistoryCommand(history, command),
    workspace: applyCommandPayload(workspace, command.kind, command.payload),
  }
}

export function undoCommand(workspace: Workspace, history: CommandHistory): CommandExecutionResult {
  const nextState = undoHistoryCommand(history)

  if (nextState.command === undefined) {
    return {
      history: nextState.history,
      workspace,
    }
  }

  return {
    command: nextState.command,
    history: nextState.history,
    workspace: nextState.command.inverse === undefined
      ? workspace
      : applyCommandPayload(workspace, nextState.command.kind, nextState.command.inverse),
  }
}

export function redoCommand(workspace: Workspace, history: CommandHistory): CommandExecutionResult {
  const nextState = redoHistoryCommand(history)

  if (nextState.command === undefined) {
    return {
      history: nextState.history,
      workspace,
    }
  }

  return {
    command: nextState.command,
    history: nextState.history,
    workspace: applyCommandPayload(workspace, nextState.command.kind, nextState.command.payload),
  }
}

export function addBlockCommand(block: Block): Command {
  return createEditorCommand('addBlock', `Add block ${block.name}`, {
    blocks: [toJsonValue(block)],
  }, {
    blockIds: [block.id],
  })
}

export function deleteBlockCommand(workspace: Workspace, blockIds: readonly BlockId[]): Command {
  const blocks = workspace.arrangement.blocks.filter(block => blockIds.includes(block.id))

  return createEditorCommand('deleteBlock', `Delete ${blocks.length} block${blocks.length === 1 ? '' : 's'}`, {
    blockIds: blocks.map(block => block.id),
  }, {
    blocks: blocks.map(toJsonValue),
  })
}

export function duplicateBlockCommand(
  workspace: Workspace,
  blockIds: readonly BlockId[],
  offsetTicks = 480,
): Command {
  const existingIds = new Set(workspace.arrangement.blocks.map(block => block.id))
  const blocks = workspace.arrangement.blocks
    .filter(block => blockIds.includes(block.id))
    .map((block, index) => {
      const id = createUniqueId(`${block.id}_copy`, existingIds)
      existingIds.add(id)

      return {
        ...block,
        id,
        name: `${block.name} Copy`,
        startTick: Math.max(0, block.startTick + offsetTicks + (index * 120)),
      }
    })

  return createEditorCommand('duplicateBlock', `Duplicate ${blocks.length} block${blocks.length === 1 ? '' : 's'}`, {
    blocks: blocks.map(toJsonValue),
  }, {
    blockIds: blocks.map(block => block.id),
  })
}

export function moveBlockCommand(
  workspace: Workspace,
  blockId: BlockId,
  startTick: Tick,
  trackId?: TrackId,
): Command {
  const block = requireBlock(workspace, blockId)
  const nextBlock: Block = {
    ...block,
    startTick: Math.max(0, Math.round(startTick)),
    trackId: trackId ?? block.trackId,
  }

  return updateBlockSnapshotCommand('moveBlock', `Move block ${block.name}`, block, nextBlock)
}

export function resizeBlockCommand(
  workspace: Workspace,
  blockId: BlockId,
  startTick: Tick,
  lengthTicks: number,
): Command {
  const block = requireBlock(workspace, blockId)
  const nextBlock: Block = {
    ...block,
    lengthTicks: Math.max(1, Math.round(lengthTicks)),
    startTick: Math.max(0, Math.round(startTick)),
  }

  return updateBlockSnapshotCommand('resizeBlock', `Resize block ${block.name}`, block, nextBlock)
}

export function splitBlockCommand(workspace: Workspace, blockId: BlockId, splitTick: Tick): Command {
  const block = requireBlock(workspace, blockId)
  const blockEndTick = block.startTick + block.lengthTicks
  const targetTick = Math.max(block.startTick + 1, Math.min(blockEndTick - 1, Math.round(splitTick)))
  const rightBlockId = createUniqueId(`${block.id}_split`, new Set(workspace.arrangement.blocks.map(currentBlock => currentBlock.id)))
  const leftBlock: Block = {
    ...block,
    lengthTicks: targetTick - block.startTick,
  }
  const rightBlock: Block = {
    ...block,
    id: rightBlockId,
    lengthTicks: blockEndTick - targetTick,
    name: `${block.name} Split`,
    startTick: targetTick,
  }

  return createEditorCommand('splitBlock', `Split block ${block.name}`, {
    leftBlock: toJsonValue(leftBlock),
    rightBlock: toJsonValue(rightBlock),
  }, {
    block: toJsonValue(block),
    blockIds: [rightBlock.id],
  })
}

export function renameBlockCommand(workspace: Workspace, blockId: BlockId, name: string): Command {
  const block = requireBlock(workspace, blockId)

  return updateBlockSnapshotCommand('renameBlock', `Rename block ${block.name}`, block, {
    ...block,
    name: name.trim() || block.name,
  })
}

export function setBlockMutedCommand(workspace: Workspace, blockId: BlockId, muted: boolean): Command {
  const block = requireBlock(workspace, blockId)

  return updateBlockSnapshotCommand('setBlockMuted', `${muted ? 'Mute' : 'Unmute'} block ${block.name}`, block, {
    ...block,
    muted,
  })
}

export function setBlockColorCommand(workspace: Workspace, blockId: BlockId, color: string): Command {
  const block = requireBlock(workspace, blockId)

  return updateBlockSnapshotCommand('setBlockColor', `Set block color ${block.name}`, block, {
    ...block,
    color,
  })
}

export function setBlockPlaybackModeCommand(
  workspace: Workspace,
  blockId: BlockId,
  playbackMode: BlockPlaybackMode,
): Command {
  const block = requireBlock(workspace, blockId)

  return updateBlockSnapshotCommand('setBlockPlaybackMode', `Set block playback ${block.name}`, block, {
    ...block,
    playbackMode,
  })
}

export function assignBlockPatternCommand(
  workspace: Workspace,
  blockId: BlockId,
  patternId: PatternId,
): Command {
  const block = requireBlock(workspace, blockId)

  return updateBlockSnapshotCommand('assignBlockPattern', `Assign pattern ${block.name}`, block, {
    ...block,
    patternId,
  })
}

export function moveBlockToTrackCommand(workspace: Workspace, blockId: BlockId, trackId: TrackId): Command {
  const block = requireBlock(workspace, blockId)

  return updateBlockSnapshotCommand('moveBlockToTrack', `Move block to track ${block.name}`, block, {
    ...block,
    trackId,
  })
}

export function addSectionCommand(section: Section): Command {
  return createEditorCommand('addSection', `Add section ${section.name}`, {
    sections: [toJsonValue(section)],
  }, {
    sectionIds: [section.id],
  })
}

export function deleteSectionCommand(workspace: Workspace, sectionIds: readonly SectionId[]): Command {
  const sections = workspace.arrangement.sections.filter(section => sectionIds.includes(section.id))

  return createEditorCommand('deleteSection', `Delete ${sections.length} section${sections.length === 1 ? '' : 's'}`, {
    sectionIds: sections.map(section => section.id),
  }, {
    sections: sections.map(toJsonValue),
  })
}

export function duplicateSectionCommand(
  workspace: Workspace,
  sectionIds: readonly SectionId[],
  offsetTicks = 480,
): Command {
  const existingIds = new Set(workspace.arrangement.sections.map(section => section.id))
  const sections = workspace.arrangement.sections
    .filter(section => sectionIds.includes(section.id))
    .map((section, index) => {
      const id = createUniqueId(`${section.id}_copy`, existingIds)
      existingIds.add(id)

      return {
        ...section,
        id,
        name: `${section.name} Copy`,
        startTick: Math.max(0, section.startTick + offsetTicks + (index * 120)),
      }
    })

  return createEditorCommand('duplicateSection', `Duplicate ${sections.length} section${sections.length === 1 ? '' : 's'}`, {
    sections: sections.map(toJsonValue),
  }, {
    sectionIds: sections.map(section => section.id),
  })
}

export function moveSectionCommand(workspace: Workspace, sectionId: SectionId, startTick: Tick): Command {
  const section = requireSection(workspace, sectionId)

  return updateSectionSnapshotCommand('moveSection', `Move section ${section.name}`, section, {
    ...section,
    startTick: Math.max(0, Math.round(startTick)),
  })
}

export function resizeSectionCommand(
  workspace: Workspace,
  sectionId: SectionId,
  startTick: Tick,
  lengthTicks: number,
): Command {
  const section = requireSection(workspace, sectionId)

  return updateSectionSnapshotCommand('resizeSection', `Resize section ${section.name}`, section, {
    ...section,
    lengthTicks: Math.max(1, Math.round(lengthTicks)),
    startTick: Math.max(0, Math.round(startTick)),
  })
}

export function renameSectionCommand(workspace: Workspace, sectionId: SectionId, name: string): Command {
  const section = requireSection(workspace, sectionId)

  return updateSectionSnapshotCommand('renameSection', `Rename section ${section.name}`, section, {
    ...section,
    name: name.trim() || section.name,
  })
}

export function addTempoEventCommand(workspace: Workspace, event: TempoEvent): Command {
  return createTimelineEventCommand(
    workspace.timeline,
    'addTempoEvent',
    `Add tempo ${event.bpm}`,
    'tempoEvents',
    event,
  )
}

export function deleteTempoEventCommand(workspace: Workspace, tick: Tick): Command {
  return deleteTimelineEventCommand(
    workspace.timeline,
    'deleteTempoEvent',
    'Delete tempo event',
    'tempoEvents',
    tick,
  )
}

export function updateTempoEventCommand(workspace: Workspace, tick: Tick, event: TempoEvent): Command {
  return updateTimelineEventSnapshotCommand(
    workspace.timeline,
    'updateTempoEvent',
    `Update tempo ${event.bpm}`,
    'tempoEvents',
    tick,
    event,
  )
}

export function addMeterEventCommand(workspace: Workspace, event: MeterEvent): Command {
  return createTimelineEventCommand(
    workspace.timeline,
    'addMeterEvent',
    `Add meter ${event.timeSignature.numerator}/${event.timeSignature.denominator}`,
    'meterEvents',
    {
      ...event,
      tick: snapTickToGrid(workspace.timeline, event.tick, 'bar'),
    },
  )
}

export function deleteMeterEventCommand(workspace: Workspace, tick: Tick): Command {
  return deleteTimelineEventCommand(
    workspace.timeline,
    'deleteMeterEvent',
    'Delete meter event',
    'meterEvents',
    tick,
  )
}

export function updateMeterEventCommand(workspace: Workspace, tick: Tick, event: MeterEvent): Command {
  return updateTimelineEventSnapshotCommand(
    workspace.timeline,
    'updateMeterEvent',
    `Update meter ${event.timeSignature.numerator}/${event.timeSignature.denominator}`,
    'meterEvents',
    tick,
    event,
  )
}

export function addKeyEventCommand(workspace: Workspace, event: KeyEvent): Command {
  return createTimelineEventCommand(
    workspace.timeline,
    'addKeyEvent',
    'Add key event',
    'keyEvents',
    event,
  )
}

export function deleteKeyEventCommand(workspace: Workspace, tick: Tick): Command {
  return deleteTimelineEventCommand(
    workspace.timeline,
    'deleteKeyEvent',
    'Delete key event',
    'keyEvents',
    tick,
  )
}

export function updateKeyEventCommand(workspace: Workspace, tick: Tick, event: KeyEvent): Command {
  return updateTimelineEventSnapshotCommand(
    workspace.timeline,
    'updateKeyEvent',
    'Update key event',
    'keyEvents',
    tick,
    event,
  )
}

export function moveTimelineEventCommand(workspace: Workspace, event: TimelineEvent, tick: Tick): Command {
  const nextTick = snapTickToGrid(
    workspace.timeline,
    tick,
    workspace.timeline.grid,
  )

  return updateTimelineEventSnapshotCommand(
    workspace.timeline,
    'moveTimelineEvent',
    'Move timeline event',
    getTimelineEventField(event),
    event.tick,
    {
      ...event,
      tick: nextTick,
    },
  )
}

export function setGridDivisionCommand(workspace: Workspace, grid: GridDivision): Command {
  return createEditorCommand('setGridDivision', `Set grid ${grid}`, {
    grid,
  }, {
    grid: workspace.timeline.grid,
  })
}

export function addTrackCommand(track: Track): Command {
  return createEditorCommand('addTrack', `Add track ${track.name}`, {
    track: toJsonValue(track),
  }, {
    trackId: track.id,
  })
}

export function deleteTrackCommand(workspace: Workspace, trackId: TrackId): Command {
  const track = workspace.tracks.byId[trackId]

  if (track === undefined) {
    throw new Error(`Track ${trackId} does not exist.`)
  }

  return createEditorCommand('deleteTrack', `Delete track ${track.name}`, {
    trackId,
  }, {
    track: toJsonValue(track),
  })
}

export function updateTrackCommand(kind: CommandKind, label: string, previousTrack: Track, nextTrack: Track): Command {
  return createEditorCommand(kind, label, {
    track: toJsonValue(nextTrack),
  }, {
    track: toJsonValue(previousTrack),
  })
}

export function addPatternCommand(pattern: Pattern): Command {
  return createEditorCommand('addPattern', `Add pattern ${pattern.name}`, {
    pattern: toJsonValue(pattern),
  }, {
    patternId: pattern.id,
  })
}

export function deletePatternCommand(workspace: Workspace, patternId: PatternId): Command {
  const pattern = workspace.patterns.byId[patternId]

  if (pattern === undefined) {
    throw new Error(`Pattern ${patternId} does not exist.`)
  }

  return createEditorCommand('deletePattern', `Delete pattern ${pattern.name}`, {
    patternId,
  }, {
    pattern: toJsonValue(pattern),
  })
}

export function updatePatternCommand(kind: CommandKind, label: string, previousPattern: Pattern, nextPattern: Pattern): Command {
  return createEditorCommand(kind, label, {
    pattern: toJsonValue(nextPattern),
  }, {
    pattern: toJsonValue(previousPattern),
  })
}

export function addPatternEventCommand(patternId: PatternId, event: PatternEvent): Command {
  return createEditorCommand('addPatternEvent', `Add ${event.kind} event`, {
    event: toJsonValue(event),
    patternId,
  }, {
    eventId: event.id,
    patternId,
  })
}

export function deletePatternEventCommand(
  workspace: Workspace,
  patternId: PatternId,
  eventId: string,
): Command {
  const pattern = requirePattern(workspace, patternId)
  const event = pattern.events.find(currentEvent => currentEvent.id === eventId)

  if (event === undefined) {
    throw new Error(`Pattern event ${eventId} does not exist.`)
  }

  return createEditorCommand('deletePatternEvent', `Delete ${event.kind} event`, {
    eventId,
    patternId,
  }, {
    event: toJsonValue(event),
    patternId,
  })
}

export function updatePatternEventCommand(
  kind: CommandKind,
  patternId: PatternId,
  previousEvent: PatternEvent,
  nextEvent: PatternEvent,
): Command {
  return createEditorCommand(kind, `Update ${nextEvent.kind} event`, {
    event: toJsonValue(nextEvent),
    patternId,
  }, {
    event: toJsonValue(previousEvent),
    patternId,
  })
}

export function updateBlockSnapshotCommand(
  kind: CommandKind,
  label: string,
  previousBlock: Block,
  nextBlock: Block,
): Command {
  return createEditorCommand(kind, label, {
    block: toJsonValue(nextBlock),
  }, {
    block: toJsonValue(previousBlock),
  })
}

function updateSectionSnapshotCommand(
  kind: CommandKind,
  label: string,
  previousSection: Section,
  nextSection: Section,
): Command {
  return createEditorCommand(kind, label, {
    section: toJsonValue(nextSection),
  }, {
    section: toJsonValue(previousSection),
  })
}

function createTimelineEventCommand<TEvent extends { tick: Tick }>(
  timeline: Timeline,
  kind: CommandKind,
  label: string,
  field: TimelineEventField,
  event: TEvent,
): Command {
  return createEditorCommand(kind, label, {
    event: toJsonValue(event),
  }, {
    previousEvent: toJsonValue(timeline[field].find(currentEvent => currentEvent.tick === event.tick) ?? null),
    tick: event.tick,
  })
}

function deleteTimelineEventCommand<TEvent extends { tick: Tick }>(
  timeline: Timeline,
  kind: CommandKind,
  label: string,
  field: TimelineEventField,
  tick: Tick,
): Command {
  const event = requireTimelineEvent(timeline[field] as unknown as TEvent[], tick, field)

  return createEditorCommand(kind, label, {
    tick,
  }, {
    event: toJsonValue(event),
  })
}

function updateTimelineEventSnapshotCommand<TEvent extends { tick: Tick }>(
  timeline: Timeline,
  kind: CommandKind,
  label: string,
  field: TimelineEventField,
  previousTick: Tick,
  event: TEvent,
): Command {
  const previousEvent = requireTimelineEvent(timeline[field] as unknown as TEvent[], previousTick, field)

  return createEditorCommand(kind, label, {
    event: toJsonValue(event),
    field,
    previousTick,
  }, {
    event: toJsonValue(previousEvent),
    field,
    previousTick: event.tick,
  })
}

function applyCommandPayload(workspace: Workspace, kind: CommandKind, payload: CommandPayload): Workspace {
  switch (kind) {
    case 'addBlock':
    case 'deleteBlock':
    case 'duplicateBlock':
    case 'moveBlock':
    case 'resizeBlock':
    case 'renameBlock':
    case 'setBlockMuted':
    case 'setBlockColor':
    case 'setBlockPlaybackMode':
    case 'assignBlockPattern':
    case 'moveBlockToTrack':
      return applyBlockPayload(workspace, payload)
    case 'splitBlock':
      return applySplitBlockPayload(workspace, payload)
    case 'addSection':
    case 'deleteSection':
    case 'duplicateSection':
    case 'moveSection':
    case 'resizeSection':
    case 'renameSection':
      return applySectionPayload(workspace, payload)
    case 'addTrack':
    case 'deleteTrack':
    case 'renameTrack':
    case 'setTrackMuted':
    case 'setTrackSoloed':
    case 'setTrackVolume':
    case 'setTrackColor':
    case 'setTrackInstrument':
      return applyTrackPayload(workspace, payload)
    case 'reorderTrack':
      return applyTrackOrderPayload(workspace, payload)
    case 'addPattern':
    case 'deletePattern':
    case 'duplicatePattern':
    case 'renamePattern':
      return applyPatternPayload(workspace, payload)
    case 'addPatternEvent':
    case 'deletePatternEvent':
    case 'duplicatePatternEvent':
    case 'movePatternEvent':
    case 'resizePatternEvent':
    case 'updatePatternEvent':
      return applyPatternEventPayload(workspace, payload)
    case 'addTempoEvent':
    case 'deleteTempoEvent':
    case 'updateTempoEvent':
      return applyTimelineEventPayload(workspace, payload, 'tempoEvents')
    case 'addMeterEvent':
    case 'deleteMeterEvent':
    case 'updateMeterEvent':
      return applyTimelineEventPayload(workspace, payload, 'meterEvents')
    case 'addKeyEvent':
    case 'deleteKeyEvent':
    case 'updateKeyEvent':
      return applyTimelineEventPayload(workspace, payload, 'keyEvents')
    case 'moveTimelineEvent':
      return applyTimelineEventPayload(
        workspace,
        payload,
        getPayloadString(payload, 'field') as TimelineEventField,
      )
    case 'setGridDivision':
      return setWorkspaceTimeline(workspace, {
        ...workspace.timeline,
        grid: getPayloadString(payload, 'grid') as GridDivision,
      })
    case 'renameEntity':
      return workspace
  }
}

function applyBlockPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  let nextWorkspace = workspace

  for (const blockId of getPayloadStringArray(payload, 'blockIds')) {
    nextWorkspace = removeWorkspaceBlock(nextWorkspace, blockId)
  }

  for (const block of getPayloadArray<Block>(payload, 'blocks')) {
    nextWorkspace = upsertBlock(nextWorkspace, block)
  }

  const block = getPayloadObject<Block>(payload, 'block')

  if (block !== undefined) {
    nextWorkspace = upsertBlock(nextWorkspace, block)
  }

  return nextWorkspace
}

function applySplitBlockPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  const leftBlock = getPayloadObject<Block>(payload, 'leftBlock')
  const rightBlock = getPayloadObject<Block>(payload, 'rightBlock')

  if (leftBlock !== undefined && rightBlock !== undefined) {
    return upsertBlock(upsertBlock(workspace, leftBlock), rightBlock)
  }

  return applyBlockPayload(workspace, payload)
}

function applySectionPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  let nextWorkspace = workspace

  for (const sectionId of getPayloadStringArray(payload, 'sectionIds')) {
    nextWorkspace = removeWorkspaceSection(nextWorkspace, sectionId)
  }

  for (const section of getPayloadArray<Section>(payload, 'sections')) {
    nextWorkspace = upsertSection(nextWorkspace, section)
  }

  const section = getPayloadObject<Section>(payload, 'section')

  if (section !== undefined) {
    nextWorkspace = upsertSection(nextWorkspace, section)
  }

  return nextWorkspace
}

function applyTrackPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  const trackId = getPayloadString(payload, 'trackId')

  if (trackId !== undefined) {
    return removeWorkspaceTrack(workspace, trackId)
  }

  const track = getPayloadObject<Track>(payload, 'track')

  return track === undefined ? workspace : upsertTrack(workspace, track)
}

function applyTrackOrderPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  const trackIds = getPayloadStringArray(payload, 'trackIds')

  if (trackIds.length === 0) {
    return workspace
  }

  const knownIds = new Set(workspace.tracks.allIds)
  const orderedIds = trackIds.filter(trackId => knownIds.has(trackId))
  const remainingIds = workspace.tracks.allIds.filter(trackId => !orderedIds.includes(trackId))

  return {
    ...workspace,
    project: touchProject(workspace.project),
    tracks: {
      ...workspace.tracks,
      allIds: [...orderedIds, ...remainingIds],
    },
  }
}

function applyPatternPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  const patternId = getPayloadString(payload, 'patternId')

  if (patternId !== undefined) {
    return removeWorkspacePattern(workspace, patternId)
  }

  const pattern = getPayloadObject<Pattern>(payload, 'pattern')

  return pattern === undefined ? workspace : upsertPattern(workspace, pattern)
}

function applyPatternEventPayload(workspace: Workspace, payload: CommandPayload): Workspace {
  const patternId = getPayloadString(payload, 'patternId')

  if (patternId === undefined) {
    return workspace
  }

  const pattern = workspace.patterns.byId[patternId]

  if (pattern === undefined) {
    return workspace
  }

  const eventId = getPayloadString(payload, 'eventId')
  const event = getPayloadObject<PatternEvent>(payload, 'event')
  const events = eventId === undefined
    ? pattern.events
    : pattern.events.filter(currentEvent => currentEvent.id !== eventId)
  const nextEvents = event === undefined
    ? events
    : sortPatternEventsByTime([
        ...events.filter(currentEvent => currentEvent.id !== event.id),
        event,
      ])

  return updateWorkspacePattern(workspace, {
    ...pattern,
    events: nextEvents,
  } as Pattern)
}

function applyTimelineEventPayload(
  workspace: Workspace,
  payload: CommandPayload,
  field: TimelineEventField,
): Workspace {
  const tick = getPayloadNumber(payload, 'tick')
  const previousTick = getPayloadNumber(payload, 'previousTick')
  const event = getPayloadObject<TimelineEvent>(payload, 'event')
  const previousEvent = getPayloadObject<TimelineEvent | null>(payload, 'previousEvent')

  let events: TimelineEvent[] = [...workspace.timeline[field]]

  if (tick !== undefined) {
    events = events.filter(currentEvent => currentEvent.tick !== tick)
  }

  if (previousTick !== undefined) {
    events = events.filter(currentEvent => currentEvent.tick !== previousTick)
  }

  if (previousEvent !== undefined) {
    if (previousEvent !== null) {
      events = upsertTimelineEvent(events, previousEvent)
    }
  }
  else if (event !== undefined) {
    events = upsertTimelineEvent(events, event)
  }

  return setWorkspaceTimeline(workspace, {
    ...workspace.timeline,
    [field]: sortTimelineEventsByTick(events),
  })
}

function upsertBlock(workspace: Workspace, block: Block): Workspace {
  return workspace.arrangement.blocks.some(currentBlock => currentBlock.id === block.id)
    ? updateWorkspaceBlock(workspace, block)
    : addWorkspaceBlock(workspace, block)
}

function upsertSection(workspace: Workspace, section: Section): Workspace {
  return workspace.arrangement.sections.some(currentSection => currentSection.id === section.id)
    ? updateWorkspaceSection(workspace, section)
    : addWorkspaceSection(workspace, section)
}

function upsertTrack(workspace: Workspace, track: Track): Workspace {
  return workspace.tracks.allIds.includes(track.id)
    ? updateWorkspaceTrack(workspace, track)
    : addWorkspaceTrack(workspace, track)
}

function upsertPattern(workspace: Workspace, pattern: Pattern): Workspace {
  return workspace.patterns.allIds.includes(pattern.id)
    ? updateWorkspacePattern(workspace, pattern)
    : addWorkspacePattern(workspace, pattern)
}

function upsertTimelineEvent<TEvent extends TimelineEvent>(events: TEvent[], event: TEvent): TEvent[] {
  return [
    ...events.filter(currentEvent => currentEvent.tick !== event.tick),
    event,
  ]
}

function requireBlock(workspace: Workspace, blockId: BlockId): Block {
  const block = workspace.arrangement.blocks.find(currentBlock => currentBlock.id === blockId)

  if (block === undefined) {
    throw new Error(`Block ${blockId} does not exist.`)
  }

  return block
}

function requireSection(workspace: Workspace, sectionId: SectionId): Section {
  const section = workspace.arrangement.sections.find(currentSection => currentSection.id === sectionId)

  if (section === undefined) {
    throw new Error(`Section ${sectionId} does not exist.`)
  }

  return section
}

function requirePattern(workspace: Workspace, patternId: PatternId): Pattern {
  const pattern = workspace.patterns.byId[patternId]

  if (pattern === undefined) {
    throw new Error(`Pattern ${patternId} does not exist.`)
  }

  return pattern
}

function requireTimelineEvent<TEvent extends { tick: Tick }>(
  events: readonly TEvent[],
  tick: Tick,
  label: string,
): TEvent {
  const event = events.find(currentEvent => currentEvent.tick === tick)

  if (event === undefined) {
    throw new Error(`${label} event at tick ${tick} does not exist.`)
  }

  return event
}

function createEditorCommand(
  kind: CommandKind,
  label: string,
  payload: CommandPayload,
  inverse?: CommandPayload,
): Command {
  const sequence = commandSequence
  commandSequence += 1

  return createCommand({
    createdAt: new Date().toISOString(),
    id: `editor_command_${sequence}`,
    inverse,
    kind,
    label,
    payload,
  })
}

function createUniqueId(prefix: string, existingIds: Set<string>): string {
  if (!existingIds.has(prefix)) {
    return prefix
  }

  let index = 2
  let id = `${prefix}_${index}`

  while (existingIds.has(id)) {
    index += 1
    id = `${prefix}_${index}`
  }

  return id
}

function getPayloadObject<TValue>(payload: CommandPayload, key: string): TValue | undefined {
  const value = payload[key]

  if (typeof value !== 'object' || Array.isArray(value)) {
    return undefined
  }

  return value as TValue
}

function getPayloadArray<TValue>(payload: CommandPayload, key: string): TValue[] {
  const value = payload[key]

  return Array.isArray(value) ? value as TValue[] : []
}

function getPayloadString(payload: CommandPayload, key: string): string | undefined {
  const value = payload[key]

  return typeof value === 'string' ? value : undefined
}

function getPayloadNumber(payload: CommandPayload, key: string): number | undefined {
  const value = payload[key]

  return typeof value === 'number' ? value : undefined
}

function getPayloadStringArray(payload: CommandPayload, key: string): string[] {
  return getPayloadArray<string>(payload, key).filter(value => typeof value === 'string')
}

function toJsonValue<TValue>(value: TValue): JsonValue {
  return value as JsonValue
}
