import { useState } from 'react'
import { type MetaArgs } from 'react-router'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'

import { DebugNav } from './DebugNav'
import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'
import {
  barBeatToTick,
  BLOCK_PLAYBACK_MODES,
  type BlockPlaybackMode,
  canTrackAcceptPatternKind,
  CHORD_ALTERATIONS,
  CHORD_EXTENSIONS,
  CHORD_PLAYBACK_RECIPE_IDS,
  CHORD_PLAYBACK_STYLES,
  CHORD_QUALITIES,
  type ChordAlteration,
  type ChordExtension,
  type ChordPlaybackRecipeId,
  type ChordPlaybackStyle,
  type ChordQuality,
  COMMAND_KINDS,
  type CommandKind,
  createAutomationEvent,
  createBlock,
  createChordEvent,
  createChordSymbol,
  createCommand,
  createDefaultArrangement,
  createDefaultChordPlayback,
  createDefaultChordVoicing,
  createDefaultKey,
  createDefaultTimeline,
  createDefaultTracks,
  createDrumHitEvent,
  createDurationTicks,
  createEmptyCommandHistory,
  createEmptyPattern,
  createKeyEvent,
  createMeterEvent,
  createMidiNote,
  createNoteEvent,
  createPattern,
  createPitchClass,
  createPositiveDurationTicks,
  createProject,
  createProjectMetadata,
  createProjectVersion,
  createSection,
  createTempoEvent,
  createTick,
  createTimeline,
  createTrack,
  createVelocity,
  eventMatchesPatternKind,
  formatChordSymbol,
  getBarLengthTicks,
  getBarLengthTicksAtTick,
  getBarStartTick,
  getBlockEndTick,
  getChordPitchClasses,
  getKeyAtTick,
  getMeterAtTick,
  getNashvilleNumber,
  getNoteNameForPitchClass,
  getOctaveForMidiNote,
  getPatternEventEndTick,
  getPatternEventKind,
  getPitchClassForNoteName,
  getRomanNumeral,
  getScalePitchClasses,
  getTempoAtTick,
  getTicksPerBeat,
  GRID_DIVISIONS,
  type GridDivision,
  isBarBoundaryTick,
  isChordQuality,
  isDurationTicks,
  isInteger,
  isMidiNote,
  isMode,
  isNoteName,
  isPatternEventWithinLength,
  isPitchClass,
  isPositiveDurationTicks,
  isTick,
  isTimedPatternEvent,
  isTrackVolume,
  isValidTimeSignature,
  isVelocity,
  materializeChordVoicing,
  midiNoteFromPitchClass,
  type Mode,
  MODES,
  moveBlock,
  normalizePitchClass,
  NOTE_NAMES,
  type NoteName,
  PATTERN_KINDS,
  type PatternEvent,
  type PatternKind,
  PITCH_CLASSES,
  type PitchClass,
  pitchClassFromMidiNote,
  pushCommand,
  redoCommand,
  type Register,
  REGISTERS,
  resizeBlock,
  snapTickToGrid,
  sortBlocksByStartTick,
  sortPatternEventsByTime,
  tickToBarBeat,
  TIME_SIGNATURE_DENOMINATORS,
  type TimeSignatureDenominator,
  touchProject,
  TRACK_ROLES,
  type TrackRole,
  transposeChordSymbol,
  transposePitchClass,
  undoCommand,
  updateProjectMetadata,
  validatePattern,
  validateProject,
  validateTimeline,
  validateTrack,
  type VoicedNote,
  VOICING_TYPES,
  type VoicingType,
} from '~/domain'
import {
  ACTIVE_TOOLS,
  type ActiveTool,
  createClipboardState,
  createEditorState,
  createInspectorState,
  createSelectionState,
  INSPECTOR_PANELS,
  type InspectorPanel,
} from '~/store/editor'
import {
  addPattern as addWorkspacePattern,
  createWorkspace,
  selectPattern,
  selectTrack,
  validateWorkspace,
} from '~/store/workspace'

type OutputStatus = 'ok' | 'error'

type PlaygroundOutput = {
  label: string
  status: OutputStatus
  value: unknown
}

const PITCH_CLASS_OPTIONS = PITCH_CLASSES.map(index => ({
  label: `${index}`,
  value: `${index}`,
}))

const CHORD_EXTENSION_OPTIONS = ['none', ...CHORD_EXTENSIONS] as const satisfies ReadonlyArray<ChordExtension | 'none'>
const CHORD_ALTERATION_OPTIONS = ['none', ...CHORD_ALTERATIONS] as const satisfies ReadonlyArray<ChordAlteration | 'none'>
const DENOMINATOR_SELECT_OPTIONS = TIME_SIGNATURE_DENOMINATORS.map(value => ({
  label: `${value}`,
  value: `${value}`,
}))

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Debug' },
  ]
}

export default function Debug() {
  const [outputs, setOutputs] = useState<Record<string, PlaygroundOutput>>({})

  const [primitiveTick, setPrimitiveTick] = useState('480')
  const [primitiveDuration, setPrimitiveDuration] = useState('960')
  const [primitivePitchClass, setPrimitivePitchClass] = useState('0')
  const [primitiveMidiNote, setPrimitiveMidiNote] = useState('60')
  const [primitiveVelocity, setPrimitiveVelocity] = useState('96')
  const [primitiveInterval, setPrimitiveInterval] = useState('7')
  const [primitiveNoteName, setPrimitiveNoteName] = useState<NoteName>('C')
  const [primitiveOctave, setPrimitiveOctave] = useState('4')

  const [harmonyRoot, setHarmonyRoot] = useState('0')
  const [harmonyQuality, setHarmonyQuality] = useState<ChordQuality>('minor')
  const [harmonyExtension, setHarmonyExtension] = useState<ChordExtension | 'none'>('7')
  const [harmonyAlteration, setHarmonyAlteration] = useState<ChordAlteration | 'none'>('none')
  const [harmonyKeyTonic, setHarmonyKeyTonic] = useState('0')
  const [harmonyMode, setHarmonyMode] = useState<Mode>('major')
  const [harmonyInterval, setHarmonyInterval] = useState('2')

  const [voicingType, setVoicingType] = useState<VoicingType>('closed')
  const [voicingInversion, setVoicingInversion] = useState('0')
  const [voicingRegister, setVoicingRegister] = useState<Register>('mid')
  const [voicingSpread, setVoicingSpread] = useState('1')
  const [voicingOctave, setVoicingOctave] = useState('4')
  const [voicingBassEnabled, setVoicingBassEnabled] = useState(false)
  const [voicingBass, setVoicingBass] = useState('7')

  const [playheadTick, setPlayheadTick] = useState('480')
  const [loopStartTick, setLoopStartTick] = useState('0')
  const [loopEndTick, setLoopEndTick] = useState('1920')
  const [playbackStyle, setPlaybackStyle] = useState<ChordPlaybackStyle>('arpeggio')
  const [playbackGate, setPlaybackGate] = useState('0.85')
  const [stepTicks, setStepTicks] = useState('240')
  const [microStaggerTicks, setMicroStaggerTicks] = useState('3')
  const [recipeId, setRecipeId] = useState<ChordPlaybackRecipeId>('arp_up')

  const [eventTimeTick, setEventTimeTick] = useState('0')
  const [eventDurationTicks, setEventDurationTicks] = useState('480')
  const [eventVelocity, setEventVelocity] = useState('96')
  const [eventMidiNote, setEventMidiNote] = useState('60')
  const [eventKitPiece, setEventKitPiece] = useState('kick')
  const [automationParameter, setAutomationParameter] = useState('filterCutoff')
  const [automationValue, setAutomationValue] = useState('0.75')
  const [patternLengthForEvent, setPatternLengthForEvent] = useState('1920')

  const [patternId, setPatternId] = useState('pattern_main')
  const [patternName, setPatternName] = useState('Main Pattern')
  const [patternKind, setPatternKind] = useState<PatternKind>('chord')
  const [patternLengthTicks, setPatternLengthTicks] = useState('1920')

  const [trackId, setTrackId] = useState('track_chords')
  const [trackName, setTrackName] = useState('Chords')
  const [trackRole, setTrackRole] = useState<TrackRole>('chords')
  const [trackAccepts, setTrackAccepts] = useState<PatternKind>('chord')
  const [trackVolume, setTrackVolume] = useState('0.85')
  const [trackColor, setTrackColor] = useState('#9b51e0')

  const [sectionId, setSectionId] = useState('section_a')
  const [sectionName, setSectionName] = useState('Section A')
  const [sectionStartTick, setSectionStartTick] = useState('0')
  const [sectionLengthTicks, setSectionLengthTicks] = useState('7680')
  const [blockId, setBlockId] = useState('block_1')
  const [blockTrackId, setBlockTrackId] = useState('track_chords')
  const [blockPatternId, setBlockPatternId] = useState('pattern_main')
  const [blockStartTick, setBlockStartTick] = useState('0')
  const [blockLengthTicks, setBlockLengthTicks] = useState('1920')
  const [blockMuted, setBlockMuted] = useState(false)
  const [blockColor, setBlockColor] = useState('#6c6f7d')
  const [blockName, setBlockName] = useState('Verse Chords')
  const [blockPlaybackMode, setBlockPlaybackMode] = useState<BlockPlaybackMode>('loop')
  const [blockMoveTick, setBlockMoveTick] = useState('1920')
  const [blockResizeTicks, setBlockResizeTicks] = useState('3840')

  const [timelineBpm, setTimelineBpm] = useState('120')
  const [timelineTick, setTimelineTick] = useState('960')
  const [timelineNumerator, setTimelineNumerator] = useState('4')
  const [timelineDenominator, setTimelineDenominator] = useState<TimeSignatureDenominator>(4)
  const [timelineGrid, setTimelineGrid] = useState<GridDivision>('sixteenthNote')
  const [barValue, setBarValue] = useState('2')
  const [beatValue, setBeatValue] = useState('1')
  const [beatTickValue, setBeatTickValue] = useState('0')

  const [commandId, setCommandId] = useState('command_1')
  const [commandKind, setCommandKind] = useState<CommandKind>('moveBlock')
  const [commandLabel, setCommandLabel] = useState('Move block')
  const [commandTargetId, setCommandTargetId] = useState('block_1')
  const [commandTick, setCommandTick] = useState('1920')
  const [commandCreatedAt, setCommandCreatedAt] = useState('2026-01-01T00:00:00.000Z')

  const [activeTool, setActiveTool] = useState<ActiveTool>('select')
  const [inspectorPanel, setInspectorPanel] = useState<InspectorPanel>('block')
  const [selectedBlockIds, setSelectedBlockIds] = useState('block_1, block_2')
  const [selectedEventIds, setSelectedEventIds] = useState('event_1')
  const [selectedTrackIds, setSelectedTrackIds] = useState('track_chords')
  const [selectedSectionIds, setSelectedSectionIds] = useState('section_a')

  const [projectId, setProjectId] = useState('project_debug')
  const [projectName, setProjectName] = useState('Debug Project')
  const [projectDescription, setProjectDescription] = useState('Sketch for testing domain factories.')
  const [projectTags, setProjectTags] = useState('debug, playground')
  const [projectRevision, setProjectRevision] = useState('2')
  const [projectCreatedAt, setProjectCreatedAt] = useState('2026-01-01T00:00:00.000Z')

  function run(domain: string, label: string, action: () => unknown) {
    const outputKey = `${domain}.${label}`

    try {
      setOutputs(currentOutputs => ({
        ...currentOutputs,
        [outputKey]: {
          label,
          status: 'ok',
          value: action(),
        },
      }))
    }
    catch (error) {
      setOutputs(currentOutputs => ({
        ...currentOutputs,
        [outputKey]: {
          label,
          status: 'error',
          value: error instanceof Error
            ? { message: error.message, name: error.name }
            : error,
        },
      }))
    }
  }

  const harmonyChord = () => createChordSymbol({
    alterations: harmonyAlteration === 'none' ? [] : [harmonyAlteration],
    extensions: harmonyExtension === 'none' ? [] : [harmonyExtension],
    quality: harmonyQuality,
    root: parsePitchClass(harmonyRoot),
  })

  const harmonyKey = () => ({
    mode: harmonyMode,
    tonic: parsePitchClass(harmonyKeyTonic),
  })

  const chordVoicing = () => createDefaultChordVoicing({
    bassNote: voicingBassEnabled ? parsePitchClass(voicingBass) : undefined,
    inversion: parseInteger(voicingInversion),
    octave: parseInteger(voicingOctave),
    register: voicingRegister,
    spread: parseInteger(voicingSpread),
    type: voicingType,
  })

  const chordPlayback = () => createDefaultChordPlayback({
    gate: parseNumber(playbackGate),
    microStaggerTicks: parseInteger(microStaggerTicks),
    recipeId,
    stepTicks: parseInteger(stepTicks),
    style: playbackStyle,
  })

  const chordEvent = () => createChordEvent({
    chord: harmonyChord(),
    durationTicks: parseInteger(eventDurationTicks),
    id: 'event_chord',
    playback: chordPlayback(),
    timeTick: parseInteger(eventTimeTick),
    velocity: parseInteger(eventVelocity),
    voicing: chordVoicing(),
  })

  const noteEvent = () => createNoteEvent({
    durationTicks: parseInteger(eventDurationTicks),
    id: 'event_note',
    pitch: parseInteger(eventMidiNote),
    timeTick: parseInteger(eventTimeTick),
    velocity: parseInteger(eventVelocity),
  })

  const drumHitEvent = () => createDrumHitEvent({
    id: 'event_drum',
    kitPiece: eventKitPiece,
    timeTick: parseInteger(eventTimeTick),
    velocity: parseInteger(eventVelocity),
  })

  const automationEvent = () => createAutomationEvent({
    id: 'event_automation',
    parameter: automationParameter,
    timeTick: parseInteger(eventTimeTick),
    value: parseAutomationValue(automationValue),
  })

  const patternEvent = (kind = patternKind): PatternEvent => {
    switch (kind) {
      case 'automation':
        return automationEvent()
      case 'chord':
        return chordEvent()
      case 'drum':
        return drumHitEvent()
      case 'note':
        return noteEvent()
    }
  }

  const pattern = (kind = patternKind) => createPattern({
    events: [patternEvent(kind)],
    id: patternId,
    kind,
    lengthTicks: parseInteger(patternLengthTicks),
    metadata: { source: 'debug' },
    name: patternName,
  })

  const track = () => createTrack({
    accepts: [trackAccepts],
    color: trackColor,
    id: trackId,
    name: trackName,
    role: trackRole,
    volume: parseNumber(trackVolume),
  })

  const section = () => createSection({
    id: sectionId,
    lengthTicks: parseInteger(sectionLengthTicks),
    name: sectionName,
    startTick: parseInteger(sectionStartTick),
  })

  const block = () => createBlock({
    color: blockColor,
    id: blockId,
    lengthTicks: parseInteger(blockLengthTicks),
    muted: blockMuted,
    name: blockName,
    patternId: blockPatternId,
    playbackMode: blockPlaybackMode,
    startTick: parseInteger(blockStartTick),
    trackId: blockTrackId,
  })

  const timeline = () => createTimeline({
    grid: timelineGrid,
    keyEvents: [createKeyEvent({ key: harmonyKey(), tick: 0 })],
    meterEvents: [createMeterEvent({
      tick: 0,
      timeSignature: {
        denominator: timelineDenominator,
        numerator: parseInteger(timelineNumerator),
      },
    })],
    tempoEvents: [createTempoEvent({ bpm: parseNumber(timelineBpm), tick: 0 })],
  })

  const command = () => createCommand({
    createdAt: commandCreatedAt,
    id: commandId,
    kind: commandKind,
    label: commandLabel,
    payload: {
      targetId: commandTargetId,
      tick: parseInteger(commandTick),
    },
  })

  const selection = () => ({
    selectedBlockIds: parseCsv(selectedBlockIds),
    selectedPatternEventIds: parseCsv(selectedEventIds),
    selectedSectionIds: parseCsv(selectedSectionIds),
    selectedTrackIds: parseCsv(selectedTrackIds),
  })

  const project = () => createProject({
    createdAt: projectCreatedAt,
    id: projectId,
    metadata: createProjectMetadata({
      description: projectDescription,
      tags: parseCsv(projectTags),
    }),
    name: projectName,
    updatedAt: projectCreatedAt,
    version: createProjectVersion({ revision: parseInteger(projectRevision) }),
  })

  const workspaceWithSampleContent = () => addWorkspacePattern(
    createWorkspace({
      createdAt: projectCreatedAt,
      id: projectId,
      metadata: createProjectMetadata({
        description: projectDescription,
        tags: parseCsv(projectTags),
      }),
      name: projectName,
      updatedAt: projectCreatedAt,
      version: createProjectVersion({ revision: parseInteger(projectRevision) }),
    }),
    pattern('chord'),
  )
  const voicedNotes = materializeChordVoicing(harmonyChord(), chordVoicing())

  return (
    <AppProvider>
      <AppLayout>
        <Stack gap="lg" py="lg">
          <Stack gap={4}>
            <Group justify="space-between" align="flex-start">
              <Box>
                <Title order={1}>Domain Playground</Title>
                <DebugNav />
                <Text c="dimmed" size="sm">
                  Pure domain factories, validators, and helpers.
                </Text>
              </Box>
              <Badge variant="light">/debug</Badge>
            </Group>
          </Stack>

          <DomainPanel id="musicPrimitives" title="Music Primitives" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Tick" value={primitiveTick} onChange={setPrimitiveTick} />
              <Field label="Duration ticks" value={primitiveDuration} onChange={setPrimitiveDuration} />
              <SelectField label="Pitch class" value={primitivePitchClass} data={PITCH_CLASS_OPTIONS} onChange={setPrimitivePitchClass} />
              <Field label="MIDI note" value={primitiveMidiNote} onChange={setPrimitiveMidiNote} />
              <Field label="Velocity" value={primitiveVelocity} onChange={setPrimitiveVelocity} />
              <Field label="Interval" value={primitiveInterval} onChange={setPrimitiveInterval} />
              <SelectField label="Note name" value={primitiveNoteName} data={NOTE_NAMES} onChange={setPrimitiveNoteName} />
              <Field label="Octave" value={primitiveOctave} onChange={setPrimitiveOctave} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createTick" onClick={() => run('musicPrimitives', 'createTick', () => createTick(parseInteger(primitiveTick)))} />
              <RunButton label="createDurationTicks" onClick={() => run('musicPrimitives', 'createDurationTicks', () => createDurationTicks(parseInteger(primitiveDuration)))} />
              <RunButton label="createPositiveDurationTicks" onClick={() => run('musicPrimitives', 'createPositiveDurationTicks', () => createPositiveDurationTicks(parseInteger(primitiveDuration)))} />
              <RunButton label="createPitchClass" onClick={() => run('musicPrimitives', 'createPitchClass', () => createPitchClass(parseInteger(primitivePitchClass)))} />
              <RunButton label="createMidiNote" onClick={() => run('musicPrimitives', 'createMidiNote', () => createMidiNote(parseInteger(primitiveMidiNote)))} />
              <RunButton label="createVelocity" onClick={() => run('musicPrimitives', 'createVelocity', () => createVelocity(parseInteger(primitiveVelocity)))} />
              <RunButton label="normalizePitchClass" onClick={() => run('musicPrimitives', 'normalizePitchClass', () => normalizePitchClass(parseInteger(primitivePitchClass)))} />
              <RunButton label="transposePitchClass" onClick={() => run('musicPrimitives', 'transposePitchClass', () => transposePitchClass(parsePitchClass(primitivePitchClass), parseInteger(primitiveInterval)))} />
              <RunButton label="getPitchClassForNoteName" onClick={() => run('musicPrimitives', 'getPitchClassForNoteName', () => getPitchClassForNoteName(primitiveNoteName))} />
              <RunButton label="getNoteNameForPitchClass" onClick={() => run('musicPrimitives', 'getNoteNameForPitchClass', () => getNoteNameForPitchClass(parsePitchClass(primitivePitchClass)))} />
              <RunButton label="pitchClassFromMidiNote" onClick={() => run('musicPrimitives', 'pitchClassFromMidiNote', () => pitchClassFromMidiNote(parseInteger(primitiveMidiNote)))} />
              <RunButton label="getOctaveForMidiNote" onClick={() => run('musicPrimitives', 'getOctaveForMidiNote', () => getOctaveForMidiNote(parseInteger(primitiveMidiNote)))} />
              <RunButton label="midiNoteFromPitchClass" onClick={() => run('musicPrimitives', 'midiNoteFromPitchClass', () => midiNoteFromPitchClass(parsePitchClass(primitivePitchClass), parseInteger(primitiveOctave)))} />
              <RunButton
                label="validators"
                onClick={() => run('musicPrimitives', 'validators', () => ({
                  isDurationTicks: isDurationTicks(parseInteger(primitiveDuration)),
                  isInteger: isInteger(parseNumber(primitiveTick)),
                  isMidiNote: isMidiNote(parseInteger(primitiveMidiNote)),
                  isNoteName: isNoteName(primitiveNoteName),
                  isPitchClass: isPitchClass(parseInteger(primitivePitchClass)),
                  isPositiveDurationTicks: isPositiveDurationTicks(parseInteger(primitiveDuration)),
                  isTick: isTick(parseInteger(primitiveTick)),
                  isVelocity: isVelocity(parseInteger(primitiveVelocity)),
                }))}
              />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="harmony" title="Harmony" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <SelectField label="Chord root" value={harmonyRoot} data={PITCH_CLASS_OPTIONS} onChange={setHarmonyRoot} />
              <SelectField label="Quality" value={harmonyQuality} data={CHORD_QUALITIES} onChange={setHarmonyQuality} />
              <SelectField label="Extension" value={harmonyExtension} data={CHORD_EXTENSION_OPTIONS} onChange={setHarmonyExtension} />
              <SelectField label="Alteration" value={harmonyAlteration} data={CHORD_ALTERATION_OPTIONS} onChange={setHarmonyAlteration} />
              <SelectField label="Key tonic" value={harmonyKeyTonic} data={PITCH_CLASS_OPTIONS} onChange={setHarmonyKeyTonic} />
              <SelectField label="Mode" value={harmonyMode} data={MODES} onChange={setHarmonyMode} />
              <Field label="Transpose interval" value={harmonyInterval} onChange={setHarmonyInterval} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createDefaultKey" onClick={() => run('harmony', 'createDefaultKey', createDefaultKey)} />
              <RunButton label="createChordSymbol" onClick={() => run('harmony', 'createChordSymbol', harmonyChord)} />
              <RunButton label="formatChordSymbol" onClick={() => run('harmony', 'formatChordSymbol', () => formatChordSymbol(harmonyChord()))} />
              <RunButton label="transposeChordSymbol" onClick={() => run('harmony', 'transposeChordSymbol', () => transposeChordSymbol(harmonyChord(), parseInteger(harmonyInterval)))} />
              <RunButton label="getChordPitchClasses" onClick={() => run('harmony', 'getChordPitchClasses', () => getChordPitchClasses(harmonyChord()))} />
              <RunButton label="getScalePitchClasses" onClick={() => run('harmony', 'getScalePitchClasses', () => getScalePitchClasses(harmonyKey()))} />
              <RunButton label="getRomanNumeral" onClick={() => run('harmony', 'getRomanNumeral', () => getRomanNumeral(harmonyChord(), harmonyKey()))} />
              <RunButton label="getNashvilleNumber" onClick={() => run('harmony', 'getNashvilleNumber', () => getNashvilleNumber(harmonyChord(), harmonyKey()))} />
              <RunButton
                label="guards"
                onClick={() => run('harmony', 'guards', () => ({
                  isChordQuality: isChordQuality(harmonyQuality),
                  isMode: isMode(harmonyMode),
                }))}
              />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="voicing" title="Voicing" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }}>
              <SelectField label="Type" value={voicingType} data={VOICING_TYPES} onChange={setVoicingType} />
              <Field label="Inversion" value={voicingInversion} onChange={setVoicingInversion} />
              <SelectField label="Register" value={voicingRegister} data={REGISTERS} onChange={setVoicingRegister} />
              <Field label="Spread" value={voicingSpread} onChange={setVoicingSpread} />
              <Field label="Octave" value={voicingOctave} onChange={setVoicingOctave} />
              <SelectField label="Bass note" value={voicingBass} data={PITCH_CLASS_OPTIONS} onChange={setVoicingBass} />
            </SimpleGrid>
            <Checkbox label="Add bass note" checked={voicingBassEnabled} onChange={event => setVoicingBassEnabled(event.currentTarget.checked)} />
            <VoicedNotePreview notes={voicedNotes} />
            <ButtonGroup>
              <RunButton label="createDefaultChordVoicing" onClick={() => run('voicing', 'createDefaultChordVoicing', chordVoicing)} />
              <RunButton label="materializeChordVoicing" onClick={() => run('voicing', 'materializeChordVoicing', () => materializeChordVoicing(harmonyChord(), chordVoicing()))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="playback" title="Playback" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Playhead tick" value={playheadTick} onChange={setPlayheadTick} />
              <Field label="Loop start" value={loopStartTick} onChange={setLoopStartTick} />
              <Field label="Loop end" value={loopEndTick} onChange={setLoopEndTick} />
              <SelectField label="Playback style" value={playbackStyle} data={CHORD_PLAYBACK_STYLES} onChange={setPlaybackStyle} />
              <SelectField label="Recipe" value={recipeId} data={CHORD_PLAYBACK_RECIPE_IDS} onChange={setRecipeId} />
              <Field label="Gate" value={playbackGate} onChange={setPlaybackGate} />
              <Field label="Step ticks" value={stepTicks} onChange={setStepTicks} />
              <Field label="Micro stagger ticks" value={microStaggerTicks} onChange={setMicroStaggerTicks} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createDefaultChordPlayback" onClick={() => run('playback', 'createDefaultChordPlayback', chordPlayback)} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="patternEvents" title="Pattern Events" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Event time tick" value={eventTimeTick} onChange={setEventTimeTick} />
              <Field label="Event duration" value={eventDurationTicks} onChange={setEventDurationTicks} />
              <Field label="Velocity" value={eventVelocity} onChange={setEventVelocity} />
              <Field label="MIDI pitch" value={eventMidiNote} onChange={setEventMidiNote} />
              <Field label="Kit piece" value={eventKitPiece} onChange={setEventKitPiece} />
              <Field label="Automation parameter" value={automationParameter} onChange={setAutomationParameter} />
              <Field label="Automation value" value={automationValue} onChange={setAutomationValue} />
              <Field label="Pattern length" value={patternLengthForEvent} onChange={setPatternLengthForEvent} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createChordEvent" onClick={() => run('patternEvents', 'createChordEvent', chordEvent)} />
              <RunButton label="createNoteEvent" onClick={() => run('patternEvents', 'createNoteEvent', noteEvent)} />
              <RunButton label="createDrumHitEvent" onClick={() => run('patternEvents', 'createDrumHitEvent', drumHitEvent)} />
              <RunButton label="createAutomationEvent" onClick={() => run('patternEvents', 'createAutomationEvent', automationEvent)} />
              <RunButton
                label="sortPatternEventsByTime"
                onClick={() => run('patternEvents', 'sortPatternEventsByTime', () => sortPatternEventsByTime([
                  createNoteEvent({ durationTicks: 120, id: 'event_late', pitch: 64, timeTick: parseInteger(eventTimeTick) + 240 }),
                  noteEvent(),
                  drumHitEvent(),
                ]))}
              />
              <RunButton label="getPatternEventEndTick" onClick={() => run('patternEvents', 'getPatternEventEndTick', () => getPatternEventEndTick(chordEvent()))} />
              <RunButton label="isPatternEventWithinLength" onClick={() => run('patternEvents', 'isPatternEventWithinLength', () => isPatternEventWithinLength(chordEvent(), parseInteger(patternLengthForEvent)))} />
              <RunButton label="isTimedPatternEvent" onClick={() => run('patternEvents', 'isTimedPatternEvent', () => isTimedPatternEvent(drumHitEvent()))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="patterns" title="Patterns" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Pattern id" value={patternId} onChange={setPatternId} />
              <Field label="Pattern name" value={patternName} onChange={setPatternName} />
              <SelectField label="Pattern kind" value={patternKind} data={PATTERN_KINDS} onChange={setPatternKind} />
              <Field label="Pattern length" value={patternLengthTicks} onChange={setPatternLengthTicks} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton
                label="createEmptyPattern"
                onClick={() => run('patterns', 'createEmptyPattern', () => createEmptyPattern({
                  id: patternId,
                  kind: patternKind,
                  lengthTicks: parseInteger(patternLengthTicks),
                  metadata: { source: 'debug' },
                  name: patternName,
                }))}
              />
              <RunButton label="createPattern" onClick={() => run('patterns', 'createPattern', () => pattern())} />
              <RunButton label="validatePattern" onClick={() => run('patterns', 'validatePattern', () => validatePattern(pattern()))} />
              <RunButton label="getPatternEventKind" onClick={() => run('patterns', 'getPatternEventKind', () => getPatternEventKind(patternKind))} />
              <RunButton label="eventMatchesPatternKind" onClick={() => run('patterns', 'eventMatchesPatternKind', () => eventMatchesPatternKind(patternEvent(), patternKind))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="tracks" title="Tracks" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Track id" value={trackId} onChange={setTrackId} />
              <Field label="Track name" value={trackName} onChange={setTrackName} />
              <SelectField label="Role" value={trackRole} data={TRACK_ROLES} onChange={setTrackRole} />
              <SelectField label="Accepts" value={trackAccepts} data={PATTERN_KINDS} onChange={setTrackAccepts} />
              <Field label="Volume" value={trackVolume} onChange={setTrackVolume} />
              <Field label="Color" value={trackColor} onChange={setTrackColor} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createTrack" onClick={() => run('tracks', 'createTrack', track)} />
              <RunButton label="createDefaultTracks" onClick={() => run('tracks', 'createDefaultTracks', createDefaultTracks)} />
              <RunButton label="canTrackAcceptPatternKind" onClick={() => run('tracks', 'canTrackAcceptPatternKind', () => canTrackAcceptPatternKind(track(), patternKind))} />
              <RunButton label="isTrackVolume" onClick={() => run('tracks', 'isTrackVolume', () => isTrackVolume(parseNumber(trackVolume)))} />
              <RunButton label="validateTrack" onClick={() => run('tracks', 'validateTrack', () => validateTrack(track()))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="arrangement" title="Arrangement" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Section id" value={sectionId} onChange={setSectionId} />
              <Field label="Section name" value={sectionName} onChange={setSectionName} />
              <Field label="Section start" value={sectionStartTick} onChange={setSectionStartTick} />
              <Field label="Section length" value={sectionLengthTicks} onChange={setSectionLengthTicks} />
              <Field label="Block id" value={blockId} onChange={setBlockId} />
              <Field label="Block track id" value={blockTrackId} onChange={setBlockTrackId} />
              <Field label="Block pattern id" value={blockPatternId} onChange={setBlockPatternId} />
              <Field label="Block start" value={blockStartTick} onChange={setBlockStartTick} />
              <Field label="Block length" value={blockLengthTicks} onChange={setBlockLengthTicks} />
              <Field label="Block color" value={blockColor} onChange={setBlockColor} />
              <Field label="Block name" value={blockName} onChange={setBlockName} />
              <SelectField label="Playback mode" value={blockPlaybackMode} data={BLOCK_PLAYBACK_MODES} onChange={setBlockPlaybackMode} />
              <Field label="Move tick" value={blockMoveTick} onChange={setBlockMoveTick} />
              <Field label="Resize ticks" value={blockResizeTicks} onChange={setBlockResizeTicks} />
            </SimpleGrid>
            <Checkbox label="Block muted" checked={blockMuted} onChange={event => setBlockMuted(event.currentTarget.checked)} />
            <ButtonGroup>
              <RunButton label="createSection" onClick={() => run('arrangement', 'createSection', section)} />
              <RunButton label="createBlock" onClick={() => run('arrangement', 'createBlock', block)} />
              <RunButton label="createDefaultArrangement" onClick={() => run('arrangement', 'createDefaultArrangement', createDefaultArrangement)} />
              <RunButton label="getBlockEndTick" onClick={() => run('arrangement', 'getBlockEndTick', () => getBlockEndTick(block()))} />
              <RunButton
                label="sortBlocksByStartTick"
                onClick={() => run('arrangement', 'sortBlocksByStartTick', () => sortBlocksByStartTick([
                  block(),
                  createBlock({
                    id: `${blockId}_later`,
                    lengthTicks: parseInteger(blockLengthTicks),
                    patternId: blockPatternId,
                    startTick: parseInteger(blockStartTick) + 960,
                    trackId: blockTrackId,
                  }),
                ]))}
              />
              <RunButton label="moveBlock" onClick={() => run('arrangement', 'moveBlock', () => moveBlock(block(), parseInteger(blockMoveTick)))} />
              <RunButton label="resizeBlock" onClick={() => run('arrangement', 'resizeBlock', () => resizeBlock(block(), parseInteger(blockResizeTicks)))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="timeline" title="Timeline" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="BPM" value={timelineBpm} onChange={setTimelineBpm} />
              <Field label="Tick" value={timelineTick} onChange={setTimelineTick} />
              <Field label="Numerator" value={timelineNumerator} onChange={setTimelineNumerator} />
              <SelectField label="Denominator" value={`${timelineDenominator}`} data={DENOMINATOR_SELECT_OPTIONS} onChange={value => setTimelineDenominator(parseInteger(value) as TimeSignatureDenominator)} />
              <SelectField label="Grid" value={timelineGrid} data={GRID_DIVISIONS} onChange={setTimelineGrid} />
              <Field label="Bar" value={barValue} onChange={setBarValue} />
              <Field label="Beat" value={beatValue} onChange={setBeatValue} />
              <Field label="Beat tick" value={beatTickValue} onChange={setBeatTickValue} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createDefaultTimeline" onClick={() => run('timeline', 'createDefaultTimeline', createDefaultTimeline)} />
              <RunButton label="createTimeline" onClick={() => run('timeline', 'createTimeline', timeline)} />
              <RunButton label="createTempoEvent" onClick={() => run('timeline', 'createTempoEvent', () => createTempoEvent({ bpm: parseNumber(timelineBpm), tick: parseInteger(timelineTick) }))} />
              <RunButton
                label="createMeterEvent"
                onClick={() => run('timeline', 'createMeterEvent', () => createMeterEvent({
                  tick: parseInteger(timelineTick),
                  timeSignature: {
                    denominator: timelineDenominator,
                    numerator: parseInteger(timelineNumerator),
                  },
                }))}
              />
              <RunButton label="getTempoAtTick" onClick={() => run('timeline', 'getTempoAtTick', () => getTempoAtTick(timeline(), parseInteger(timelineTick)))} />
              <RunButton label="getMeterAtTick" onClick={() => run('timeline', 'getMeterAtTick', () => getMeterAtTick(timeline(), parseInteger(timelineTick)))} />
              <RunButton label="getKeyAtTick" onClick={() => run('timeline', 'getKeyAtTick', () => getKeyAtTick(timeline(), parseInteger(timelineTick)))} />
              <RunButton
                label="getTicksPerBeat"
                onClick={() => run('timeline', 'getTicksPerBeat', () => getTicksPerBeat({
                  denominator: timelineDenominator,
                  numerator: parseInteger(timelineNumerator),
                }))}
              />
              <RunButton
                label="getBarLengthTicks"
                onClick={() => run('timeline', 'getBarLengthTicks', () => getBarLengthTicks({
                  denominator: timelineDenominator,
                  numerator: parseInteger(timelineNumerator),
                }))}
              />
              <RunButton label="getBarLengthTicksAtTick" onClick={() => run('timeline', 'getBarLengthTicksAtTick', () => getBarLengthTicksAtTick(timeline(), parseInteger(timelineTick)))} />
              <RunButton label="tickToBarBeat" onClick={() => run('timeline', 'tickToBarBeat', () => tickToBarBeat(timeline(), parseInteger(timelineTick)))} />
              <RunButton
                label="barBeatToTick"
                onClick={() => run('timeline', 'barBeatToTick', () => barBeatToTick(timeline(), {
                  bar: parseInteger(barValue),
                  beat: parseInteger(beatValue),
                  tick: parseInteger(beatTickValue),
                }))}
              />
              <RunButton label="getBarStartTick" onClick={() => run('timeline', 'getBarStartTick', () => getBarStartTick(timeline(), parseInteger(timelineTick)))} />
              <RunButton label="isBarBoundaryTick" onClick={() => run('timeline', 'isBarBoundaryTick', () => isBarBoundaryTick(timeline(), parseInteger(timelineTick)))} />
              <RunButton label="snapTickToGrid" onClick={() => run('timeline', 'snapTickToGrid', () => snapTickToGrid(timeline(), parseInteger(timelineTick), timelineGrid))} />
              <RunButton
                label="isValidTimeSignature"
                onClick={() => run('timeline', 'isValidTimeSignature', () => isValidTimeSignature({
                  denominator: timelineDenominator,
                  numerator: parseInteger(timelineNumerator),
                }))}
              />
              <RunButton label="validateTimeline" onClick={() => run('timeline', 'validateTimeline', () => validateTimeline(timeline()))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="editing" title="Editing" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Command id" value={commandId} onChange={setCommandId} />
              <SelectField label="Command kind" value={commandKind} data={COMMAND_KINDS} onChange={setCommandKind} />
              <Field label="Label" value={commandLabel} onChange={setCommandLabel} />
              <Field label="Target id" value={commandTargetId} onChange={setCommandTargetId} />
              <Field label="Tick" value={commandTick} onChange={setCommandTick} />
              <Field label="Created at" value={commandCreatedAt} onChange={setCommandCreatedAt} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createCommand" onClick={() => run('editing', 'createCommand', command)} />
              <RunButton label="createEmptyCommandHistory" onClick={() => run('editing', 'createEmptyCommandHistory', createEmptyCommandHistory)} />
              <RunButton label="pushCommand" onClick={() => run('editing', 'pushCommand', () => pushCommand(createEmptyCommandHistory(), command()))} />
              <RunButton label="undoCommand" onClick={() => run('editing', 'undoCommand', () => undoCommand(pushCommand(createEmptyCommandHistory(), command())))} />
              <RunButton
                label="redoCommand"
                onClick={() => run('editing', 'redoCommand', () => {
                  const undone = undoCommand(pushCommand(createEmptyCommandHistory(), command()))

                  return redoCommand(undone.history)
                })}
              />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="editor" title="Editor Store" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <SelectField label="Active tool" value={activeTool} data={ACTIVE_TOOLS} onChange={setActiveTool} />
              <SelectField label="Inspector panel" value={inspectorPanel} data={INSPECTOR_PANELS} onChange={setInspectorPanel} />
              <Field label="Selected blocks" value={selectedBlockIds} onChange={setSelectedBlockIds} />
              <Field label="Selected events" value={selectedEventIds} onChange={setSelectedEventIds} />
              <Field label="Selected tracks" value={selectedTrackIds} onChange={setSelectedTrackIds} />
              <Field label="Selected sections" value={selectedSectionIds} onChange={setSelectedSectionIds} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton label="createSelectionState" onClick={() => run('editor', 'createSelectionState', createSelectionState)} />
              <RunButton label="createClipboardState" onClick={() => run('editor', 'createClipboardState', createClipboardState)} />
              <RunButton label="createInspectorState" onClick={() => run('editor', 'createInspectorState', createInspectorState)} />
              <RunButton
                label="createEditorState"
                onClick={() => run('editor', 'createEditorState', () => createEditorState({
                  activeTool,
                  clipboard: {
                    blockIds: parseCsv(selectedBlockIds),
                    patternEventIds: parseCsv(selectedEventIds),
                  },
                  inspector: {
                    open: true,
                    panel: inspectorPanel,
                  },
                  selection: selection(),
                }))}
              />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="project" title="Project" outputs={outputs}>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Field label="Project id" value={projectId} onChange={setProjectId} />
              <Field label="Name" value={projectName} onChange={setProjectName} />
              <Field label="Description" value={projectDescription} onChange={setProjectDescription} />
              <Field label="Tags" value={projectTags} onChange={setProjectTags} />
              <Field label="Revision" value={projectRevision} onChange={setProjectRevision} />
              <Field label="Created at" value={projectCreatedAt} onChange={setProjectCreatedAt} />
            </SimpleGrid>
            <ButtonGroup>
              <RunButton
                label="createProjectMetadata"
                onClick={() => run('project', 'createProjectMetadata', () => createProjectMetadata({
                  description: projectDescription,
                  tags: parseCsv(projectTags),
                }))}
              />
              <RunButton label="createProjectVersion" onClick={() => run('project', 'createProjectVersion', () => createProjectVersion({ revision: parseInteger(projectRevision) }))} />
              <RunButton label="createProject" onClick={() => run('project', 'createProject', project)} />
              <RunButton label="touchProject" onClick={() => run('project', 'touchProject', () => touchProject(project()))} />
              <RunButton
                label="updateProjectMetadata"
                onClick={() => run('project', 'updateProjectMetadata', () => updateProjectMetadata(project(), createProjectMetadata({
                  description: projectDescription,
                  tags: parseCsv(projectTags),
                })))}
              />
              <RunButton label="validateProject" onClick={() => run('project', 'validateProject', () => validateProject(project()))} />
            </ButtonGroup>
          </DomainPanel>

          <DomainPanel id="workspace" title="Workspace" outputs={outputs}>
            <ButtonGroup>
              <RunButton label="createWorkspace" onClick={() => run('workspace', 'createWorkspace', workspaceWithSampleContent)} />
              <RunButton label="validateWorkspace" onClick={() => run('workspace', 'validateWorkspace', () => validateWorkspace(workspaceWithSampleContent()))} />
              <RunButton label="selectTrack" onClick={() => run('workspace', 'selectTrack', () => selectTrack(workspaceWithSampleContent(), 'track_chords'))} />
              <RunButton label="selectPattern" onClick={() => run('workspace', 'selectPattern', () => selectPattern(workspaceWithSampleContent(), patternId))} />
            </ButtonGroup>
          </DomainPanel>
        </Stack>
      </AppLayout>
    </AppProvider>
  )
}

function DomainPanel({
  children,
  id,
  outputs,
  title,
}: {
  children: React.ReactNode
  id: string
  outputs: Record<string, PlaygroundOutput>
  title: string
}) {
  const domainOutputs = Object.entries(outputs)
    .filter(([key]) => key.startsWith(`${id}.`))
    .map(([key, output]) => ({ key, ...output }))

  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2} size="h3">{title}</Title>
          <Badge color={domainOutputs.some(output => output.status === 'error') ? 'red' : 'gray'} variant="light">
            {domainOutputs.length}
            {' '}
            outputs
          </Badge>
        </Group>
        {children}
        {domainOutputs.length > 0 && (
          <>
            <Divider />
            <SimpleGrid cols={{ base: 1, md: 2 }}>
              {domainOutputs.map(output => (
                <OutputBlock key={output.key} output={output} />
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Paper>
  )
}

function Field({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <TextInput
      label={label}
      value={value}
      onChange={event => onChange(event.currentTarget.value)}
    />
  )
}

function SelectField<TValue extends string>({
  data,
  label,
  onChange,
  value,
}: {
  data: Array<{ label: string, value: string }> | readonly TValue[]
  label: string
  onChange: (value: TValue) => void
  value: TValue
}) {
  return (
    <Select
      allowDeselect={false}
      data={data}
      label={label}
      value={value}
      onChange={nextValue => onChange((nextValue ?? value) as TValue)}
    />
  )
}

function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <Group gap="xs">
      {children}
    </Group>
  )
}

function RunButton({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <Button size="xs" variant="light" onClick={onClick}>
      {label}
    </Button>
  )
}

function VoicedNotePreview({ notes }: { notes: VoicedNote[] }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 4, md: 6 }}>
      {notes.map(note => (
        <Box
          key={`${note.voiceIndex}-${note.midiNote}`}
          p="xs"
          style={{
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 4,
          }}
        >
          <Text fw={700} size="sm">{formatVoicedNoteLabel(note)}</Text>
          <Text c="dimmed" size="xs">
            voice
            {' '}
            {note.voiceIndex}
          </Text>
          <Text c="dimmed" size="xs">
            midi
            {' '}
            {note.midiNote}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  )
}

function OutputBlock({ output }: { output: PlaygroundOutput }) {
  return (
    <Box>
      <Group gap="xs" mb={4}>
        <Badge color={output.status === 'ok' ? 'green' : 'red'} variant="light">
          {output.status}
        </Badge>
        <Text fw={600} size="sm">{output.label}</Text>
      </Group>
      <Box
        component="pre"
        m={0}
        p="sm"
        style={{
          background: 'var(--mantine-color-gray-0)',
          border: '1px solid var(--mantine-color-gray-3)',
          borderRadius: 4,
          fontSize: 12,
          maxHeight: 320,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
        }}
      >
        {formatOutput(output.value)}
      </Box>
    </Box>
  )
}

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10)

  return Number.isFinite(parsed) ? parsed : 0
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : 0
}

function parsePitchClass(value: string): PitchClass {
  return parseInteger(value) as PitchClass
}

function parseCsv(value: string): string[] {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function parseAutomationValue(value: string): boolean | number | string {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  const parsed = Number.parseFloat(value)

  return Number.isFinite(parsed) ? parsed : value
}

function formatVoicedNoteLabel(note: VoicedNote): string {
  return `${getNoteNameForPitchClass(note.pitchClass)}${note.octave}`
}

function formatOutput(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  const json = JSON.stringify(value, null, 2)

  return json ?? String(value)
}
