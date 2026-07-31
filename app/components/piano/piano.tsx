import { type CSSProperties, memo } from 'react'
import { Box, Text } from '@mantine/core'

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

export type PianoOrientation = 'horizontal' | 'vertical'

const DEFAULT_PIANO_ROLL_START_OCTAVE = 3
const DEFAULT_PIANO_ROLL_OCTAVE_COUNT = 4
const DEFAULT_PIANO_ROLL_ORIENTATION = 'horizontal'

const VERTICAL_PIANO_KEY_HEIGHT = 16
const BLACK_KEY_WIDTH_IN_WHITE_KEYS = 0.6
const BLACK_PITCH_CLASSES = new Set<PitchClass>([1, 3, 6, 8, 10])

const PIANO_KEY_BASE_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  position: 'relative',
}

type PianoKeyData = {
  isBlackKey: boolean
  midiNote: MidiNote
  noteName: string
  octave: Octave
  whiteKeyIndex: number
}

export const Piano = memo(function Piano({
  hasBassNote,
  octaveCount = DEFAULT_PIANO_ROLL_OCTAVE_COUNT,
  orientation = DEFAULT_PIANO_ROLL_ORIENTATION,
  startOctave = DEFAULT_PIANO_ROLL_START_OCTAVE,
  voicedNotes,
}: {
  hasBassNote: boolean
  octaveCount?: number
  orientation?: PianoOrientation
  startOctave?: Octave
  voicedNotes: VoicedNote[]
}) {
  const keys = createPianoKeys(startOctave, octaveCount)
  const voicedMidiNotes = new Set(voicedNotes.map(note => note.midiNote))
  const bassMidiNote = hasBassNote ? voicedNotes[0]?.midiNote : undefined

  if (orientation === 'vertical') {
    return (
      <VerticalPiano
        keys={keys}
        keyHeight={VERTICAL_PIANO_KEY_HEIGHT}
        bassMidiNote={bassMidiNote}
        voicedMidiNotes={voicedMidiNotes}
      />
    )
  }

  return (
    <HorizontalPiano
      keys={keys}
      bassMidiNote={bassMidiNote}
      octaveCount={octaveCount}
      voicedMidiNotes={voicedMidiNotes}
    />
  )
})

const HorizontalPiano = memo(function HorizontalPiano({
  bassMidiNote,
  keys,
  octaveCount,
  voicedMidiNotes,
}: {
  bassMidiNote?: MidiNote
  keys: PianoKeyData[]
  octaveCount: number
  voicedMidiNotes: Set<MidiNote>
}) {
  const whiteKeyCount = octaveCount * 7

  return (
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
          <HorizontalPianoKey
            key={key.midiNote}
            highlighted={voicedMidiNotes.has(key.midiNote)}
            keyData={key}
            tone={key.midiNote === bassMidiNote ? 'bass' : 'note'}
            whiteKeyCount={whiteKeyCount}
          />
        ))}
      </Box>
    </Box>
  )
})

const VerticalPiano = memo(function VerticalPiano({
  bassMidiNote,
  keyHeight,
  keys,
  voicedMidiNotes,
}: {
  bassMidiNote?: MidiNote
  keyHeight: number
  keys: PianoKeyData[]
  voicedMidiNotes: Set<MidiNote>
}) {
  return (
    <Box
      aria-label="Vertical piano roll"
      role="list"
      style={{
        background: 'var(--mantine-color-gray-0)',
        height: keys.length * keyHeight,
        width: '100%',
      }}
    >
      {[...keys].reverse().map(key => (
        <VerticalPianoKey
          key={key.midiNote}
          highlighted={voicedMidiNotes.has(key.midiNote)}
          keyData={key}
          keyHeight={keyHeight}
          tone={key.midiNote === bassMidiNote ? 'bass' : 'note'}
        />
      ))}
    </Box>
  )
})

const VerticalPianoKey = memo(function VerticalPianoKey({
  highlighted,
  keyData,
  keyHeight,
  tone,
}: {
  highlighted: boolean
  keyData: PianoKeyData
  keyHeight: number
  tone: 'bass' | 'note'
}) {
  const showLabel = highlighted || keyData.noteName === 'C'

  return (
    <Box
      aria-label={`${keyData.noteName}${keyData.octave}`}
      role="listitem"
      style={{
        ...PIANO_KEY_BASE_STYLE,
        alignItems: 'center',
        background: keyData.isBlackKey
          ? 'var(--mantine-color-gray-1)'
          : getKeyBackground(false, highlighted, tone),
        borderBottom: '1px solid var(--mantine-color-gray-4)',
        height: keyHeight,
        justifyContent: 'flex-end',
        overflow: 'hidden',
      }}
    >
      {keyData.isBlackKey && (
        <Box
          aria-hidden
          style={{
            background: getKeyBackground(true, highlighted, tone),
            borderBottom: `1px solid ${getKeyBorderColor(true, highlighted, tone)}`,
            borderRight: `1px solid ${getKeyBorderColor(true, highlighted, tone)}`,
            bottom: 0,
            left: 0,
            position: 'absolute',
            top: 0,
            width: '68%',
          }}
        />
      )}
      {showLabel && (
        <Text
          c={getKeyTextColor(keyData.isBlackKey, highlighted)}
          fw={700}
          size="10px"
          style={{
            lineHeight: 1,
            paddingInline: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {keyData.noteName}
          {keyData.octave}
        </Text>
      )}
    </Box>
  )
})

const HorizontalPianoKey = memo(function HorizontalPianoKey({
  highlighted,
  keyData,
  tone,
  whiteKeyCount,
}: {
  highlighted: boolean
  keyData: PianoKeyData
  tone: 'bass' | 'note'
  whiteKeyCount: number
}) {
  return (
    <Box
      aria-label={`${keyData.noteName}${keyData.octave}`}
      role="listitem"
      style={{
        ...PIANO_KEY_BASE_STYLE,
        alignItems: 'flex-end',
        background: getKeyBackground(keyData.isBlackKey, highlighted, tone),
        border: `1px solid ${getKeyBorderColor(keyData.isBlackKey, highlighted, tone)}`,
        borderLeftWidth: keyData.isBlackKey || keyData.whiteKeyIndex === 0 ? 1 : 0,
        borderRadius: keyData.isBlackKey ? '0 0 3px 3px' : 0,
        color: getKeyTextColor(keyData.isBlackKey, highlighted),
        flex: keyData.isBlackKey ? undefined : '1 1 0',
        height: keyData.isBlackKey ? 108 : 150,
        justifyContent: 'center',
        left: keyData.isBlackKey
          ? `${keyData.whiteKeyIndex / whiteKeyCount * 100}%`
          : undefined,
        minWidth: 0,
        padding: '0 2px 8px',
        position: keyData.isBlackKey ? 'absolute' : 'relative',
        top: 0,
        transform: keyData.isBlackKey ? 'translateX(-50%)' : undefined,
        width: keyData.isBlackKey
          ? `${BLACK_KEY_WIDTH_IN_WHITE_KEYS / whiteKeyCount * 100}%`
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

function createPianoKeys(startOctave: Octave, octaveCount: number): PianoKeyData[] {
  const startMidiNote = ((startOctave + 1) * PITCH_CLASSES.length) as MidiNote
  const keyCount = octaveCount * PITCH_CLASSES.length

  let whiteKeyIndex = 0

  return Array.from({ length: keyCount }, (_, index) => {
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
