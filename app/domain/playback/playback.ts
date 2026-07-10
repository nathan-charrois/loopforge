import type { DurationTicks, MidiNote, Tick, Velocity } from '../musicPrimitives'
import type { VoicedNote } from '../voicing'
import { CHORD_PLAYBACK_RECIPES } from './constants'

export type PlaybackRange = {
  startTick: Tick
  endTick: Tick
}

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
  durationSteps?: number
  gate?: number
  velocityScale?: number
  octaveShift?: number
}

export type ChordPlaybackRecipe = {
  id: ChordPlaybackRecipeId
  name: string
  style: ChordPlaybackStyle
  steps: ChordPlaybackRecipeStep[]
  outOfRange: ChordPlaybackRecipeOutOfRange
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

export function isTickInPlaybackRange(tick: Tick, range: PlaybackRange): boolean {
  return tick >= range.startTick && tick < range.endTick
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
  step: ChordPlaybackRecipeStep,
  outOfRange: ChordPlaybackRecipe['outOfRange'],
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

export function getRecipeStepPitch(note: VoicedNote, step: ChordPlaybackRecipeStep): MidiNote {
  return note.midiNote + ((step.octaveShift ?? 0) * 12)
}

export function getRecipeStepVelocity(velocity: Velocity, step: ChordPlaybackRecipeStep): Velocity {
  return Math.max(0, Math.min(127, Math.round(velocity * (step.velocityScale ?? 1))))
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
