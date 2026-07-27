// Adjust these imports to wherever these existing types live.
import type { Tick, TickRange } from '~/domain'
import type { PlaybackScheduleWarning, PlaybackTrigger, ScheduledPlaybackEvent } from '~/playback/schedule'

/**
 * Immutable compiled representation of a Workspace.
 *
 * buildSchedule(workspace) produces this value.
 */
export type PlaybackSchedule = {
  eventStartTicks: readonly Tick[]
  events: readonly ScheduledPlaybackEvent[]
  triggers: readonly PlaybackTrigger[]
  projectEndTick: Tick
  warnings: readonly PlaybackScheduleWarning[]
}

/**
 * A concrete occurrence of a trigger in audio-clock time.
 *
 * A trigger normally has one occurrence. When looping, the same trigger
 * can produce multiple occurrences.
 */
export type ScheduledTriggerOccurrence = {
  trigger: PlaybackTrigger
  whenSeconds: number
  durationSeconds?: number
}

export type SecondsBetweenTicks = (
  startTick: Tick,
  endTick: Tick,
) => number

export type CreatePlaybackScheduleCursorInput = {
  schedule: PlaybackSchedule
  startTick: Tick
  startAudioTime: number
  loopRange?: TickRange
  secondsBetweenTicks: SecondsBetweenTicks
}

/**
 * Reads an immutable PlaybackSchedule sequentially.
 *
 * It owns the runtime position within the schedule, including loop wraps.
 * PlaybackEngine does not need to calculate loop occurrences itself.
 */
export class PlaybackScheduleCursor {
  private readonly schedule: PlaybackSchedule
  private readonly loopRange: TickRange | undefined
  private readonly secondsBetweenTicks: SecondsBetweenTicks

  private segmentStartTick: Tick
  private segmentEndTick: Tick
  private segmentStartAudioTime: number
  private nextTriggerIndex: number

  private finished = false

  public constructor({
    schedule,
    startTick,
    startAudioTime,
    loopRange,
    secondsBetweenTicks,
  }: CreatePlaybackScheduleCursorInput) {
    this.schedule = schedule
    this.loopRange = normalizeLoopRange(
      loopRange,
      schedule.projectEndTick,
    )
    this.secondsBetweenTicks = secondsBetweenTicks

    const normalizedStartTick = this.loopRange
      ? getTickInsideLoop(startTick, this.loopRange)
      : clampTick(startTick, schedule.projectEndTick)

    this.segmentStartTick = normalizedStartTick
    this.segmentEndTick
      = this.loopRange?.endTick
        ?? schedule.projectEndTick

    this.segmentStartAudioTime = startAudioTime

    this.nextTriggerIndex = findFirstTriggerAtOrAfter(
      schedule.triggers,
      normalizedStartTick,
    )

    if (this.segmentEndTick <= this.segmentStartTick) {
      this.finished = true
    }

    if (this.loopRange) {
      const loopDurationSeconds
        = this.secondsBetweenTicks(
          this.loopRange.startTick,
          this.loopRange.endTick,
        )

      if (loopDurationSeconds <= 0) {
        throw new Error(
          'Playback loop must have a positive duration',
        )
      }
    }
  }

  public isFinished(): boolean {
    return this.finished
  }

  /**
   * Returns occurrences in the half-open audio-time range:
   *
   * [windowStartSeconds, windowEndSeconds)
   *
   * Calling this repeatedly with consecutive windows does not produce
   * duplicate occurrences.
   */
  public readWindow(
    windowStartSeconds: number,
    windowEndSeconds: number,
  ): ScheduledTriggerOccurrence[] {
    if (
      this.finished
      || windowEndSeconds <= windowStartSeconds
    ) {
      return []
    }

    const occurrences: ScheduledTriggerOccurrence[] = []

    while (!this.finished) {
      const segmentEndAudioTime
        = this.getSegmentEndAudioTime()

      const trigger
        = this.schedule.triggers[
          this.nextTriggerIndex
        ]

      const triggerIsInSegment
        = trigger !== undefined
          && trigger.startTick < this.segmentEndTick

      if (triggerIsInSegment) {
        const whenSeconds
          = this.getTriggerAudioTime(trigger)

        /*
         * The scheduling timer may be late. Advance past occurrences that
         * are already outside the requested window.
         */
        if (whenSeconds < windowStartSeconds) {
          this.nextTriggerIndex += 1
          continue
        }

        if (whenSeconds >= windowEndSeconds) {
          break
        }

        occurrences.push(
          this.createOccurrence(
            trigger,
            whenSeconds,
          ),
        )

        this.nextTriggerIndex += 1
        continue
      }

      /*
       * There are no more triggers in the current timeline segment.
       * Do not wrap until the requested audio window reaches the boundary.
       */
      if (
        segmentEndAudioTime
        >= windowEndSeconds
      ) {
        break
      }

      this.advanceSegment(segmentEndAudioTime)
    }

    return occurrences
  }

  private getTriggerAudioTime(
    trigger: PlaybackTrigger,
  ): number {
    return (
      this.segmentStartAudioTime
      + this.secondsBetweenTicks(
        this.segmentStartTick,
        trigger.startTick,
      )
    )
  }

  private getSegmentEndAudioTime(): number {
    return (
      this.segmentStartAudioTime
      + this.secondsBetweenTicks(
        this.segmentStartTick,
        this.segmentEndTick,
      )
    )
  }

  private createOccurrence(
    trigger: PlaybackTrigger,
    whenSeconds: number,
  ): ScheduledTriggerOccurrence {
    if (trigger.kind !== 'note') {
      return {
        trigger,
        whenSeconds,
      }
    }

    /*
     * For now, notes are clipped at the project or loop boundary.
     * This is predictable and prevents a looping note from overlapping
     * indefinitely into the next cycle.
     */
    const endTick = Math.min(
      trigger.startTick
      + trigger.durationTicks,
      this.segmentEndTick,
    )

    return {
      trigger,
      whenSeconds,
      durationSeconds:
        this.secondsBetweenTicks(
          trigger.startTick,
          endTick,
        ),
    }
  }

  private advanceSegment(
    nextSegmentAudioTime: number,
  ): void {
    if (!this.loopRange) {
      this.finished = true
      return
    }

    this.segmentStartTick
      = this.loopRange.startTick

    this.segmentEndTick
      = this.loopRange.endTick

    this.segmentStartAudioTime
      = nextSegmentAudioTime

    this.nextTriggerIndex
      = findFirstTriggerAtOrAfter(
        this.schedule.triggers,
        this.loopRange.startTick,
      )
  }
}

function findFirstTriggerAtOrAfter(
  triggers: readonly PlaybackTrigger[],
  tick: Tick,
): number {
  let low = 0
  let high = triggers.length

  while (low < high) {
    const middle = Math.floor(
      (low + high) / 2,
    )

    if (triggers[middle].startTick < tick) {
      low = middle + 1
    }
    else {
      high = middle
    }
  }

  return low
}

function normalizeLoopRange(
  range: TickRange | undefined,
  projectEndTick: Tick,
): TickRange | undefined {
  if (!range) {
    return undefined
  }

  const startTick = clampTick(
    range.startTick,
    projectEndTick,
  )

  const endTick = clampTick(
    range.endTick,
    projectEndTick,
  )

  if (endTick <= startTick) {
    return undefined
  }

  return {
    startTick,
    endTick,
  }
}

function getTickInsideLoop(
  tick: Tick,
  loopRange: TickRange,
): Tick {
  const loopLength
    = loopRange.endTick
      - loopRange.startTick

  const offset
    = positiveModulo(
      tick - loopRange.startTick,
      loopLength,
    )

  return loopRange.startTick + offset
}

function clampTick(
  tick: Tick,
  projectEndTick: Tick,
): Tick {
  return Math.max(
    0,
    Math.min(
      Math.floor(tick),
      projectEndTick,
    ),
  )
}

function positiveModulo(
  value: number,
  divisor: number,
): number {
  return ((value % divisor) + divisor) % divisor
}
