import type { DurationTicks, Tick } from '../musicPrimitives'

export type TransportStatus = 'stopped' | 'playing' | 'paused'

export type PlaybackRange = {
  startTick: Tick
  endTick: Tick
}

export const PLAYBACK_STYLES = ['block', 'strum', 'arpeggio', 'rhythm'] as const
export type PlaybackStyle = typeof PLAYBACK_STYLES[number]

export const ARPEGGIO_PATTERNS = ['up', 'down', 'upDown', 'random'] as const
export type ArpeggioPattern = typeof ARPEGGIO_PATTERNS[number]

export const STRUM_PATTERNS = ['down', 'up', 'alternate'] as const
export type StrumPattern = typeof STRUM_PATTERNS[number]
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
