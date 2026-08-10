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
    | 'block_bright_rake'
    | 'block_falling_rake'
    | 'block_soft_pad'
    | 'block_accented'
    | 'block_bass_weighted'
    | 'block_top_weighted'
    | 'block_octave_stack'
    | 'block_short_punch'
    | 'strum_up'
    | 'strum_down'
    | 'strum_wide'
    | 'strum_slow_up'
    | 'strum_slow_down'
    | 'strum_fast_up'
    | 'strum_fast_down'
    | 'strum_center_out'
    | 'strum_outside_in'
    | 'strum_harp'
    | 'strum_brushed'
    | 'arp_up'
    | 'arp_down'
    | 'arp_up_down'
    | 'arp_down_up'
    | 'arp_pedal'
    | 'arp_octave_bloom'
    | 'arp_triplet'
    | 'arp_fast_up'
    | 'arp_fast_down'
    | 'arp_slow_rise'
    | 'arp_slow_fall'
    | 'arp_alberti'
    | 'arp_reverse_alberti'
    | 'arp_root_pedal'
    | 'arp_top_pedal'
    | 'arp_converge'
    | 'arp_diverge'
    | 'arp_skip_up'
    | 'arp_skip_down'
    | 'arp_rolling_thirds'
    | 'arp_octave_ladder'
    | 'arp_octave_descent'
    | 'arp_two_octave_up'
    | 'arp_two_octave_down'
    | 'arp_cascade'
    | 'arp_echo'
    | 'arp_accent_cycle'
    | 'arp_zigzag'
    | 'arp_wave'
    | 'arp_low_high'
    | 'arp_high_low'
    | 'arp_cross_octaves'
    | 'arp_bell_tower'
    | 'arp_upper_circle'
    | 'arp_velvet'
    | 'arp_ripple_up'
    | 'arp_ripple_down'
    | 'arp_pyramid'
    | 'arp_inverted_pyramid'
    | 'arp_orbit'
    | 'arp_satellite'
    | 'arp_chord_tone_skip'
    | 'arp_octave_ping_pong'
    | 'arp_bass_bounce'
    | 'arp_soprano_bounce'
    | 'arp_glass_rain'
    | 'arp_neon_stairs'
    | 'arp_spiral_up'
    | 'arp_spiral_down'
    | 'arp_three_cycle'
    | 'arp_five_cycle'
    | 'arp_baroque_turn'
    | 'arp_dream_echo'
    | 'arp_motorik'
    | 'arp_crystal_fan'
    | 'pop_ostinato'
    | 'pattern_offbeat'
    | 'pattern_tresillo'
    | 'pattern_ballad'
    | 'pattern_syncopated'
    | 'pattern_broken_octaves'
    | 'pattern_quarter_pulse'
    | 'pattern_euclidean_three'
    | 'pattern_euclidean_five'
    | 'pattern_son_clave'
    | 'pattern_rumba_clave'
    | 'pattern_gallop'
    | 'pattern_half_time'
    | 'pattern_call_response'

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
      return CHORD_PLAYBACK_RECIPES.strum_up
    case 'pattern':
      return CHORD_PLAYBACK_RECIPES.pattern_offbeat
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
      return 'strum_up'
    case 'pattern':
      return 'pattern_offbeat'
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

export function getRecipeStepsForNotes(
  notes: VoicedNote[],
  recipe: ChordPlaybackRecipe,
): ChordPlaybackRecipeStep[] {
  if (recipe.outOfRange !== 'skip') {
    return recipe.steps
  }

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
