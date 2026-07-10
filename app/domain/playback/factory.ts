import { type ChordPlayback, getDefaultRecipeIdForStyle, getDefaultStyleForRecipeId } from './playback'

export function createDefaultChordPlayback(input: Partial<ChordPlayback> = {}): ChordPlayback {
  const style = input.style ?? getDefaultStyleForRecipeId(input.recipeId)
  const recipeId = input.recipeId ?? getDefaultRecipeIdForStyle(style)

  return {
    effectPresetId: input.effectPresetId,
    gate: input.gate ?? 1,
    instrumentPresetId: input.instrumentPresetId,
    microStaggerTicks: input.microStaggerTicks,
    stepTicks: input.stepTicks,
    recipeId,
    style,
  }
}
