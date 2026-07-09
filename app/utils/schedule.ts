import {
  type AutomationValue,
  type Block,
  type BlockId,
  type DrumKitPiece,
  type DurationTicks,
  getBlockEndTick,
  getGatedDurationTick,
  getRepeatOrDurationTick,
  getScheduledEventDurationTicks,
  getScheduledEventStartTick,
  materializeChordVoicing,
  type MidiNote,
  orderArpeggioNotes,
  type Pattern,
  type PatternEvent,
  type PatternEventId,
  type PatternId,
  type Tick,
  type Track,
  type TrackId,
  type Velocity,
  type VoiceIndex,
} from '~/domain'
import {
  selectPattern,
  selectTrack,
  selectWorkspaceEndTick,
  type Workspace,
} from '~/store/workspace'

export type ScheduledPlaybackEventBase = {
  id: string
  blockId: BlockId
  durationTicks: DurationTicks
  event: PatternEvent
  patternId: PatternId
  startTick: Tick
  trackId: TrackId
  trackVolume: number
}

export type ScheduledPlaybackEvent = ScheduledPlaybackEventBase & {
  triggers: PlaybackTrigger[]
}

export type PlaybackTriggerSource = {
  scheduledEventId: string
  eventId: PatternEventId
  blockId: BlockId
  patternId: PatternId
  trackId: TrackId
}

export type NotePlaybackTrigger = {
  id: string
  kind: 'note'
  startTick: Tick
  durationTicks: DurationTicks
  pitch: MidiNote
  velocity: Velocity
  trackVolume: number
  stepIndex?: number
  voiceIndex?: VoiceIndex
  source: PlaybackTriggerSource
}

export type DrumPlaybackTrigger = {
  id: string
  kind: 'drum'
  startTick: Tick
  kitPiece: DrumKitPiece
  velocity: Velocity
  trackVolume: number
  source: PlaybackTriggerSource
}

export type AutomationPlaybackTrigger = {
  id: string
  kind: 'automation'
  startTick: Tick
  parameter: string
  value: AutomationValue
  source: PlaybackTriggerSource
}

export type PlaybackTrigger = NotePlaybackTrigger | DrumPlaybackTrigger | AutomationPlaybackTrigger

export type PlaybackScheduleWarning = {
  id: string
  message: string
}

export type PlaybackSchedule = {
  eventStartTicks: Tick[]
  events: ScheduledPlaybackEvent[]
  triggers: PlaybackTrigger[]
  projectEndTick: Tick
  warnings: PlaybackScheduleWarning[]
}

export function buildSchedule(workspace: Workspace): PlaybackSchedule {
  const events: ScheduledPlaybackEvent[] = []
  const warnings: PlaybackScheduleWarning[] = []

  for (const block of workspace.arrangement.blocks) {
    const context = getBlockContext(workspace, block, warnings)

    if (context === null) {
      continue
    }

    events.push(
      ...createScheduledPlaybackEventsForBlock({
        block,
        pattern: context.pattern,
        track: context.track,
      }),
    )
  }

  const sortedEvents = sortByStartTick(events)
  const sortedTriggers = sortByStartTick(sortedEvents.flatMap(event => event.triggers))
  const sortedStartTicks = sortedEvents.map(event => event.startTick)

  return {
    events: sortedEvents,
    eventStartTicks: sortedStartTicks,
    triggers: sortedTriggers,
    projectEndTick: selectWorkspaceEndTick(workspace),
    warnings,
  }
}

function getBlockContext(
  workspace: Workspace,
  block: Block,
  warnings: PlaybackScheduleWarning[],
) {
  if (block.muted) {
    return null
  }

  const track = selectTrack(workspace, block.trackId)

  if (track === undefined) {
    warnings.push({
      id: `missing-track-${block.id}`,
      message: `Block ${block.name} references missing track ${block.trackId}.`,
    })
    return null
  }

  if (track.muted) {
    return null
  }

  const pattern = selectPattern(workspace, block.patternId)

  if (pattern === undefined) {
    warnings.push({
      id: `missing-pattern-${block.id}`,
      message: `Block ${block.name} references missing pattern ${block.patternId}.`,
    })
    return null
  }

  if (!track.accepts.includes(pattern.kind)) {
    warnings.push({
      id: `track-accepts-${block.id}`,
      message: `${track.name} does not accept ${pattern.kind} patterns.`,
    })
    return null
  }

  if (pattern.lengthTicks <= 0) {
    warnings.push({
      id: `pattern-length-${pattern.id}`,
      message: `${pattern.name} has no positive length and cannot be scheduled.`,
    })
    return null
  }

  return {
    pattern,
    track,
  }
}

function createScheduledPlaybackEventsForBlock({
  block,
  pattern,
  track,
}: {
  block: Block
  pattern: Pattern
  track: Track
}): ScheduledPlaybackEvent[] {
  switch (block.playbackMode) {
    case 'oneShot':
      return createOneShotScheduledEvents({ block, pattern, track })
    case 'stretch':
      return createStretchScheduledEvents({ block, pattern, track })
    case 'loop':
    default:
      return createLoopScheduledEvents({ block, pattern, track })
  }
}

function createOneShotScheduledEvents({
  block,
  pattern,
  track,
}: {
  block: Block
  pattern: Pattern
  track: Track
}): ScheduledPlaybackEvent[] {
  const events: ScheduledPlaybackEvent[] = []

  for (const event of pattern.events) {
    const scheduledEvent = createScheduledPlaybackEvent({
      block,
      event,
      offsetTick: 0,
      pattern,
      track,
    })

    if (scheduledEvent !== null) {
      events.push(scheduledEvent)
    }
  }

  return events
}

function createStretchScheduledEvents({
  block,
  pattern,
  track,
}: {
  block: Block
  pattern: Pattern
  track: Track
}): ScheduledPlaybackEvent[] {
  const events: ScheduledPlaybackEvent[] = []
  const blockEndTick = getBlockEndTick(block)

  for (const event of pattern.events) {
    const eventDurationTicks = getPatternEventDurationTicks(event)

    const stretchedStartOffset = stretchTickToBlock(
      event.timeTick,
      pattern.lengthTicks,
      block.lengthTicks,
    )

    const stretchedEndOffset = stretchTickToBlock(
      event.timeTick + eventDurationTicks,
      pattern.lengthTicks,
      block.lengthTicks,
    )

    const startTick = block.startTick + stretchedStartOffset

    if (startTick >= blockEndTick) {
      continue
    }

    const durationTicks = Math.max(
      1,
      Math.min(stretchedEndOffset - stretchedStartOffset, blockEndTick - startTick),
    ) as DurationTicks

    const scheduledEventBase: ScheduledPlaybackEventBase = {
      blockId: block.id,
      durationTicks,
      event,
      id: `${block.id}:stretch:${event.id}`,
      patternId: pattern.id,
      startTick,
      trackId: track.id,
      trackVolume: track.volume,
    }

    events.push({
      ...scheduledEventBase,
      triggers: createPlaybackTriggers(scheduledEventBase),
    })
  }

  return events
}

function getPatternEventDurationTicks(event: PatternEvent): DurationTicks {
  switch (event.kind) {
    case 'chord':
    case 'note':
      return event.durationTicks
    case 'drumHit':
    case 'automation':
      return 1 as DurationTicks
  }
}

function stretchTickToBlock(
  patternTick: Tick,
  patternLengthTicks: DurationTicks,
  blockLengthTicks: DurationTicks,
): Tick {
  return Math.round((patternTick * blockLengthTicks) / patternLengthTicks) as Tick
}

function createLoopScheduledEvents({
  block,
  pattern,
  track,
}: {
  block: Block
  pattern: Pattern
  track: Track
}): ScheduledPlaybackEvent[] {
  const events: ScheduledPlaybackEvent[] = []

  for (let offsetTick = 0; offsetTick < block.lengthTicks; offsetTick += pattern.lengthTicks) {
    for (const event of pattern.events) {
      const scheduledEvent = createScheduledPlaybackEvent({
        block,
        event,
        offsetTick,
        pattern,
        track,
      })

      if (scheduledEvent !== null) {
        events.push(scheduledEvent)
      }
    }
  }

  return events
}

function createScheduledPlaybackEvent({
  block,
  event,
  offsetTick,
  pattern,
  track,
}: {
  block: Block
  event: PatternEvent
  offsetTick: number
  pattern: Pattern
  track: Track
}): ScheduledPlaybackEvent | null {
  const blockEndTick = getBlockEndTick(block)
  const startTick = getScheduledEventStartTick(event, block.startTick + offsetTick)

  if (startTick >= blockEndTick) {
    return null
  }

  const durationTicks = getScheduledEventDurationTicks(event, blockEndTick - startTick)

  const scheduledEvent: ScheduledPlaybackEventBase = {
    blockId: block.id,
    event,
    id: `${block.id}:${offsetTick}:${event.id}`,
    patternId: pattern.id,
    startTick,
    durationTicks,
    trackId: track.id,
    trackVolume: track.volume,
  }

  return {
    ...scheduledEvent,
    triggers: createPlaybackTriggers(scheduledEvent),
  }
}

function createPlaybackTriggers(scheduledEvent: ScheduledPlaybackEventBase): PlaybackTrigger[] {
  switch (scheduledEvent.event.kind) {
    case 'chord':
      return createChordPlaybackTriggers(scheduledEvent, scheduledEvent.event)
    case 'automation':
      return [createAutomationPlaybackTrigger(scheduledEvent, scheduledEvent.event)]
    case 'drumHit':
      return [createDrumPlaybackTrigger(scheduledEvent, scheduledEvent.event)]
    case 'note':
      return [createNotePlaybackTrigger(scheduledEvent, scheduledEvent.event)]
  }
}

function createChordPlaybackTriggers(
  scheduledEvent: ScheduledPlaybackEventBase,
  event: Extract<PatternEvent, { kind: 'chord' }>,
): NotePlaybackTrigger[] {
  const source = createPlaybackTriggerSource(scheduledEvent)
  const notes = materializeChordVoicing(event.chord, event.voicing)

  if (notes.length === 0) {
    return []
  }

  if (event.playback.style === 'arpeggio') {
    const triggers: NotePlaybackTrigger[] = []

    const repeatTicks = getRepeatOrDurationTick(scheduledEvent.durationTicks, event.playback)
    const arpeggioNotes = orderArpeggioNotes(notes, event.playback.arpeggioPattern ?? 'up')

    let stepIndex = 0

    for (let offsetTicks = 0; offsetTicks < scheduledEvent.durationTicks; offsetTicks += repeatTicks) {
      const note = arpeggioNotes[stepIndex % arpeggioNotes.length]

      if (note === undefined) {
        break
      }

      triggers.push({
        kind: 'note',
        id: `${scheduledEvent.id}:note:${stepIndex}:${note.midiNote}:${offsetTicks}`,
        pitch: note.midiNote,
        trackVolume: scheduledEvent.trackVolume,
        velocity: event.velocity,
        source,
        stepIndex,
        voiceIndex: note.voiceIndex,
        startTick: scheduledEvent.startTick + offsetTicks,
        durationTicks: getGatedDurationTick(
          repeatTicks,
          scheduledEvent.durationTicks - offsetTicks,
          event.playback.gate,
        ),
      })
      stepIndex += 1
    }

    return triggers
  }

  return notes.map((note, stepIndex) => ({
    kind: 'note',
    id: `${scheduledEvent.id}:note:${stepIndex}:${note.midiNote}`,
    pitch: note.midiNote,
    trackVolume: scheduledEvent.trackVolume,
    velocity: event.velocity,
    startTick: scheduledEvent.startTick,
    source,
    stepIndex,
    voiceIndex: note.voiceIndex,
    durationTicks: getGatedDurationTick(
      scheduledEvent.durationTicks,
      scheduledEvent.durationTicks,
      event.playback.gate,
    ),
  }))
}

function createNotePlaybackTrigger(
  scheduledEvent: ScheduledPlaybackEventBase,
  event: Extract<PatternEvent, { kind: 'note' }>,
): NotePlaybackTrigger {
  return {
    kind: 'note',
    id: `${scheduledEvent.id}:note`,
    durationTicks: scheduledEvent.durationTicks,
    pitch: event.pitch,
    source: createPlaybackTriggerSource(scheduledEvent),
    startTick: scheduledEvent.startTick,
    trackVolume: scheduledEvent.trackVolume,
    velocity: event.velocity,
  }
}

function createDrumPlaybackTrigger(
  scheduledEvent: ScheduledPlaybackEventBase,
  event: Extract<PatternEvent, { kind: 'drumHit' }>,
): DrumPlaybackTrigger {
  return {
    kind: 'drum',
    id: `${scheduledEvent.id}:drum`,
    kitPiece: event.kitPiece,
    source: createPlaybackTriggerSource(scheduledEvent),
    startTick: scheduledEvent.startTick,
    trackVolume: scheduledEvent.trackVolume,
    velocity: event.velocity,
  }
}

function createAutomationPlaybackTrigger(
  scheduledEvent: ScheduledPlaybackEventBase,
  event: Extract<PatternEvent, { kind: 'automation' }>,
): AutomationPlaybackTrigger {
  return {
    kind: 'automation',
    id: `${scheduledEvent.id}:automation`,
    parameter: event.parameter,
    source: createPlaybackTriggerSource(scheduledEvent),
    startTick: scheduledEvent.startTick,
    value: event.value,
  }
}

function createPlaybackTriggerSource(scheduledEvent: ScheduledPlaybackEventBase): PlaybackTriggerSource {
  return {
    blockId: scheduledEvent.blockId,
    eventId: scheduledEvent.event.id,
    patternId: scheduledEvent.patternId,
    scheduledEventId: scheduledEvent.id,
    trackId: scheduledEvent.trackId,
  }
}

export function sortByStartTick<TEvent extends ScheduledPlaybackEvent | PlaybackTrigger>(events: readonly TEvent[]): TEvent[] {
  return [...events].sort((left, right) => {
    if (left.startTick !== right.startTick) {
      return left.startTick - right.startTick
    }

    return left.id.localeCompare(right.id)
  })
}
