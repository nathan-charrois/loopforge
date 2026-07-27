import type { PlaybackSchedule } from './buildSchedule'
import { type Tick, type TickRange, toTimelineTick } from '~/domain'
import { createTimelineClock, type TimelineClock } from '~/playback/timelineClock'
import type { Workspace } from '~/store/workspace'
import { clampNumber, positiveModulo } from '~/utils/number'

export type TransportStatus = 'stopped' | 'playing' | 'paused'

export type TransportSnapshot = {
  status: TransportStatus
  playheadTick: Tick
  projectEndTick: Tick
  loopEnabled: boolean
  loopRange?: TickRange
}

export const INITIAL_TRANSPORT_SNAPSHOT: TransportSnapshot = {
  status: 'stopped',
  playheadTick: 0,
  projectEndTick: 0,
  loopEnabled: true,
  loopRange: undefined,
}

const SNAPSHOT_INTERVAL_MS = 28

type PlaybackAnchor = {
  tick: Tick
  timeMs: number
}

export class Transport {
  private clock: TimelineClock | undefined
  private status: TransportStatus = 'stopped'

  private projectEndTick: Tick = 0

  private anchor: PlaybackAnchor = { tick: 0, timeMs: 0 }

  private loopEnabled = INITIAL_TRANSPORT_SNAPSHOT.loopEnabled
  private loopRange: TickRange | undefined

  private readonly listeners = new Set<() => void>()

  private snapshot: TransportSnapshot = INITIAL_TRANSPORT_SNAPSHOT
  private snapshotTimerId: ReturnType<typeof setInterval> | undefined

  public getSnapshot = (): TransportSnapshot => {
    return this.snapshot
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  public loadWorkspace(workspace: Workspace, schedule: PlaybackSchedule): void {
    const initialTick = this.getPlayheadTick()

    this.clock = createTimelineClock(workspace.timeline)
    this.projectEndTick = toTimelineTick(schedule.projectEndTick)

    this.loopRange = this.loopRange
      ? this.normalizeLoopRange(this.loopRange)
      : this.getDefaultLoopRange()

    this.setPosition(initialTick)
    this.publishSnapshot()
  }

  public play(): void {
    this.requireClock()

    if (this.status === 'playing') {
      return
    }

    const activeLoopRange = this.getActiveLoopRange()
    let startTick = this.anchor.tick

    if (startTick >= this.projectEndTick) {
      startTick = activeLoopRange?.startTick ?? 0
    }

    if (activeLoopRange) {
      startTick = getTickInsideRange(startTick, activeLoopRange)
    }

    this.setPosition(startTick)
    this.status = 'playing'

    this.startSnapshotTimer()
    this.publishSnapshot()
  }

  public pause(): void {
    if (this.status !== 'playing') {
      return
    }

    const currentTick = this.getPlayheadTick()

    this.status = 'paused'
    this.setPosition(currentTick)

    this.stopSnapshotTimer()
    this.publishSnapshot()
  }

  public stop(): void {
    if (!this.clock) {
      return
    }

    this.status = 'stopped'
    this.setPosition(this.getActiveLoopRange()?.startTick ?? 0)

    this.stopSnapshotTimer()
    this.publishSnapshot()
  }

  public seek(tick: Tick): void {
    if (!this.clock) {
      return
    }

    const activeLoopRange = this.getActiveLoopRange()
    let nextTick = this.clampTick(tick)

    if (this.status === 'playing' && activeLoopRange) {
      nextTick = getTickInsideRange(nextTick, activeLoopRange)
    }

    this.setPosition(nextTick)
    this.publishSnapshot()
  }

  public setLoop(range: TickRange | undefined, enabled = this.loopEnabled): void {
    this.requireClock()
    this.loopEnabled = enabled

    if (range !== undefined) {
      this.loopRange = this.normalizeLoopRange(range)
    }
    else if (enabled && this.loopRange === undefined) {
      this.loopRange = this.getDefaultLoopRange()
    }

    const activeLoopRange = this.getActiveLoopRange()

    if (activeLoopRange) {
      const currentTick = this.getPlayheadTick()
      this.setPosition(getTickInsideRange(currentTick, activeLoopRange))
    }

    this.publishSnapshot()
  }

  public getPlayheadTick(): Tick {
    return toTimelineTick(this.computePlayheadTick())
  }

  public getSecondsBetweenTicks(startTick: Tick, endTick: Tick): number {
    return this.requireClock().getSecondsBetweenTicks(startTick, endTick)
  }

  public dispose(): void {
    this.stopSnapshotTimer()

    this.clock = undefined
    this.projectEndTick = 0
    this.status = 'stopped'
    this.anchor = { tick: 0, timeMs: 0 }
    this.loopEnabled = INITIAL_TRANSPORT_SNAPSHOT.loopEnabled
    this.loopRange = undefined

    this.replaceSnapshot(INITIAL_TRANSPORT_SNAPSHOT)
    this.listeners.clear()
  }

  private computePlayheadTick(): Tick {
    if (this.status !== 'playing' || !this.clock) {
      return this.clampTick(this.anchor.tick)
    }

    const elapsedSeconds = Math.max(0, (getNowMs() - this.anchor.timeMs) / 1000)
    const activeLoopRange = this.getActiveLoopRange()

    if (activeLoopRange) {
      return this.getLoopedTick(this.anchor.tick, elapsedSeconds, activeLoopRange)
    }

    return this.clock.getTickAfterSeconds(
      this.anchor.tick,
      elapsedSeconds,
      this.projectEndTick,
    )
  }

  private getLoopedTick(
    startTick: Tick,
    elapsedSeconds: number,
    loopRange: TickRange,
  ): Tick {
    const clock = this.requireClock()
    const secondsToLoopEnd = clock.getSecondsBetweenTicks(startTick, loopRange.endTick)

    if (elapsedSeconds < secondsToLoopEnd) {
      return clock.getTickAfterSeconds(startTick, elapsedSeconds, loopRange.endTick)
    }

    const loopDurationSeconds = clock.getSecondsBetweenTicks(
      loopRange.startTick,
      loopRange.endTick,
    )

    if (loopDurationSeconds <= 0) {
      return loopRange.startTick
    }

    const elapsedInsideLoop = positiveModulo(
      elapsedSeconds - secondsToLoopEnd,
      loopDurationSeconds,
    )

    return clock.getTickAfterSeconds(
      loopRange.startTick,
      elapsedInsideLoop,
      loopRange.endTick,
    )
  }

  private setPosition(tick: Tick): void {
    const nextTick = this.clampTick(tick)

    this.anchor = {
      tick: nextTick,
      timeMs: getNowMs(),
    }
  }

  private getActiveLoopRange(): TickRange | undefined {
    return this.loopEnabled ? this.loopRange : undefined
  }

  private normalizeLoopRange(range: TickRange): TickRange | undefined {
    if (this.projectEndTick <= 0) {
      return undefined
    }

    const startTick = clampNumber(
      toTimelineTick(range.startTick),
      0,
      this.projectEndTick - 1,
    )

    const endTick = clampNumber(
      toTimelineTick(range.endTick),
      startTick + 1,
      this.projectEndTick,
    )

    return { startTick, endTick }
  }

  private getDefaultLoopRange(): TickRange | undefined {
    if (this.projectEndTick <= 0) {
      return undefined
    }

    return this.normalizeLoopRange({
      startTick: 0,
      endTick: this.projectEndTick,
    })
  }

  private clampTick(tick: Tick): Tick {
    return clampNumber(toTimelineTick(tick), 0, this.projectEndTick)
  }

  private startSnapshotTimer(): void {
    this.stopSnapshotTimer()
    this.snapshotTimerId = setInterval(this.publishSnapshot, SNAPSHOT_INTERVAL_MS)
  }

  private stopSnapshotTimer(): void {
    if (this.snapshotTimerId === undefined) {
      return
    }

    clearInterval(this.snapshotTimerId)
    this.snapshotTimerId = undefined
  }

  private readonly publishSnapshot = (): void => {
    if (!this.clock) {
      this.replaceSnapshot(INITIAL_TRANSPORT_SNAPSHOT)
      return
    }

    let playheadTick = this.getPlayheadTick()

    if (
      this.status === 'playing'
      && this.getActiveLoopRange() === undefined
      && playheadTick >= this.projectEndTick
    ) {
      this.status = 'stopped'
      playheadTick = this.projectEndTick
      this.setPosition(playheadTick)
      this.stopSnapshotTimer()
    }
    else {
      this.anchor = {
        tick: playheadTick,
        timeMs: getNowMs(),
      }
    }

    this.replaceSnapshot({
      status: this.status,
      playheadTick,
      projectEndTick: this.projectEndTick,
      loopEnabled: this.loopEnabled,
      loopRange: this.loopRange,
    })
  }

  private replaceSnapshot(nextSnapshot: TransportSnapshot): void {
    if (areTransportSnapshotsEqual(this.snapshot, nextSnapshot)) {
      return
    }

    this.snapshot = nextSnapshot

    for (const listener of this.listeners) {
      listener()
    }
  }

  private requireClock(): TimelineClock {
    if (!this.clock) {
      throw new Error('No timeline has been loaded')
    }

    return this.clock
  }
}

function getTickInsideRange(tick: Tick, range: TickRange): Tick {
  const length = range.endTick - range.startTick

  if (length <= 0) {
    return range.startTick
  }

  return range.startTick + positiveModulo(tick - range.startTick, length)
}

function areTransportSnapshotsEqual(
  left: TransportSnapshot,
  right: TransportSnapshot,
): boolean {
  return left.status === right.status
    && left.playheadTick === right.playheadTick
    && left.projectEndTick === right.projectEndTick
    && left.loopEnabled === right.loopEnabled
    && areTickRangesEqual(left.loopRange, right.loopRange)
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

function getNowMs(): number {
  return globalThis.performance.now()
}
