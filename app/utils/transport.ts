import { positiveModulo } from './number'
import type {
  PlaybackSchedule,
  PlaybackScheduleWarning,
} from './schedule'
import {
  getTempoAtTick,
  isTickInRange,
  type Tick,
  type TickRange,
} from '~/domain'
import type { Workspace } from '~/store/workspace'

export type TransportStatus
  = | 'stopped'
    | 'playing'
    | 'paused'

export type TransportSnapshot = {
  loaded: boolean
  activeBlockIds: string[]
  compileWarnings: PlaybackScheduleWarning[]
  loopEnabled: boolean
  loopRange?: TickRange
  playheadTick: Tick
  projectEndTick: Tick
  scheduledEventCount: number
  status: TransportStatus
}

export type TransportLoadInput = {
  workspace: Workspace
  schedule: PlaybackSchedule
}

export const INITIAL_TRANSPORT_SNAPSHOT: TransportSnapshot = {
  loaded: false,
  activeBlockIds: [],
  compileWarnings: [],
  loopEnabled: true,
  loopRange: undefined,
  playheadTick: 0,
  projectEndTick: 0,
  scheduledEventCount: 0,
  status: 'stopped',
}

const SNAPSHOT_INTERVAL_MS = 33

export class Transport {
  private anchorMs = 0
  private anchorTick: Tick = 0
  private listeners = new Set<() => void>()
  private loopEnabled = INITIAL_TRANSPORT_SNAPSHOT.loopEnabled
  private loopRange: TickRange | undefined
  private playheadTick: Tick = 0
  private schedule: PlaybackSchedule | undefined
  private snapshot = INITIAL_TRANSPORT_SNAPSHOT
  private snapshotTimerId: ReturnType<typeof setInterval> | undefined
  private status: TransportStatus = 'stopped'
  private workspace: Workspace | undefined

  public getSnapshot = (): TransportSnapshot => this.snapshot

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  public load(input: TransportLoadInput): void {
    const previousPlayheadTick = this.workspace === undefined
      ? 0
      : this.getPlayheadTick()

    this.stopTimers()
    this.workspace = input.workspace
    this.schedule = input.schedule
    this.status = 'stopped'

    this.loopRange = this.loopRange === undefined
      ? this.getDefaultLoopRange()
      : this.normalizeLoopRange(this.loopRange)

    this.playheadTick = this.clampTick(previousPlayheadTick)
    this.anchorTick = this.playheadTick
    this.anchorMs = getNowMs()
    this.emitSnapshot()
  }

  public play(): void {
    const schedule = this.requiredSchedule()

    if (this.status === 'playing') {
      return
    }

    const fallbackStartTick = this.playheadTick >= schedule.projectEndTick
      ? this.loopRange?.startTick ?? 0
      : this.playheadTick
    const startTick = this.loopEnabled && this.loopRange !== undefined
      ? this.getTickInsideLoop(fallbackStartTick, this.loopRange)
      : fallbackStartTick

    this.status = 'playing'
    this.anchorTick = toTimelineTick(startTick)
    this.playheadTick = this.anchorTick
    this.anchorMs = getNowMs()
    this.startTimers()
    this.emitSnapshot()
  }

  public pause(): void {
    if (this.status !== 'playing') {
      return
    }

    this.playheadTick = this.getPlayheadTick()
    this.status = 'paused'
    this.stopTimers()
    this.emitSnapshot()
  }

  public stop(): void {
    if (this.workspace === undefined) {
      return
    }

    this.status = 'stopped'
    this.playheadTick = this.loopEnabled ? (this.loopRange?.startTick ?? 0) : 0
    this.anchorTick = this.playheadTick
    this.anchorMs = getNowMs()
    this.stopTimers()
    this.emitSnapshot()
  }

  public seek(tick: Tick): void {
    if (this.workspace === undefined) {
      return
    }

    const clampedTick = this.clampTick(tick)
    const nextTick = (
      this.status === 'playing'
      && this.loopEnabled
      && this.loopRange !== undefined
    )
      ? this.getTickInsideLoop(clampedTick, this.loopRange)
      : clampedTick

    this.playheadTick = nextTick
    this.anchorTick = nextTick
    this.anchorMs = getNowMs()
    this.emitSnapshot()
  }

  public setLoop(
    range: TickRange | undefined,
    enabled = this.loopEnabled,
  ): void {
    this.requiredSchedule()
    this.loopEnabled = enabled

    const nextRange = range
      ?? (enabled ? this.loopRange ?? this.getDefaultLoopRange() : undefined)

    this.loopRange = nextRange === undefined
      ? undefined
      : this.normalizeLoopRange(nextRange)

    if (this.loopEnabled && this.loopRange !== undefined) {
      this.seek(this.getTickInsideLoop(this.getPlayheadTick(), this.loopRange))
      return
    }

    this.emitSnapshot()
  }

  public getPlayheadTick(): Tick {
    return toTimelineTick(this.getComputedPlayheadTick())
  }

  public getSecondsBetweenTicks(
    startTick: Tick,
    endTick: Tick,
  ): number {
    const workspace = this.requiredWorkspace()

    if (startTick === endTick) {
      return 0
    }

    if (startTick > endTick) {
      return -this.getSecondsBetweenTicks(endTick, startTick)
    }

    const timeline = workspace.timeline
    const tempoEvents = [...timeline.tempoEvents]
      .sort((left, right) => left.tick - right.tick)
      .filter(event => event.tick > startTick && event.tick < endTick)

    let seconds = 0
    let segmentStartTick = startTick
    let bpm = getTempoAtTick(timeline, toTimelineTick(startTick))

    for (const tempoEvent of tempoEvents) {
      seconds += ticksToSeconds(
        tempoEvent.tick - segmentStartTick,
        bpm,
        timeline.ppq,
      )
      segmentStartTick = tempoEvent.tick
      bpm = tempoEvent.bpm
    }

    return seconds + ticksToSeconds(
      endTick - segmentStartTick,
      bpm,
      timeline.ppq,
    )
  }

  public dispose(): void {
    this.stopTimers()
    this.workspace = undefined
    this.schedule = undefined
    this.status = 'stopped'
    this.loopEnabled = INITIAL_TRANSPORT_SNAPSHOT.loopEnabled
    this.loopRange = undefined
    this.playheadTick = 0
    this.anchorTick = 0
    this.snapshot = INITIAL_TRANSPORT_SNAPSHOT
    this.emitListeners()
    this.listeners.clear()
  }

  private startTimers(): void {
    this.stopTimers()
    this.snapshotTimerId = setInterval(
      () => this.emitSnapshot(),
      SNAPSHOT_INTERVAL_MS,
    )
  }

  private stopTimers(): void {
    if (this.snapshotTimerId === undefined) {
      return
    }

    clearInterval(this.snapshotTimerId)
    this.snapshotTimerId = undefined
  }

  private getComputedPlayheadTick(): Tick {
    const schedule = this.schedule

    if (
      this.status !== 'playing'
      || this.workspace === undefined
      || schedule === undefined
    ) {
      return this.clampTick(this.playheadTick)
    }

    const elapsedSeconds = Math.max(0, (getNowMs() - this.anchorMs) / 1000)

    if (this.loopEnabled && this.loopRange !== undefined) {
      return this.getLoopedPlayheadTick(
        this.anchorTick,
        elapsedSeconds,
        this.loopRange,
      )
    }

    return this.getTickAfterSeconds(
      this.anchorTick,
      elapsedSeconds,
      schedule.projectEndTick,
    )
  }

  private getLoopedPlayheadTick(
    startTick: Tick,
    elapsedSeconds: number,
    loopRange: TickRange,
  ): Tick {
    const secondsToLoopEnd = this.getSecondsBetweenTicks(
      startTick,
      loopRange.endTick,
    )

    if (elapsedSeconds < secondsToLoopEnd) {
      return this.getTickAfterSeconds(
        startTick,
        elapsedSeconds,
        loopRange.endTick,
      )
    }

    const loopDurationSeconds = this.getSecondsBetweenTicks(
      loopRange.startTick,
      loopRange.endTick,
    )

    if (loopDurationSeconds <= 0) {
      return loopRange.startTick
    }

    const loopElapsedSeconds = positiveModulo(
      elapsedSeconds - secondsToLoopEnd,
      loopDurationSeconds,
    )

    return this.getTickAfterSeconds(
      loopRange.startTick,
      loopElapsedSeconds,
      loopRange.endTick,
    )
  }

  private getTickAfterSeconds(
    startTick: Tick,
    seconds: number,
    endTick: Tick,
  ): Tick {
    const workspace = this.requiredWorkspace()
    const timeline = workspace.timeline
    const tempoEvents = [...timeline.tempoEvents]
      .sort((left, right) => left.tick - right.tick)
      .filter(event => event.tick > startTick && event.tick < endTick)

    let remainingSeconds = seconds
    let segmentStartTick = startTick
    let bpm = getTempoAtTick(timeline, toTimelineTick(startTick))

    for (const tempoEvent of tempoEvents) {
      const segmentSeconds = ticksToSeconds(
        tempoEvent.tick - segmentStartTick,
        bpm,
        timeline.ppq,
      )

      if (remainingSeconds < segmentSeconds) {
        return segmentStartTick + secondsToTicks(
          remainingSeconds,
          bpm,
          timeline.ppq,
        )
      }

      remainingSeconds -= segmentSeconds
      segmentStartTick = tempoEvent.tick
      bpm = tempoEvent.bpm
    }

    return Math.min(
      endTick,
      segmentStartTick + secondsToTicks(
        remainingSeconds,
        bpm,
        timeline.ppq,
      ),
    )
  }

  private getActiveBlockIds(playheadTick: Tick): string[] {
    const workspace = this.workspace

    if (workspace === undefined) {
      return []
    }

    return workspace.arrangement.blocks
      .filter(block => isTickInRange(playheadTick, {
        endTick: block.startTick + block.lengthTicks,
        startTick: block.startTick,
      }))
      .map(block => block.id)
  }

  private clampTick(tick: Tick): Tick {
    const projectEndTick = this.schedule?.projectEndTick ?? 0

    return Math.max(0, Math.min(toTimelineTick(tick), projectEndTick))
  }

  private getTickInsideLoop(
    tick: Tick,
    loopRange: TickRange,
  ): Tick {
    const loopLengthTicks = loopRange.endTick - loopRange.startTick

    if (loopLengthTicks <= 0) {
      return loopRange.startTick
    }

    return loopRange.startTick
      + positiveModulo(tick - loopRange.startTick, loopLengthTicks)
  }

  private normalizeLoopRange(
    range: TickRange,
  ): TickRange | undefined {
    const schedule = this.requiredSchedule()

    if (schedule.projectEndTick <= 0) {
      return undefined
    }

    const lastStartTick = Math.max(0, schedule.projectEndTick - 1)
    const startTick = Math.min(this.clampTick(range.startTick), lastStartTick)
    const endTick = Math.min(
      schedule.projectEndTick,
      Math.max(startTick + 1, this.clampTick(range.endTick)),
    )

    return {
      endTick,
      startTick,
    }
  }

  private getDefaultLoopRange(): TickRange | undefined {
    const projectEndTick = this.requiredSchedule().projectEndTick

    if (projectEndTick <= 0) {
      return undefined
    }

    return {
      endTick: projectEndTick,
      startTick: 0,
    }
  }

  private emitSnapshot(): void {
    const schedule = this.schedule
    const workspace = this.workspace

    if (schedule === undefined || workspace === undefined) {
      this.replaceSnapshot(INITIAL_TRANSPORT_SNAPSHOT)
      return
    }

    let playheadTick = this.getPlayheadTick()

    if (
      this.status === 'playing'
      && (!this.loopEnabled || this.loopRange === undefined)
      && playheadTick >= schedule.projectEndTick
    ) {
      this.status = 'stopped'
      this.playheadTick = schedule.projectEndTick
      this.anchorTick = this.playheadTick
      this.stopTimers()
      playheadTick = this.playheadTick
    }

    this.playheadTick = playheadTick

    this.replaceSnapshot({
      activeBlockIds: this.getActiveBlockIds(playheadTick),
      compileWarnings: schedule.warnings,
      loaded: true,
      loopEnabled: this.loopEnabled,
      loopRange: this.loopRange,
      playheadTick,
      projectEndTick: schedule.projectEndTick,
      scheduledEventCount: schedule.events.length,
      status: this.status,
    })
  }

  private replaceSnapshot(nextSnapshot: TransportSnapshot): void {
    if (areTransportSnapshotsEqual(this.snapshot, nextSnapshot)) {
      return
    }

    this.snapshot = nextSnapshot
    this.emitListeners()
  }

  private emitListeners(): void {
    for (const listener of this.listeners) {
      listener()
    }
  }

  private requiredWorkspace(): Workspace {
    if (this.workspace === undefined) {
      throw new Error('No workspace has been loaded')
    }

    return this.workspace
  }

  private requiredSchedule(): PlaybackSchedule {
    if (this.schedule === undefined) {
      throw new Error('No playback schedule has been loaded')
    }

    return this.schedule
  }
}

function areTransportSnapshotsEqual(
  left: TransportSnapshot,
  right: TransportSnapshot,
): boolean {
  return left.loaded === right.loaded
    && areArraysEqual(left.activeBlockIds, right.activeBlockIds)
    && areArraysEqual(left.compileWarnings, right.compileWarnings)
    && left.loopEnabled === right.loopEnabled
    && areTickRangesEqual(left.loopRange, right.loopRange)
    && left.playheadTick === right.playheadTick
    && left.projectEndTick === right.projectEndTick
    && left.scheduledEventCount === right.scheduledEventCount
    && left.status === right.status
}

function areArraysEqual<T>(
  left: readonly T[],
  right: readonly T[],
): boolean {
  return left === right
    || (
      left.length === right.length
      && left.every((value, index) => value === right[index])
    )
}

function areTickRangesEqual(
  left: TickRange | undefined,
  right: TickRange | undefined,
): boolean {
  return left === right
    || (
      left !== undefined
      && right !== undefined
      && left.startTick === right.startTick
      && left.endTick === right.endTick
    )
}

function ticksToSeconds(
  ticks: number,
  bpm: number,
  ppq: number,
): number {
  return (ticks * 60) / (bpm * ppq)
}

function secondsToTicks(
  seconds: number,
  bpm: number,
  ppq: number,
): Tick {
  return (seconds * bpm * ppq) / 60
}

function getNowMs(): number {
  return globalThis.performance.now()
}

function toTimelineTick(tick: number): Tick {
  return Math.max(0, Math.floor(tick))
}
