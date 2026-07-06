import type { DurationTicks, Tick } from '../musicPrimitives'
import type { ArpeggioPattern, PlaybackStyle, StrumPattern } from './constants'

export type TransportStatus = 'stopped' | 'playing' | 'paused'

export type PlaybackRange = {
  startTick: Tick
  endTick: Tick
}

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

export function isTickInPlaybackRange(tick: Tick, range: PlaybackRange): boolean {
  return tick >= range.startTick && tick < range.endTick
}
