import type { ActiveTool, Block, ClipboardState, Command, Section, SelectionState, Tick } from '~/domain'
import {
  deleteBlockCommand,
  deletePatternEventCommand,
  deleteSectionCommand,
  duplicateBlockCommand,
  duplicateSectionCommand,
  setBlockMutedCommand,
  splitBlockCommand,
  type Workspace,
} from '~/store/workspace'
import { selectPatternEventContext } from '~/store/workspace'

export function createDeleteSelectedEntitiesCommands(input: {
  selection: SelectionState
  workspace: Workspace
}): Command[] {
  const { selection, workspace } = input
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(deleteBlockCommand(workspace, selection.selectedBlockIds))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(deleteSectionCommand(workspace, selection.selectedSectionIds))
  }

  for (const patternEventId of selection.selectedPatternEventIds) {
    const eventContext = selectPatternEventContext(workspace, patternEventId)

    if (eventContext !== undefined) {
      commands.push(deletePatternEventCommand(workspace, eventContext.patternId, patternEventId))
    }
  }

  return commands
}

export function createDuplicateSelectionCommands(input: {
  offsetTicks?: number
  selection: SelectionState
  workspace: Workspace
}): Command[] {
  const { offsetTicks = input.workspace.timeline.ppq, selection, workspace } = input
  const commands: Command[] = []

  if (selection.selectedBlockIds.length > 0) {
    commands.push(duplicateBlockCommand(workspace, selection.selectedBlockIds, offsetTicks))
  }

  if (selection.selectedSectionIds.length > 0) {
    commands.push(duplicateSectionCommand(workspace, selection.selectedSectionIds, offsetTicks))
  }

  return commands
}

export function createPasteClipboardCommands(input: {
  clipboard: ClipboardState
  workspace: Workspace
}): Command[] {
  const { clipboard, workspace } = input

  if (clipboard.blockIds.length === 0) {
    return []
  }

  return [duplicateBlockCommand(workspace, clipboard.blockIds, workspace.timeline.ppq)]
}

export function createBlockToolCommands(input: {
  block: Block
  tick: Tick
  tool: ActiveTool
  workspace: Workspace
}): Command[] {
  const { block, tick, tool, workspace } = input

  if (tool === 'erase') {
    return [deleteBlockCommand(workspace, [block.id])]
  }

  if (tool === 'split') {
    return [splitBlockCommand(workspace, block.id, tick)]
  }

  if (tool === 'mute') {
    return [setBlockMutedCommand(workspace, block.id, !block.muted)]
  }

  return []
}

export function createSectionToolCommands(input: {
  section: Section
  tool: ActiveTool
  workspace: Workspace
}): Command[] {
  const { section, tool, workspace } = input

  if (tool === 'erase') {
    return [deleteSectionCommand(workspace, [section.id])]
  }

  return []
}
