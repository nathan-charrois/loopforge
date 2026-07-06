import type { DurationTicks, Tick } from '../musicPrimitives'

export type TransportStatus = 'stopped' | 'playing' | 'paused'

export type PlaybackRange = {
  startTick: Tick
  endTick: Tick
}

export type TransportState = {
  status: TransportStatus
  playheadTick: Tick
  loopEnabled: boolean
  loopRange?: PlaybackRange
  bpmOverride?: number
}

export type PlaybackStyle = 'block' | 'strum' | 'arpeggio' | 'rhythm'
export type ArpeggioPattern = 'up' | 'down' | 'upDown' | 'random'
export type StrumPattern = 'down' | 'up' | 'alternate'
export type EffectPresetRef = string
export type InstrumentPresetRef = string

export type ChordPlayback = {
  style: PlaybackStyle
  gate: number
  repeatEveryTicks?: DurationTicks
  arpeggioPattern?: ArpeggioPattern
  strumPattern?: StrumPattern
  effectPresetId?: EffectPresetRef
  instrumentPresetId?: InstrumentPresetRef
}

export function createDefaultTransportState(input: Partial<TransportState> = {}): TransportState {
  return {
    bpmOverride: input.bpmOverride,
    loopEnabled: input.loopEnabled ?? false,
    loopRange: input.loopRange,
    playheadTick: input.playheadTick ?? 0,
    status: input.status ?? 'stopped',
  }
}

export function createDefaultChordPlayback(input: Partial<ChordPlayback> = {}): ChordPlayback {
  return {
    arpeggioPattern: input.arpeggioPattern,
    effectPresetId: input.effectPresetId,
    gate: input.gate ?? 1,
    instrumentPresetId: input.instrumentPresetId,
    repeatEveryTicks: input.repeatEveryTicks,
    strumPattern: input.strumPattern,
    style: input.style ?? 'block',
  }
}

export function isTickInPlaybackRange(tick: Tick, range: PlaybackRange): boolean {
  return tick >= range.startTick && tick < range.endTick
}
