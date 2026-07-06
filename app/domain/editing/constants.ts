export const COMMAND_KINDS = [
  'addBlock',
  'moveBlock',
  'resizeBlock',
  'deleteBlock',
  'addPatternEvent',
  'movePatternEvent',
  'deletePatternEvent',
  'renameEntity',
] as const

export type CommandKind = typeof COMMAND_KINDS[number]
