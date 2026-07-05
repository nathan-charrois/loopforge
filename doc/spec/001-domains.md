# Domains

You are working on a new browser-based music sketching app. The immediate task is to create the core domain model and project structure so future features can be implemented cleanly.

## Goal

Create the initial domain layer for the app using domain-driven design principles. Build clean TypeScript domain primitives, types, factories, validators, and pure helper functions.

## Domains

- Music Primitives
- Projects
- Timeline
- Arrangement
- Tracks
- Blocks
- Patterns
- Pattern Events
- Harmony
- Voicing
- Playback
- Editor state

## Core Mental Model

Project owns:
- Timeline
- Arrangement
- Tracks
- Patterns

Arrangement owns:
- Sections
- Blocks

A **Block** is a placement of a **Pattern** on a **Track**.
A **Pattern** is reusable musical content.
A **PatternEvent** is a timed musical atom inside a Pattern.

Example:

```txt
Project
  timeline
  arrangement
    sections[]
    blocks[]
  tracks[]
  patterns[]

Block
  trackId
  patternId
  startTick
  lengthTicks

Pattern
  kind
  lengthTicks
  events[]
```

A Block should not directly contain chord, drum, melody, or note data. It only places a Pattern on a Track.
A Pattern should not know where it appears in the arrangement. That is Block’s job.
PatternEvent times are relative to the start of the Pattern.
Block times are absolute project timeline ticks.

## Domain List

Create these domain areas.

## MusicPrimitives

Responsible for low-level musical primitives shared by other domains.

A “note” can mean different things:

```txt
Pitch concept: C, Eb, MIDI 60, pitch class 0
Timed musical event: play C4 at tick 480 for 240 ticks
Materialized chord tone: generated from Cm7 + voicing
Drum trigger: MIDI note mapped to a kit piece
```

Timed notes are handled by `NoteEvent` under `PatternEvent`.

Pitch and theory primitives should live in `MusicPrimitives` or a shared music folder.

Suggested types:

- `Tick`
- `DurationTicks`
- `PitchClass`
- `MidiNote`
- `NoteName`
- `Octave`
- `Interval`
- `Velocity`

Use integer ticks for all musical time.
Use integer MIDI notes for concrete pitched notes.
Velocity should be represented consistently, probably as `0–127`.

Example:

```ts
type Tick = number
type DurationTicks = number
type PitchClass = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
type MidiNote = number
type Velocity = number
```

## Project

Responsible for top-level project identity and structure.

Features this domain should eventually support:

- New Project
- Save Project
- Version History
- Import Project
- Export Project

Suggested entities:

- Project
- ProjectId
- ProjectMetadata
- ProjectVersion

Project should contain:

- id
- name
- createdAt
- updatedAt
- timeline
- arrangement
- tracks
- patterns
- version

## Timeline

Responsible for musical time. This is one of the most important domains.

Use integer ticks internally. Do not use floats for musical positions.

Use a PPQ constant:

```ts
export const PPQ = 480
```

Timeline should support:

- Tempo Change
- Time Signature
- Signature Change
- Mixed Meter
- Grid Snap
- Bar Numbers
- Beat Markers
- Transport Head

Internally, model Timeline using maps/events:

```txt
Timeline
  Tempo Map
  Meter Map
  Key Map
  Grid
```

Suggested types:

- Tick
- BeatsPerMinute
- TimeSignature
- TempoEvent
- MeterEvent
- KeyEvent
- Timeline
- BarBeat
- GridDivision

Suggested shape:

```ts
type Timeline = {
  ppq: number
  tempoEvents: TempoEvent[]
  meterEvents: MeterEvent[]
  keyEvents: KeyEvent[]
}

type TempoEvent = {
  tick: Tick
  bpm: number
}

type TimeSignature = {
  numerator: number
  denominator: 1 | 2 | 4 | 8 | 16 | 32
}

type MeterEvent = {
  tick: Tick
  timeSignature: TimeSignature
}

type KeyEvent = {
  tick: Tick
  key: Key
}
```

Timeline events should be sorted by tick.

Implement pure helper functions such as:

- `createDefaultTimeline()`
- `getTempoAtTick()`
- `getMeterAtTick()`
- `getKeyAtTick()`
- `barBeatToTick()`
- `tickToBarBeat()`
- `getBarStartTick()`
- `snapTickToGrid()`

## Mixed Meter and Time Signature Changes

The app must support multiple time signatures through a Timeline meter map.
Use `MeterEvent[]`, sorted by tick.
A `MeterEvent` defines the active time signature from its tick until the next meter event.
Meter changes should be constrained to bar boundaries for v1.
All canonical musical positions should use integer ticks.
Do not store bars/beats as canonical positions.
Blocks use absolute project ticks.
Pattern events use ticks relative to the start of their pattern.
Bars, beats, beat markers, and grid lines are derived from the meter map.

Use this formula:

```txt
ticksPerBeat = PPQ * (4 / denominator)
barLengthTicks = numerator * ticksPerBeat
```

Examples when `PPQ = 480`:

```txt
4/4 = 4 * 480 = 1920 ticks
3/4 = 3 * 480 = 1440 ticks
7/8 = 7 * 240 = 1680 ticks
5/8 = 5 * 240 = 1200 ticks
```

Implement pure helper functions such as:

- `createDefaultTimeline()`
- `getTempoAtTick()`
- `getMeterAtTick()`
- `getKeyAtTick()`
- `getBarLengthTicksAtTick()`
- `getBarStartTick()`
- `tickToBarBeat()`
- `barBeatToTick()`
- `isBarBoundaryTick()`
- `snapTickToGrid()`


## Arrangement

Responsible for song structure and block placement.

Features this domain should eventually support:

- Sections
- Section Length
- Section Loop
- Arrangement Blocks
- Add Block
- Move Block
- Resize Block
- Mute Block

Suggested entities:

- Arrangement
- Section
- Block

A Section should contain:

- id
- name
- startTick
- lengthTicks
- loopEnabled

A Block should contain:

- id
- trackId
- patternId
- startTick
- lengthTicks
- muted
- color
- name
- playbackMode

A Block should not contain chord-specific, drum-specific, or UI-specific data.

## Track

Responsible for lanes and mixer-like metadata.

Features this domain should eventually support:

- Add Track
- Rename Track
- Delete Track
- Duplicate Track
- Chord Track
- Bass Track
- Melody Track
- Drum Track
- Track Mute
- Track Solo
- Track Volume
- Track Color
- Track Instrument Sound

Suggested types:

```ts
type TrackRole =
  | 'chords'
  | 'bass'
  | 'drums'

type PatternKind =
  | 'chord'
  | 'note'
  | 'drum'
  | 'automation'
```

Track should contain:

- id
- name
- role
- accepts
- muted
- soloed
- volume
- color
- instrumentSoundId

## Pattern

Responsible for reusable musical content.

A Pattern should not know where it appears in the arrangement. That is Block’s job.

Features this domain should eventually support:

- Pattern Library
- Pattern Type
- Pattern Name
- Pattern Length
- Pattern Loop
- Pattern Duplicate
- Pattern Rename
- Pattern Delete
- Pattern Link
- Pattern Unlink
- Pattern Variation
- Pattern Metadata
- Pattern Preview
- Pattern Quantize
- Pattern Humanize
- Pattern Transpose
- Pattern Mutate
- Pattern Events

Suggested type:

```ts
type Pattern =
  | ChordPattern
  | NotePattern
  | DrumPattern
  | AutomationPattern
```

Each pattern should contain:

- id
- kind
- name
- lengthTicks
- events
- metadata

Pattern event times are relative to the start of the pattern, not the project timeline.

## Pattern Event

A PatternEvent is the smallest timed musical thing inside a pattern.

This is not a UI event.

This is also not a DDD domain event like `ProjectSaved` or `BlockMoved`.

Use the name `PatternEvent` to avoid confusion.

Features this domain should eventually support:

- Event Type
- Event Timing
- Event Duration
- Event Velocity
- Event Pitch
- Event Chord
- Event Drum Piece
- Event Position
- Event Selection
- Add Event
- Move Event
- Resize Event
- Delete Event
- Duplicate Event
- Quantize Event
- Transpose Event
- Preview Event

Suggested union:

```ts
type PatternEvent =
  | ChordEvent
  | NoteEvent
  | DrumHitEvent
  | AutomationEvent
```

Shared base:

```ts
type BasePatternEvent = {
  id: string
  timeTick: number
}
```

ChordEvent should contain:

- id
- kind: `'chord'`
- timeTick
- durationTicks
- chord
- voicing
- playback
- velocity

NoteEvent should contain:

- id
- kind: `'note'`
- timeTick
- durationTicks
- pitch
- velocity

DrumHitEvent should contain:

- id
- kind: `'drumHit'`
- timeTick
- kitPiece
- velocity

AutomationEvent can be minimal for now:

- id
- kind: `'automation'`
- timeTick
- parameter
- value

## Harmony

Responsible for musical meaning and theory.

Features this domain should eventually support:

- Key
- Mode
- Scale
- Key Change
- Mode Change
- Roman Numerals
- Nashville Numbers
- Function
- Quality
- Extensions
- Scale Highlight
- Function Labels

Suggested types:

- PitchClass
- NoteName
- Mode
- Scale
- Key
- ChordSymbol
- ChordQuality
- ChordExtension
- ChordAlteration
- ChordFunction
- RomanNumeral
- NashvilleNumber

Chord identity should be separate from voicing.

For example, `Cm7` is a chord identity. Its inversion, spread, register, and actual notes are voicing concerns.

Create basic pure helper functions, but keep them modest:

- `formatChordSymbol()`
- `transposeChordSymbol()`
- `getChordPitchClasses()`
- `getScalePitchClasses()`
- `getRomanNumeral()`
- `getNashvilleNumber()`

Avoid overbuilding theory in this first pass.

## Voicing

Responsible for how abstract harmony becomes notes.
Voicing should not own duration or velocity.
Duration belongs to events or blocks.
Velocity belongs to events or playback/performance.

Features this domain should eventually support:

- Voicing Type
- Inversion
- Register
- Spread
- Bass Note
- Materialized Notes
- Piano Roll View

Suggested types:

- `ChordVoicing`
- `VoicingType`
- `Inversion`
- `Register`
- `Spread`
- `MaterializedNote`

Do not always store materialized notes directly on the chord.

Prefer generating notes from:

```txt
ChordSymbol + ChordVoicing
```

Only store manually edited notes if necessary later.

## Playback

Responsible for transport and performance metadata.

Do not implement real audio.

Features this domain should eventually support:

- Play
- Stop
- Pause
- Loop Playback
- Audition Block
- Rhythm
- Style
- Strum
- Arpeggio
- Effect
- Instrument

Suggested types:

- TransportState
- PlaybackRange
- PlaybackStyle
- ChordPlayback
- ArpeggioPattern
- StrumPattern
- EffectPresetRef
- InstrumentPresetRef

Chord playback should be separate from chord identity and voicing.

A chord event can be played once, strummed, arpeggiated, repeated rhythmically, and gated without changing the chord itself.

## Editing

Responsible for edit operations and undo/redo infrastructure.

Features this domain should eventually support:

- Undo
- Redo
- Cut
- Copy
- Paste
- Duplicate
- Delete
- Drag Move
- Drag Resize
- Select Block

For now, create foundational types for command-based editing.

Suggested types:

- Command
- CommandId
- CommandHistory
- SelectionState
- ClipboardState

A Command should be serializable or at least structured enough to support undo/redo later.
Do not bind editing to React state.

## EditorState

Responsible for temporary editor/session state. Keep saved musical data separate from temporary UI/editor state.

Saved in project:
- Project
- Timeline
- Arrangement
- Tracks
- Patterns

Not saved as core musical data:
- Selected block
- Selected event
- Open inspector panel
- Hovered chord
- Current tool
- Clipboard
- Undo stack
- Transport playhead, unless intentionally persisted later

Suggested types:
- `EditorState`
- `SelectionState`
- `ClipboardState`
- `ActiveTool`
- `InspectorState`

SelectionState should be separate from domain entities.
Do not store `selected: true` inside Block, Pattern, or PatternEvent.

Suggested shape:

```ts
type SelectionState = {
  selectedBlockIds: BlockId[]
  selectedPatternEventIds: PatternEventId[]
  selectedTrackIds: TrackId[]
  selectedSectionIds: SectionId[]
}
```


## Implementation Expectations

Before coding, inspect the existing repo structure and conventions.
Then create a clean domain structure. Each domain should have its own folder and files.
Prefer pure functions.
Keep domain files independent from React components.
Do not import UI code into the domain layer.
Do not import audio engine code into the domain layer.

## Factories

Create default factories for a blank project.

A default project should probably include:
- Timeline with 120 BPM
- 4/4 meter
- C major key
- Arrangement with one default section
- Four default tracks:
  - Chords
  - Bass
  - Melody
  - Drums
- Empty patterns or no patterns, depending on what is cleaner
