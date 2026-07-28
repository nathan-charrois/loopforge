import { memo } from 'react'
import {
  Badge,
  Box,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'

import {
  getNoteNameForPitchClass,
  getOctaveForMidiNote,
  type MidiNote,
  type Octave,
  PITCH_CLASSES,
  type PitchClass,
  pitchClassFromMidiNote,
  type VoicedNote,
} from '~/domain'

const DEFAULT_PIANO_ROLL_START_OCTAVE: Octave = 3
const PIANO_ROLL_OCTAVE_COUNT = 4
const PIANO_ROLL_KEY_COUNT = PIANO_ROLL_OCTAVE_COUNT * PITCH_CLASSES.length
const PIANO_ROLL_WHITE_KEY_COUNT = PIANO_ROLL_OCTAVE_COUNT * 7
const BLACK_KEY_WIDTH_IN_WHITE_KEYS = 0.6
const BLACK_PITCH_CLASSES = new Set<PitchClass>([1, 3, 6, 8, 10])

type PianoKeyData = {
  isBlackKey: boolean
  midiNote: MidiNote
  noteName: string
  octave: Octave
  whiteKeyIndex: number
}

export const Piano = memo(function Piano({
  hasBassNote,
  startOctave = DEFAULT_PIANO_ROLL_START_OCTAVE,
  voicedNotes,
}: {
  hasBassNote: boolean
  startOctave?: Octave
  voicedNotes: VoicedNote[]
}) {
  const keys = createPianoKeys(startOctave)
  const voicedMidiNotes = new Set(voicedNotes.map(note => note.midiNote))
  const bassMidiNote = hasBassNote ? voicedNotes[0]?.midiNote : undefined

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Title order={2} size="h3">Piano Roll</Title>
        <Badge variant="light">
          {formatPianoOctaveRange(startOctave)}
        </Badge>
      </Group>
      <Box style={{ overflowX: 'auto' }}>
        <Box
          aria-label="Piano roll"
          role="list"
          style={{
            display: 'flex',
            height: 150,
            position: 'relative',
          }}
        >
          {keys.map(key => (
            <PianoRollKey
              key={key.midiNote}
              highlighted={voicedMidiNotes.has(key.midiNote)}
              keyData={key}
              tone={key.midiNote === bassMidiNote ? 'bass' : 'note'}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  )
})

const PianoRollKey = memo(function PianoRollKey({
  highlighted,
  keyData,
  tone,
}: {
  highlighted: boolean
  keyData: PianoKeyData
  tone: 'bass' | 'note'
}) {
  return (
    <Box
      aria-label={`${keyData.noteName}${keyData.octave}`}
      role="listitem"
      style={{
        alignItems: 'flex-end',
        background: getKeyBackground(keyData.isBlackKey, highlighted, tone),
        border: `1px solid ${getKeyBorderColor(keyData.isBlackKey, highlighted, tone)}`,
        borderLeftWidth: keyData.isBlackKey || keyData.whiteKeyIndex === 0 ? 1 : 0,
        borderRadius: keyData.isBlackKey ? '0 0 3px 3px' : 0,
        boxSizing: 'border-box',
        color: getKeyTextColor(keyData.isBlackKey, highlighted),
        display: 'flex',
        flex: keyData.isBlackKey ? undefined : '1 1 0',
        height: keyData.isBlackKey ? 108 : 150,
        justifyContent: 'center',
        left: keyData.isBlackKey
          ? `${keyData.whiteKeyIndex / PIANO_ROLL_WHITE_KEY_COUNT * 100}%`
          : undefined,
        minWidth: 0,
        padding: '0 2px 8px',
        position: keyData.isBlackKey ? 'absolute' : 'relative',
        top: 0,
        transform: keyData.isBlackKey ? 'translateX(-50%)' : undefined,
        width: keyData.isBlackKey
          ? `${BLACK_KEY_WIDTH_IN_WHITE_KEYS / PIANO_ROLL_WHITE_KEY_COUNT * 100}%`
          : undefined,
        zIndex: keyData.isBlackKey ? 2 : 1,
      }}
    >
      {highlighted && (
        <Text
          fw={700}
          size="10px"
          style={{
            lineHeight: 1,
            overflowWrap: 'anywhere',
            textAlign: 'center',
          }}
        >
          {keyData.noteName}
        </Text>
      )}
    </Box>
  )
})

function getKeyBackground(
  isBlackKey: boolean,
  highlighted: boolean,
  tone: 'bass' | 'note',
): string {
  if (highlighted && tone === 'bass') {
    return 'var(--mantine-color-blue-3)'
  }

  if (highlighted) {
    return 'var(--mantine-color-red-1)'
  }

  return isBlackKey ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-0)'
}

function getKeyBorderColor(
  isBlackKey: boolean,
  highlighted: boolean,
  tone: 'bass' | 'note',
): string {
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

function createPianoKeys(startOctave: Octave): PianoKeyData[] {
  const startMidiNote = ((startOctave + 1) * PITCH_CLASSES.length) as MidiNote
  let whiteKeyIndex = 0

  return Array.from({ length: PIANO_ROLL_KEY_COUNT }, (_, index) => {
    const midiNote = (startMidiNote + index) as MidiNote
    const pitchClass = pitchClassFromMidiNote(midiNote)
    const isBlackKey = BLACK_PITCH_CLASSES.has(pitchClass)
    const key = {
      isBlackKey,
      midiNote,
      noteName: getNoteNameForPitchClass(pitchClass),
      octave: getOctaveForMidiNote(midiNote),
      whiteKeyIndex,
    }

    if (!isBlackKey) {
      whiteKeyIndex += 1
    }

    return key
  })
}

function formatPianoOctaveRange(startOctave: Octave): string {
  return `C${startOctave} - B${startOctave + PIANO_ROLL_OCTAVE_COUNT - 1}`
}
