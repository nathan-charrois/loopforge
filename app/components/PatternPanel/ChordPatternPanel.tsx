import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Badge,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'

import { Piano } from '~/components/Piano/Piano'
import { usePlaybackEngine } from '~/components/Providers/PlaybackProvider'
import {
  type Block,
  CHORD_LIBRARY_CATEGORIES,
  CHORD_PLAYBACK_RECIPE_GROUPS,
  CHORD_PLAYBACK_RECIPES,
  type ChordEvent,
  type ChordLibraryCategory,
  type ChordLibraryEntry,
  type ChordPattern,
  type ChordPlaybackStyle,
  createChordLibrary,
  DEFAULT_VOICING_OCTAVE,
  formatChordSymbol,
  getChordPitchClasses,
  getKeyAtTick,
  getNoteNameForPitchClass,
  getOctaveForMidiNote,
  materializeChordVoicing,
  type MidiNote,
  type PatternEvent,
  type PatternEventId,
  pitchClassFromMidiNote,
  REGISTERS,
  type Timeline,
  type VoicedNote,
  VOICING_TYPES,
} from '~/domain'
import {
  buildSchedule,
  type NotePlaybackTrigger,
} from '~/playback/buildSchedule'
import {
  type ActivePatternPanelTool,
  type PatternEventDraft,
} from '~/store/editor'
import type { Dispatch } from '~/store/session'
import type { Workspace } from '~/store/workspace'

const CATEGORY_LABELS: Record<ChordLibraryCategory, string> = {
  alterations: 'Alterations',
  borrowed: 'Borrowed',
  chromatic: 'Chromatic',
  color: 'Color',
  common: 'Common',
  diatonic: 'Diatonic',
  extensions: 'Extensions',
  modal: 'Modal',
  passing: 'Passing Dim.',
  secondary: 'Secondary',
  substitutions: 'Substitutions',
  suspended: 'Suspended',
}

const VOICING_TYPE_LABELS = {
  closed: 'Closed',
  drop2: 'Drop 2',
  open: 'Open',
  spread: 'Spread',
} as const

type Props = {
  dispatch: Dispatch
  workspace: Workspace
  tool: ActivePatternPanelTool
  timeline: Timeline
  focusedBlockId?: string
  selectedPatternEvent?: PatternEvent
  selectedPatternEventIds?: PatternEventId[]
  onDeletePatternEvent: (patternEventId: PatternEventId) => void
  onSelectPatternEvent: (patternEventId: PatternEventId, additive: boolean) => void
  onSetActiveTool: (tool: ActivePatternPanelTool) => void
  onUpdatePatternEventDraft: (patternEvent: PatternEvent, patternEventDraft: Partial<PatternEventDraft>) => void
  focusedBlock: Block
  pattern: ChordPattern
}

export const ChordPanel = memo(function ChordPanel({
  focusedBlock,
  onSelectPatternEvent,
  onUpdatePatternEventDraft,
  pattern,
  selectedPatternEvent,
  timeline,
  workspace,
}: Props) {
  const playbackEngine = usePlaybackEngine()
  const [activeCategory, setActiveCategory] = useState<ChordLibraryCategory>('diatonic')
  const [auditionError, setAuditionError] = useState<string | undefined>()
  const [isAuditioning, setIsAuditioning] = useState(false)

  const selectedChordEvent = selectedPatternEvent?.kind === 'chord'
    && pattern.events.some(event => event.id === selectedPatternEvent.id)
    ? selectedPatternEvent
    : undefined
  const timelineTick = focusedBlock.startTick + (selectedChordEvent?.timeTick ?? 0)
  const key = useMemo(
    () => getKeyAtTick(timeline, timelineTick),
    [timeline, timelineTick],
  )
  const library = useMemo(() => createChordLibrary(key), [key])
  const notes = useMemo(
    () => selectedChordEvent === undefined
      ? []
      : materializeChordVoicing(selectedChordEvent.chord, selectedChordEvent.voicing),
    [selectedChordEvent],
  )
  const scheduledChordEvent = useMemo(
    () => selectedChordEvent === undefined
      ? undefined
      : buildSchedule(workspace).events.find(scheduledEvent => (
          scheduledEvent.blockId === focusedBlock.id
          && scheduledEvent.event.id === selectedChordEvent.id
        )),
    [focusedBlock.id, selectedChordEvent, workspace],
  )
  const playbackTriggers = useMemo(
    () => scheduledChordEvent?.triggers.filter(
      (trigger): trigger is NotePlaybackTrigger => trigger.kind === 'note',
    ) ?? [],
    [scheduledChordEvent],
  )

  const updateChord = useCallback((chord: ChordEvent['chord']) => {
    if (selectedChordEvent === undefined) {
      return
    }

    onUpdatePatternEventDraft(selectedChordEvent, {
      patternEventChord: chord,
    })
  }, [onUpdatePatternEventDraft, selectedChordEvent])

  const updateVoicing = useCallback((voicing: Partial<ChordEvent['voicing']>) => {
    if (selectedChordEvent === undefined) {
      return
    }

    onUpdatePatternEventDraft(selectedChordEvent, {
      patternEventVoicing: {
        ...selectedChordEvent.voicing,
        ...voicing,
      },
    })
  }, [onUpdatePatternEventDraft, selectedChordEvent])

  const updatePlaybackRecipe = useCallback((recipeId: ChordEvent['playback']['recipeId']) => {
    if (selectedChordEvent === undefined || recipeId === undefined) {
      return
    }

    onUpdatePatternEventDraft(selectedChordEvent, {
      patternEventPlayback: {
        ...selectedChordEvent.playback,
        recipeId,
        style: CHORD_PLAYBACK_RECIPES[recipeId].style,
      },
    })
  }, [onUpdatePatternEventDraft, selectedChordEvent])

  const audition = useCallback(async () => {
    if (playbackTriggers.length === 0) {
      return
    }

    setAuditionError(undefined)
    setIsAuditioning(true)

    try {
      await playbackEngine.auditionTriggers(playbackTriggers)
    }
    catch (error) {
      setAuditionError(error instanceof Error ? error.message : 'Unable to audition this chord.')
    }
    finally {
      setIsAuditioning(false)
    }
  }, [
    playbackEngine,
    playbackTriggers,
  ])

  return (
    <Paper withBorder radius="sm" p="md" mb="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2} size="md">Chord Panel</Title>
            <Text c="dimmed" size="xs">
              Explore harmony and voicing; use Inspector for detailed event fields.
            </Text>
          </Box>
          <Badge color="violet" variant="light">
            {getNoteNameForPitchClass(key.tonic)}
            {' '}
            {key.mode}
          </Badge>
        </Group>

        <ChordEventPicker
          events={pattern.events}
          selectedEventId={selectedChordEvent?.id}
          onSelect={onSelectPatternEvent}
        />

        {selectedChordEvent === undefined
          ? (
              <Paper withBorder p="lg" radius="sm">
                <Text c="dimmed" size="sm" ta="center">
                  Select a chord event to explore its harmony, voicing, and playback.
                </Text>
              </Paper>
            )
          : (
              <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md" verticalSpacing="md">
                <ChordLibrarySection
                  activeCategory={activeCategory}
                  entries={library[activeCategory]}
                  selectedChord={selectedChordEvent.chord}
                  onChangeCategory={setActiveCategory}
                  onSelectChord={updateChord}
                />

                <Stack gap="md">
                  <VoicingSection
                    event={selectedChordEvent}
                    notes={notes}
                    onUpdate={updateVoicing}
                  />

                  <PlaybackSection
                    auditionError={auditionError}
                    event={selectedChordEvent}
                    isAuditioning={isAuditioning}
                    startTick={scheduledChordEvent?.startTick ?? 0}
                    triggers={playbackTriggers}
                    onAudition={() => void audition()}
                    onSelectRecipe={updatePlaybackRecipe}
                  />
                </Stack>
              </SimpleGrid>
            )}
      </Stack>
    </Paper>
  )
})

const ChordEventPicker = memo(function ChordEventPicker({
  events,
  onSelect,
  selectedEventId,
}: {
  events: ChordEvent[]
  onSelect: (patternEventId: PatternEventId, additive: boolean) => void
  selectedEventId?: PatternEventId
}) {
  return (
    <Stack gap={6}>
      <Text fw={700} size="xs">Chord Events</Text>
      <Group gap={6} wrap="wrap">
        {events.map(event => (
          <Button
            key={event.id}
            aria-pressed={selectedEventId === event.id}
            color="violet"
            size="compact-xs"
            variant={selectedEventId === event.id ? 'filled' : 'light'}
            onClick={() => onSelect(event.id, false)}
          >
            {formatChordSymbol(event.chord)}
            <Text component="span" inherit opacity={0.72} ml={5}>
              @
              {event.timeTick}
            </Text>
          </Button>
        ))}
      </Group>
    </Stack>
  )
})

const ChordLibrarySection = memo(function ChordLibrarySection({
  activeCategory,
  entries,
  onChangeCategory,
  onSelectChord,
  selectedChord,
}: {
  activeCategory: ChordLibraryCategory
  entries: ChordLibraryEntry[]
  onChangeCategory: (category: ChordLibraryCategory) => void
  onSelectChord: (chord: ChordEvent['chord']) => void
  selectedChord: ChordEvent['chord']
}) {
  return (
    <Paper withBorder h="100%" p="md" radius="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Box>
            <Text fw={700} size="sm" tt="uppercase">Chord Palette</Text>
            <Text c="dimmed" size="xs">Scale-aware chords for the current key</Text>
          </Box>
          <Badge color="violet" variant="light">
            {entries.length}
            {' '}
            chords
          </Badge>
        </Group>
        <Group gap={6} wrap="wrap">
          {CHORD_LIBRARY_CATEGORIES.map(category => (
            <Button
              key={category}
              aria-pressed={category === activeCategory}
              color="violet"
              size="compact-xs"
              variant={category === activeCategory ? 'filled' : 'subtle'}
              onClick={() => onChangeCategory(category)}
            >
              {CATEGORY_LABELS[category]}
            </Button>
          ))}
        </Group>
        <Box
          style={{
            display: 'grid',
            gap: 8,
            gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))',
          }}
        >
          {entries.map((entry) => {
            const selected = areSameChord(entry.chord, selectedChord)

            return (
              <Button
                key={`${entry.degree}:${formatChordSymbol(entry.chord)}`}
                aria-pressed={selected}
                color="violet"
                h={78}
                px="xs"
                variant={selected ? 'light' : 'default'}
                styles={{
                  inner: { height: '100%' },
                  label: { overflow: 'visible', width: '100%' },
                  root: selected
                    ? { boxShadow: 'inset 0 0 0 1px var(--mantine-color-violet-5)' }
                    : undefined,
                }}
                onClick={() => onSelectChord(entry.chord)}
              >
                <Stack align="center" gap={3} w="100%">
                  <Text component="span" fw={700} size="md">
                    {formatChordSymbol(entry.chord)}
                  </Text>
                  <Text component="span" c="dimmed" fw={600} size="xs">
                    {entry.degree}
                  </Text>
                </Stack>
              </Button>
            )
          })}
        </Box>
      </Stack>
    </Paper>
  )
})

const VoicingSection = memo(function VoicingSection({
  event,
  notes,
  onUpdate,
}: {
  event: ChordEvent
  notes: VoicedNote[]
  onUpdate: (voicing: Partial<ChordEvent['voicing']>) => void
}) {
  const chordToneCount = getChordPitchClasses(event.chord).length
  const pianoStartOctave = Math.min(
    ...notes.map(note => note.octave),
    event.voicing.octave ?? DEFAULT_VOICING_OCTAVE,
  )
  const pianoEndOctave = Math.max(
    ...notes.map(note => note.octave),
    pianoStartOctave + 1,
  )

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Box>
            <Text fw={700} size="sm" tt="uppercase">Voicing</Text>
            <Text c="dimmed" size="xs">Shape and register the realized chord</Text>
          </Box>
          <Badge color="violet" variant="light">{formatChordSymbol(event.chord)}</Badge>
        </Group>
        <OptionButtons
          label="Shape"
          options={VOICING_TYPES.map(type => ({
            label: VOICING_TYPE_LABELS[type],
            value: type,
          }))}
          value={event.voicing.type}
          onChange={type => onUpdate({ type })}
        />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm" verticalSpacing="sm">
          <OptionButtons
            label="Inversion"
            options={Array.from({ length: chordToneCount }, (_, inversion) => ({
              label: inversion === 0 ? 'Root' : `${inversion}`,
              value: inversion,
            }))}
            value={event.voicing.inversion}
            onChange={inversion => onUpdate({ inversion })}
          />
          <OptionButtons
            label="Octave"
            options={[2, 3, 4, 5, 6].map(octave => ({ label: `${octave}`, value: octave }))}
            value={event.voicing.octave ?? DEFAULT_VOICING_OCTAVE}
            onChange={octave => onUpdate({ octave })}
          />
          <OptionButtons
            label="Register"
            options={REGISTERS.map(register => ({
              label: `${register[0].toUpperCase()}${register.slice(1)}`,
              value: register,
            }))}
            value={event.voicing.register}
            onChange={register => onUpdate({ register })}
          />
          <OptionButtons
            label="Spread"
            options={[0, 1, 2, 3].map(spread => ({ label: `${spread}`, value: spread }))}
            value={event.voicing.spread}
            onChange={spread => onUpdate({ spread })}
          />
        </SimpleGrid>
        <Divider />
        <Piano
          hasBassNote={event.voicing.bassNote !== undefined}
          octaveCount={Math.max(2, pianoEndOctave - pianoStartOctave + 1)}
          startOctave={pianoStartOctave}
          voicedNotes={notes}
        />
        <Text c="dimmed" size="xs" ta="center">
          {notes.map(note => formatMidiNote(note.midiNote)).join(' · ')}
        </Text>
      </Stack>
    </Paper>
  )
})

const PlaybackSection = memo(function PlaybackSection({
  auditionError,
  event,
  isAuditioning,
  onAudition,
  onSelectRecipe,
  startTick,
  triggers,
}: {
  auditionError?: string
  event: ChordEvent
  isAuditioning: boolean
  onAudition: () => void
  onSelectRecipe: (recipeId: ChordEvent['playback']['recipeId']) => void
  startTick: number
  triggers: NotePlaybackTrigger[]
}) {
  const selectedPlaybackStyle = event.playback.recipeId === undefined
    ? event.playback.style
    : CHORD_PLAYBACK_RECIPES[event.playback.recipeId].style
  const [activePlaybackStyle, setActivePlaybackStyle] = useState<ChordPlaybackStyle>(
    selectedPlaybackStyle,
  )
  const activeGroup = CHORD_PLAYBACK_RECIPE_GROUPS.find(
    group => group.style === activePlaybackStyle,
  ) ?? CHORD_PLAYBACK_RECIPE_GROUPS[0]

  useEffect(() => {
    setActivePlaybackStyle(selectedPlaybackStyle)
  }, [event.id, event.playback.recipeId, selectedPlaybackStyle])

  return (
    <Paper withBorder p="md" radius="sm">
      <Stack gap="md">
        <Group justify="space-between">
          <Box>
            <Text fw={700} size="sm" tt="uppercase">Playback</Text>
            <Text c="dimmed" size="xs">
              {triggers.length}
              {' '}
              scheduled note triggers
            </Text>
          </Box>
          <Button
            color="violet"
            leftSection={<HugeiconsIcon icon={PlayIcon} size={14} />}
            loading={isAuditioning}
            size="compact-sm"
            onClick={onAudition}
          >
            Audition
          </Button>
        </Group>
        <Group gap={6} wrap="wrap">
          {CHORD_PLAYBACK_RECIPE_GROUPS.map(group => (
            <Button
              key={group.style}
              aria-pressed={group.style === activePlaybackStyle}
              color="violet"
              size="compact-xs"
              variant={group.style === activePlaybackStyle ? 'filled' : 'subtle'}
              onClick={() => setActivePlaybackStyle(group.style)}
            >
              {group.label}
              {' '}
              ·
              {' '}
              {group.recipeIds.length}
            </Button>
          ))}
        </Group>
        <Paper bg="var(--mantine-color-gray-0)" p="sm" radius="sm">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text c="dimmed" fw={700} size="10px" tt="uppercase">
                {activeGroup.label}
                {' '}
                recipes
              </Text>
              <Text c="dimmed" size="10px">
                {activeGroup.recipeIds.length}
                {' '}
                options
              </Text>
            </Group>
            <Group gap={4} wrap="wrap">
              {activeGroup.recipeIds.map((recipeId) => {
                const recipe = CHORD_PLAYBACK_RECIPES[recipeId]

                return (
                  <Button
                    key={recipeId}
                    aria-pressed={event.playback.recipeId === recipeId}
                    color="violet"
                    size="compact-xs"
                    variant={event.playback.recipeId === recipeId ? 'filled' : 'default'}
                    onClick={() => onSelectRecipe(recipeId)}
                  >
                    {recipe.name}
                  </Button>
                )
              })}
            </Group>
          </Stack>
        </Paper>
        <Divider label="Trigger Timing" labelPosition="left" />
        <PlaybackTriggerView
          durationTicks={event.durationTicks}
          startTick={startTick}
          triggers={triggers}
        />
        {auditionError !== undefined && (
          <Text c="red" size="xs">{auditionError}</Text>
        )}
      </Stack>
    </Paper>
  )
})

const PlaybackTriggerView = memo(function PlaybackTriggerView({
  durationTicks,
  startTick,
  triggers,
}: {
  durationTicks: number
  startTick: number
  triggers: NotePlaybackTrigger[]
}) {
  const pitches = [...new Set(triggers.map(trigger => trigger.pitch))]
    .sort((left, right) => right - left)
  const laneHeight = 25

  return (
    <Stack gap={4}>
      <Box
        aria-label="Chord playback note triggers"
        style={{
          display: 'grid',
          gridTemplateColumns: '34px minmax(0, 1fr)',
        }}
      >
        <Box>
          {pitches.map(pitch => (
            <Text
              key={pitch}
              c="dimmed"
              fw={700}
              size="10px"
              style={{ height: laneHeight, lineHeight: `${laneHeight}px` }}
            >
              {formatMidiNote(pitch)}
            </Text>
          ))}
        </Box>
        <Box
          style={{
            backgroundColor: 'var(--mantine-color-gray-0)',
            backgroundImage: 'linear-gradient(to right, var(--mantine-color-gray-3) 1px, transparent 1px)',
            backgroundSize: '25% 100%',
            border: '1px solid var(--mantine-color-gray-3)',
            borderRadius: 'var(--mantine-radius-xs)',
            height: Math.max(laneHeight, pitches.length * laneHeight),
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {pitches.map((_pitch, index) => (
            <Box
              key={index}
              aria-hidden
              style={{
                borderTop: index === 0 ? undefined : '1px solid var(--mantine-color-gray-2)',
                left: 0,
                position: 'absolute',
                right: 0,
                top: index * laneHeight,
              }}
            />
          ))}
          {triggers.map((trigger) => {
            const laneIndex = pitches.indexOf(trigger.pitch)
            const startOffsetTicks = trigger.startTick - startTick
            const left = startOffsetTicks / durationTicks * 100
            const width = trigger.durationTicks / durationTicks * 100
            const label = formatMidiNote(trigger.pitch)

            return (
              <Box
                key={trigger.id}
                title={`${label}: ${startOffsetTicks} + ${trigger.durationTicks} ticks`}
                style={{
                  alignItems: 'center',
                  background: 'var(--mantine-color-violet-6)',
                  borderRadius: 3,
                  color: 'white',
                  display: 'flex',
                  height: laneHeight - 5,
                  left: `${left}%`,
                  maxWidth: `${Math.max(0, 100 - left)}%`,
                  minWidth: 3,
                  overflow: 'hidden',
                  paddingInline: 4,
                  position: 'absolute',
                  top: (laneIndex * laneHeight) + 2,
                  width: `${width}%`,
                }}
              >
                <Text fw={700} size="10px" truncate>{label}</Text>
              </Box>
            )
          })}
        </Box>
      </Box>
      <Group justify="space-between" pl={34}>
        <Text c="dimmed" size="10px">0</Text>
        <Text c="dimmed" size="10px">
          {durationTicks}
          {' '}
          ticks
        </Text>
      </Group>
    </Stack>
  )
})

function OptionButtons<TValue extends number | string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: TValue) => void
  options: Array<{ label: string, value: TValue }>
  value: TValue
}) {
  return (
    <Stack gap={4}>
      <Text c="dimmed" fw={700} size="10px" tt="uppercase">{label}</Text>
      <Group gap={4} wrap="wrap">
        {options.map(option => (
          <Button
            key={`${option.value}`}
            aria-pressed={option.value === value}
            color="violet"
            size="compact-xs"
            variant={option.value === value ? 'filled' : 'default'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Group>
    </Stack>
  )
}

function formatMidiNote(midiNote: MidiNote): string {
  return `${getNoteNameForPitchClass(pitchClassFromMidiNote(midiNote))}${getOctaveForMidiNote(midiNote)}`
}

function areSameChord(
  left: ChordEvent['chord'],
  right: ChordEvent['chord'],
): boolean {
  return left.root === right.root
    && left.quality === right.quality
    && left.extensions.join(':') === right.extensions.join(':')
    && left.alterations.join(':') === right.alterations.join(':')
}
