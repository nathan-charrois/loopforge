import type { InspectorDraft } from './type'
import {
  type Block,
  createChordSymbol,
  createDefaultChordPlayback,
  createDefaultChordVoicing,
  createSynthEnvelope,
  createSynthFilter,
  DEFAULT_TRACK_COLOR,
  type Instrument,
  isKeyEvent,
  isLoopEvent,
  isMeterEvent,
  isTempoEvent,
  type MixChannel,
  type Pattern,
  type PatternEvent,
  type Section,
  type TimelineEvent,
  type Track,
} from '~/domain'

export function createInspectorDraft(): InspectorDraft {
  return {
    blockColor: '#4c6ef5',
    blockMuted: false,
    blockName: '',
    blockPatternId: '',
    blockPlaybackMode: 'loop',
    instrumentFmAlgorithm: 'serial',
    instrumentFmOperators: [],
    instrumentName: '',
    instrumentKind: 'thor',
    instrumentWavetableDetuneCents: 0,
    instrumentWavetableEnvelope: createSynthEnvelope(),
    instrumentWavetableFilter: createSynthFilter(),
    instrumentWavetableId: '',
    instrumentWavetablePosition: 0,
    instrumentWavetableUnison: 0,
    keyMode: 'major',
    keyTick: 0,
    keyTonic: 0,
    loopLengthTicks: 1,
    loopTick: 0,
    meterDenominator: 4,
    meterNumerator: 4,
    meterTick: 0,
    mixChannelMuted: false,
    mixChannelPan: 0,
    mixChannelSoloed: false,
    mixChannelVolumeDb: 0,
    patternKind: 'chord',
    patternLengthTicks: 1,
    patternName: '',
    patternEventChord: createChordSymbol({ root: 0 }),
    patternEventDurationTicks: 1,
    patternEventKind: 'note',
    patternEventParameter: '',
    patternEventPiece: 'kick',
    patternEventPitch: 60,
    patternEventPlayback: createDefaultChordPlayback(),
    patternEventTimeTick: 0,
    patternEventValue: '',
    patternEventVelocity: 96,
    patternEventVoicing: createDefaultChordVoicing(),
    sectionName: '',
    tempoBpm: 120,
    tempoTick: 0,
    trackAccepts: ['chord'],
    trackColor: DEFAULT_TRACK_COLOR,
    trackName: '',
    trackRole: 'chords',
  }
}

export function updateInspectorDraftFromSelection(
  currentDraft: InspectorDraft,
  selectedTrack?: Track,
  selectedInstrument?: Instrument,
  selectedMixChannel?: MixChannel,
  selectedBlock?: Block,
  selectedPattern?: Pattern,
  selectedPatternEvent?: PatternEvent,
  selectedSection?: Section,
  selectionTimelineEvent?: TimelineEvent,
): InspectorDraft {
  const withTrack = updateInspectorDraftFromTrack(currentDraft, selectedTrack)
  const withInstrument = updateInspectorDraftFromInstrument(withTrack, selectedInstrument)
  const withMixChannel = updateInspectorDraftFromMixChannel(withInstrument, selectedMixChannel)
  const withBlock = updateInspectorDraftFromBlock(withMixChannel, selectedBlock)
  const withPattern = updateInspectorDraftFromPattern(withBlock, selectedPattern)
  const withPatternEvent = updateInspectorDraftFromPatternEvent(withPattern, selectedPatternEvent)
  const withSection = updateInspectorDraftFromSection(withPatternEvent, selectedSection)

  return updateInspectorDraftFromTimelineEvent(withSection, selectionTimelineEvent)
}

export function updateInspectorDraftFromInstrument(
  currentDraft: InspectorDraft,
  selectedInstrument?: Instrument,
): InspectorDraft {
  if (selectedInstrument === undefined) {
    return currentDraft
  }

  const nextDraft: InspectorDraft = {
    ...currentDraft,
    instrumentName: selectedInstrument.name,
    instrumentKind: selectedInstrument.kind,
  }

  if (selectedInstrument.kind === 'fm') {
    return {
      ...nextDraft,
      instrumentFmAlgorithm: selectedInstrument.algorithm,
      instrumentFmOperators: selectedInstrument.operators.map(operator => ({
        ...operator,
        envelope: { ...operator.envelope },
      })),
    }
  }

  if (selectedInstrument.kind === 'wavetable') {
    return {
      ...nextDraft,
      instrumentWavetableDetuneCents: selectedInstrument.detuneCents,
      instrumentWavetableEnvelope: { ...selectedInstrument.envelope },
      instrumentWavetableFilter: { ...selectedInstrument.filter },
      instrumentWavetableId: selectedInstrument.wavetableId,
      instrumentWavetablePosition: selectedInstrument.position,
      instrumentWavetableUnison: selectedInstrument.unison,
    }
  }

  if (
    selectedInstrument.kind === 'thor'
    || selectedInstrument.kind === 'subtractor'
  ) {
    const synthDraft: InspectorDraft = {
      ...nextDraft,
      instrumentSynthEnvelope: {
        ...selectedInstrument.envelope,
      },
      instrumentSynthOscillators: selectedInstrument.oscillators.map(oscillator => ({
        ...oscillator,
      })),
    }

    if (selectedInstrument.kind === 'subtractor') {
      return {
        ...synthDraft,
        instrumentSubtractorFilter: {
          ...selectedInstrument.filter,
        },
        instrumentSubtractorGlideSeconds: selectedInstrument.glideSeconds,
        instrumentSubtractorMono: selectedInstrument.mono,
        instrumentSubtractorOscillatorMix: selectedInstrument.oscillatorMix,
      }
    }

    return {
      ...synthDraft,
    }
  }

  return nextDraft
}

export function updateInspectorDraftFromPatternEvent(
  currentDraft: InspectorDraft,
  selectedPatternEvent?: PatternEvent,
): InspectorDraft {
  if (selectedPatternEvent === undefined) {
    return currentDraft
  }

  const nextDraft: InspectorDraft = {
    ...currentDraft,
    patternEventKind: selectedPatternEvent.kind,
    patternEventTimeTick: selectedPatternEvent.timeTick,
  }

  switch (selectedPatternEvent.kind) {
    case 'automation':
      return {
        ...nextDraft,
        patternEventParameter: selectedPatternEvent.parameter,
        patternEventValue: String(selectedPatternEvent.value),
      }
    case 'chord':
      return {
        ...nextDraft,
        patternEventChord: {
          ...selectedPatternEvent.chord,
          alterations: [...selectedPatternEvent.chord.alterations],
          extensions: [...selectedPatternEvent.chord.extensions],
        },
        patternEventDurationTicks: selectedPatternEvent.durationTicks,
        patternEventPlayback: { ...selectedPatternEvent.playback },
        patternEventVelocity: selectedPatternEvent.velocity,
        patternEventVoicing: { ...selectedPatternEvent.voicing },
      }
    case 'drumHit':
      return {
        ...nextDraft,
        patternEventPiece: selectedPatternEvent.piece,
        patternEventVelocity: selectedPatternEvent.velocity,
      }
    case 'note':
      return {
        ...nextDraft,
        patternEventDurationTicks: selectedPatternEvent.durationTicks,
        patternEventPitch: selectedPatternEvent.pitch,
        patternEventVelocity: selectedPatternEvent.velocity,
      }
  }
}

export function updateInspectorDraftFromPattern(
  currentDraft: InspectorDraft,
  selectedPattern?: Pattern,
): InspectorDraft {
  if (selectedPattern) {
    return {
      ...currentDraft,
      patternKind: selectedPattern.kind,
      patternLengthTicks: selectedPattern.lengthTicks,
      patternName: selectedPattern.name,
    }
  }

  return currentDraft
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
      blockPatternId: selectedBlock?.patternId ?? currentDraft.blockPatternId,
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

  if (isLoopEvent(selectedTimelineEvent)) {
    return {
      ...currentDraft,
      loopLengthTicks: selectedTimelineEvent.lengthTicks,
      loopTick: selectedTimelineEvent.tick,
    }
  }

  return currentDraft
}
