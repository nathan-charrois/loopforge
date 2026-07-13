import { clampVelocity, createPositiveDurationTicks, type DurationTicks, type MidiNote, type Velocity } from '../musicPrimitives'
import type { ChordEvent } from '../patternEvents'
import type { VoicedNote } from '../voicing'
import { CHORD_PLAYBACK_RECIPES } from './constants'

export type EffectPresetRef = string
export type InstrumentPresetRef = string

export type ChordPlaybackStyle
  = | 'block'
    | 'arpeggio'
    | 'strum'
    | 'pattern'

export type ChordPlaybackRecipeId
  = | 'block'
    | 'block_staggered'
    | 'arp_up'
    | 'arp_down'
    | 'pop_ostinato'

export type ChordPlaybackRecipeOutOfRange
  = | 'wrap'
    | 'skip'
    | 'clamp'

export type ChordPlaybackRecipeStep = {
  voiceIndex: number
  offsetSteps?: number
  durationSteps?: number | 'toEventEnd'
  gate?: number
  velocityScale?: number
  octaveShift?: number
}

export type ChordPlaybackRecipeHeldStep = {
  voiceIndex: number
  gate?: number
  velocityScale?: number
  octaveShift?: number
}

export type ChordPlaybackRecipeStepOrHeldStep = ChordPlaybackRecipeStep | ChordPlaybackRecipeHeldStep

export type ChordPlaybackRecipe = {
  id: ChordPlaybackRecipeId
  name: string
  style: ChordPlaybackStyle
  steps: ChordPlaybackRecipeStep[]
  outOfRange: ChordPlaybackRecipeOutOfRange
  heldSteps?: ChordPlaybackRecipeHeldStep[]
  defaultStepTicks?: DurationTicks
  defaultGate?: number
}

export type ChordPlayback = {
  style: ChordPlaybackStyle
  gate: number
  recipeId?: ChordPlaybackRecipeId
  stepTicks?: DurationTicks
  microStaggerTicks?: DurationTicks
  effectPresetId?: EffectPresetRef
  instrumentPresetId?: InstrumentPresetRef
}

export function getGatedDurationTick(durationTicks: DurationTicks, maxDurationTicks: DurationTicks, gate: number): DurationTicks {
  return Math.max(1, Math.min(maxDurationTicks, Math.floor(durationTicks * gate)))
}

export function getChordPlaybackRecipe(playback: ChordPlayback): ChordPlaybackRecipe {
  if (playback.recipeId !== undefined) {
    return CHORD_PLAYBACK_RECIPES[playback.recipeId]
  }

  switch (playback.style) {
    case 'arpeggio':
      return CHORD_PLAYBACK_RECIPES.arp_up
    case 'strum':
      return CHORD_PLAYBACK_RECIPES.block_staggered
    case 'pattern':
    case 'block':
    default:
      return CHORD_PLAYBACK_RECIPES.block
  }
}

export function getDefaultStyleForRecipeId(recipeId?: ChordPlaybackRecipeId): ChordPlaybackStyle {
  if (recipeId === undefined) {
    return 'block'
  }

  return CHORD_PLAYBACK_RECIPES[recipeId].style
}

export function getDefaultRecipeIdForStyle(style: ChordPlaybackStyle): ChordPlaybackRecipeId {
  switch (style) {
    case 'arpeggio':
      return 'arp_up'
    case 'strum':
      return 'block_staggered'
    case 'pattern':
    case 'block':
    default:
      return 'block'
  }
}

export function getRecipeStepNote(
  notes: VoicedNote[],
  step: ChordPlaybackRecipeStepOrHeldStep,
  outOfRange: ChordPlaybackRecipeOutOfRange,
): VoicedNote | null {
  if (notes.length === 0) {
    return null
  }

  const voiceIndex = Math.trunc(step.voiceIndex)
  const directNote = notes.find(note => note.voiceIndex === voiceIndex)

  if (directNote !== undefined) {
    return directNote
  }

  if (outOfRange === 'skip') {
    return null
  }

  const resolvedVoiceIndex = outOfRange === 'wrap'
    ? ((voiceIndex % notes.length) + notes.length) % notes.length
    : Math.max(0, Math.min(notes.length - 1, voiceIndex))

  return notes.find(note => note.voiceIndex === resolvedVoiceIndex) ?? null
}

export function getRecipeStepPitch(note: VoicedNote, step: ChordPlaybackRecipeStepOrHeldStep): MidiNote {
  return note.midiNote + ((step.octaveShift ?? 0) * 12)
}

export function scaleVelocity(velocity: Velocity, scale = 1): Velocity {
  return clampVelocity(velocity * scale)
}

export function getRecipeStepVelocity(velocity: Velocity, step: ChordPlaybackRecipeStepOrHeldStep): Velocity {
  return scaleVelocity(velocity, step.velocityScale)
}

export function getRecipeArpeggioSteps(
  notes: VoicedNote[],
  recipe: ChordPlaybackRecipe,
): ChordPlaybackRecipeStep[] {
  const voiceIndexes = new Set(notes.map(note => note.voiceIndex))

  return recipe.steps.filter(
    step => voiceIndexes.has(Math.trunc(step.voiceIndex)),
  )
}

export function getRecipeStepTicks(
  event: ChordEvent,
  recipe: ChordPlaybackRecipe,
  durationTicks: DurationTicks,
  stepCount: number,
): DurationTicks {
  const fallbackStepTicks = getFallbackStepTicks(
    recipe.style,
    durationTicks,
    stepCount,
  )

  return createPositiveDurationTicks(
    event.playback.stepTicks ?? recipe.defaultStepTicks ?? fallbackStepTicks,
  )
}

export function getFallbackStepTicks(
  style: ChordPlaybackRecipe['style'],
  durationTicks: DurationTicks,
  stepCount: number,
): DurationTicks {
  if (style !== 'arpeggio') {
    return durationTicks
  }

  return createPositiveDurationTicks(
    Math.floor(durationTicks / Math.max(1, stepCount)),
  )
}

export function getRecipeStepDurationTicks(
  durationTicks: DurationTicks,
  event: ChordEvent,
  recipe: ChordPlaybackRecipe,
  step: ChordPlaybackRecipeStep,
  stepTicks: DurationTicks,
  startOffsetTicks: number,
): DurationTicks | null {
  const maxDurationTicks = durationTicks - startOffsetTicks

  if (maxDurationTicks <= 0) {
    return null
  }

  const recipeDurationTicks = getRecipeDurationTicks(
    step,
    stepTicks,
    maxDurationTicks,
  )

  return getGatedDurationTick(
    recipeDurationTicks,
    maxDurationTicks,
    step.gate ?? event.playback.gate ?? recipe.defaultGate ?? 1,
  )
}

export function getRecipeDurationTicks(
  step: ChordPlaybackRecipeStep,
  stepTicks: DurationTicks,
  maxDurationTicks: DurationTicks,
): DurationTicks {
  if (step.durationSteps === 'toEventEnd') {
    return createPositiveDurationTicks(maxDurationTicks)
  }

  const durationSteps = step.durationSteps ?? 1

  return createPositiveDurationTicks(durationSteps * stepTicks)
}
