import {
  memo,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
  useCallback,
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
  Slider,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'

import { DebugNav } from './DebugNav'
import { AppLayout } from '~/components/AppLayout/AppLayout'
import AppProvider from '~/components/Providers/AppProvider'
import {
  barEndValueToTick,
  barLengthValueToTicks,
  barStartValueToTick,
  type Block,
  BLOCK_PLAYBACK_MODES,
  type BlockPlaybackMode,
  canTrackAcceptPatternKind,
  CHORD_QUALITIES,
  type ChordQuality,
  createBlock,
  createMixChannel,
  createPattern,
  createSection,
  createSeedPatternEvents,
  createTrack,
  formatChordSymbol,
  formatDurationAsBars,
  formatTickAsBars,
  formatTickRangeAsBars,
  formatTickToEndBar,
  formatTickToStartBar,
  getBlockEndTick,
  getMeterAtTick,
  getSectionEndTick,
  getTempoAtTick,
  getTicksPerBeat,
  type Pattern,
  PATTERN_KINDS,
  type PatternKind,
  type PitchClass,
  type Section,
  type Tick,
  tickToBarBeat,
  TIME_SIGNATURE_DENOMINATORS,
  type TimeSignatureDenominator,
  toTimelineTick,
  type Track,
  TRACK_ROLES,
  type TrackRole,
} from '~/domain'
import {
  addBlock as addWorkspaceBlock,
  addPattern as addWorkspacePattern,
  addSection as addWorkspaceSection,
  addTrack as addWorkspaceTrack,
  createDemoLoopWorkspace,
  createLargeSketchWorkspace,
  createWorkspaceForPlayback,
  removeBlock as removeWorkspaceBlock,
  removeSection as removeWorkspaceSection,
  selectBlocksForTrack,
  selectPattern,
  selectPatterns,
  selectTrack,
  selectTracks,
  selectWorkspaceEndTick,
  summarizeWorkspaceAction,
  updateBlock as updateWorkspaceBlock,
  updateSection as updateWorkspaceSection,
  validateWorkspace,
  type Workspace,
} from '~/store/workspace'
import {
  Transport,
  type TransportSnapshot,
  type TransportStatus,
} from '~/utils/transport'

const TICK_WIDTH = 0.09
const TRACK_ROW_HEIGHT = 58
const TRACK_LABEL_WIDTH = 128
const SLIDER_FRAME_INTERVAL_MS = 50
const DEFAULT_START_BAR_VALUE = '1'
const DEFAULT_SECTION_LENGTH_BAR_VALUE = '2'
const DEFAULT_PATTERN_LENGTH_BAR_VALUE = '1'
const DEFAULT_BLOCK_LENGTH_BAR_VALUE = '1'

const PITCH_CLASS_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  label: `${index}`,
  value: `${index}`,
}))

const STATIC_BAR_OPTIONS = Array.from({ length: 32 }, (_, index) => {
  const barNumber = index + 1

  return {
    label: `Bar ${barNumber}`,
    value: `${barNumber}`,
  }
})

const STATIC_DURATION_BAR_OPTIONS = Array.from({ length: 16 }, (_, index) => {
  const barCount = index + 1

  return {
    label: `${barCount} ${barCount === 1 ? 'bar' : 'bars'}`,
    value: `${barCount}`,
  }
})

type ActionLogEntry = {
  id: string
  label: string
  value: unknown
}

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Playback' },
  ]
}

export default function Play() {
  const [projectName, setProjectName] = useState('')
  const [projectBpm, setProjectBpm] = useState('120')
  const [projectNumerator, setProjectNumerator] = useState('4')
  const [projectDenominator, setProjectDenominator] = useState<TimeSignatureDenominator>(4)
  const [workspace, setWorkspace] = useState(() => createWorkspaceForPlayback({
    bpm: 120,
    denominator: 4,
    name: 'Playback Sketch',
    numerator: 4,
  }))
  const transportRef = useRef<Transport | null>(null)

  if (transportRef.current === null) {
    transportRef.current = new Transport(workspace)
  }

  const transport = transportRef.current

  const [trackName, setTrackName] = useState('')
  const [trackRole, setTrackRole] = useState<TrackRole>('melody')
  const [trackVolumeDb, setTrackVolumeDb] = useState('0')

  const [sectionName, setSectionName] = useState('')
  const [sectionStartBar, setSectionStartBar] = useState(DEFAULT_START_BAR_VALUE)
  const [sectionLengthBars, setSectionLengthBars] = useState(DEFAULT_SECTION_LENGTH_BAR_VALUE)

  const [patternName, setPatternName] = useState('')
  const [patternKind, setPatternKind] = useState<PatternKind>('chord')
  const [patternLengthBars, setPatternLengthBars] = useState(DEFAULT_PATTERN_LENGTH_BAR_VALUE)
  const [chordRoot, setChordRoot] = useState('0')
  const [chordQuality, setChordQuality] = useState<ChordQuality>('minor')
  const [notePitch, setNotePitch] = useState('60')
  const [drumPiece, setDrumPiece] = useState('kick')

  const [selectedTrackId, setSelectedTrackId] = useState('track_chords')
  const [selectedPatternId, setSelectedPatternId] = useState('')
  const [blockName, setBlockName] = useState('')
  const [blockStartBar, setBlockStartBar] = useState(DEFAULT_START_BAR_VALUE)
  const [blockLengthBars, setBlockLengthBars] = useState(DEFAULT_BLOCK_LENGTH_BAR_VALUE)
  const [blockPlaybackMode, setBlockPlaybackMode] = useState<BlockPlaybackMode>('loop')
  const [blockMuted, setBlockMuted] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  const [actions, setActions] = useState<ActionLogEntry[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const workspaceErrors = useMemo(() => validateWorkspace(workspace), [workspace])

  useEffect(() => {
    transport.setWorkspace(workspace)
  }, [transport, workspace])

  useEffect(() => {
    return () => {
      transport.destroy()
    }
  }, [transport])

  function runAction(label: string, action: () => unknown) {
    try {
      const value = action()

      setActions(currentActions => [
        ...currentActions,
        {
          id: `action_${currentActions.length + 1}`,
          label,
          value,
        },
      ])
      setErrorMessage(null)
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  function updateWorkspace(label: string, updater: (currentWorkspace: Workspace) => Workspace) {
    runAction(label, () => {
      const nextWorkspace = updater(workspace)

      setWorkspace(nextWorkspace)

      return summarizeWorkspaceAction(nextWorkspace)
    })
  }

  function handleCreateProject() {
    runAction('createWorkspaceForPlayback', () => {
      const nextWorkspace = createWorkspaceForPlayback({
        bpm: parseNumber(projectBpm),
        denominator: projectDenominator,
        name: getNameOrFallback(projectName, 'Playback Sketch'),
        numerator: parseInteger(projectNumerator),
      })
      const tracks = selectTracks(nextWorkspace)
      const patterns = selectPatterns(nextWorkspace)

      setWorkspace(nextWorkspace)
      setSelectedTrackId(tracks[0]?.id ?? '')
      setSelectedPatternId(patterns[0]?.id ?? '')
      setSelectedSectionId(null)
      setSelectedBlockId(null)
      transport.seek(0)
      transport.setLoop({
        endTick: selectWorkspaceEndTick(nextWorkspace),
        startTick: 0,
      }, true)

      return summarizeWorkspaceAction(nextWorkspace)
    })
  }

  function handleSeedDemoLoop() {
    runAction('seed demo loop', () => {
      const seeded = createDemoLoopWorkspace(workspace)
      const nextWorkspace = seeded.workspace
      const block = nextWorkspace.arrangement.blocks.find(currentBlock => currentBlock.id === seeded.blockId)

      setWorkspace(nextWorkspace)
      setSelectedPatternId(seeded.patternId)
      setSelectedTrackId(block?.trackId ?? selectedTrackId)
      setSelectedSectionId(null)
      setSelectedBlockId(seeded.blockId)

      if (block !== undefined) {
        setSelectedTrackId(block.trackId)
        setSelectedPatternId(block.patternId)
        setBlockName(block.name)
        setBlockPlaybackMode(block.playbackMode)
        setBlockMuted(block.muted)
      }

      return {
        blockId: seeded.blockId,
        patternId: seeded.patternId,
        ...summarizeWorkspaceAction(nextWorkspace),
      }
    })
  }

  function handleSeedLargeSketch() {
    runAction('seed large sketch', () => {
      const nextWorkspace = createLargeSketchWorkspace(workspace)
      const tracks = selectTracks(nextWorkspace)
      const patterns = selectPatterns(nextWorkspace)

      setWorkspace(nextWorkspace)
      setSelectedTrackId(tracks[0]?.id ?? '')
      setSelectedPatternId(patterns[0]?.id ?? '')
      setSelectedSectionId(null)
      setSelectedBlockId(null)
      transport.seek(0)
      transport.setLoop({
        endTick: selectWorkspaceEndTick(nextWorkspace),
        startTick: 0,
      }, true)

      return summarizeWorkspaceAction(nextWorkspace)
    })
  }

  function handleAddTrack() {
    updateWorkspace('createTrack', (currentWorkspace) => {
      const tracks = selectTracks(currentWorkspace)
      const track = createTrack({
        id: createEntityId(`track_${trackRole}`, tracks.length),
        name: getNameOrFallback(trackName, `${capitalize(trackRole)} Track ${tracks.length + 1}`),
        role: trackRole,
      })
      const mixChannel = createMixChannel({
        id: track.mixChannelId,
        volumeDb: parseNumber(trackVolumeDb),
      })

      setSelectedTrackId(track.id)

      return addWorkspaceTrack(currentWorkspace, track, mixChannel)
    })
  }

  function handleAddSection() {
    updateWorkspace('createSection', (currentWorkspace) => {
      const section = createSection({
        id: createEntityId('section', currentWorkspace.arrangement.sections.length),
        lengthTicks: barLengthValueToTicks(currentWorkspace.timeline, sectionLengthBars),
        name: getNameOrFallback(sectionName, `Section ${currentWorkspace.arrangement.sections.length + 1}`),
        startTick: barStartValueToTick(currentWorkspace.timeline, sectionStartBar),
      })
      const nextWorkspace = addWorkspaceSection(currentWorkspace, section)

      setSelectedSectionId(null)
      setSelectedBlockId(null)
      setSectionName('')

      return nextWorkspace
    })
  }

  function handleSelectSection(section: Section) {
    setSelectedSectionId(section.id)
    setSelectedBlockId(null)
    setSectionName(section.name)
  }

  function handleClearSelectedSection() {
    setSelectedSectionId(null)
    setSectionName('')
  }

  function handleUpdateSection() {
    updateWorkspace('updateSection', (currentWorkspace) => {
      if (selectedSectionId === null) {
        throw new Error('Select a section before updating.')
      }

      const section = createSection({
        id: selectedSectionId,
        lengthTicks: barLengthValueToTicks(currentWorkspace.timeline, sectionLengthBars),
        name: getNameOrFallback(sectionName, `Section ${currentWorkspace.arrangement.sections.length}`),
        startTick: barStartValueToTick(currentWorkspace.timeline, sectionStartBar),
      })
      const didUpdate = currentWorkspace.arrangement.sections.some(currentSection => currentSection.id === selectedSectionId)

      if (!didUpdate) {
        throw new Error(`Section ${selectedSectionId} no longer exists.`)
      }

      return updateWorkspaceSection(currentWorkspace, section)
    })
  }

  function handleDeleteSelectedSection() {
    updateWorkspace('deleteSection', (currentWorkspace) => {
      if (selectedSectionId === null) {
        throw new Error('Select a section before deleting.')
      }

      const sections = currentWorkspace.arrangement.sections.filter(section => section.id !== selectedSectionId)

      if (sections.length === currentWorkspace.arrangement.sections.length) {
        throw new Error(`Section ${selectedSectionId} no longer exists.`)
      }

      const nextWorkspace = removeWorkspaceSection(currentWorkspace, selectedSectionId)

      setSelectedSectionId(null)
      setSectionName('')

      return nextWorkspace
    })
  }

  function handleAddPattern() {
    updateWorkspace('createPattern', (currentWorkspace) => {
      const patterns = selectPatterns(currentWorkspace)
      const patternLengthTicks = barLengthValueToTicks(currentWorkspace.timeline, patternLengthBars)
      const pattern = createPattern({
        events: createSeedPatternEvents(patternKind, patternLengthTicks, {
          chordQuality,
          chordRoot: parsePitchClass(chordRoot),
          drumPiece,
          notePitch: parseInteger(notePitch),
        }),
        id: createEntityId(`pattern_${patternKind}`, patterns.length),
        kind: patternKind,
        lengthTicks: patternLengthTicks,
        metadata: { generatedBy: 'playback route' },
        name: getNameOrFallback(patternName, `${capitalize(patternKind)} Pattern ${patterns.length + 1}`),
      })

      setSelectedPatternId(pattern.id)

      return addWorkspacePattern(currentWorkspace, pattern)
    })
  }

  function handleAddBlock(startTickOverride?: number) {
    updateWorkspace('createBlock', (currentWorkspace) => {
      const track = selectTrack(currentWorkspace, selectedTrackId)
      const pattern = selectPattern(currentWorkspace, selectedPatternId)

      if (track === undefined) {
        throw new Error('Select a track before adding a block.')
      }

      if (pattern === undefined) {
        throw new Error('Select a pattern before adding a block.')
      }

      if (!canTrackAcceptPatternKind(track, pattern.kind)) {
        throw new Error(`${track.name} does not accept ${pattern.kind} patterns.`)
      }

      const block = createBlock({
        color: track.color,
        id: createEntityId('block', currentWorkspace.arrangement.blocks.length),
        lengthTicks: barLengthValueToTicks(currentWorkspace.timeline, blockLengthBars),
        muted: blockMuted,
        name: getNameOrFallback(blockName, `Block ${currentWorkspace.arrangement.blocks.length + 1}`),
        patternId: pattern.id,
        playbackMode: blockPlaybackMode,
        startTick: startTickOverride === undefined
          ? barStartValueToTick(currentWorkspace.timeline, blockStartBar)
          : toTimelineTick(startTickOverride),
        trackId: track.id,
      })
      const nextWorkspace = addWorkspaceBlock(currentWorkspace, block)

      setSelectedBlockId(null)
      setSelectedSectionId(null)
      setBlockName('')

      return nextWorkspace
    })
  }

  function handleSelectBlock(block: Block) {
    setSelectedBlockId(block.id)
    setSelectedSectionId(null)
    setSelectedTrackId(block.trackId)
    setSelectedPatternId(block.patternId)
    setBlockName(block.name)
    setBlockPlaybackMode(block.playbackMode)
    setBlockMuted(block.muted)
  }

  function handleClearSelectedBlock() {
    setSelectedBlockId(null)
    setBlockName('')
  }

  function handleUpdateBlock() {
    updateWorkspace('updateBlock', (currentWorkspace) => {
      if (selectedBlockId === null) {
        throw new Error('Select a block before updating.')
      }

      const track = selectTrack(currentWorkspace, selectedTrackId)
      const pattern = selectPattern(currentWorkspace, selectedPatternId)

      if (track === undefined) {
        throw new Error('Select a track before updating a block.')
      }

      if (pattern === undefined) {
        throw new Error('Select a pattern before updating a block.')
      }

      if (!canTrackAcceptPatternKind(track, pattern.kind)) {
        throw new Error(`${track.name} does not accept ${pattern.kind} patterns.`)
      }

      const block = createBlock({
        color: track.color,
        id: selectedBlockId,
        lengthTicks: barLengthValueToTicks(currentWorkspace.timeline, blockLengthBars),
        muted: blockMuted,
        name: getNameOrFallback(blockName, `Block ${currentWorkspace.arrangement.blocks.length}`),
        patternId: pattern.id,
        playbackMode: blockPlaybackMode,
        startTick: barStartValueToTick(currentWorkspace.timeline, blockStartBar),
        trackId: track.id,
      })
      const didUpdate = currentWorkspace.arrangement.blocks.some(currentBlock => currentBlock.id === selectedBlockId)

      if (!didUpdate) {
        throw new Error(`Block ${selectedBlockId} no longer exists.`)
      }

      return updateWorkspaceBlock(currentWorkspace, block)
    })
  }

  function handleDeleteSelectedBlock() {
    updateWorkspace('deleteBlock', (currentWorkspace) => {
      if (selectedBlockId === null) {
        throw new Error('Select a block before deleting.')
      }

      const blocks = currentWorkspace.arrangement.blocks.filter(block => block.id !== selectedBlockId)

      if (blocks.length === currentWorkspace.arrangement.blocks.length) {
        throw new Error(`Block ${selectedBlockId} no longer exists.`)
      }

      const nextWorkspace = removeWorkspaceBlock(currentWorkspace, selectedBlockId)

      setSelectedBlockId(null)
      setBlockName('')

      return nextWorkspace
    })
  }

  const tracks = selectTracks(workspace)
  const patterns = selectPatterns(workspace)
  const trackOptions = tracks.map(track => ({
    label: `${track.name} (${track.role})`,
    value: track.id,
  }))
  const patternOptions = patterns.map(pattern => ({
    label: `${pattern.name} (${pattern.kind})`,
    value: pattern.id,
  }))
  return (
    <AppProvider>
      <AppLayout>
        <Stack gap="lg" py="lg">
          <Group justify="space-between" align="flex-start">
            <Box>
              <Title order={1}>Playback Lab</Title>
              <DebugNav />
              <Text c="dimmed" size="sm">
                Workspace data with a transport clock.
              </Text>
            </Box>
          </Group>

          {errorMessage !== null && (
            <Paper withBorder radius="sm" p="sm" bg="red.0">
              <Text c="red" size="sm" fw={600}>{errorMessage}</Text>
            </Paper>
          )}

          <PlaybackRuntime
            transport={transport}
            actions={actions}
            onError={setErrorMessage}
            onSelectBlock={handleSelectBlock}
            onSelectSection={handleSelectSection}
            workspace={workspace}
            workspaceErrors={workspaceErrors}
            selectedBlockId={selectedBlockId}
            selectedSectionId={selectedSectionId}
          />

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <Title order={2} size="h3">Project</Title>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Field label="Project name" value={projectName} onChange={setProjectName} />
                  <Field label="BPM" value={projectBpm} onChange={setProjectBpm} />
                  <Field label="Numerator" value={projectNumerator} onChange={setProjectNumerator} />
                  <SelectField
                    label="Denominator"
                    value={`${projectDenominator}`}
                    data={TIME_SIGNATURE_DENOMINATORS.map(value => ({ label: `${value}`, value: `${value}` }))}
                    onChange={value => setProjectDenominator(parseInteger(value) as TimeSignatureDenominator)}
                  />
                </SimpleGrid>
                <Group gap="xs">
                  <Button onClick={handleCreateProject}>Create Project</Button>
                  <Button variant="light" onClick={handleSeedDemoLoop}>Seed Demo Loop</Button>
                  <Button variant="light" onClick={handleSeedLargeSketch}>Seed Large Sketch</Button>
                </Group>
                <StatsGrid
                  items={[
                    ['Tracks', tracks.length],
                    ['Sections', workspace.arrangement.sections.length],
                    ['Patterns', patterns.length],
                    ['Blocks', workspace.arrangement.blocks.length],
                  ]}
                />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <Title order={2} size="h3">Add Track</Title>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Field label="Name" value={trackName} onChange={setTrackName} />
                  <SelectField label="Role" value={trackRole} data={TRACK_ROLES} onChange={setTrackRole} />
                  <Field label="Volume dB" value={trackVolumeDb} onChange={setTrackVolumeDb} />
                </SimpleGrid>
                <Button onClick={handleAddTrack}>Add Track</Button>
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={2} size="h3">Add Section</Title>
                  {selectedSectionId !== null && (
                    <Badge variant="light">
                      Editing
                      {selectedSectionId}
                    </Badge>
                  )}
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Field label="Name" value={sectionName} onChange={setSectionName} />
                  <SelectField label="Start bar" value={sectionStartBar} data={STATIC_BAR_OPTIONS} onChange={setSectionStartBar} />
                  <SelectField label="Length" value={sectionLengthBars} data={STATIC_DURATION_BAR_OPTIONS} onChange={setSectionLengthBars} />
                </SimpleGrid>
                <Group gap="xs">
                  <Button onClick={handleAddSection}>Add Section</Button>
                  <Button variant="light" disabled={selectedSectionId === null} onClick={handleUpdateSection}>Update Selected</Button>
                  <Button variant="light" color="red" disabled={selectedSectionId === null} onClick={handleDeleteSelectedSection}>Delete Selected</Button>
                  <Button variant="subtle" disabled={selectedSectionId === null} onClick={handleClearSelectedSection}>Clear Selection</Button>
                </Group>
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <Title order={2} size="h3">Add Pattern</Title>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Field label="Name" value={patternName} onChange={setPatternName} />
                  <SelectField label="Kind" value={patternKind} data={PATTERN_KINDS} onChange={setPatternKind} />
                  <SelectField label="Length" value={patternLengthBars} data={STATIC_DURATION_BAR_OPTIONS} onChange={setPatternLengthBars} />
                  <SelectField label="Chord root" value={chordRoot} data={PITCH_CLASS_OPTIONS} onChange={setChordRoot} />
                  <SelectField label="Chord quality" value={chordQuality} data={CHORD_QUALITIES} onChange={setChordQuality} />
                  <Field label="Note pitch" value={notePitch} onChange={setNotePitch} />
                  <Field label="Drum piece" value={drumPiece} onChange={setDrumPiece} />
                </SimpleGrid>
                <Button onClick={handleAddPattern}>Add Pattern</Button>
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={2} size="h3">Add Block</Title>
                  {selectedBlockId !== null && (
                    <Badge variant="light">
                      Editing
                      {selectedBlockId}
                    </Badge>
                  )}
                </Group>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <Field label="Name" value={blockName} onChange={setBlockName} />
                  <SelectField label="Track" value={selectedTrackId} data={trackOptions} onChange={setSelectedTrackId} />
                  <SelectField label="Pattern" value={selectedPatternId} data={patternOptions} onChange={setSelectedPatternId} />
                  <SelectField label="Start bar" value={blockStartBar} data={STATIC_BAR_OPTIONS} onChange={setBlockStartBar} />
                  <SelectField label="Length" value={blockLengthBars} data={STATIC_DURATION_BAR_OPTIONS} onChange={setBlockLengthBars} />
                  <SelectField label="Playback mode" value={blockPlaybackMode} data={BLOCK_PLAYBACK_MODES} onChange={setBlockPlaybackMode} />
                  <Checkbox label="Muted" checked={blockMuted} onChange={event => setBlockMuted(event.currentTarget.checked)} />
                </SimpleGrid>
                <Group gap="xs">
                  <Button onClick={() => handleAddBlock()}>Add Block</Button>
                  <Button variant="light" onClick={() => handleAddBlock(transport.getPlayheadTick())}>Add At Playhead</Button>
                  <Button variant="light" disabled={selectedBlockId === null} onClick={handleUpdateBlock}>Update Selected</Button>
                  <Button variant="light" color="red" disabled={selectedBlockId === null} onClick={handleDeleteSelectedBlock}>Delete Selected</Button>
                  <Button variant="subtle" disabled={selectedBlockId === null} onClick={handleClearSelectedBlock}>Clear Selection</Button>
                </Group>
              </Stack>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <DomainList title="Tracks">
              {tracks.map(track => (
                <TrackRow key={track.id} track={track} />
              ))}
            </DomainList>

            <DomainList title="Patterns">
              {patterns.map(pattern => (
                <PatternRow key={pattern.id} pattern={pattern} workspace={workspace} />
              ))}
            </DomainList>

            <DomainList title="Sections">
              {workspace.arrangement.sections.map(section => (
                <SectionRow key={section.id} section={section} workspace={workspace} />
              ))}
            </DomainList>

            <DomainList title="Blocks">
              {workspace.arrangement.blocks.map(block => (
                <BlockRow key={block.id} block={block} pattern={selectPattern(workspace, block.patternId)} track={selectTrack(workspace, block.trackId)} workspace={workspace} />
              ))}
            </DomainList>
          </SimpleGrid>

        </Stack>
      </AppLayout>
    </AppProvider>
  )
}

function PlaybackRuntime({
  actions,
  transport,
  onError,
  onSelectBlock,
  onSelectSection,
  workspace,
  workspaceErrors,
  selectedBlockId,
  selectedSectionId,
}: {
  actions: ActionLogEntry[]
  transport: Transport
  onError: (message: string | null) => void
  onSelectBlock: (block: Block) => void
  onSelectSection: (section: Section) => void
  workspace: Workspace
  workspaceErrors: string[]
  selectedBlockId: string | null
  selectedSectionId: string | null
}) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const [transportSnapshot, setTransportSnapshot] = useState<TransportSnapshot>(() => transport.getSnapshot())
  const [sliderTick, setSliderTick] = useState(() => toTimelineTick(transport.getPlayheadTick()))
  const projectEndTick = transportSnapshot.projectEndTick
  const timelineWidth = Math.max(860, Math.ceil(projectEndTick * TICK_WIDTH))
  const barOptions = STATIC_BAR_OPTIONS
  const activeTimelineTick = toTimelineTick(transportSnapshot.playheadTick)
  const activeTempo = getTempoAtTick(workspace.timeline, activeTimelineTick)
  const activeMeter = getMeterAtTick(workspace.timeline, activeTimelineTick)
  const activeBlocks = useMemo(
    () => workspace.arrangement.blocks.filter(block => transportSnapshot.activeBlockIds.includes(block.id)),
    [workspace.arrangement.blocks, transportSnapshot.activeBlockIds],
  )
  const handleSeek = useCallback((tick: Tick) => {
    const nextTick = toTimelineTick(tick)

    setSliderTick(nextTick)
    transport.seek(nextTick)
  }, [transport])

  useEffect(() => {
    return transport.subscribe((snapshot) => {
      setTransportSnapshot(snapshot)

      if (snapshot.status !== 'playing') {
        setSliderTick(snapshot.playheadTick)
      }
    })
  }, [transport])

  useEffect(() => {
    let frameId = 0
    let lastSliderUpdateMs = 0
    let lastSliderTick = toTimelineTick(transport.getPlayheadTick())

    function updatePlayheadTransform(nowMs: number) {
      const playheadTick = transport.getPlayheadTick()

      if (playheadRef.current !== null && Number.isFinite(playheadTick)) {
        playheadRef.current.style.transform = `translateX(${playheadTick * TICK_WIDTH}px)`
      }

      if (nowMs - lastSliderUpdateMs >= SLIDER_FRAME_INTERVAL_MS) {
        const nextSliderTick = toTimelineTick(playheadTick)

        lastSliderUpdateMs = nowMs

        if (nextSliderTick !== lastSliderTick) {
          lastSliderTick = nextSliderTick
          setSliderTick(nextSliderTick)
        }
      }

      frameId = requestAnimationFrame(updatePlayheadTransform)
    }

    frameId = requestAnimationFrame(updatePlayheadTransform)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [transport])

  function handlePlay() {
    void transport.play().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : String(error))
    })
  }

  function handlePause() {
    transport.pause()
  }

  function handleStop() {
    transport.stop()
  }

  function updateLoopRange(partialRange: Partial<{ endTick: Tick, startTick: Tick }>) {
    transport.setLoop({
      endTick: partialRange.endTick ?? transportSnapshot.loopRange?.endTick ?? projectEndTick,
      startTick: partialRange.startTick ?? transportSnapshot.loopRange?.startTick ?? 0,
    }, transportSnapshot.loopEnabled)
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
    <>
      <Paper withBorder radius="sm" p="md">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={2} size="h3">Transport</Title>
            <Group gap="xs">
              <Badge color={getTransportColor(transportSnapshot.status)} variant="light">
                {transportSnapshot.status}
              </Badge>
              <Badge variant="light">
                {activeTempo}
                {' '}
                BPM
              </Badge>
              <Badge variant="light">
                {activeMeter.numerator}
                /
                {activeMeter.denominator}
              </Badge>
              <Badge variant="light">
                {formatTickAsBars(workspace.timeline, transportSnapshot.playheadTick)}
              </Badge>
              <Badge variant="light">
                {transportSnapshot.scheduledEventCount}
                {' '}
                scheduled
              </Badge>
            </Group>
          </Group>

          <Group gap="xs">
            <Button onClick={handlePlay} disabled={transportSnapshot.status === 'playing'}>Play</Button>
            <Button variant="light" onClick={handlePause} disabled={transportSnapshot.status !== 'playing'}>Pause</Button>
            <Button variant="light" color="red" onClick={handleStop}>Stop</Button>
            <Button
              variant={transportSnapshot.loopEnabled ? 'filled' : 'light'}
              onClick={() => transport.setLoop(transportSnapshot.loopRange, !transportSnapshot.loopEnabled)}
            >
              Loop
            </Button>
          </Group>

          <Slider
            label={null}
            max={projectEndTick}
            min={0}
            step={1}
            value={sliderTick}
            onChange={handleSeek}
          />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
            <SelectField label="Loop start bar" value={formatTickToStartBar(workspace.timeline, transportSnapshot.loopRange?.startTick ?? 0)} data={barOptions} onChange={value => updateLoopRange({ startTick: barStartValueToTick(workspace.timeline, value) })} />
            <SelectField label="Loop end bar" value={formatTickToEndBar(workspace.timeline, transportSnapshot.loopRange?.endTick ?? projectEndTick)} data={barOptions} onChange={value => updateLoopRange({ endTick: barEndValueToTick(workspace.timeline, value) })} />
            <SelectField label="Playhead bar" value={formatTickToStartBar(workspace.timeline, transportSnapshot.playheadTick)} data={barOptions} onChange={value => handleSeek(barStartValueToTick(workspace.timeline, value))} />
            <SelectField label="Status" value={transportSnapshot.status} data={['stopped', 'playing', 'paused']} onChange={setTransportStatus} />
          </SimpleGrid>
        </Stack>
      </Paper>

      <TimelineView
        activeBlocks={activeBlocks}
        onSeek={handleSeek}
        onSelectBlock={onSelectBlock}
        onSelectSection={onSelectSection}
        playheadRef={playheadRef}
        workspace={workspace}
        projectEndTick={projectEndTick}
        selectedBlockId={selectedBlockId}
        selectedSectionId={selectedSectionId}
        timelineWidth={timelineWidth}
      />

      <MemoizedPlaybackDomainState
        actions={actions}
        compileWarnings={transportSnapshot.compileWarnings}
        workspaceErrors={workspaceErrors}
      />
    </>
  )
}

const MemoizedPlaybackDomainState = memo(PlaybackDomainState)

function PlaybackDomainState({
  actions,
  compileWarnings,
  workspaceErrors,
}: {
  actions: ActionLogEntry[]
  compileWarnings: TransportSnapshot['compileWarnings']
  workspaceErrors: string[]
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={2} size="h3">Domain State</Title>
          <Badge color={workspaceErrors.length === 0 ? 'green' : 'red'} variant="light">
            {workspaceErrors.length === 0 ? 'valid' : `${workspaceErrors.length} errors`}
          </Badge>
        </Group>
        {workspaceErrors.length > 0 && (
          <Stack gap={2}>
            {workspaceErrors.map(error => (
              <Text key={error} c="red" size="sm">{error}</Text>
            ))}
          </Stack>
        )}
        {compileWarnings.length > 0 && (
          <Stack gap={2}>
            {compileWarnings.map(warning => (
              <Text key={warning.id} c="yellow.8" size="sm">{warning.message}</Text>
            ))}
          </Stack>
        )}
        <Divider />
        <Group justify="space-between">
          <Text size="sm" fw={600}>Actions</Text>
          <Badge color="gray" variant="light">{actions.length}</Badge>
        </Group>
        {actions.length === 0 && (
          <Text c="dimmed" size="sm">No actions yet</Text>
        )}
        {actions.length > 0 && (
          <>
            {actions.map(action => (
              <Paper key={action.id} withBorder radius="sm" p="sm">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" fw={600}>{action.label}</Text>
                    <Badge color="gray" variant="light">{action.id}</Badge>
                  </Group>
                  <Box component="pre" m={0} p="sm" style={preStyle}>
                    {formatOutput(action.value)}
                  </Box>
                </Stack>
              </Paper>
            ))}
          </>
        )}
      </Stack>
    </Paper>
  )
}

function TimelineView({
  activeBlocks,
  onSeek,
  onSelectBlock,
  onSelectSection,
  playheadRef,
  projectEndTick,
  selectedBlockId,
  selectedSectionId,
  timelineWidth,
  workspace,
}: {
  activeBlocks: Block[]
  onSeek: (tick: Tick) => void
  onSelectBlock: (block: Block) => void
  onSelectSection: (section: Section) => void
  playheadRef: RefObject<HTMLDivElement | null>
  projectEndTick: Tick
  selectedBlockId: string | null
  selectedSectionId: string | null
  timelineWidth: number
  workspace: Workspace
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={2} size="h3">Arrangement</Title>
          <Group gap="xs">
            {activeBlocks.length === 0
              ? <Badge variant="light">No active blocks</Badge>
              : activeBlocks.map(block => <Badge key={block.id} color="green" variant="light">{block.name}</Badge>)}
          </Group>
        </Group>

        <MemoizedTimelineArrangement
          onSeek={onSeek}
          onSelectBlock={onSelectBlock}
          onSelectSection={onSelectSection}
          playheadRef={playheadRef}
          projectEndTick={projectEndTick}
          selectedBlockId={selectedBlockId}
          selectedSectionId={selectedSectionId}
          timelineWidth={timelineWidth}
          workspace={workspace}
        />
      </Stack>
    </Paper>
  )
}

const MemoizedTimelineArrangement = memo(TimelineArrangement)

function TimelineArrangement({
  onSeek,
  onSelectBlock,
  onSelectSection,
  playheadRef,
  projectEndTick,
  selectedBlockId,
  selectedSectionId,
  timelineWidth,
  workspace,
}: {
  onSeek: (tick: Tick) => void
  onSelectBlock: (block: Block) => void
  onSelectSection: (section: Section) => void
  playheadRef: RefObject<HTMLDivElement | null>
  projectEndTick: Tick
  selectedBlockId: string | null
  selectedSectionId: string | null
  timelineWidth: number
  workspace: Workspace
}) {
  const isDraggingPlayheadRef = useRef(false)
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const tracks = selectTracks(workspace)
  const barMarkers = useMemo(() => getBarMarkers(workspace, timelineWidth), [workspace, timelineWidth])
  const getSeekTickFromClientX = useCallback((clientX: number) => {
    if (timelineContentRef.current === null) {
      return 0
    }

    const rect = timelineContentRef.current.getBoundingClientRect()
    const rawTick = (clientX - rect.left - TRACK_LABEL_WIDTH) / TICK_WIDTH

    return Math.max(0, Math.min(projectEndTick, Math.round(rawTick)))
  }, [projectEndTick])

  function handlePlayheadPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.stopPropagation()
    isDraggingPlayheadRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    onSeek(getSeekTickFromClientX(event.clientX))
  }

  function handlePlayheadPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingPlayheadRef.current) {
      return
    }

    event.preventDefault()
    onSeek(getSeekTickFromClientX(event.clientX))
  }

  function handlePlayheadPointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingPlayheadRef.current) {
      return
    }

    isDraggingPlayheadRef.current = false

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <Box style={{ overflowX: 'auto', paddingBottom: 8 }}>
      <Box
        ref={timelineContentRef}
        style={{
          minWidth: timelineWidth + TRACK_LABEL_WIDTH,
          position: 'relative',
        }}
      >
        <Box
          style={{
            height: 32,
            marginLeft: TRACK_LABEL_WIDTH,
            position: 'relative',
            width: timelineWidth,
          }}
        >
          {barMarkers.map(marker => (
            <Box
              key={marker.tick}
              style={{
                borderLeft: '1px solid var(--mantine-color-gray-4)',
                height: '100%',
                left: marker.left,
                position: 'absolute',
                top: 0,
              }}
            >
              <Text c="dimmed" size="xs" style={{ paddingLeft: 4 }}>
                {marker.label}
              </Text>
            </Box>
          ))}
        </Box>

        <Box
          style={{
            marginLeft: TRACK_LABEL_WIDTH,
            position: 'absolute',
            top: 0,
            width: timelineWidth,
          }}
        >
          {workspace.arrangement.sections.map(section => (
            <Box
              key={section.id}
              onClick={(event) => {
                event.stopPropagation()
                onSelectSection(section)
              }}
              title={`${section.name}: ${formatTickRangeAsBars(workspace.timeline, section.startTick, getSectionEndTick(section))}`}
              style={{
                background: 'var(--mantine-color-gray-1)',
                border: '1px solid var(--mantine-color-gray-3)',
                borderRadius: 4,
                cursor: 'pointer',
                height: 24,
                left: section.startTick * TICK_WIDTH,
                outline: section.id === selectedSectionId ? '2px solid var(--mantine-color-blue-6)' : undefined,
                overflow: 'hidden',
                paddingInline: 6,
                position: 'absolute',
                top: 4,
                width: Math.max(24, section.lengthTicks * TICK_WIDTH),
              }}
            >
              <Text size="xs" truncate>{section.name}</Text>
            </Box>
          ))}
        </Box>

        <Stack gap={0}>
          {tracks.map(track => (
            <MemoizedTimelineTrackRow
              key={track.id}
              onSelectBlock={onSelectBlock}
              selectedBlockId={selectedBlockId}
              timelineWidth={timelineWidth}
              track={track}
              workspace={workspace}
            />
          ))}
        </Stack>

        <Box
          ref={playheadRef}
          onPointerCancel={handlePlayheadPointerEnd}
          onPointerDown={handlePlayheadPointerDown}
          onPointerMove={handlePlayheadPointerMove}
          onPointerUp={handlePlayheadPointerEnd}
          style={{
            bottom: 0,
            cursor: 'ew-resize',
            left: TRACK_LABEL_WIDTH - 5,
            pointerEvents: 'auto',
            position: 'absolute',
            top: 0,
            touchAction: 'none',
            transform: 'translateX(0)',
            width: 12,
            willChange: 'transform',
            zIndex: 4,
          }}
        >
          <Box
            style={{
              background: 'var(--mantine-color-red-6)',
              height: '100%',
              marginInline: 'auto',
              width: 2,
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}

const MemoizedTimelineTrackRow = memo(TimelineTrackRow)

function TimelineTrackRow({
  onSelectBlock,
  selectedBlockId,
  timelineWidth,
  track,
  workspace,
}: {
  onSelectBlock: (block: Block) => void
  selectedBlockId: string | null
  timelineWidth: number
  track: Track
  workspace: Workspace
}) {
  const blocks = selectBlocksForTrack(workspace, track.id)

  return (
    <Group gap={0} wrap="nowrap" style={{ height: TRACK_ROW_HEIGHT }}>
      <Box
        style={{
          alignItems: 'center',
          borderTop: '1px solid var(--mantine-color-gray-3)',
          display: 'flex',
          height: '100%',
          paddingRight: 8,
          width: TRACK_LABEL_WIDTH,
        }}
      >
        <Stack gap={0}>
          <Text fw={600} size="sm" truncate>{track.name}</Text>
          <Text c="dimmed" size="xs">{track.role}</Text>
        </Stack>
      </Box>
      <Box
        style={{
          background: 'var(--mantine-color-gray-0)',
          borderTop: '1px solid var(--mantine-color-gray-3)',
          height: '100%',
          position: 'relative',
          width: timelineWidth,
        }}
      >
        {blocks.map((block) => {
          const pattern = selectPattern(workspace, block.patternId)

          return (
            <Box
              key={block.id}
              onClick={(event) => {
                event.stopPropagation()
                onSelectBlock(block)
              }}
              title={`${block.name}: ${formatTickRangeAsBars(workspace.timeline, block.startTick, getBlockEndTick(block))}`}
              style={{
                background: block.muted ? 'var(--mantine-color-gray-4)' : block.color,
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: 4,
                color: 'white',
                cursor: 'pointer',
                height: 34,
                left: block.startTick * TICK_WIDTH,
                opacity: block.muted ? 0.55 : 0.95,
                outline: block.id === selectedBlockId ? '2px solid var(--mantine-color-yellow-4)' : undefined,
                overflow: 'hidden',
                padding: '4px 6px',
                position: 'absolute',
                top: 11,
                width: Math.max(48, block.lengthTicks * TICK_WIDTH),
              }}
            >
              <Text fw={600} size="xs" truncate>{block.name}</Text>
              <Text size="xs" truncate>{pattern?.name ?? block.patternId}</Text>
            </Box>
          )
        })}
      </Box>
    </Group>
  )
}

function StatsGrid({ items }: { items: Array<[string, number]> }) {
  return (
    <SimpleGrid cols={4}>
      {items.map(([label, value]) => (
        <Paper key={label} withBorder radius="sm" p="xs">
          <Text c="dimmed" size="xs">{label}</Text>
          <Text fw={700}>{value}</Text>
        </Paper>
      ))}
    </SimpleGrid>
  )
}

function DomainList({ children, title }: { children: ReactNode, title: string }) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Title order={2} size="h3">{title}</Title>
        <Stack gap="xs">
          {children}
        </Stack>
      </Stack>
    </Paper>
  )
}

function TrackRow({ track }: { track: Track }) {
  return (
    <Paper withBorder radius="sm" p="xs">
      <Group justify="space-between">
        <Box>
          <Text fw={600} size="sm">{track.name}</Text>
          <Text c="dimmed" size="xs">{track.id}</Text>
        </Box>
        <Group gap="xs">
          <Badge variant="light">{track.role}</Badge>
          <Badge color="gray" variant="light">{track.accepts.join(', ')}</Badge>
        </Group>
      </Group>
    </Paper>
  )
}

function PatternRow({ pattern, workspace }: { pattern: Pattern, workspace: Workspace }) {
  return (
    <Paper withBorder radius="sm" p="xs">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text fw={600} size="sm">{pattern.name}</Text>
          <Text c="dimmed" size="xs">
            {pattern.id}
            {' '}
            |
            {' '}
            {formatDurationAsBars(workspace.timeline, pattern.lengthTicks)}
          </Text>
          <Text c="dimmed" size="xs">{getPatternEventSummary(pattern)}</Text>
        </Box>
        <Stack gap={4} align="flex-end">
          <Badge variant="light">{pattern.kind}</Badge>
          <Text c="dimmed" size="xs">
            {pattern.events.length}
            {' '}
            events
          </Text>
        </Stack>
      </Group>
    </Paper>
  )
}

function getPatternEventSummary(pattern: Pattern): string {
  if (pattern.events.length === 0) {
    return 'empty'
  }

  return pattern.events.map((event) => {
    if (event.kind === 'chord') {
      return formatChordSymbol(event.chord)
    }

    if (event.kind === 'note') {
      return `MIDI ${event.pitch}`
    }

    if (event.kind === 'drumHit') {
      return event.kitPiece
    }

    return event.parameter
  }).join(', ')
}

function SectionRow({ section, workspace }: { section: Section, workspace: Workspace }) {
  return (
    <Paper withBorder radius="sm" p="xs">
      <Group justify="space-between">
        <Box>
          <Text fw={600} size="sm">{section.name}</Text>
          <Text c="dimmed" size="xs">
            {formatTickRangeAsBars(workspace.timeline, section.startTick, getSectionEndTick(section))}
          </Text>
        </Box>
      </Group>
    </Paper>
  )
}

function BlockRow({
  block,
  pattern,
  track,
  workspace,
}: {
  block: Block
  pattern?: Pattern
  track?: Track
  workspace: Workspace
}) {
  return (
    <Paper withBorder radius="sm" p="xs">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Text fw={600} size="sm">{block.name}</Text>
          <Text c="dimmed" size="xs">
            {track?.name ?? block.trackId}
            {' '}
            |
            {' '}
            {pattern?.name ?? block.patternId}
          </Text>
        </Box>
        <Stack gap={4} align="flex-end">
          <Badge variant="light">{block.playbackMode}</Badge>
          <Text c="dimmed" size="xs">
            {formatTickRangeAsBars(workspace.timeline, block.startTick, getBlockEndTick(block))}
          </Text>
        </Stack>
      </Group>
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

function getNameOrFallback(value: string, fallback: string): string {
  return value.trim() === '' ? fallback : value.trim()
}

function capitalize(value: string): string {
  return value.length === 0 ? value : `${value[0].toUpperCase()}${value.slice(1)}`
}

function getBarMarkers(workspace: Workspace, timelineWidth: number): Array<{
  label: string
  left: number
  tick: Tick
}> {
  const markers: Array<{ label: string, left: number, tick: Tick }> = []
  const projectEndTick = selectWorkspaceEndTick(workspace)
  let tick = 0

  while (tick <= projectEndTick) {
    const barBeat = tickToBarBeat(workspace.timeline, tick)
    const meter = getMeterAtTick(workspace.timeline, tick)
    const ticksPerBeat = getTicksPerBeat(meter, workspace.timeline.ppq)
    const nextTick = tick + (meter.numerator * ticksPerBeat)

    markers.push({
      label: `${barBeat.bar}`,
      left: Math.min(timelineWidth, tick * TICK_WIDTH),
      tick,
    })

    tick = nextTick
  }

  return markers
}

function createEntityId(prefix: string, existingCount: number): string {
  return `${prefix}_${existingCount + 1}`
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

function formatOutput(value: unknown): string {
  if (value === undefined) {
    return 'undefined'
  }

  const json = JSON.stringify(value, null, 2)

  return json ?? String(value)
}

const preStyle = {
  background: 'var(--mantine-color-gray-0)',
  border: '1px solid var(--mantine-color-gray-3)',
  borderRadius: 4,
  fontSize: 12,
  maxHeight: 360,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
}
