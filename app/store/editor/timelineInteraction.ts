import { snapTimelineTick } from './snap'
import {
  type ActiveTool,
  type Command,
  createKeyEvent,
  createMeterEvent,
  createTempoEvent,
  getKeyAtTick,
  getMeterAtTick,
  getTempoAtTick,
  type GridDivision,
  type Key,
  type TimelineEventSelection,
} from '~/domain'
import {
  addKeyEventCommand,
  addMeterEventCommand,
  addTempoEventCommand,
  deleteKeyEventCommand,
  deleteMeterEventCommand,
  deleteTempoEventCommand,
  moveKeyEventCommand,
  moveMeterEventCommand,
  moveTempoEventCommand,
  updateKeyEventCommand,
  updateMeterEventCommand,
  updateTempoEventCommand,
  type Workspace,
} from '~/store/workspace'

export type TimelineEventDraft = {
  keyMode: Key['mode']
  keyTick: number
  keyTonic: number
  meterDenominator: 1 | 2 | 4 | 8 | 16 | 32
  meterNumerator: number
  meterTick: number
  tempoBpm: number
  tempoTick: number
}

export function createTimelineMarkerAddCommand(
  workspace: Workspace,
  activeTool: ActiveTool,
  tick: number,
): Command | undefined {
  if (activeTool === 'tempo') {
    return addTempoEventCommand(workspace, createTempoEvent({
      bpm: getTempoAtTick(workspace.timeline, tick),
      tick,
    }))
  }

  if (activeTool === 'meter') {
    return addMeterEventCommand(workspace, createMeterEvent({
      tick,
      timeSignature: getMeterAtTick(workspace.timeline, tick),
    }))
  }

  if (activeTool === 'key') {
    return addKeyEventCommand(workspace, createKeyEvent({
      key: getKeyAtTick(workspace.timeline, tick),
      tick,
    }))
  }

  return undefined
}

export function createTimelineMoveCommand(
  workspace: Workspace,
  event: TimelineEventSelection,
  tick: number,
): Command {
  if (event.kind === 'tempo') {
    return moveTempoEventCommand(workspace, event.tick, tick)
  }

  if (event.kind === 'meter') {
    return moveMeterEventCommand(workspace, event.tick, tick)
  }

  return moveKeyEventCommand(workspace, event.tick, tick)
}

export function createTimelineDeleteCommand(workspace: Workspace, event: TimelineEventSelection): Command {
  if (event.kind === 'tempo') {
    return deleteTempoEventCommand(workspace, event.tick)
  }

  if (event.kind === 'meter') {
    return deleteMeterEventCommand(workspace, event.tick)
  }

  return deleteKeyEventCommand(workspace, event.tick)
}

export function createTimelineEventUpdateCommands(input: {
  draft: TimelineEventDraft
  event: TimelineEventSelection
  workspace: Workspace
}): {
  commands: Command[]
  selectedTimelineEvent: TimelineEventSelection
} {
  const { draft, event, workspace } = input

  if (event.kind === 'tempo') {
    const nextTick = snapTimelineTick(workspace.timeline, draft.tempoTick)

    return {
      commands: [updateTempoEventCommand(workspace, event.tick, draft.tempoBpm, nextTick)],
      selectedTimelineEvent: { kind: 'tempo', tick: nextTick },
    }
  }

  if (event.kind === 'meter') {
    const nextTick = snapTimelineTick(workspace.timeline, draft.meterTick, 'bar' satisfies GridDivision)
    const meterEvent = createMeterEvent({
      tick: nextTick,
      timeSignature: {
        denominator: draft.meterDenominator,
        numerator: draft.meterNumerator,
      },
    })

    return {
      commands: [updateMeterEventCommand(workspace, event.tick, meterEvent)],
      selectedTimelineEvent: { kind: 'meter', tick: nextTick },
    }
  }

  const nextTick = snapTimelineTick(workspace.timeline, draft.keyTick)
  const keyEvent = createKeyEvent({
    key: {
      mode: draft.keyMode,
      tonic: draft.keyTonic as Key['tonic'],
    },
    tick: nextTick,
  })

  return {
    commands: [updateKeyEventCommand(workspace, event.tick, keyEvent)],
    selectedTimelineEvent: { kind: 'key', tick: nextTick },
  }
}
