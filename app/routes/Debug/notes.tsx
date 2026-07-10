import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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

import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'
import {
  BLOCK_PLAYBACK_MODES,
  type BlockPlaybackMode,
  CHORD_ALTERATIONS,
  CHORD_EXTENSIONS,
  CHORD_PLAYBACK_RECIPE_IDS,
  CHORD_PLAYBACK_RECIPES,
  CHORD_PLAYBACK_STYLES,
  CHORD_QUALITIES,
  type ChordAlteration,
  type ChordExtension,
  type ChordPlaybackRecipeId,
  type ChordPlaybackStyle,
  type ChordQuality,
  createBlock,
  createChordEvent,
  createChordSymbol,
  createKeyEvent,
  createMeterEvent,
  createPattern,
  createPitchClass,
  createSection,
  createTempoEvent,
  createTimeline,
  createTrack,
  createVelocity,
  formatChordSymbol,
  getChordPitchClasses,
  getDefaultRecipeIdForStyle,
  getNashvilleNumber,
  getNoteNameForPitchClass,
  getOctaveForMidiNote,
  getRomanNumeral,
  getScalePitchClasses,
  type MidiNote,
  type Mode,
  MODES,
  normalizePitchClass,
  type Pattern,
  PATTERN_KINDS,
  type PatternEvent,
  PITCH_CLASSES,
  pitchClassFromMidiNote,
  type Register,
  REGISTERS,
  type Tick,
  type VoiceIndex,
  VOICING_TYPES,
  type VoicingType,
} from '~/domain'
import { createBlankWorkspace, type Workspace } from '~/store/workspace'
import {
  clampInteger,
  clampNumber,
  parseInteger,
  parseNumber,
} from '~/utils/number'
import {
  buildSchedule,
  type NotePlaybackTrigger,
  type PlaybackTrigger,
  type ScheduledPlaybackEvent,
} from '~/utils/schedule'
import {
  Transport,
  type TransportSnapshot,
  type TransportStatus,
} from '~/utils/transport'

const LOOP_WIDTH = 850
const LOOP_HEIGHT = 460
const LOOP_LANE_LEFT = 36
const LOOP_LANE_TOP = 148
const LOOP_LANE_WIDTH = 775
const LOOP_LANE_HEIGHT = 237
const EVENT_WINDOW_TOP = 62
const EVENT_WINDOW_HEIGHT = 145
const NOTE_LANE_TOP = 94
const NOTE_LANE_HEIGHT = 100

const MIN_PATTERN_LENGTH_TICKS = 120
const MAX_PATTERN_LENGTH_TICKS = 7680
const MIN_EVENT_DURATION_TICKS = 60

const PITCH_CLASS_OPTIONS = PITCH_CLASSES.map(pitchClass => ({
  label: `${pitchClass} - ${getNoteNameForPitchClass(pitchClass)}`,
  value: `${pitchClass}`,
}))

const CHORD_EXTENSION_OPTIONS = ['none', ...CHORD_EXTENSIONS] as const satisfies ReadonlyArray<ChordExtension | 'none'>
const CHORD_ALTERATION_OPTIONS = ['none', ...CHORD_ALTERATIONS] as const satisfies ReadonlyArray<ChordAlteration | 'none'>

const CHORD_PLAYBACK_RECIPE_OPTIONS = CHORD_PLAYBACK_RECIPE_IDS.map(recipeId => ({
  label: CHORD_PLAYBACK_RECIPES[recipeId].name,
  value: recipeId,
}))

type NotesModel = {
  chordLabel: string
  chordPitchLabels: string[]
  event: PatternEvent
  loopLengthTicks: number
  pattern: Pattern
  playbackTriggers: PlaybackTrigger[]
  renderedNotes: RenderedScheduledNote[]
  scalePitchLabels: string[]
  scheduledEvents: ScheduledPlaybackEvent[]
  tonalLabels: string[]
  voicingPitchLabels: string[]
  workspace: Workspace
}

type RenderedScheduledNote = {
  durationTicks: number
  eventId: string
  id: string
  pitch: MidiNote
  startTick: Tick
  stepIndex: number
  velocity: number
  voiceIndex?: VoiceIndex
}

type NotesPreset = {
  id: string
  label: string
  blockLengthTicks: string
  blockPlaybackMode: BlockPlaybackMode
  eventDurationTicks: string
  eventTimeTick: string
  eventVelocity: string
  harmonyAlteration: ChordAlteration | 'none'
  harmonyBass: string
  harmonyBassEnabled: boolean
  harmonyExtension: ChordExtension | 'none'
  harmonyQuality: ChordQuality
  harmonyRoot: string
  keyMode: Mode
  keyTonic: string
  patternLengthTicks: string
  playbackGate: string
  playbackStyle: ChordPlaybackStyle
  recipeId: ChordPlaybackRecipeId
  toneStepTicks: string
  voicingBass: string
  voicingBassEnabled: boolean
  voicingInversion: string
  voicingOctave: string
  voicingRegister: Register
  voicingSpread: string
  voicingType: VoicingType
}

type NotesPresetInput = Pick<NotesPreset, 'id' | 'label'> & Partial<Omit<NotesPreset, 'id' | 'label'>>

const DEFAULT_NOTES_PRESET: Omit<NotesPreset, 'id' | 'label'> = {
  blockLengthTicks: '960',
  blockPlaybackMode: 'oneShot',
  eventDurationTicks: '240',
  eventTimeTick: '0',
  eventVelocity: '96',
  harmonyAlteration: 'none',
  harmonyBass: '7',
  harmonyBassEnabled: false,
  harmonyExtension: '7',
  harmonyQuality: 'minor',
  harmonyRoot: '0',
  keyMode: 'minor',
  keyTonic: '0',
  patternLengthTicks: '480',
  playbackGate: '0.85',
  playbackStyle: 'arpeggio',
  recipeId: 'arp_up',
  toneStepTicks: '240',
  voicingBass: '0',
  voicingBassEnabled: true,
  voicingInversion: '0',
  voicingOctave: '4',
  voicingRegister: 'mid',
  voicingSpread: '1',
  voicingType: 'close',
}

const NOTES_PRESETS = [
  createNotesPreset({ id: 'two_pattern_passes', label: '2 Pattern Passes', blockLengthTicks: '960', eventDurationTicks: '480', patternLengthTicks: '480', toneStepTicks: '60' }),
  createNotesPreset({ id: 'one_shot_arp', label: 'One Shot Arp', blockLengthTicks: '960', blockPlaybackMode: 'oneShot', eventDurationTicks: '480', patternLengthTicks: '480', toneStepTicks: '60' }),
  createNotesPreset({ id: 'stretch_arp', label: 'Stretch Arp', blockLengthTicks: '960', blockPlaybackMode: 'stretch', eventDurationTicks: '480', patternLengthTicks: '480', toneStepTicks: '60' }),
  createNotesPreset({ id: 'minor_7_arp', label: 'Minor 7 Arp' }),
  createNotesPreset({ id: 'major_9_open', label: 'Major 9 Open', harmonyExtension: '9', harmonyQuality: 'major', harmonyRoot: '5', keyMode: 'major', keyTonic: '5', voicingType: 'open' }),
  createNotesPreset({ id: 'dominant_13', label: 'Dominant 13', harmonyExtension: '13', harmonyQuality: 'major', harmonyRoot: '7', keyMode: 'mixolydian', keyTonic: '0', voicingInversion: '1' }),
  createNotesPreset({ id: 'lydian_maj7', label: 'Lydian Maj7', harmonyExtension: 'maj7', harmonyQuality: 'major', harmonyRoot: '2', keyMode: 'lydian', keyTonic: '2', voicingType: 'spread' }),
  createNotesPreset({ id: 'dorian_min9', label: 'Dorian Min9', harmonyExtension: '9', harmonyQuality: 'minor', harmonyRoot: '9', keyMode: 'dorian', keyTonic: '9', voicingType: 'open' }),
  createNotesPreset({ id: 'phrygian_susb9', label: 'Phrygian Sus b9', harmonyAlteration: 'b9', harmonyExtension: '7', harmonyQuality: 'sus4', harmonyRoot: '4', keyMode: 'phrygian', keyTonic: '4' }),
  createNotesPreset({ id: 'drop2_major', label: 'Drop2 Major', harmonyExtension: 'maj7', harmonyQuality: 'major', harmonyRoot: '0', keyMode: 'major', keyTonic: '0', voicingType: 'drop2' }),
  createNotesPreset({ id: 'spread_minor_11', label: 'Spread Min11', harmonyExtension: '11', harmonyQuality: 'minor', harmonyRoot: '10', keyMode: 'minor', keyTonic: '10', voicingSpread: '2', voicingType: 'spread' }),
  createNotesPreset({ id: 'augmented_bright', label: 'Aug Bright', harmonyExtension: 'maj7', harmonyQuality: 'augmented', harmonyRoot: '1', keyMode: 'lydian', keyTonic: '1', voicingOctave: '5' }),
  createNotesPreset({ id: 'diminished_tension', label: 'Dim Tension', harmonyExtension: '7', harmonyQuality: 'diminished', harmonyRoot: '11', keyMode: 'locrian', keyTonic: '11', voicingRegister: 'low' }),
  createNotesPreset({ id: 'sus4_dominant', label: 'Sus4 Dominant', harmonyExtension: '7', harmonyQuality: 'sus4', harmonyRoot: '7', keyMode: 'mixolydian', keyTonic: '7' }),
  createNotesPreset({ id: 'low_slash_fifth', label: 'Low Slash Fifth', harmonyBass: '7', harmonyBassEnabled: true, harmonyQuality: 'minor', harmonyRoot: '0', voicingBass: '7', voicingRegister: 'low' }),
  createNotesPreset({ id: 'high_cluster', label: 'High Cluster', harmonyExtension: '9', harmonyQuality: 'sus2', harmonyRoot: '2', keyMode: 'major', keyTonic: '2', voicingOctave: '5', voicingRegister: 'high' }),
  createNotesPreset({ id: 'first_inversion_pad', label: 'First Inversion', harmonyExtension: 'maj7', harmonyQuality: 'major', harmonyRoot: '9', keyMode: 'major', keyTonic: '9', patternLengthTicks: '3840', voicingInversion: '1', voicingType: 'open' }),
  createNotesPreset({ id: 'second_inversion_pad', label: 'Second Inversion', harmonyExtension: '7', harmonyQuality: 'minor', harmonyRoot: '5', keyMode: 'minor', keyTonic: '5', patternLengthTicks: '3840', voicingInversion: '2', voicingType: 'spread' }),
  createNotesPreset({ id: 'short_stab', label: 'Short Stab', eventDurationTicks: '240', eventVelocity: '118', harmonyQuality: 'major', playbackGate: '0.4', playbackStyle: 'block', toneStepTicks: '120' }),
  createNotesPreset({ id: 'long_pad', label: 'Long Pad', blockLengthTicks: '3840', eventDurationTicks: '3840', harmonyExtension: '9', harmonyQuality: 'minor', patternLengthTicks: '3840', playbackGate: '1', playbackStyle: 'block', toneStepTicks: '960', voicingType: 'open' }),
  createNotesPreset({ id: 'open_sus2', label: 'Open Sus2', harmonyExtension: '6', harmonyQuality: 'sus2', harmonyRoot: '3', keyMode: 'major', keyTonic: '3', voicingType: 'open' }),
  createNotesPreset({ id: 'locrian_dim', label: 'Locrian Dim', harmonyAlteration: 'b5', harmonyExtension: '7', harmonyQuality: 'diminished', harmonyRoot: '6', keyMode: 'locrian', keyTonic: '6', voicingBass: '6' }),
  createNotesPreset({ id: 'minor_13', label: 'Minor 13', harmonyExtension: '13', harmonyQuality: 'minor', harmonyRoot: '8', keyMode: 'dorian', keyTonic: '8', voicingSpread: '2', voicingType: 'spread' }),
  createNotesPreset({ id: 'major_6', label: 'Major 6', harmonyExtension: '6', harmonyQuality: 'major', harmonyRoot: '0', keyMode: 'major', keyTonic: '0', voicingBassEnabled: false }),
  createNotesPreset({ id: 'altered_sharp9', label: 'Altered #9', harmonyAlteration: '#9', harmonyExtension: '7', harmonyQuality: 'major', harmonyRoot: '1', keyMode: 'phrygian', keyTonic: '1', voicingType: 'drop2' }),
  createNotesPreset({ id: 'flat5_dominant', label: 'Flat5 Dominant', harmonyAlteration: 'b5', harmonyExtension: '7', harmonyQuality: 'major', harmonyRoot: '6', keyMode: 'mixolydian', keyTonic: '6' }),
  createNotesPreset({ id: 'high_arpeggio', label: 'High Arpeggio', harmonyExtension: 'maj7', harmonyQuality: 'major', harmonyRoot: '4', keyMode: 'lydian', keyTonic: '4', voicingOctave: '5', voicingRegister: 'high' }),
  createNotesPreset({ id: 'low_spread', label: 'Low Spread', harmonyExtension: '11', harmonyQuality: 'minor', harmonyRoot: '2', keyMode: 'minor', keyTonic: '2', voicingRegister: 'low', voicingSpread: '3', voicingType: 'spread' }),
] as const satisfies readonly NotesPreset[]

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Notes' },
  ]
}

export default function Notes() {
  const [harmonyRoot, setHarmonyRoot] = useState('0')
  const [harmonyQuality, setHarmonyQuality] = useState<ChordQuality>('major')
  const [harmonyExtension, setHarmonyExtension] = useState<ChordExtension | 'none'>('none')
  const [harmonyAlteration, setHarmonyAlteration] = useState<ChordAlteration | 'none'>('none')
  const [harmonyBassEnabled, setHarmonyBassEnabled] = useState(false)
  const [harmonyBass, setHarmonyBass] = useState('7')
  const [keyTonic, setKeyTonic] = useState('0')
  const [keyMode, setKeyMode] = useState<Mode>('minor')

  const [voicingType, setVoicingType] = useState<VoicingType>('close')
  const [voicingInversion, setVoicingInversion] = useState('0')
  const [voicingRegister, setVoicingRegister] = useState<Register>('mid')
  const [voicingSpread, setVoicingSpread] = useState('0')
  const [voicingOctave, setVoicingOctave] = useState('4')
  const [voicingBassEnabled, setVoicingBassEnabled] = useState(false)
  const [voicingBass, setVoicingBass] = useState('0')

  const [blockLengthTicks, setBlockLengthTicks] = useState('960')
  const [blockPlaybackMode, setBlockPlaybackMode] = useState<BlockPlaybackMode>('oneShot')
  const [patternLengthTicks, setPatternLengthTicks] = useState('720')
  const [eventTimeTick, setEventTimeTick] = useState('0')
  const [eventDurationTicks, setEventDurationTicks] = useState('480')
  const [eventVelocity, setEventVelocity] = useState('96')
  const [playbackStyle, setPlaybackStyle] = useState<ChordPlaybackStyle>('arpeggio')
  const [playbackGate, setPlaybackGate] = useState('0.95')
  const [toneStepTicks, setToneStepTicks] = useState('120')
  const [recipeId, setRecipeId] = useState<ChordPlaybackRecipeId>('arp_up')

  function applyPreset(preset: NotesPreset) {
    setHarmonyRoot(preset.harmonyRoot)
    setHarmonyQuality(preset.harmonyQuality)
    setHarmonyExtension(preset.harmonyExtension)
    setHarmonyAlteration(preset.harmonyAlteration)
    setHarmonyBassEnabled(preset.harmonyBassEnabled)
    setHarmonyBass(preset.harmonyBass)
    setKeyTonic(preset.keyTonic)
    setKeyMode(preset.keyMode)
    setVoicingType(preset.voicingType)
    setVoicingInversion(preset.voicingInversion)
    setVoicingRegister(preset.voicingRegister)
    setVoicingSpread(preset.voicingSpread)
    setVoicingOctave(preset.voicingOctave)
    setVoicingBassEnabled(preset.voicingBassEnabled)
    setVoicingBass(preset.voicingBass)
    setBlockLengthTicks(preset.blockLengthTicks)
    setBlockPlaybackMode(preset.blockPlaybackMode)
    setPatternLengthTicks(preset.patternLengthTicks)
    setEventTimeTick(preset.eventTimeTick)
    setEventDurationTicks(preset.eventDurationTicks)
    setEventVelocity(preset.eventVelocity)
    setPlaybackStyle(preset.playbackStyle)
    setPlaybackGate(preset.playbackGate)
    setToneStepTicks(preset.toneStepTicks)
    setRecipeId(preset.recipeId)
  }

  const notesModel = useMemo(() => createNotesModel({
    blockLengthTicks,
    blockPlaybackMode,
    eventDurationTicks,
    eventTimeTick,
    eventVelocity,
    harmonyAlteration,
    harmonyBass,
    harmonyBassEnabled,
    harmonyExtension,
    harmonyQuality,
    harmonyRoot,
    keyMode,
    keyTonic,
    patternLengthTicks,
    playbackGate,
    playbackStyle,
    recipeId,
    toneStepTicks,
    voicingBass,
    voicingBassEnabled,
    voicingInversion,
    voicingOctave,
    voicingRegister,
    voicingSpread,
    voicingType,
  }), [
    blockLengthTicks,
    blockPlaybackMode,
    eventDurationTicks,
    eventTimeTick,
    eventVelocity,
    harmonyAlteration,
    harmonyBass,
    harmonyBassEnabled,
    harmonyExtension,
    harmonyQuality,
    harmonyRoot,
    keyMode,
    keyTonic,
    patternLengthTicks,
    playbackGate,
    playbackStyle,
    recipeId,
    toneStepTicks,
    voicingBass,
    voicingBassEnabled,
    voicingInversion,
    voicingOctave,
    voicingRegister,
    voicingSpread,
    voicingType,
  ])

  return (
    <AppProvider>
      <AppLayout>
        <Stack gap="lg" py="lg">
          <Group justify="space-between" align="flex-end">
            <Stack gap={2}>
              <Title order={1}>Notes</Title>
              <Group gap="xs">
                <Badge variant="light">Harmony</Badge>
                <Badge variant="light">Voicing</Badge>
                <Badge variant="light">Patterns</Badge>
                <Badge variant="light">PatternEvents</Badge>
              </Group>
            </Stack>
            <Badge color="blue" variant="light">
              {notesModel.chordLabel}
            </Badge>
          </Group>

          <PresetBank presets={NOTES_PRESETS} onSelect={applyPreset} />

          <NotesLooper model={notesModel} />
          <PatternNotesPanel notes={notesModel.renderedNotes} />

          <SimpleGrid cols={{ base: 1, md: 4 }}>
            <Paper withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Title order={2} size="h3">Harmony</Title>
                <SelectField label="Root" value={harmonyRoot} data={PITCH_CLASS_OPTIONS} onChange={setHarmonyRoot} />
                <SelectField label="Quality" value={harmonyQuality} data={CHORD_QUALITIES} onChange={setHarmonyQuality} />
                <SelectField label="Extension" value={harmonyExtension} data={CHORD_EXTENSION_OPTIONS} onChange={setHarmonyExtension} />
                <SelectField label="Alteration" value={harmonyAlteration} data={CHORD_ALTERATION_OPTIONS} onChange={setHarmonyAlteration} />
                <Checkbox label="Slash bass" checked={harmonyBassEnabled} onChange={event => setHarmonyBassEnabled(event.currentTarget.checked)} />
                <SelectField label="Bass" value={harmonyBass} data={PITCH_CLASS_OPTIONS} onChange={setHarmonyBass} />
                <Divider />
                <SelectField label="Key tonic" value={keyTonic} data={PITCH_CLASS_OPTIONS} onChange={setKeyTonic} />
                <SelectField label="Key mode" value={keyMode} data={MODES} onChange={setKeyMode} />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Title order={2} size="h3">Voicing</Title>
                <SelectField label="Type" value={voicingType} data={VOICING_TYPES} onChange={setVoicingType} />
                <SelectField label="Register" value={voicingRegister} data={REGISTERS} onChange={setVoicingRegister} />
                <TextField label="Inversion" value={voicingInversion} onChange={setVoicingInversion} />
                <TextField label="Spread" value={voicingSpread} onChange={setVoicingSpread} />
                <TextField label="Octave" value={voicingOctave} onChange={setVoicingOctave} />
                <Checkbox label="Bass note" checked={voicingBassEnabled} onChange={event => setVoicingBassEnabled(event.currentTarget.checked)} />
                <SelectField label="Bass pitch" value={voicingBass} data={PITCH_CLASS_OPTIONS} onChange={setVoicingBass} />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Title order={2} size="h3">Block</Title>
                <TextField label="Block length ticks" value={blockLengthTicks} onChange={setBlockLengthTicks} />
                <SelectField label="Playback mode" value={blockPlaybackMode} data={BLOCK_PLAYBACK_MODES} onChange={setBlockPlaybackMode} />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Group justify="space-between">
                  <Title order={2} size="h3">Patterns</Title>
                  <Badge variant="light">{PATTERN_KINDS[0]}</Badge>
                </Group>
                <TextField label="Pattern length ticks" value={patternLengthTicks} onChange={setPatternLengthTicks} />
                <TextField label="Event time tick" value={eventTimeTick} onChange={setEventTimeTick} />
                <TextField label="Event duration ticks" value={eventDurationTicks} onChange={setEventDurationTicks} />
                <TextField label="Velocity" value={eventVelocity} onChange={setEventVelocity} />
                <SelectField label="Playback style" value={playbackStyle} data={CHORD_PLAYBACK_STYLES} onChange={setPlaybackStyle} />
                <SelectField label="Recipe" value={recipeId} data={CHORD_PLAYBACK_RECIPE_OPTIONS} onChange={setRecipeId} />
                <TextField label="Gate" value={playbackGate} onChange={setPlaybackGate} />
                <TextField label="Step ticks" value={toneStepTicks} onChange={setToneStepTicks} />
              </Stack>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <JsonPanel title="Event" value={notesModel.event} />
            <JsonPanel
              title="Schedule"
              value={{
                events: notesModel.scheduledEvents,
                triggers: notesModel.playbackTriggers,
              }}
            />
            <JsonPanel title="Pattern" value={notesModel.pattern} />
          </SimpleGrid>
        </Stack>
      </AppLayout>
    </AppProvider>
  )
}

function NotesLooper({ model }: { model: NotesModel }) {
  const transportRef = useRef<Transport | null>(null)

  if (transportRef.current === null) {
    transportRef.current = new Transport(model.workspace)
  }

  const transport = transportRef.current
  const playheadRef = useRef<HTMLDivElement>(null)
  const [transportSnapshot, setTransportSnapshot] = useState<TransportSnapshot>(() => transport.getSnapshot())
  const noteRows = getNoteRows(model.renderedNotes)
  const noteRowIndexByKey = getNoteRowIndexByKey(noteRows)
  const noteBarHeight = getNoteBarHeight(noteRows.length)
  const playheadX = getLoopX(transportSnapshot.playheadTick, model.loopLengthTicks)

  useEffect(() => {
    transport.setWorkspace(model.workspace)
    transport.setLoop({
      endTick: model.loopLengthTicks,
      startTick: 0,
    }, true)
  }, [model.loopLengthTicks, model.workspace, transport])

  useEffect(() => {
    return transport.subscribe((snapshot) => {
      setTransportSnapshot(snapshot)
    })
  }, [transport])

  useEffect(() => {
    let frameId = 0

    function updatePlayheadTransform() {
      const currentTick = transport.getPlayheadTick()

      if (playheadRef.current !== null && Number.isFinite(currentTick)) {
        playheadRef.current.style.transform = `translateX(${getLoopX(currentTick, model.loopLengthTicks)}px)`
      }

      frameId = requestAnimationFrame(updatePlayheadTransform)
    }

    frameId = requestAnimationFrame(updatePlayheadTransform)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [model.loopLengthTicks, transport])

  useEffect(() => {
    return () => {
      transport.destroy()
    }
  }, [transport])

  function handlePlay() {
    void transport.play()
  }

  function handlePause() {
    transport.pause()
  }

  function handleStop() {
    transport.stop()
  }

  function setTransportStatus(status: TransportStatus) {
    if (status === 'playing') {
      handlePlay()
      return
    }

    if (status === 'paused') {
      handlePause()
      return
    }

    handleStop()
  }

  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2} size="h3">Looper</Title>
          <Group gap="xs">
            <Badge color={getTransportColor(transportSnapshot.status)} variant="light">
              {transportSnapshot.status}
            </Badge>
            <Badge color="blue" variant="light">looping</Badge>
            <Badge variant="light">
              {transportSnapshot.scheduledEventCount}
              {' '}
              event
            </Badge>
            <Badge variant="light">
              {model.loopLengthTicks}
              {' '}
              ticks
            </Badge>
          </Group>
        </Group>

        <Group gap="xs">
          <Button onClick={handlePlay} disabled={transportSnapshot.status === 'playing'}>Play</Button>
          <Button variant="light" onClick={handlePause} disabled={transportSnapshot.status !== 'playing'}>Pause</Button>
          <Button variant="light" color="red" onClick={handleStop}>Stop</Button>
          <SelectField label="Status" value={transportSnapshot.status} data={['stopped', 'playing', 'paused']} onChange={setTransportStatus} />
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Box
            style={{
              background: '#f7f7f4',
              border: '1px solid #d9d7ce',
              borderRadius: 8,
              height: LOOP_HEIGHT,
              overflow: 'hidden',
              position: 'relative',
              width: LOOP_WIDTH,
            }}
          >
            <Group gap="xs" style={{ left: 24, position: 'absolute', top: 18 }}>
              <LooperValue label="Harmony" value={model.chordLabel} />
              <LooperValue label="Voicing" value={model.voicingPitchLabels.join(' ')} />
              <LooperValue label="PatternEvents" value={`${model.event.timeTick} -> ${model.event.timeTick + getTimedEventDuration(model.event)}`} />
            </Group>

            <Group gap="xs" style={{ left: 24, position: 'absolute', top: 64 }}>
              {model.tonalLabels.map(label => (
                <Badge key={label} color="gray" variant="white">
                  {label}
                </Badge>
              ))}
            </Group>

            <Box
              style={{
                background: '#ffffff',
                border: '1px solid #cbc8bd',
                borderRadius: 6,
                height: LOOP_LANE_HEIGHT,
                left: LOOP_LANE_LEFT,
                position: 'absolute',
                top: LOOP_LANE_TOP,
                width: LOOP_LANE_WIDTH,
              }}
            >
              <Box
                style={{
                  background: '#e8f1ff',
                  border: '1px solid #9ec5fe',
                  borderRadius: 5,
                  height: LOOP_LANE_HEIGHT - 28,
                  left: 0,
                  position: 'absolute',
                  top: 14,
                  width: LOOP_LANE_WIDTH,
                }}
              >
                <Text c="blue.9" fw={600} size="xs" style={{ marginLeft: 8, marginTop: 5 }}>
                  block_notes
                  {' '}
                  0 -
                  {' '}
                  {model.loopLengthTicks}
                </Text>
              </Box>

              {model.scheduledEvents.map(scheduledEvent => (
                <Box
                  key={scheduledEvent.id}
                  style={{
                    background: 'rgba(250, 176, 5, 0.22)',
                    border: '1px solid rgba(240, 140, 0, 0.55)',
                    borderRadius: 5,
                    height: EVENT_WINDOW_HEIGHT,
                    left: getLaneX(scheduledEvent.startTick, model.loopLengthTicks),
                    position: 'absolute',
                    top: EVENT_WINDOW_TOP,
                    width: getScheduledEventWidth(scheduledEvent, model.loopLengthTicks),
                  }}
                >
                  <Text c="orange.9" fw={600} size="10px" style={{ marginLeft: 6, marginTop: 3 }}>
                    event
                    {' '}
                    {scheduledEvent.startTick}
                    {' '}
                    -
                    {' '}
                    {scheduledEvent.startTick + scheduledEvent.durationTicks}
                  </Text>
                </Box>
              ))}

              {getLoopMarkers(model.loopLengthTicks).map(marker => (
                <Box
                  key={marker.tick}
                  style={{
                    background: marker.tick === 0 ? '#6b675b' : '#e7e2d7',
                    height: '100%',
                    left: getLaneX(marker.tick, model.loopLengthTicks),
                    position: 'absolute',
                    top: 0,
                    width: 1,
                  }}
                >
                  <Text c="dimmed" size="xs" style={{ marginLeft: 4, marginTop: -22 }}>
                    {marker.label}
                  </Text>
                </Box>
              ))}

              {model.renderedNotes.map(note => (
                <Box
                  key={note.id}
                  style={{
                    background: '#2f80ed',
                    borderRadius: 4,
                    color: '#fff',
                    height: noteBarHeight,
                    left: getLaneX(note.startTick, model.loopLengthTicks),
                    overflow: 'hidden',
                    padding: '1px 6px',
                    position: 'absolute',
                    top: getNoteBarTop(getNoteRowIndex(noteRowIndexByKey, note), noteRows.length),
                    width: getNoteWidth(note, model.loopLengthTicks),
                  }}
                >
                  <Text fw={600} size="10px" truncate="end">
                    {formatScheduledNoteLabel(note)}
                    {' '}
                    midi
                    {' '}
                    {note.pitch}
                  </Text>
                </Box>
              ))}
            </Box>

            <Box
              ref={playheadRef}
              style={{
                background: '#fa5252',
                bottom: 54,
                left: 0,
                position: 'absolute',
                top: 118,
                transform: `translateX(${playheadX}px)`,
                width: 2,
              }}
            />

            <Group gap="xs" style={{ bottom: 10, left: 24, position: 'absolute' }}>
              <LooperValue label="Chord tones" value={model.chordPitchLabels.join(' ')} />
              <LooperValue label="Scale" value={model.scalePitchLabels.join(' ')} />
            </Group>
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}

function createNotesModel(input: {
  blockLengthTicks: string
  blockPlaybackMode: BlockPlaybackMode
  eventDurationTicks: string
  eventTimeTick: string
  eventVelocity: string
  harmonyAlteration: ChordAlteration | 'none'
  harmonyBass: string
  harmonyBassEnabled: boolean
  harmonyExtension: ChordExtension | 'none'
  harmonyQuality: ChordQuality
  harmonyRoot: string
  keyMode: Mode
  keyTonic: string
  patternLengthTicks: string
  playbackGate: string
  playbackStyle: ChordPlaybackStyle
  recipeId: ChordPlaybackRecipeId
  toneStepTicks: string
  voicingBass: string
  voicingBassEnabled: boolean
  voicingInversion: string
  voicingOctave: string
  voicingRegister: Register
  voicingSpread: string
  voicingType: VoicingType
}): NotesModel {
  const root = parsePitchClass(input.harmonyRoot)
  const key = {
    mode: input.keyMode,
    tonic: parsePitchClass(input.keyTonic),
  }
  const chord = createChordSymbol({
    alterations: input.harmonyAlteration === 'none' ? [] : [input.harmonyAlteration],
    bass: input.harmonyBassEnabled ? parsePitchClass(input.harmonyBass) : undefined,
    extensions: input.harmonyExtension === 'none' ? [] : [input.harmonyExtension],
    quality: input.harmonyQuality,
    root,
  })
  const blockLengthTicks = clampInteger(
    parseInteger(input.blockLengthTicks),
    MIN_PATTERN_LENGTH_TICKS,
    MAX_PATTERN_LENGTH_TICKS,
  )
  const patternLengthTicks = clampInteger(
    parseInteger(input.patternLengthTicks),
    MIN_PATTERN_LENGTH_TICKS,
    blockLengthTicks,
  )
  const eventTime = clampInteger(
    parseInteger(input.eventTimeTick),
    0,
    Math.max(0, patternLengthTicks - MIN_EVENT_DURATION_TICKS),
  )
  const eventDuration = clampInteger(
    parseInteger(input.eventDurationTicks),
    MIN_EVENT_DURATION_TICKS,
    Math.max(MIN_EVENT_DURATION_TICKS, patternLengthTicks - eventTime),
  )
  const voicing = {
    bassNote: input.voicingBassEnabled ? parsePitchClass(input.voicingBass) : undefined,
    inversion: parseInteger(input.voicingInversion),
    octave: clampInteger(parseInteger(input.voicingOctave), 0, 8),
    register: input.voicingRegister,
    spread: clampInteger(parseInteger(input.voicingSpread), 0, 4),
    type: input.voicingType,
  }
  const event = createChordEvent({
    chord,
    durationTicks: eventDuration,
    id: 'event_notes_chord',
    playback: {
      gate: clampNumber(parseNumber(input.playbackGate), 0.05, 1),
      microStaggerTicks: clampInteger(parseInteger(input.toneStepTicks), 0, blockLengthTicks),
      recipeId: input.recipeId,
      stepTicks: clampInteger(parseInteger(input.toneStepTicks), MIN_EVENT_DURATION_TICKS, blockLengthTicks),
      style: input.playbackStyle,
    },
    timeTick: eventTime,
    velocity: createVelocity(clampInteger(parseInteger(input.eventVelocity), 0, 127)),
    voicing,
  })
  const pattern = createPattern({
    events: [event],
    id: 'pattern_notes',
    kind: 'chord',
    lengthTicks: patternLengthTicks,
    metadata: { source: 'notes-debug' },
    name: 'Notes Pattern',
  })
  const track = createTrack({
    accepts: ['chord'],
    color: '#2f80ed',
    id: 'track_notes',
    name: 'Notes',
    role: 'chords',
  })
  const workspace = createBlankWorkspace({
    arrangement: {
      blocks: [
        createBlock({
          color: track.color,
          id: 'block_notes',
          lengthTicks: blockLengthTicks,
          name: 'Notes Loop',
          patternId: pattern.id,
          playbackMode: input.blockPlaybackMode,
          startTick: 0,
          trackId: track.id,
        }),
      ],
      sections: [
        createSection({
          id: 'section_notes',
          lengthTicks: blockLengthTicks,
          name: 'Notes',
          startTick: 0,
        }),
      ],
    },
    id: 'project_notes_debug',
    name: 'Notes Debug',
    patterns: [pattern],
    timeline: createTimeline({
      keyEvents: [createKeyEvent({ key, tick: 0 })],
      meterEvents: [createMeterEvent({ tick: 0 })],
      tempoEvents: [createTempoEvent({ bpm: 120, tick: 0 })],
    }),
    tracks: [track],
  })
  const chordPitchLabels = getChordPitchClasses(chord).map(getNoteNameForPitchClass)
  const playbackSchedule = buildSchedule(workspace)
  const playbackTriggers = playbackSchedule.triggers
  const scheduledEvents = playbackSchedule.events
  const renderedNotes = renderNotePlaybackTriggers(playbackTriggers)
  const voicingPitchLabels = renderedNotes.map(formatScheduledNoteLabel)
  const scalePitchLabels = getScalePitchClasses(key).map(getNoteNameForPitchClass)

  return {
    chordLabel: formatChordSymbol(chord),
    chordPitchLabels,
    event,
    loopLengthTicks: blockLengthTicks,
    pattern,
    playbackTriggers,
    renderedNotes,
    scalePitchLabels,
    scheduledEvents,
    tonalLabels: [
      `Roman ${getRomanNumeral(chord, key)}`,
      `Nashville ${getNashvilleNumber(chord, key)}`,
      `${getNoteNameForPitchClass(key.tonic)} ${key.mode}`,
    ],
    voicingPitchLabels,
    workspace,
  }
}

function PresetBank({
  onSelect,
  presets,
}: {
  onSelect: (preset: NotesPreset) => void
  presets: readonly NotesPreset[]
}) {
  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={2} size="h3">Presets</Title>
        <Badge variant="light">
          {presets.length}
        </Badge>
      </Group>
      <Group gap="xs">
        {presets.map(preset => (
          <Button
            key={preset.id}
            size="xs"
            variant="light"
            onClick={() => onSelect(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </Group>
    </Stack>
  )
}

function PatternNotesPanel({ notes }: { notes: RenderedScheduledNote[] }) {
  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Title order={2} size="h3">Rendered Tones</Title>
        <Badge variant="light">
          {notes.length}
        </Badge>
      </Group>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
        {notes.map(note => (
          <Box
            key={note.id}
            style={{
              border: '1px solid #d9d7ce',
              borderRadius: 6,
              minHeight: 72,
              padding: '8px 10px',
            }}
          >
            <Text fw={700}>{formatScheduledNoteLabel(note)}</Text>
            <Text c="dimmed" size="xs">
              tone
              {' '}
              {note.stepIndex + 1}
            </Text>
            <Text c="dimmed" size="xs">
              voice
              {' '}
              {formatScheduledNoteVoiceIndex(note)}
            </Text>
            <Text c="dimmed" size="xs">
              midi
              {' '}
              {note.pitch}
            </Text>
            <Text c="dimmed" size="xs">
              {note.startTick}
              {' '}
              -
              {' '}
              {note.startTick + note.durationTicks}
            </Text>
            <Text c="dimmed" size="xs">
              vel
              {' '}
              {note.velocity}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  )
}

function JsonPanel({ title, value }: { title: string, value: unknown }) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Title order={2} size="h3">{title}</Title>
        <Box
          component="pre"
          style={{
            background: '#f6f6f6',
            borderRadius: 6,
            fontSize: 12,
            margin: 0,
            maxHeight: 360,
            overflow: 'auto',
            padding: 12,
          }}
        >
          {JSON.stringify(value, null, 2)}
        </Box>
      </Stack>
    </Paper>
  )
}

function LooperValue({ label, value }: { label: string, value: string }) {
  return (
    <Box
      style={{
        background: '#ffffff',
        border: '1px solid #d9d7ce',
        borderRadius: 6,
        maxWidth: 256,
        minHeight: 34,
        padding: '4px 8px',
      }}
    >
      <Text c="dimmed" size="10px" tt="uppercase">
        {label}
      </Text>
      <Text fw={600} size="xs" truncate="end">
        {value}
      </Text>
    </Box>
  )
}

function TextField({
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

function createNotesPreset(input: NotesPresetInput): NotesPreset {
  const preset = {
    ...DEFAULT_NOTES_PRESET,
    ...input,
  }

  return {
    ...preset,
    recipeId: input.recipeId ?? getDefaultRecipeIdForStyle(preset.playbackStyle),
  }
}

function renderNotePlaybackTriggers(triggers: PlaybackTrigger[]): RenderedScheduledNote[] {
  return triggers
    .filter(isNotePlaybackTrigger)
    .map(createRenderedScheduledNote)
}

function isNotePlaybackTrigger(trigger: PlaybackTrigger): trigger is NotePlaybackTrigger {
  return trigger.kind === 'note'
}

function createRenderedScheduledNote(trigger: NotePlaybackTrigger): RenderedScheduledNote {
  return {
    durationTicks: trigger.durationTicks,
    eventId: trigger.source.eventId,
    id: trigger.id,
    pitch: trigger.pitch,
    startTick: trigger.startTick,
    velocity: trigger.velocity,
    stepIndex: trigger.stepIndex ?? 0,
    voiceIndex: trigger.voiceIndex,
  }
}

function getNoteRows(notes: RenderedScheduledNote[]): RenderedScheduledNote[] {
  const noteRowsByKey = new Map<string, RenderedScheduledNote>()

  for (const note of notes) {
    const rowKey = getNoteRowKey(note)

    if (!noteRowsByKey.has(rowKey)) {
      noteRowsByKey.set(rowKey, note)
    }
  }

  return [...noteRowsByKey.values()].sort((left, right) => {
    if (left.pitch !== right.pitch) {
      return right.pitch - left.pitch
    }

    if (left.voiceIndex !== right.voiceIndex) {
      return (left.voiceIndex ?? Number.MAX_SAFE_INTEGER) - (right.voiceIndex ?? Number.MAX_SAFE_INTEGER)
    }

    return left.id.localeCompare(right.id)
  })
}

function getNoteRowIndexByKey(notes: RenderedScheduledNote[]): Map<string, number> {
  return new Map(notes.map((note, index) => [getNoteRowKey(note), index]))
}

function getNoteRowIndex(rowIndexByKey: Map<string, number>, note: RenderedScheduledNote): number {
  return rowIndexByKey.get(getNoteRowKey(note)) ?? 0
}

function getNoteRowKey(note: RenderedScheduledNote): string {
  return `${note.pitch}:${note.voiceIndex ?? 'unvoiced'}`
}

function getNoteBarTop(index: number, noteCount: number): number {
  const rowStep = NOTE_LANE_HEIGHT / Math.max(1, noteCount)

  return NOTE_LANE_TOP + (index * rowStep)
}

function getNoteBarHeight(noteCount: number): number {
  const rowStep = NOTE_LANE_HEIGHT / Math.max(1, noteCount)

  return clampNumber(rowStep - 2, 14, 24)
}

function getNoteWidth(note: RenderedScheduledNote, loopLengthTicks: number): number {
  return clampNumber(
    (note.durationTicks / loopLengthTicks) * LOOP_LANE_WIDTH,
    2,
    LOOP_LANE_WIDTH - getLaneX(note.startTick, loopLengthTicks),
  )
}

function getScheduledEventWidth(event: ScheduledPlaybackEvent, loopLengthTicks: number): number {
  return clampNumber(
    (event.durationTicks / loopLengthTicks) * LOOP_LANE_WIDTH,
    28,
    LOOP_LANE_WIDTH - getLaneX(event.startTick, loopLengthTicks),
  )
}

function getLoopMarkers(loopLengthTicks: number): Array<{ label: string, tick: Tick }> {
  return [0, 0.25, 0.5, 0.75, 1].map((position) => {
    const tick = Math.floor(loopLengthTicks * position) as Tick

    return {
      label: `${tick}`,
      tick,
    }
  })
}

function getLoopX(tick: number, loopLengthTicks: number): number {
  return LOOP_LANE_LEFT + getLaneX(tick, loopLengthTicks)
}

function getLaneX(tick: number, loopLengthTicks: number): number {
  return (clampNumber(tick, 0, loopLengthTicks) / loopLengthTicks) * LOOP_LANE_WIDTH
}

function getTimedEventDuration(event: PatternEvent): number {
  if (event.kind === 'chord' || event.kind === 'note') {
    return event.durationTicks
  }

  return 0
}

function parsePitchClass(value: string) {
  return createPitchClass(normalizePitchClass(parseInteger(value)))
}

function formatScheduledNoteLabel(note: RenderedScheduledNote): string {
  return `${getNoteNameForPitchClass(pitchClassFromMidiNote(note.pitch))}${getOctaveForMidiNote(note.pitch)}`
}

function formatScheduledNoteVoiceIndex(note: RenderedScheduledNote): string {
  return note.voiceIndex === undefined ? '-' : `${note.voiceIndex}`
}

function getTransportColor(status: TransportStatus): string {
  switch (status) {
    case 'paused':
      return 'yellow'
    case 'playing':
      return 'green'
    case 'stopped':
      return 'gray'
  }
}
