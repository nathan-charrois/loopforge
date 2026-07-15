import type { InspectorDraft } from './type'
import {
  type Block,
  isMeterEvent,
  isTempoEvent,
  type Section,
  type TimelineEvent,
} from '~/domain'

export function createInspectorDraft(): InspectorDraft {
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

export function updateInspectorDraftFromSelection(
  currentDraft: InspectorDraft,
  selectedBlock?: Block,
  selectedSection?: Section,
): InspectorDraft {
  return {
    ...currentDraft,
    blockColor: selectedBlock?.color ?? currentDraft.blockColor,
    blockMuted: selectedBlock?.muted ?? currentDraft.blockMuted,
    blockName: selectedBlock?.name ?? currentDraft.blockName,
    blockPlaybackMode: selectedBlock?.playbackMode ?? currentDraft.blockPlaybackMode,
    sectionName: selectedSection?.name ?? currentDraft.sectionName,
  }
}

export function updateInspectorDraftFromTimelineEvent(
  currentDraft: InspectorDraft,
  timelineEvent: TimelineEvent,
): InspectorDraft {
  if (isTempoEvent(timelineEvent)) {
    return {
      ...currentDraft,
      tempoBpm: timelineEvent.bpm,
      tempoTick: timelineEvent.tick,
    }
  }

  if (isMeterEvent(timelineEvent)) {
    return {
      ...currentDraft,
      meterDenominator: timelineEvent.timeSignature.denominator,
      meterNumerator: timelineEvent.timeSignature.numerator,
      meterTick: timelineEvent.tick,
    }
  }

  return {
    ...currentDraft,
    keyMode: timelineEvent.key.mode,
    keyTick: timelineEvent.tick,
    keyTonic: timelineEvent.key.tonic,
  }
}
