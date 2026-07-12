export const COMMAND_KINDS = [
  // blocks
  'addBlock',
  'deleteBlock',
  'duplicateBlock',
  'moveBlock',
  'resizeBlock',
  'splitBlock',
  'renameBlock',
  'setBlockMuted',
  'setBlockColor',
  'setBlockPlaybackMode',
  'assignBlockPattern',
  'moveBlockToTrack',

  // sections
  'addSection',
  'deleteSection',
  'duplicateSection',
  'moveSection',
  'resizeSection',
  'renameSection',

  // tracks
  'addTrack',
  'deleteTrack',
  'renameTrack',
  'reorderTrack',
  'setTrackMuted',
  'setTrackSoloed',
  'setTrackVolume',
  'setTrackColor',
  'setTrackInstrument',

  // patterns
  'addPattern',
  'deletePattern',
  'duplicatePattern',
  'renamePattern',

  // pattern events
  'addPatternEvent',
  'deletePatternEvent',
  'duplicatePatternEvent',
  'movePatternEvent',
  'resizePatternEvent',
  'updatePatternEvent',

  // timeline
  'addTempoEvent',
  'deleteTempoEvent',
  'moveTempoEvent',
  'updateTempoEvent',
  'addMeterEvent',
  'deleteMeterEvent',
  'moveMeterEvent',
  'updateMeterEvent',
  'addKeyEvent',
  'deleteKeyEvent',
  'moveKeyEvent',
  'updateKeyEvent',
  'setGridDivision',

  // generic fallback
  'renameEntity',
] as const

export type CommandKind = typeof COMMAND_KINDS[number]
