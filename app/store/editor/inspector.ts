import { createTimelineEventUpdateCommands, type TimelineEventDraft } from './timelineInteraction'
import type { Block, BlockPlaybackMode, Command, Key, Section, TimelineEventSelection, TimeSignatureDenominator } from '~/domain'
import {
  renameSectionCommand,
  updateBlockSnapshotCommand,
  type Workspace,
} from '~/store/workspace'

export type InspectorDraft = TimelineEventDraft & {
  blockColor: string
  blockMuted: boolean
  blockName: string
  blockPlaybackMode: BlockPlaybackMode
  sectionName: string
}

export function createEmptyInspectorDraft(): InspectorDraft {
  return {
    blockColor: '#4c6ef5',
    blockMuted: false,
    blockName: '',
    blockPlaybackMode: 'loop',
    keyMode: 'major',
    keyTick: 0,
    keyTonic: 0,
    meterDenominator: 4,
    meterNumerator: 4,
    meterTick: 0,
    sectionName: '',
    tempoBpm: 120,
    tempoTick: 0,
  }
}

export function updateInspectorDraftFromSelection(input: {
  currentDraft: InspectorDraft
  selectedBlock?: Block
  selectedSection?: Section
}): InspectorDraft {
  const { currentDraft, selectedBlock, selectedSection } = input

  return {
    ...currentDraft,
    blockColor: selectedBlock?.color ?? currentDraft.blockColor,
    blockMuted: selectedBlock?.muted ?? currentDraft.blockMuted,
    blockName: selectedBlock?.name ?? currentDraft.blockName,
    blockPlaybackMode: selectedBlock?.playbackMode ?? currentDraft.blockPlaybackMode,
    sectionName: selectedSection?.name ?? currentDraft.sectionName,
  }
}

export function updateInspectorDraftFromTimelineEvent(input: {
  currentDraft: InspectorDraft
  event: TimelineEventSelection
  workspace: Workspace
}): InspectorDraft {
  const { currentDraft, event, workspace } = input

  if (event.kind === 'tempo') {
    const tempoEvent = workspace.timeline.tempoEvents.find(currentEvent => currentEvent.tick === event.tick)

    if (tempoEvent === undefined) {
      return currentDraft
    }

    return {
      ...currentDraft,
      tempoBpm: tempoEvent.bpm,
      tempoTick: tempoEvent.tick,
    }
  }

  if (event.kind === 'meter') {
    const meterEvent = workspace.timeline.meterEvents.find(currentEvent => currentEvent.tick === event.tick)

    if (meterEvent === undefined) {
      return currentDraft
    }

    return {
      ...currentDraft,
      meterDenominator: meterEvent.timeSignature.denominator,
      meterNumerator: meterEvent.timeSignature.numerator,
      meterTick: meterEvent.tick,
    }
  }

  const keyEvent = workspace.timeline.keyEvents.find(currentEvent => currentEvent.tick === event.tick)

  if (keyEvent === undefined) {
    return currentDraft
  }

  return {
    ...currentDraft,
    keyMode: keyEvent.key.mode,
    keyTick: keyEvent.tick,
    keyTonic: keyEvent.key.tonic,
  }
}

export function createBlockInspectorCommands(input: {
  block: Block
  draft: InspectorDraft
}): Command[] {
  const { block, draft } = input
  const commands: Command[] = []
  let currentBlock = block
  const nextName = draft.blockName.trim() || block.name

  if (nextName !== currentBlock.name) {
    const nextBlock = { ...currentBlock, name: nextName }

    commands.push(updateBlockSnapshotCommand('renameBlock', `Rename block ${currentBlock.name}`, currentBlock, nextBlock))
    currentBlock = nextBlock
  }

  if (draft.blockColor !== currentBlock.color) {
    const nextBlock = { ...currentBlock, color: draft.blockColor }

    commands.push(updateBlockSnapshotCommand('setBlockColor', `Set block color ${currentBlock.name}`, currentBlock, nextBlock))
    currentBlock = nextBlock
  }

  if (draft.blockMuted !== currentBlock.muted) {
    const nextBlock = { ...currentBlock, muted: draft.blockMuted }

    commands.push(updateBlockSnapshotCommand(
      'setBlockMuted',
      `${draft.blockMuted ? 'Mute' : 'Unmute'} block ${currentBlock.name}`,
      currentBlock,
      nextBlock,
    ))
    currentBlock = nextBlock
  }

  if (draft.blockPlaybackMode !== currentBlock.playbackMode) {
    const nextBlock = { ...currentBlock, playbackMode: draft.blockPlaybackMode }

    commands.push(updateBlockSnapshotCommand('setBlockPlaybackMode', `Set block playback ${currentBlock.name}`, currentBlock, nextBlock))
  }

  return commands
}

export function createSectionInspectorCommands(input: {
  draft: InspectorDraft
  section: Section
  workspace: Workspace
}): Command[] {
  const { draft, section, workspace } = input

  return [renameSectionCommand(workspace, section.id, draft.sectionName)]
}

export { createTimelineEventUpdateCommands }

export function numberInputValue(value: string | number, fallback: number): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : fallback
}

export type { Key, TimeSignatureDenominator }
