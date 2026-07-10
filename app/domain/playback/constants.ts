import type { ChordPlaybackRecipe, ChordPlaybackRecipeId, ChordPlaybackStyle } from './playback'

export const CHORD_PLAYBACK_STYLES = [
  'block',
  'arpeggio',
  'strum',
  'pattern',
] as const satisfies readonly ChordPlaybackStyle[]

export const CHORD_PLAYBACK_RECIPE_IDS = [
  'block',
  'block_staggered',
  'arp_up',
  'arp_down',
  'pop_ostinato',
] as const satisfies readonly ChordPlaybackRecipeId[]

export const CHORD_PLAYBACK_RECIPES: Record<ChordPlaybackRecipeId, ChordPlaybackRecipe> = {
  block: {
    id: 'block',
    name: 'Block',
    style: 'block',
    steps: [],
    outOfRange: 'skip',
  },
  block_staggered: {
    id: 'block_staggered',
    name: 'Soft Stagger',
    style: 'block',
    defaultStepTicks: 3,
    steps: [
      { voiceIndex: 0, offsetSteps: 0, durationSteps: 'toEventEnd' },
      { voiceIndex: 1, offsetSteps: 1, durationSteps: 'toEventEnd' },
      { voiceIndex: 2, offsetSteps: 2, durationSteps: 'toEventEnd' },
      { voiceIndex: 3, offsetSteps: 3, durationSteps: 'toEventEnd' },
      { voiceIndex: 4, offsetSteps: 4, durationSteps: 'toEventEnd' },
    ],
    outOfRange: 'skip',
  },
  arp_up: {
    id: 'arp_up',
    name: 'Arp Up',
    style: 'arpeggio',
    steps: [
      { voiceIndex: 0 },
      { voiceIndex: 1 },
      { voiceIndex: 2 },
      { voiceIndex: 3 },
      { voiceIndex: 4 },
    ],
    outOfRange: 'wrap',
  },
  arp_down: {
    id: 'arp_down',
    name: 'Arp Down',
    style: 'arpeggio',
    steps: [
      { voiceIndex: 4 },
      { voiceIndex: 3 },
      { voiceIndex: 2 },
      { voiceIndex: 1 },
      { voiceIndex: 0 },
    ],
    outOfRange: 'wrap',
  },
  pop_ostinato: {
    id: 'pop_ostinato',
    name: 'Pop Ostinato',
    style: 'arpeggio',
    heldSteps: [
      { voiceIndex: 0, gate: 1, velocityScale: 0.25, octaveShift: -2 },
    ],
    steps: [
      { voiceIndex: 0 },
      { voiceIndex: 0 },
      { voiceIndex: 2, durationSteps: 4, velocityScale: 0.5 },
      { voiceIndex: 1, gate: 0.5 },
      { voiceIndex: 3, gate: 0.5 },
      { voiceIndex: 0, gate: 0.5 },
      { voiceIndex: 2, gate: 0.5 },
      { voiceIndex: 0 },
    ],
    outOfRange: 'wrap',
  },
}
