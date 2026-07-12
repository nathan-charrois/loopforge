export const ACTIVE_TOOLS = [
  'select',
  'marquee',
  'hand',
  'drawBlock',
  'drawSection',
  'drawPatternEvent',
  'erase',
  'split',
  'resize',
  'move',
  'audition',
  'mute',
  'zoom',
  'loopRange',
  'tempo',
  'meter',
  'key',
] as const
export type ActiveTool = typeof ACTIVE_TOOLS[number]

export const INSPECTOR_PANELS = ['project', 'track', 'block', 'pattern', 'event'] as const
export type InspectorPanel = typeof INSPECTOR_PANELS[number]
