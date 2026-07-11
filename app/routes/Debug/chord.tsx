import { useMemo, useState } from 'react'
import { type MetaArgs } from 'react-router'
import {
  Badge,
  Box,
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
  CHORD_ALTERATIONS,
  CHORD_EXTENSIONS,
  CHORD_FUNCTIONS,
  CHORD_QUALITIES,
  type ChordAlteration,
  type ChordExtension,
  type ChordFunction,
  type ChordQuality,
  createChordSymbol,
  createDefaultChordVoicing,
  DEFAULT_VOICING_OCTAVE,
  formatChordSymbol,
  getChordPitchClasses,
  getNoteNameForPitchClass,
  getOctaveForMidiNote,
  materializeChordVoicing,
  type MidiNote,
  type Mode,
  MODES,
  type Octave,
  PITCH_CLASSES,
  type PitchClass,
  pitchClassFromMidiNote,
  type Register,
  REGISTERS,
  type VoicedNote,
  VOICING_TYPES,
  type VoicingType,
} from '~/domain'
import { parseInteger } from '~/utils/number'

const KEY_COUNT = 60
const PIANO_ROLL_START_OCTAVE: Octave = 1
const NO_PITCH_CLASS = 'none'
const BLACK_PITCH_CLASSES = new Set<PitchClass>([1, 3, 6, 8, 10])

type OptionalPitchClass = typeof NO_PITCH_CLASS | string

type PianoKey = {
  isBlackKey: boolean
  midiNote: MidiNote
  noteName: string
  octave: Octave
  pitchClass: PitchClass
}

const PITCH_CLASS_OPTIONS = PITCH_CLASSES.map(pitchClass => ({
  label: `${getNoteNameForPitchClass(pitchClass)} (${pitchClass})`,
  value: `${pitchClass}`,
}))

const OPTIONAL_PITCH_CLASS_OPTIONS = [
  { label: 'None', value: NO_PITCH_CLASS },
  ...PITCH_CLASS_OPTIONS,
]

const CHORD_EXTENSION_OPTIONS = [NO_PITCH_CLASS, ...CHORD_EXTENSIONS].map(value => ({
  label: value === NO_PITCH_CLASS ? 'None' : value,
  value,
}))

const CHORD_ALTERATION_OPTIONS = [NO_PITCH_CLASS, ...CHORD_ALTERATIONS].map(value => ({
  label: value === NO_PITCH_CLASS ? 'None' : value,
  value,
}))

export function meta({ }: MetaArgs) {
  return [
    { title: 'Loop Forge - Chord' },
  ]
}

export default function Chord() {
  const [root, setRoot] = useState('0')
  const [quality, setQuality] = useState<ChordQuality>('major')
  const [extension, setExtension] = useState<ChordExtension | typeof NO_PITCH_CLASS>(NO_PITCH_CLASS)
  const [alteration, setAlteration] = useState<ChordAlteration | typeof NO_PITCH_CLASS>(NO_PITCH_CLASS)
  const [chordFunction, setChordFunction] = useState<ChordFunction>('tonic')
  const [tonic, setTonic] = useState('0')
  const [mode, setMode] = useState<Mode>('major')
  const [voicingType, setVoicingType] = useState<VoicingType>('closed')
  const [inversion, setInversion] = useState('0')
  const [register, setRegister] = useState<Register>('mid')
  const [spread, setSpread] = useState('0')
  const [octave, setOctave] = useState('3')
  const [bassNote, setBassNote] = useState<OptionalPitchClass>('0')

  const chord = useMemo(() => createChordSymbol({
    alterations: alteration === NO_PITCH_CLASS ? [] : [alteration],
    extensions: extension === NO_PITCH_CLASS ? [] : [extension],
    quality,
    root: parsePitchClass(root),
  }), [alteration, extension, quality, root])

  const voicing = useMemo(() => createDefaultChordVoicing({
    bassNote: bassNote === NO_PITCH_CLASS ? undefined : parsePitchClass(bassNote),
    inversion: parseInteger(inversion),
    octave: parseOptionalOctave(octave),
    register,
    spread: parseInteger(spread),
    type: voicingType,
  }), [bassNote, inversion, octave, register, spread, voicingType])

  const voicedNotes = useMemo(() => materializeChordVoicing(chord, voicing), [chord, voicing])
  const baseOctave = voicing.octave ?? DEFAULT_VOICING_OCTAVE
  const chordName = formatChordSymbol(chord)
  const chordToneLabels = getChordPitchClasses(chord).map(getNoteNameForPitchClass)
  const voicedNoteLabels = voicedNotes.map(formatVoicedNote)
  const tonicLabel = getNoteNameForPitchClass(parsePitchClass(tonic))
  const bassNoteLabel = bassNote === NO_PITCH_CLASS ? 'None' : getNoteNameForPitchClass(parsePitchClass(bassNote))

  return (
    <AppProvider>
      <AppLayout>
        <Stack gap="lg" py="lg">
          <Group justify="space-between" align="flex-end">
            <Stack gap={2}>
              <Title order={1}>Chord</Title>
              <DebugNav />
              <Group gap="xs">
                <Badge variant="light">Harmony</Badge>
                <Badge variant="light">Voicing</Badge>
                <Badge variant="light">Piano roll</Badge>
              </Group>
            </Stack>
            <Badge color="blue" variant="light">
              {chordName}
            </Badge>
          </Group>

          <PianoRoll
            hasBassNote={voicing.bassNote !== undefined}
            notes={voicedNotes}
          />

          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <SettingsPanel
              baseOctave={baseOctave}
              bassNote={bassNoteLabel}
              chordFunction={chordFunction}
              chordName={chordName}
              chordTones={chordToneLabels}
              mode={mode}
              tonic={tonicLabel}
              voicedNotes={voicedNoteLabels}
              voicingLabel={`${voicingType}, inversion ${voicing.inversion}, ${register}, spread ${voicing.spread}, octave ${baseOctave}`}
            />

            <Paper withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Title order={2} size="h3">Harmony</Title>
                <SelectField label="Root" value={root} data={PITCH_CLASS_OPTIONS} onChange={setRoot} />
                <SelectField label="Chord Quality" value={quality} data={CHORD_QUALITIES} onChange={setQuality} />
                <SelectField label="Extension" value={extension} data={CHORD_EXTENSION_OPTIONS} onChange={setExtension} />
                <SelectField label="Alteration" value={alteration} data={CHORD_ALTERATION_OPTIONS} onChange={setAlteration} />
                <SelectField label="Chord Function" value={chordFunction} data={CHORD_FUNCTIONS} onChange={setChordFunction} />
                <SelectField label="Tonic" value={tonic} data={PITCH_CLASS_OPTIONS} onChange={setTonic} />
                <SelectField label="Mode" value={mode} data={MODES} onChange={setMode} />
              </Stack>
            </Paper>

            <Paper withBorder radius="sm" p="md">
              <Stack gap="sm">
                <Title order={2} size="h3">Voicing</Title>
                <SelectField label="Voicing Type" value={voicingType} data={VOICING_TYPES} onChange={setVoicingType} />
                <TextField label="Inversion" value={inversion} onChange={setInversion} />
                <SelectField label="Register" value={register} data={REGISTERS} onChange={setRegister} />
                <TextField label="Spread" value={spread} onChange={setSpread} />
                <TextField label="Octave" value={octave} onChange={setOctave} />
                <SelectField label="Bass Note" value={bassNote} data={OPTIONAL_PITCH_CLASS_OPTIONS} onChange={setBassNote} />
              </Stack>
            </Paper>
          </SimpleGrid>
        </Stack>
      </AppLayout>
    </AppProvider>
  )
}

function PianoRoll({
  hasBassNote,
  notes,
}: {
  hasBassNote: boolean
  notes: VoicedNote[]
}) {
  const keys = createPianoKeys(PIANO_ROLL_START_OCTAVE)
  const notesByMidiNote = new Map(notes.map(note => [note.midiNote, note]))
  const bassMidiNote = hasBassNote ? notes[0]?.midiNote : undefined

  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2} size="h3">Piano Roll</Title>
          <Badge variant="light">
            {formatOctaveRange(PIANO_ROLL_START_OCTAVE)}
          </Badge>
        </Group>

        <Box style={{ overflowX: 'auto' }}>
          <Box
            aria-label="Chord piano roll"
            role="list"
            style={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: `repeat(${KEY_COUNT}, minmax(14px, 1fr))`,
              minWidth: 960,
            }}
          >
            {keys.map(key => (
              <PianoRollKey
                key={key.midiNote}
                keyData={key}
                note={notesByMidiNote.get(key.midiNote)}
                tone={key.midiNote === bassMidiNote ? 'bass' : 'chord'}
              />
            ))}
          </Box>
        </Box>
      </Stack>
    </Paper>
  )
}

function PianoRollKey({
  keyData,
  note,
  tone,
}: {
  keyData: PianoKey
  note?: VoicedNote
  tone: 'bass' | 'chord'
}) {
  const highlighted = note !== undefined
  const background = getKeyBackground(keyData.isBlackKey, highlighted, tone)
  const borderColor = getKeyBorderColor(keyData.isBlackKey, highlighted, tone)
  const textColor = getKeyTextColor(keyData.isBlackKey, highlighted)
  const label = highlighted
    ? `${keyData.noteName}${keyData.octave}`
    : ''

  return (
    <Box
      aria-label={`${keyData.noteName}${keyData.octave}`}
      role="listitem"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 172,
        justifyContent: 'space-between',
      }}
    >
      <Box
        style={{
          alignItems: 'flex-end',
          background,
          border: `1px solid ${borderColor}`,
          borderRadius: 3,
          color: textColor,
          display: 'flex',
          height: keyData.isBlackKey ? 108 : 150,
          justifyContent: 'center',
          padding: '0 2px 8px',
        }}
      >
        {label.length > 0 && (
          <Text
            fw={highlighted ? 700 : 500}
            size="10px"
            style={{
              lineHeight: 1,
              overflowWrap: 'anywhere',
              textAlign: 'center',
            }}
          >
            {label}
          </Text>
        )}
      </Box>
      <Box
        style={{
          background: 'transparent',
          borderRadius: 999,
          height: 4,
        }}
      />
    </Box>
  )
}

function SettingsPanel({
  baseOctave,
  bassNote,
  chordFunction,
  chordName,
  chordTones,
  mode,
  tonic,
  voicedNotes,
  voicingLabel,
}: {
  baseOctave: Octave
  bassNote: string
  chordFunction: ChordFunction
  chordName: string
  chordTones: string[]
  mode: Mode
  tonic: string
  voicedNotes: string[]
  voicingLabel: string
}) {
  return (
    <Paper withBorder radius="sm" p="md">
      <Stack gap="sm">
        <Title order={2} size="h3">Current</Title>
        <SettingValue label="Chord Name" value={chordName} />
        <SettingValue label="Chord Tones" value={chordTones.join(', ')} />
        <SettingValue label="Voiced Notes" value={voicedNotes.join(', ')} />
        <Divider />
        <SettingValue label="Function" value={chordFunction} />
        <SettingValue label="Key" value={`${tonic} ${mode}`} />
        <SettingValue label="Voicing" value={voicingLabel} />
        <SettingValue label="Base Octave" value={`${baseOctave}`} />
        <SettingValue label="Bass Note" value={bassNote} />
      </Stack>
    </Paper>
  )
}

function SettingValue({ label, value }: { label: string, value: string }) {
  return (
    <Box>
      <Text c="dimmed" size="xs" tt="uppercase">
        {label}
      </Text>
      <Text fw={650} size="sm">
        {value.length > 0 ? value : 'None'}
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

function createPianoKeys(startOctave: Octave): PianoKey[] {
  const startMidiNote = ((startOctave + 1) * 12) as MidiNote

  return Array.from({ length: KEY_COUNT }, (_, index) => {
    const midiNote = (startMidiNote + index) as MidiNote
    const pitchClass = pitchClassFromMidiNote(midiNote)

    return {
      isBlackKey: BLACK_PITCH_CLASSES.has(pitchClass),
      midiNote,
      noteName: getNoteNameForPitchClass(pitchClass),
      octave: getOctaveForMidiNote(midiNote),
      pitchClass,
    }
  })
}

function getKeyBackground(isBlackKey: boolean, highlighted: boolean, tone: 'bass' | 'chord'): string {
  if (highlighted && tone === 'bass') {
    return 'var(--mantine-color-blue-3)'
  }

  if (highlighted) {
    return 'var(--mantine-color-red-1)'
  }

  return isBlackKey ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-0)'
}

function getKeyBorderColor(isBlackKey: boolean, highlighted: boolean, tone: 'bass' | 'chord'): string {
  if (highlighted && tone === 'bass') {
    return 'var(--mantine-color-blue-7)'
  }

  if (highlighted) {
    return 'var(--mantine-color-red-5)'
  }

  return isBlackKey ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-4)'
}

function getKeyTextColor(isBlackKey: boolean, highlighted: boolean): string {
  if (highlighted) {
    return 'var(--mantine-color-dark-8)'
  }

  return isBlackKey ? 'var(--mantine-color-gray-0)' : 'var(--mantine-color-gray-8)'
}

function formatOctaveRange(startOctave: Octave): string {
  return `C${startOctave} - B${startOctave + 4}`
}

function formatVoicedNote(note: VoicedNote): string {
  return `${getNoteNameForPitchClass(note.pitchClass)}${note.octave} (${note.midiNote})`
}

function parsePitchClass(value: string): PitchClass {
  const parsed = Number.parseInt(value, 10)

  return PITCH_CLASSES.includes(parsed as PitchClass) ? parsed as PitchClass : 0
}

function parseOptionalOctave(value: string): Octave | undefined {
  if (value.trim().length === 0) {
    return undefined
  }

  return parseInteger(value) as Octave
}
