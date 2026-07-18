import type { InspectorDraft } from './type'
import {
  type Block,
  isKeyEvent,
  isMeterEvent,
  isTempoEvent,
  type MixChannel,
  type Section,
  type TimelineEvent,
  type Track,
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
    mixChannelMuted: false,
    mixChannelPan: 0,
    mixChannelSoloed: false,
    mixChannelVolumeDb: 0,
    sectionName: '',
    tempoBpm: 120,
    tempoTick: 0,
    trackAccepts: ['chord'],
    trackColor: '#9b51e0',
    trackName: '',
    trackRole: 'chords',
  }
}

export function updateInspectorDraftFromSelection(
  currentDraft: InspectorDraft,
  selectedTrack?: Track,
  selectedMixChannel?: MixChannel,
  selectedBlock?: Block,
  selectedSection?: Section,
  selectionTimelineEvent?: TimelineEvent,
): InspectorDraft {
  const withTrack = updateInspectorDraftFromTrack(currentDraft, selectedTrack)
  const withMixChannel = updateInspectorDraftFromMixChannel(withTrack, selectedMixChannel)
  const withBlock = updateInspectorDraftFromBlock(withMixChannel, selectedBlock)
  const withSection = updateInspectorDraftFromSection(withBlock, selectedSection)

  return updateInspectorDraftFromTimelineEvent(withSection, selectionTimelineEvent)
}

export function updateInspectorDraftFromMixChannel(
  currentDraft: InspectorDraft,
  selectedMixChannel?: MixChannel,
): InspectorDraft {
  if (selectedMixChannel) {
    return {
      ...currentDraft,
      mixChannelMuted: selectedMixChannel.muted,
      mixChannelPan: selectedMixChannel.pan,
      mixChannelSoloed: selectedMixChannel.soloed,
      mixChannelVolumeDb: selectedMixChannel.volumeDb,
    }
  }

  return currentDraft
}

export function updateInspectorDraftFromTrack(
  currentDraft: InspectorDraft,
  selectedTrack?: Track,
): InspectorDraft {
  if (selectedTrack) {
    return {
      ...currentDraft,
      trackAccepts: [...selectedTrack.accepts],
      trackColor: selectedTrack.color,
      trackName: selectedTrack?.name ?? currentDraft.trackName,
      trackRole: selectedTrack?.role ?? currentDraft.trackRole,
    }
  }

  return currentDraft
}

export function updateInspectorDraftFromBlock(
  currentDraft: InspectorDraft,
  selectedBlock?: Block,
): InspectorDraft {
  if (selectedBlock) {
    return {
      ...currentDraft,
      blockColor: selectedBlock?.color ?? currentDraft.blockColor,
      blockMuted: selectedBlock?.muted ?? currentDraft.blockMuted,
      blockName: selectedBlock?.name ?? currentDraft.blockName,
      blockPlaybackMode: selectedBlock?.playbackMode ?? currentDraft.blockPlaybackMode,
    }
  }

  return currentDraft
}

export function updateInspectorDraftFromSection(
  currentDraft: InspectorDraft,
  selectedSection?: Section,
): InspectorDraft {
  if (selectedSection) {
    return {
      ...currentDraft,
      sectionName: selectedSection?.name ?? currentDraft.sectionName,
    }
  }

  return currentDraft
}

export function updateInspectorDraftFromTimelineEvent(
  currentDraft: InspectorDraft,
  selectedTimelineEvent?: TimelineEvent,
): InspectorDraft {
  if (isTempoEvent(selectedTimelineEvent)) {
    return {
      ...currentDraft,
      tempoBpm: selectedTimelineEvent.bpm,
      tempoTick: selectedTimelineEvent.tick,
    }
  }

  if (isMeterEvent(selectedTimelineEvent)) {
    return {
      ...currentDraft,
      meterDenominator: selectedTimelineEvent.timeSignature.denominator,
      meterNumerator: selectedTimelineEvent.timeSignature.numerator,
      meterTick: selectedTimelineEvent.tick,
    }
  }

  if (isKeyEvent(selectedTimelineEvent)) {
    return {
      ...currentDraft,
      keyMode: selectedTimelineEvent.key.mode,
      keyTick: selectedTimelineEvent.tick,
      keyTonic: selectedTimelineEvent.key.tonic,
    }
  }

  return currentDraft
}
