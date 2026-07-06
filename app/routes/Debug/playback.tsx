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
  createDemoLoopProject,
  createLargeSketchProject,
  createPattern,
  createProjectDraft,
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
  getBlocksForTrack,
  getMeterAtTick,
  getProjectEndTick,
  getProjectPattern,
  getProjectTrack,
  getTempoAtTick,
  getTicksPerBeat,
  type Pattern,
  PATTERN_KINDS,
  type PatternKind,
  type PitchClass,
  type Project,
  type Section,
  stampProject,
  summarizeProjectAction,
  type Tick,
  tickToBarBeat,
  TIME_SIGNATURE_DENOMINATORS,
  type TimeSignatureDenominator,
  toTimelineTick,
  type Track,
  TRACK_ROLES,
  type TrackRole,
  type TransportStatus,
  validateProject,
} from '~/domain'
import {
  TransportEngine,
  type TransportSnapshot,
} from '~/utils/playback'

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

type LastAction = {
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
  const [project, setProject] = useState(() => createProjectDraft({
    bpm: 120,
    denominator: 4,
    name: 'Playback Sketch',
    numerator: 4,
  }))
  const engineRef = useRef<TransportEngine | null>(null)

  if (engineRef.current === null) {
    engineRef.current = new TransportEngine(project)
  }

  const engine = engineRef.current

  const [trackName, setTrackName] = useState('')
  const [trackRole, setTrackRole] = useState<TrackRole>('melody')
  const [trackVolume, setTrackVolume] = useState('0.85')

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

  const [lastAction, setLastAction] = useState<LastAction | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const projectErrors = useMemo(() => validateProject(project), [project])

  useEffect(() => {
    engine.setProject(project)
  }, [engine, project])

  useEffect(() => {
    return () => {
      engine.destroy()
    }
  }, [engine])

  function runAction(label: string, action: () => unknown) {
    try {
      const value = action()

      setLastAction({ label, value })
      setErrorMessage(null)
    }
    catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error))
    }
  }

  function updateProject(label: string, updater: (currentProject: Project) => Project) {
    runAction(label, () => {
      const nextProject = updater(project)

      setProject(nextProject)

      return summarizeProjectAction(nextProject)
    })
  }

  function handleCreateProject() {
    runAction('createBlankProject', () => {
      const nextProject = createProjectDraft({
        bpm: parseNumber(projectBpm),
        denominator: projectDenominator,
        name: getNameOrFallback(projectName, 'Playback Sketch'),
        numerator: parseInteger(projectNumerator),
      })

      setProject(nextProject)
      setSelectedTrackId(nextProject.tracks[0]?.id ?? '')
      setSelectedPatternId(nextProject.patterns[0]?.id ?? '')
      setSelectedSectionId(null)
      setSelectedBlockId(null)
      engine.seek(0)
      engine.setLoop({
        endTick: getProjectEndTick(nextProject),
        startTick: 0,
      }, true)

      return summarizeProjectAction(nextProject)
    })
  }

  function handleSeedDemoLoop() {
    runAction('seed demo loop', () => {
      const seeded = createDemoLoopProject(project)
      const nextProject = seeded.project
      const block = nextProject.arrangement.blocks.find(currentBlock => currentBlock.id === seeded.blockId)

      setProject(nextProject)
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
        ...summarizeProjectAction(nextProject),
      }
    })
  }

  function handleSeedLargeSketch() {
    runAction('seed large sketch', () => {
      const nextProject = createLargeSketchProject(project)

      setProject(nextProject)
      setSelectedTrackId(nextProject.tracks[0]?.id ?? '')
      setSelectedPatternId(nextProject.patterns[0]?.id ?? '')
      setSelectedSectionId(null)
      setSelectedBlockId(null)
      engine.seek(0)
      engine.setLoop({
        endTick: getProjectEndTick(nextProject),
        startTick: 0,
      }, true)

      return summarizeProjectAction(nextProject)
    })
  }

  function handleAddTrack() {
    updateProject('createTrack', (currentProject) => {
      const track = createTrack({
        id: createEntityId(`track_${trackRole}`, currentProject.tracks.length),
        name: getNameOrFallback(trackName, `${capitalize(trackRole)} Track ${currentProject.tracks.length + 1}`),
        role: trackRole,
        volume: parseNumber(trackVolume),
      })

      setSelectedTrackId(track.id)

      return stampProject({
        ...currentProject,
        tracks: [...currentProject.tracks, track],
      })
    })
  }

  function handleAddSection() {
    updateProject('createSection', (currentProject) => {
      const section = createSection({
        id: createEntityId('section', currentProject.arrangement.sections.length),
        lengthTicks: barLengthValueToTicks(currentProject.timeline, sectionLengthBars),
        name: getNameOrFallback(sectionName, `Section ${currentProject.arrangement.sections.length + 1}`),
        startTick: barStartValueToTick(currentProject.timeline, sectionStartBar),
      })
      const nextProject = stampProject({
        ...currentProject,
        arrangement: {
          ...currentProject.arrangement,
          sections: [...currentProject.arrangement.sections, section],
        },
      })

      setSelectedSectionId(null)
      setSelectedBlockId(null)
      setSectionName('')

      return nextProject
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
    updateProject('updateSection', (currentProject) => {
      if (selectedSectionId === null) {
        throw new Error('Select a section before updating.')
      }

      const section = createSection({
        id: selectedSectionId,
        lengthTicks: barLengthValueToTicks(currentProject.timeline, sectionLengthBars),
        name: getNameOrFallback(sectionName, `Section ${currentProject.arrangement.sections.length}`),
        startTick: barStartValueToTick(currentProject.timeline, sectionStartBar),
      })
      let didUpdate = false
      const sections = currentProject.arrangement.sections.map((currentSection) => {
        if (currentSection.id !== selectedSectionId) {
          return currentSection
        }

        didUpdate = true
        return section
      })

      if (!didUpdate) {
        throw new Error(`Section ${selectedSectionId} no longer exists.`)
      }

      return stampProject({
        ...currentProject,
        arrangement: {
          ...currentProject.arrangement,
          sections,
        },
      })
    })
  }

  function handleDeleteSelectedSection() {
    updateProject('deleteSection', (currentProject) => {
      if (selectedSectionId === null) {
        throw new Error('Select a section before deleting.')
      }

      const sections = currentProject.arrangement.sections.filter(section => section.id !== selectedSectionId)

      if (sections.length === currentProject.arrangement.sections.length) {
        throw new Error(`Section ${selectedSectionId} no longer exists.`)
      }

      const nextProject = stampProject({
        ...currentProject,
        arrangement: {
          ...currentProject.arrangement,
          sections,
        },
      })

      setSelectedSectionId(null)
      setSectionName('')

      return nextProject
    })
  }

  function handleAddPattern() {
    updateProject('createPattern', (currentProject) => {
      const patternLengthTicks = barLengthValueToTicks(currentProject.timeline, patternLengthBars)
      const pattern = createPattern({
        events: createSeedPatternEvents(patternKind, patternLengthTicks, {
          chordQuality,
          chordRoot: parsePitchClass(chordRoot),
          drumPiece,
          notePitch: parseInteger(notePitch),
        }),
        id: createEntityId(`pattern_${patternKind}`, currentProject.patterns.length),
        kind: patternKind,
        lengthTicks: patternLengthTicks,
        metadata: { generatedBy: 'playback route' },
        name: getNameOrFallback(patternName, `${capitalize(patternKind)} Pattern ${currentProject.patterns.length + 1}`),
      })

      setSelectedPatternId(pattern.id)

      return stampProject({
        ...currentProject,
        patterns: [...currentProject.patterns, pattern],
      })
    })
  }

  function handleAddBlock(startTickOverride?: number) {
    updateProject('createBlock', (currentProject) => {
      const track = getProjectTrack(currentProject, selectedTrackId)
      const pattern = getProjectPattern(currentProject, selectedPatternId)

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
        id: createEntityId('block', currentProject.arrangement.blocks.length),
        lengthTicks: barLengthValueToTicks(currentProject.timeline, blockLengthBars),
        muted: blockMuted,
        name: getNameOrFallback(blockName, `Block ${currentProject.arrangement.blocks.length + 1}`),
        patternId: pattern.id,
        playbackMode: blockPlaybackMode,
        startTick: startTickOverride === undefined
          ? barStartValueToTick(currentProject.timeline, blockStartBar)
          : toTimelineTick(startTickOverride),
        trackId: track.id,
      })
      const nextProject = stampProject({
        ...currentProject,
        arrangement: {
          ...currentProject.arrangement,
          blocks: [...currentProject.arrangement.blocks, block],
        },
      })

      setSelectedBlockId(null)
      setSelectedSectionId(null)
      setBlockName('')

      return nextProject
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
    updateProject('updateBlock', (currentProject) => {
      if (selectedBlockId === null) {
        throw new Error('Select a block before updating.')
      }

      const track = getProjectTrack(currentProject, selectedTrackId)
      const pattern = getProjectPattern(currentProject, selectedPatternId)

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
        lengthTicks: barLengthValueToTicks(currentProject.timeline, blockLengthBars),
        muted: blockMuted,
        name: getNameOrFallback(blockName, `Block ${currentProject.arrangement.blocks.length}`),
        patternId: pattern.id,
        playbackMode: blockPlaybackMode,
        startTick: barStartValueToTick(currentProject.timeline, blockStartBar),
        trackId: track.id,
      })
      let didUpdate = false
      const blocks = currentProject.arrangement.blocks.map((currentBlock) => {
        if (currentBlock.id !== selectedBlockId) {
          return currentBlock
        }

        didUpdate = true
        return block
      })

      if (!didUpdate) {
        throw new Error(`Block ${selectedBlockId} no longer exists.`)
      }

      return stampProject({
        ...currentProject,
        arrangement: {
          ...currentProject.arrangement,
          blocks,
        },
      })
    })
  }

  function handleDeleteSelectedBlock() {
    updateProject('deleteBlock', (currentProject) => {
      if (selectedBlockId === null) {
        throw new Error('Select a block before deleting.')
      }

      const blocks = currentProject.arrangement.blocks.filter(block => block.id !== selectedBlockId)

      if (blocks.length === currentProject.arrangement.blocks.length) {
        throw new Error(`Block ${selectedBlockId} no longer exists.`)
      }

      const nextProject = stampProject({
        ...currentProject,
        arrangement: {
          ...currentProject.arrangement,
          blocks,
        },
      })

      setSelectedBlockId(null)
      setBlockName('')

      return nextProject
    })
  }

  const trackOptions = project.tracks.map(track => ({
    label: `${track.name} (${track.role})`,
    value: track.id,
  }))
  const patternOptions = project.patterns.map(pattern => ({
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
              <Text c="dimmed" size="sm">
                Project domain data with a transport engine clock.
              </Text>
            </Box>
          </Group>

          {errorMessage !== null && (
            <Paper withBorder radius="sm" p="sm" bg="red.0">
              <Text c="red" size="sm" fw={600}>{errorMessage}</Text>
            </Paper>
          )}

          <PlaybackRuntime
            engine={engine}
            lastAction={lastAction}
            onError={setErrorMessage}
            onSelectBlock={handleSelectBlock}
            onSelectSection={handleSelectSection}
            project={project}
            projectErrors={projectErrors}
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
                    ['Tracks', project.tracks.length],
                    ['Sections', project.arrangement.sections.length],
                    ['Patterns', project.patterns.length],
                    ['Blocks', project.arrangement.blocks.length],
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
                  <Field label="Volume" value={trackVolume} onChange={setTrackVolume} />
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
                  <Button variant="light" onClick={() => handleAddBlock(engine.getPlayheadTick())}>Add At Playhead</Button>
                  <Button variant="light" disabled={selectedBlockId === null} onClick={handleUpdateBlock}>Update Selected</Button>
                  <Button variant="light" color="red" disabled={selectedBlockId === null} onClick={handleDeleteSelectedBlock}>Delete Selected</Button>
                  <Button variant="subtle" disabled={selectedBlockId === null} onClick={handleClearSelectedBlock}>Clear Selection</Button>
                </Group>
              </Stack>
            </Paper>
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, md: 2 }}>
            <DomainList title="Tracks">
              {project.tracks.map(track => (
                <TrackRow key={track.id} track={track} />
              ))}
            </DomainList>

            <DomainList title="Patterns">
              {project.patterns.map(pattern => (
                <PatternRow key={pattern.id} pattern={pattern} project={project} />
              ))}
            </DomainList>

            <DomainList title="Sections">
              {project.arrangement.sections.map(section => (
                <SectionRow key={section.id} project={project} section={section} />
              ))}
            </DomainList>

            <DomainList title="Blocks">
              {project.arrangement.blocks.map(block => (
                <BlockRow key={block.id} block={block} pattern={getProjectPattern(project, block.patternId)} project={project} track={getProjectTrack(project, block.trackId)} />
              ))}
            </DomainList>
          </SimpleGrid>

        </Stack>
      </AppLayout>
    </AppProvider>
  )
}

function PlaybackRuntime({
  engine,
  lastAction,
  onError,
  onSelectBlock,
  onSelectSection,
  project,
  projectErrors,
  selectedBlockId,
  selectedSectionId,
}: {
  engine: TransportEngine
  lastAction: LastAction | null
  onError: (message: string | null) => void
  onSelectBlock: (block: Block) => void
  onSelectSection: (section: Section) => void
  project: Project
  projectErrors: string[]
  selectedBlockId: string | null
  selectedSectionId: string | null
}) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const [transportSnapshot, setTransportSnapshot] = useState<TransportSnapshot>(() => engine.getSnapshot())
  const [sliderTick, setSliderTick] = useState(() => toTimelineTick(engine.getPlayheadTick()))
  const projectEndTick = transportSnapshot.projectEndTick
  const timelineWidth = Math.max(860, Math.ceil(projectEndTick * TICK_WIDTH))
  const barOptions = STATIC_BAR_OPTIONS
  const activeTimelineTick = toTimelineTick(transportSnapshot.playheadTick)
  const activeTempo = getTempoAtTick(project.timeline, activeTimelineTick)
  const activeMeter = getMeterAtTick(project.timeline, activeTimelineTick)
  const activeBlocks = useMemo(
    () => project.arrangement.blocks.filter(block => transportSnapshot.activeBlockIds.includes(block.id)),
    [project.arrangement.blocks, transportSnapshot.activeBlockIds],
  )
  const handleSeek = useCallback((tick: Tick) => {
    const nextTick = toTimelineTick(tick)

    setSliderTick(nextTick)
    engine.seek(nextTick)
  }, [engine])

  useEffect(() => {
    return engine.subscribe((snapshot) => {
      setTransportSnapshot(snapshot)

      if (snapshot.status !== 'playing') {
        setSliderTick(snapshot.playheadTick)
      }
    })
  }, [engine])

  useEffect(() => {
    let frameId = 0
    let lastSliderUpdateMs = 0
    let lastSliderTick = toTimelineTick(engine.getPlayheadTick())

    function updatePlayheadTransform(nowMs: number) {
      const playheadTick = engine.getPlayheadTick()

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
  }, [engine])

  function handlePlay() {
    void engine.play().catch((error: unknown) => {
      onError(error instanceof Error ? error.message : String(error))
    })
  }

  function handlePause() {
    engine.pause()
  }

  function handleStop() {
    engine.stop()
  }

  function updateLoopRange(partialRange: Partial<{ endTick: Tick, startTick: Tick }>) {
    engine.setLoop({
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
                {formatTickAsBars(project.timeline, transportSnapshot.playheadTick)}
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
              onClick={() => engine.setLoop(transportSnapshot.loopRange, !transportSnapshot.loopEnabled)}
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
            <SelectField label="Loop start bar" value={formatTickToStartBar(project.timeline, transportSnapshot.loopRange?.startTick ?? 0)} data={barOptions} onChange={value => updateLoopRange({ startTick: barStartValueToTick(project.timeline, value) })} />
            <SelectField label="Loop end bar" value={formatTickToEndBar(project.timeline, transportSnapshot.loopRange?.endTick ?? projectEndTick)} data={barOptions} onChange={value => updateLoopRange({ endTick: barEndValueToTick(project.timeline, value) })} />
            <SelectField label="Playhead bar" value={formatTickToStartBar(project.timeline, transportSnapshot.playheadTick)} data={barOptions} onChange={value => handleSeek(barStartValueToTick(project.timeline, value))} />
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
        project={project}
        projectEndTick={projectEndTick}
        selectedBlockId={selectedBlockId}
        selectedSectionId={selectedSectionId}
        timelineWidth={timelineWidth}
      />

      <MemoizedPlaybackDomainState
        compileWarnings={transportSnapshot.compileWarnings}
        lastAction={lastAction}
        projectErrors={projectErrors}
      />
    </>
  )
}

const MemoizedPlaybackDomainState = memo(PlaybackDomainState)

function PlaybackDomainState({
  compileWarnings,
  lastAction,
  projectErrors,
}: {
  compileWarnings: TransportSnapshot['compileWarnings']
  lastAction: LastAction | null
  projectErrors: string[]
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Group justify="space-between">
          <Title order={2} size="h3">Domain State</Title>
          <Badge color={projectErrors.length === 0 ? 'green' : 'red'} variant="light">
            {projectErrors.length === 0 ? 'valid' : `${projectErrors.length} errors`}
          </Badge>
        </Group>
        {projectErrors.length > 0 && (
          <Stack gap={2}>
            {projectErrors.map(error => (
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
        {lastAction !== null && (
          <>
            <Divider />
            <Text size="sm" fw={600}>{lastAction.label}</Text>
            <Box component="pre" m={0} p="sm" style={preStyle}>
              {formatOutput(lastAction.value)}
            </Box>
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
  project,
  projectEndTick,
  selectedBlockId,
  selectedSectionId,
  timelineWidth,
}: {
  activeBlocks: Block[]
  onSeek: (tick: Tick) => void
  onSelectBlock: (block: Block) => void
  onSelectSection: (section: Section) => void
  playheadRef: RefObject<HTMLDivElement | null>
  project: Project
  projectEndTick: Tick
  selectedBlockId: string | null
  selectedSectionId: string | null
  timelineWidth: number
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
          project={project}
          projectEndTick={projectEndTick}
          selectedBlockId={selectedBlockId}
          selectedSectionId={selectedSectionId}
          timelineWidth={timelineWidth}
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
  project,
  projectEndTick,
  selectedBlockId,
  selectedSectionId,
  timelineWidth,
}: {
  onSeek: (tick: Tick) => void
  onSelectBlock: (block: Block) => void
  onSelectSection: (section: Section) => void
  playheadRef: RefObject<HTMLDivElement | null>
  project: Project
  projectEndTick: Tick
  selectedBlockId: string | null
  selectedSectionId: string | null
  timelineWidth: number
}) {
  const isDraggingPlayheadRef = useRef(false)
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const barMarkers = useMemo(() => getBarMarkers(project, timelineWidth), [project, timelineWidth])
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
          {project.arrangement.sections.map(section => (
            <Box
              key={section.id}
              onClick={(event) => {
                event.stopPropagation()
                onSelectSection(section)
              }}
              title={`${section.name}: ${formatTickRangeAsBars(project.timeline, section.startTick, section.startTick + section.lengthTicks)}`}
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
          {project.tracks.map(track => (
            <MemoizedTimelineTrackRow
              key={track.id}
              onSelectBlock={onSelectBlock}
              project={project}
              selectedBlockId={selectedBlockId}
              timelineWidth={timelineWidth}
              track={track}
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
  project,
  selectedBlockId,
  timelineWidth,
  track,
}: {
  onSelectBlock: (block: Block) => void
  project: Project
  selectedBlockId: string | null
  timelineWidth: number
  track: Track
}) {
  const blocks = getBlocksForTrack(project.arrangement, track.id)

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
          const pattern = getProjectPattern(project, block.patternId)

          return (
            <Box
              key={block.id}
              onClick={(event) => {
                event.stopPropagation()
                onSelectBlock(block)
              }}
              title={`${block.name}: ${formatTickRangeAsBars(project.timeline, block.startTick, getBlockEndTick(block))}`}
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

function PatternRow({ pattern, project }: { pattern: Pattern, project: Project }) {
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
            {formatDurationAsBars(project.timeline, pattern.lengthTicks)}
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

function SectionRow({ project, section }: { project: Project, section: Section }) {
  return (
    <Paper withBorder radius="sm" p="xs">
      <Group justify="space-between">
        <Box>
          <Text fw={600} size="sm">{section.name}</Text>
          <Text c="dimmed" size="xs">
            {formatTickRangeAsBars(project.timeline, section.startTick, section.startTick + section.lengthTicks)}
          </Text>
        </Box>
      </Group>
    </Paper>
  )
}

function BlockRow({
  block,
  pattern,
  project,
  track,
}: {
  block: Block
  pattern?: Pattern
  project: Project
  track?: Track
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
            {formatTickRangeAsBars(project.timeline, block.startTick, getBlockEndTick(block))}
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

function getBarMarkers(project: Project, timelineWidth: number): Array<{
  label: string
  left: number
  tick: Tick
}> {
  const markers: Array<{ label: string, left: number, tick: Tick }> = []
  const projectEndTick = getProjectEndTick(project)
  let tick = 0

  while (tick <= projectEndTick) {
    const barBeat = tickToBarBeat(project.timeline, tick)
    const meter = getMeterAtTick(project.timeline, tick)
    const ticksPerBeat = getTicksPerBeat(meter, project.timeline.ppq)
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
