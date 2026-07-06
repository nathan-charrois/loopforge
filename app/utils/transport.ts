import {
  buildSchedule,
  type PlaybackSchedule,
  type PlaybackScheduleWarning,
} from './schedule'
import {
  getTempoAtTick,
  isTickInPlaybackRange,
  type PlaybackRange,
  type Project,
  type Tick,
  type TransportStatus,
} from '~/domain'

export type TransportSnapshot = {
  activeBlockIds: string[]
  compileWarnings: PlaybackScheduleWarning[]
  loopEnabled: boolean
  loopRange?: PlaybackRange
  playheadTick: Tick
  projectEndTick: Tick
  scheduledEventCount: number
  status: TransportStatus
}

export type TransportListener = (snapshot: TransportSnapshot) => void

const SNAPSHOT_INTERVAL_MS = 33

export class Transport {
  private anchorMs = 0
  private anchorTick: Tick = 0
  private compiled: PlaybackSchedule
  private listeners = new Set<TransportListener>()
  private loopEnabled = true
  private loopRange: PlaybackRange | undefined
  private playheadTick: Tick = 0
  private project: Project
  private snapshotTimerId: number | undefined
  private status: TransportStatus = 'stopped'

  constructor(project: Project) {
    this.project = project
    this.compiled = buildSchedule(project)
    this.loopRange = this.getDefaultLoopRange()
  }

  async play() {
    if (this.status === 'playing') {
      return
    }

    const fallbackStartTick = this.playheadTick >= this.compiled.projectEndTick
      ? this.loopRange?.startTick ?? 0
      : this.playheadTick
    const startTick = toTimelineTick(this.loopEnabled && this.loopRange !== undefined
      ? this.getTickInsideLoop(fallbackStartTick, this.loopRange)
      : fallbackStartTick)

    this.status = 'playing'
    this.anchorTick = startTick
    this.playheadTick = startTick
    this.anchorMs = performance.now()
    this.startTimers()
    this.emitSnapshot()
  }

  pause() {
    if (this.status !== 'playing') {
      return
    }

    this.playheadTick = this.getComputedPlayheadTick()
    this.status = 'paused'
    this.stopTimers()
    this.emitSnapshot()
  }

  stop() {
    this.status = 'stopped'
    this.playheadTick = this.loopRange?.startTick ?? 0
    this.stopTimers()
    this.emitSnapshot()
  }

  seek(tick: Tick) {
    const nextTick = this.clampTick(tick)
    const wasPlaying = this.status === 'playing'

    this.playheadTick = nextTick
    this.anchorTick = nextTick
    this.anchorMs = performance.now()
    this.emitSnapshot()

    if (wasPlaying) {
      this.startTimers()
    }
  }

  setLoop(range: PlaybackRange | undefined, enabled = this.loopEnabled) {
    this.loopEnabled = enabled
    const nextRange = range ?? (enabled ? this.loopRange ?? this.getDefaultLoopRange() : undefined)

    this.loopRange = nextRange ? this.normalizeLoopRange(nextRange) : undefined

    if (this.loopEnabled && this.loopRange !== undefined) {
      this.seek(this.getTickInsideLoop(this.getComputedPlayheadTick(), this.loopRange))
      return
    }

    this.emitSnapshot()
  }

  setProject(project: Project) {
    this.project = project
    this.compiled = buildSchedule(project)

    if (this.loopRange === undefined) {
      this.loopRange = this.getDefaultLoopRange()
    }
    else {
      this.loopRange = this.normalizeLoopRange(this.loopRange)
    }

    this.playheadTick = this.clampTick(this.getComputedPlayheadTick())
    this.anchorTick = this.playheadTick
    this.anchorMs = performance.now()
    this.emitSnapshot()
  }

  getPlayheadTick(): Tick {
    return this.getComputedPlayheadTick()
  }

  getSnapshot(): TransportSnapshot {
    const computedPlayheadTick = this.getComputedPlayheadTick()
    const playheadTick = toTimelineTick(computedPlayheadTick)

    return {
      activeBlockIds: this.getActiveBlockIds(computedPlayheadTick),
      compileWarnings: this.compiled.warnings,
      loopEnabled: this.loopEnabled,
      loopRange: this.loopRange,
      playheadTick,
      projectEndTick: this.compiled.projectEndTick,
      scheduledEventCount: this.compiled.events.length,
      status: this.status,
    }
  }

  subscribe(listener: TransportListener): () => void {
    this.listeners.add(listener)
    listener(this.getSnapshot())

    return () => {
      this.listeners.delete(listener)
    }
  }

  destroy() {
    this.stopTimers()
    this.listeners.clear()
  }

  private startTimers() {
    this.stopTimers()
    this.snapshotTimerId = window.setInterval(() => this.emitSnapshot(), SNAPSHOT_INTERVAL_MS)
  }

  private stopTimers() {
    if (this.snapshotTimerId !== undefined) {
      window.clearInterval(this.snapshotTimerId)
      this.snapshotTimerId = undefined
    }
  }

  private getComputedPlayheadTick(): Tick {
    if (this.status !== 'playing') {
      return this.clampTick(this.playheadTick)
    }

    const rawTick = this.getRawPlayheadTick(performance.now())

    if (this.loopEnabled && this.loopRange !== undefined) {
      const loopLengthTicks = this.loopRange.endTick - this.loopRange.startTick

      if (loopLengthTicks > 0) {
        return this.getTickInsideLoop(rawTick, this.loopRange)
      }
    }

    return this.clampTick(rawTick)
  }

  private getRawPlayheadTick(nowMs: number): Tick {
    const currentBpm = getTempoAtTick(this.project.timeline, toTimelineTick(this.anchorTick))
    const ticksPerMs = (currentBpm * this.project.timeline.ppq) / 60000

    return this.anchorTick + ((nowMs - this.anchorMs) * ticksPerMs)
  }

  private getActiveBlockIds(playheadTick: Tick): string[] {
    return this.project.arrangement.blocks
      .filter(block => isTickInPlaybackRange(playheadTick, {
        endTick: block.startTick + block.lengthTicks,
        startTick: block.startTick,
      }))
      .map(block => block.id)
  }

  private clampTick(tick: Tick): Tick {
    return Math.max(0, Math.min(Math.floor(tick), this.compiled.projectEndTick))
  }

  private getTickInsideLoop(rawTick: Tick, loopRange: PlaybackRange): Tick {
    const loopLengthTicks = loopRange.endTick - loopRange.startTick

    return loopRange.startTick + positiveModulo(rawTick - loopRange.startTick, loopLengthTicks)
  }

  private normalizeLoopRange(range: PlaybackRange): PlaybackRange {
    const lastStartTick = Math.max(0, this.compiled.projectEndTick - 1)
    const startTick = Math.min(this.clampTick(range.startTick), lastStartTick)
    const endTick = Math.min(
      this.compiled.projectEndTick,
      Math.max(startTick + 1, this.clampTick(range.endTick)),
    )

    return {
      endTick,
      startTick,
    }
  }

  private getDefaultLoopRange(): PlaybackRange {
    return {
      endTick: this.compiled.projectEndTick,
      startTick: 0,
    }
  }

  private emitSnapshot() {
    let snapshot = this.getSnapshot()

    if (
      this.status === 'playing'
      && !this.loopEnabled
      && snapshot.playheadTick >= this.compiled.projectEndTick
    ) {
      this.status = 'stopped'
      this.playheadTick = this.compiled.projectEndTick
      this.stopTimers()
      snapshot = this.getSnapshot()
    }

    this.playheadTick = snapshot.playheadTick

    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function toTimelineTick(tick: number): Tick {
  return Math.max(0, Math.floor(tick))
}
