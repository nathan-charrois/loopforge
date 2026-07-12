import type { DragState } from './drag'
import {
  type ActiveTool,
  type Block,
  getBlockEndTick,
  type KeyEvent,
  type MeterEvent,
  type Section,
  type TempoEvent,
  type Tick,
  type Timeline,
  type TimelineEventSelection,
} from '~/domain'
import type { Workspace } from '~/store/workspace'
import type { PlaybackTrigger } from '~/utils/schedule'

export function getBlockStackIndexes(blocks: Block[]): Map<string, number> {
  const lanes: number[] = []
  const stackIndexes = new Map<string, number>()

  for (const block of [...blocks].sort((left, right) => left.startTick - right.startTick)) {
    const laneIndex = lanes.findIndex(laneEndTick => laneEndTick <= block.startTick)
    const targetLaneIndex = laneIndex === -1 ? lanes.length : laneIndex

    lanes[targetLaneIndex] = getBlockEndTick(block)
    stackIndexes.set(block.id, targetLaneIndex)
  }

  return stackIndexes
}

export type TimelineEventMarkerView = TimelineEventSelection & {
  id: string
  label: string
  stackIndex: number
}

export type BlockDragPreview = Pick<Block, 'id' | 'lengthTicks' | 'name' | 'trackId'> & {
  startTick: Tick
}

export type SectionDragPreview = Pick<Section, 'id' | 'lengthTicks' | 'name'> & {
  startTick: Tick
}

export function getTimelineEventMarkerViews(timeline: Timeline): TimelineEventMarkerView[] {
  const markers = [
    ...timeline.tempoEvents.map(event => createTempoMarkerView(event)),
    ...timeline.meterEvents.map(event => createMeterMarkerView(event)),
    ...timeline.keyEvents.map(event => createKeyMarkerView(event)),
  ].sort((left, right) => {
    if (left.tick !== right.tick) {
      return left.tick - right.tick
    }

    return getTimelineEventKindOrder(left.kind) - getTimelineEventKindOrder(right.kind)
  })
  const stackIndexesByTick = new Map<Tick, number>()

  return markers.map((marker) => {
    const stackIndex = stackIndexesByTick.get(marker.tick) ?? 0
    stackIndexesByTick.set(marker.tick, stackIndex + 1)

    return {
      ...marker,
      stackIndex,
    }
  })
}

export function getBlockDragPreviews(workspace: Workspace, dragState?: DragState): BlockDragPreview[] {
  if (dragState?.kind === 'moveBlock') {
    const deltaTicks = dragState.currentTick - dragState.startTick

    return dragState.blockIds.flatMap((blockId) => {
      const block = workspace.arrangement.blocks.find(currentBlock => currentBlock.id === blockId)

      return block === undefined
        ? []
        : [{
            id: block.id,
            lengthTicks: block.lengthTicks,
            name: block.name,
            startTick: Math.max(0, block.startTick + deltaTicks),
            trackId: dragState.currentTrackId ?? block.trackId,
          }]
    })
  }

  if (dragState?.kind === 'resizeBlock') {
    const { block } = dragState
    const blockEndTick = getBlockEndTick(block)

    if (dragState.edge === 'left') {
      const startTick = Math.min(dragState.currentTick, blockEndTick - 1)

      return [{
        id: block.id,
        lengthTicks: blockEndTick - startTick,
        name: block.name,
        startTick,
        trackId: block.trackId,
      }]
    }

    const endTick = Math.max(dragState.currentTick, block.startTick + 1)

    return [{
      id: block.id,
      lengthTicks: endTick - block.startTick,
      name: block.name,
      startTick: block.startTick,
      trackId: block.trackId,
    }]
  }

  return []
}

export function getSectionDragPreviews(_workspace: Workspace, dragState?: DragState): SectionDragPreview[] {
  if (dragState?.kind === 'moveSection') {
    const deltaTicks = dragState.currentTick - dragState.startTick

    return [{
      id: dragState.section.id,
      lengthTicks: dragState.section.lengthTicks,
      name: dragState.section.name,
      startTick: Math.max(0, dragState.section.startTick + deltaTicks),
    }]
  }

  if (dragState?.kind === 'resizeSection') {
    const { section } = dragState
    const sectionEndTick = section.startTick + section.lengthTicks

    if (dragState.edge === 'left') {
      const startTick = Math.min(dragState.currentTick, sectionEndTick - 1)

      return [{
        id: section.id,
        lengthTicks: sectionEndTick - startTick,
        name: section.name,
        startTick,
      }]
    }

    const endTick = Math.max(dragState.currentTick, section.startTick + 1)

    return [{
      id: section.id,
      lengthTicks: endTick - section.startTick,
      name: section.name,
      startTick: section.startTick,
    }]
  }

  return []
}

export function getToolLabel(tool: ActiveTool): string {
  switch (tool) {
    case 'audition':
      return 'Audition'
    case 'drawBlock':
      return 'Draw block'
    case 'drawPatternEvent':
      return 'Draw pattern event'
    case 'drawSection':
      return 'Draw section'
    case 'erase':
      return 'Erase'
    case 'hand':
      return 'Hand'
    case 'key':
      return 'Key'
    case 'loopRange':
      return 'Loop range'
    case 'marquee':
      return 'Marquee'
    case 'meter':
      return 'Meter'
    case 'move':
      return 'Move'
    case 'mute':
      return 'Mute'
    case 'resize':
      return 'Resize'
    case 'select':
      return 'Select'
    case 'split':
      return 'Split'
    case 'tempo':
      return 'Tempo'
    case 'zoom':
      return 'Zoom'
  }
}

function createTempoMarkerView(event: TempoEvent): Omit<TimelineEventMarkerView, 'stackIndex'> {
  return {
    id: `tempo:${event.tick}`,
    kind: 'tempo',
    label: `${event.bpm}`,
    tick: event.tick,
  }
}

function createMeterMarkerView(event: MeterEvent): Omit<TimelineEventMarkerView, 'stackIndex'> {
  return {
    id: `meter:${event.tick}`,
    kind: 'meter',
    label: `${event.timeSignature.numerator}/${event.timeSignature.denominator}`,
    tick: event.tick,
  }
}

function createKeyMarkerView(event: KeyEvent): Omit<TimelineEventMarkerView, 'stackIndex'> {
  return {
    id: `key:${event.tick}`,
    kind: 'key',
    label: `${event.key.tonic}`,
    tick: event.tick,
  }
}

function getTimelineEventKindOrder(kind: TimelineEventSelection['kind']): number {
  switch (kind) {
    case 'tempo':
      return 0
    case 'meter':
      return 1
    case 'key':
      return 2
  }
}

export function formatPlaybackTrigger(trigger: PlaybackTrigger): string {
  if (trigger.kind === 'note') {
    return `MIDI ${trigger.pitch}`
  }

  if (trigger.kind === 'drum') {
    return trigger.kitPiece
  }

  return `${trigger.parameter}: ${trigger.value}`
}

export function getPlaybackTriggerTop(trigger: PlaybackTrigger): number {
  if (trigger.kind === 'note') {
    return 4 + ((127 - trigger.pitch) % 18)
  }

  if (trigger.kind === 'drum') {
    return 14
  }

  return 22
}
