export const ACTIVE_TOOLS = ['select', 'draw', 'erase', 'split', 'resize', 'audition'] as const
export type ActiveTool = typeof ACTIVE_TOOLS[number]

export const INSPECTOR_PANELS = ['project', 'track', 'block', 'pattern', 'event'] as const
export type InspectorPanel = typeof INSPECTOR_PANELS[number]
