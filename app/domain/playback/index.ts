import type { DurationTicks, Tick } from '../musicPrimitives'

export type TransportStatus = 'stopped' | 'playing' | 'paused'

export type PlaybackRange = {
  startTick: Tick
  endTick: Tick
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
