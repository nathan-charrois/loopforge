import {
  AudioEngine,
  type AudioEngineSnapshot,
} from './audioEngine'
import type {
  Tick,
  TickRange,
} from '~/domain'
import type { Workspace } from '~/store/workspace'
import {
  buildSchedule,
  type PlaybackSchedule,
  type PlaybackTrigger,
} from '~/utils/schedule'
import {
  Transport,
  type TransportSnapshot,
} from '~/utils/transport'

export type PlaybackEngineSnapshot = {
  loaded: boolean
  transport: TransportSnapshot
  audio: AudioEngineSnapshot
  error?: string
}

const SCHEDULE_INTERVAL_MS = 25
const SCHEDULE_LOOKAHEAD_SECONDS = 0.1

export class PlaybackEngine {
  private readonly audioEngine = new AudioEngine()
  private disposed = false
  private error: string | undefined
  private listeners = new Set<() => void>()
  private playbackBaseAudioTime = 0
  private playbackBaseTick: Tick = 0
  private playPromise: Promise<void> | undefined
  private playRequestId = 0
  private schedule: PlaybackSchedule | undefined
  private scheduledThroughSeconds = 0
  private schedulerTimerId: ReturnType<typeof setInterval> | undefined
  private snapshot: PlaybackEngineSnapshot
  private unsubscribeAudio: () => void
  private unsubscribeTransport: () => void
  private workspace: Workspace | undefined
  private readonly transport = new Transport()

  public constructor() {
    this.snapshot = {
      audio: this.audioEngine.getSnapshot(),
      loaded: false,
      transport: this.transport.getSnapshot(),
    }
    this.unsubscribeAudio = this.audioEngine.subscribe(this.handleAudioUpdate)
    this.unsubscribeTransport = this.transport.subscribe(this.handleTransportUpdate)
  }

  public getSnapshot = (): PlaybackEngineSnapshot => this.snapshot

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  public loadWorkspace(workspace: Workspace): void {
    this.requiredActive()

    if (workspace === this.workspace) {
      return
    }

    try {
      const schedule = buildSchedule(workspace)

      this.cancelPendingPlay()
      this.stopScheduling()

      this.workspace = workspace
      this.schedule = schedule
      this.error = undefined

      this.audioEngine.loadWorkspace(workspace)
      this.transport.load({
        schedule,
        workspace,
      })
      this.updateSnapshot()
    }
    catch (error) {
      this.error = getErrorMessage(error)
      this.updateSnapshot()
      throw error
    }
  }

  public play(): Promise<void> {
    this.requiredActive()

    if (this.playPromise !== undefined) {
      return this.playPromise
    }

    const playRequestId = ++this.playRequestId
    const playPromise = this.startPlayback(playRequestId)
    this.playPromise = playPromise

    const clearPendingPlay = (): void => {
      if (this.playPromise === playPromise) {
        this.playPromise = undefined
      }
    }

    void playPromise.then(clearPendingPlay, clearPendingPlay)

    return playPromise
  }

  public pause(): void {
    if (this.disposed) {
      return
    }

    this.cancelPendingPlay()
    this.transport.pause()
    this.stopScheduling()
    this.audioEngine.stopAll()
  }

  public stop(): void {
    if (this.disposed) {
      return
    }

    this.cancelPendingPlay()
    this.transport.stop()
    this.stopScheduling()
    this.audioEngine.stopAll()
  }

  public seek(tick: Tick): void {
    if (this.disposed) {
      return
    }

    this.cancelPendingPlay()
    const wasPlaying = this.transport.getSnapshot().status === 'playing'

    this.stopScheduling()
    this.audioEngine.stopAll()
    this.transport.seek(tick)

    if (wasPlaying) {
      this.startScheduling()
    }
  }

  public setLoop(
    range: TickRange | undefined,
    enabled?: boolean,
  ): void {
    this.requiredActive()

    const wasPlaying = this.transport.getSnapshot().status === 'playing'

    this.stopScheduling()
    this.audioEngine.stopAll()
    this.transport.setLoop(range, enabled)

    if (wasPlaying) {
      this.startScheduling()
    }
  }

  public async dispose(): Promise<void> {
    if (this.disposed) {
      return
    }

    this.disposed = true
    this.cancelPendingPlay()
    this.stopScheduling()
    this.unsubscribeAudio()
    this.unsubscribeTransport()
    this.transport.dispose()
    await this.audioEngine.dispose()

    this.workspace = undefined
    this.schedule = undefined
    this.error = undefined
    this.snapshot = {
      audio: this.audioEngine.getSnapshot(),
      loaded: false,
      transport: this.transport.getSnapshot(),
    }
    this.emitListeners()
    this.listeners.clear()
  }

  private async startPlayback(playRequestId: number): Promise<void> {
    this.requiredSchedule()

    try {
      this.error = undefined
      this.updateSnapshot()

      await this.audioEngine.initialize()

      if (
        this.disposed
        || playRequestId !== this.playRequestId
      ) {
        return
      }

      this.audioEngine.stopAll()
      this.transport.play()

      if (this.transport.getSnapshot().status === 'playing') {
        this.startScheduling()
      }
    }
    catch (error) {
      if (
        this.disposed
        || playRequestId !== this.playRequestId
      ) {
        return
      }

      this.stopScheduling()
      this.audioEngine.stopAll()
      this.transport.stop()
      this.error = getErrorMessage(error)
      this.updateSnapshot()
      throw error
    }
  }

  private startScheduling(): void {
    this.stopScheduling()

    this.playbackBaseTick = this.transport.getPlayheadTick()
    this.playbackBaseAudioTime = this.audioEngine.getCurrentTime()
    this.scheduledThroughSeconds = this.playbackBaseAudioTime

    this.schedulerTimerId = setInterval(
      () => this.scheduleLookahead(),
      SCHEDULE_INTERVAL_MS,
    )
    this.scheduleLookahead()
  }

  private stopScheduling(): void {
    if (this.schedulerTimerId === undefined) {
      return
    }

    clearInterval(this.schedulerTimerId)
    this.schedulerTimerId = undefined
  }

  private cancelPendingPlay(): void {
    this.playRequestId += 1
    this.playPromise = undefined
  }

  private scheduleLookahead(): void {
    try {
      const currentTime = this.audioEngine.getCurrentTime()
      const scheduleStartSeconds = Math.max(
        this.scheduledThroughSeconds,
        currentTime,
      )
      const scheduleEndSeconds = currentTime + SCHEDULE_LOOKAHEAD_SECONDS

      if (scheduleEndSeconds <= scheduleStartSeconds) {
        return
      }

      this.schedulePerformanceWindow(
        scheduleStartSeconds,
        scheduleEndSeconds,
      )
      this.scheduledThroughSeconds = scheduleEndSeconds
    }
    catch (error) {
      this.stopScheduling()
      this.audioEngine.stopAll()
      this.transport.stop()
      this.error = getErrorMessage(error)
      this.updateSnapshot()
    }
  }

  private schedulePerformanceWindow(
    windowStartSeconds: number,
    windowEndSeconds: number,
  ): void {
    const schedule = this.requiredSchedule()
    const transportSnapshot = this.transport.getSnapshot()
    const loopRange = transportSnapshot.loopEnabled
      ? transportSnapshot.loopRange
      : undefined

    for (const trigger of schedule.triggers) {
      if (loopRange === undefined) {
        this.scheduleNonLoopingTrigger(
          trigger,
          schedule.projectEndTick,
          windowStartSeconds,
          windowEndSeconds,
        )
        continue
      }

      this.scheduleLoopingTrigger(
        trigger,
        loopRange,
        windowStartSeconds,
        windowEndSeconds,
      )
    }
  }

  private scheduleNonLoopingTrigger(
    trigger: PlaybackTrigger,
    projectEndTick: Tick,
    windowStartSeconds: number,
    windowEndSeconds: number,
  ): void {
    if (
      trigger.startTick < this.playbackBaseTick
      || trigger.startTick >= projectEndTick
    ) {
      return
    }

    const whenSeconds = this.playbackBaseAudioTime
      + this.transport.getSecondsBetweenTicks(
        this.playbackBaseTick,
        trigger.startTick,
      )

    if (
      whenSeconds < windowStartSeconds
      || whenSeconds >= windowEndSeconds
    ) {
      return
    }

    this.scheduleTrigger(
      trigger,
      whenSeconds,
      projectEndTick,
    )
  }

  private scheduleLoopingTrigger(
    trigger: PlaybackTrigger,
    loopRange: TickRange,
    windowStartSeconds: number,
    windowEndSeconds: number,
  ): void {
    if (
      trigger.startTick < loopRange.startTick
      || trigger.startTick >= loopRange.endTick
    ) {
      return
    }

    const secondsToLoopEnd = this.transport.getSecondsBetweenTicks(
      this.playbackBaseTick,
      loopRange.endTick,
    )
    const loopDurationSeconds = this.transport.getSecondsBetweenTicks(
      loopRange.startTick,
      loopRange.endTick,
    )

    if (loopDurationSeconds <= 0) {
      return
    }

    const firstTriggerOffsetSeconds = trigger.startTick >= this.playbackBaseTick
      ? this.transport.getSecondsBetweenTicks(
          this.playbackBaseTick,
          trigger.startTick,
        )
      : secondsToLoopEnd
        + this.transport.getSecondsBetweenTicks(
          loopRange.startTick,
          trigger.startTick,
        )
    let whenSeconds = this.playbackBaseAudioTime + firstTriggerOffsetSeconds

    if (whenSeconds < windowStartSeconds) {
      whenSeconds += Math.ceil(
        (windowStartSeconds - whenSeconds) / loopDurationSeconds,
      ) * loopDurationSeconds
    }

    while (whenSeconds < windowEndSeconds) {
      this.scheduleTrigger(
        trigger,
        whenSeconds,
        loopRange.endTick,
      )
      whenSeconds += loopDurationSeconds
    }
  }

  private scheduleTrigger(
    trigger: PlaybackTrigger,
    whenSeconds: number,
    playbackEndTick: Tick,
  ): void {
    const durationSeconds = trigger.kind === 'note'
      ? this.transport.getSecondsBetweenTicks(
          trigger.startTick,
          Math.min(
            trigger.startTick + trigger.durationTicks,
            playbackEndTick,
          ),
        )
      : undefined

    this.audioEngine.scheduleTrigger({
      durationSeconds,
      trigger,
      whenSeconds,
    })
  }

  private handleAudioUpdate = (): void => {
    this.updateSnapshot()
  }

  private handleTransportUpdate = (): void => {
    if (
      this.transport.getSnapshot().status !== 'playing'
      && this.schedulerTimerId !== undefined
    ) {
      this.stopScheduling()
      this.audioEngine.stopAll()
    }

    this.updateSnapshot()
  }

  private updateSnapshot(): void {
    const transport = this.transport.getSnapshot()
    const nextSnapshot: PlaybackEngineSnapshot = {
      audio: this.audioEngine.getSnapshot(),
      error: this.error,
      loaded: transport.loaded,
      transport,
    }

    if (
      nextSnapshot.audio === this.snapshot.audio
      && nextSnapshot.error === this.snapshot.error
      && nextSnapshot.loaded === this.snapshot.loaded
      && nextSnapshot.transport === this.snapshot.transport
    ) {
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

  private requiredActive(): void {
    if (this.disposed) {
      throw new Error('Playback engine has been disposed')
    }
  }

  private requiredSchedule(): PlaybackSchedule {
    if (this.schedule === undefined) {
      throw new Error('No playback schedule has been loaded')
    }

    return this.schedule
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error)
}
