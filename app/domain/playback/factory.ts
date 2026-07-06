import type { ChordPlayback } from './playback'

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
