import { AudioEngine } from '../audio/audioEngine'
import type { Tick, TickRange } from '~/domain'
import { buildSchedule, type PlaybackSchedule } from '~/playback/buildSchedule'
import { PlaybackScheduleCursor } from '~/playback/scheduleCursor'
import { PLAYBACK_START_DELAY_MS, Transport } from '~/playback/transport'
import type { Workspace } from '~/store/workspace'

const SCHEDULE_INTERVAL_MS = 25
const SCHEDULE_LOOKAHEAD_SECONDS = 0.1

export class PlaybackEngine {
  public readonly audioEngine: AudioEngine
  public readonly transport: Transport

  private workspace: Workspace | undefined
  private schedule: PlaybackSchedule | undefined
  private scheduleCursor: | PlaybackScheduleCursor | undefined

  private schedulerTimerId: | ReturnType<typeof setInterval> | undefined
  private scheduledThroughSeconds = 0

  private playRequestId = 0
  private playTask: Promise<void> | undefined

  private disposed = false

  public constructor(
    transport = new Transport(),
    audioEngine = new AudioEngine(),
  ) {
    this.transport = transport
    this.audioEngine = audioEngine
  }

  public loadWorkspace(workspace: Workspace): void {
    this.requireActive()

    if (workspace === this.workspace) {
      return
    }

    const schedule = buildSchedule(workspace)

    this.workspace = workspace
    this.schedule = schedule

    this.audioEngine.loadWorkspace(workspace)
    this.replaceScheduleCursor(schedule)
    this.transport.loadWorkspace(workspace, schedule)
  }

  public play(): Promise<void> {
    this.requireActive()
    this.requireSchedule()

    if (this.isPlaying()) {
      return Promise.resolve()
    }

    if (this.playTask) {
      return this.playTask
    }

    const requestId = ++this.playRequestId

    const task = this.beginPlayback(requestId)

    this.playTask = task

    void task.finally(() => {
      if (requestId === this.playRequestId) {
        this.playTask = undefined
      }
    })

    return task
  }

  public pause(): void {
    this.requireActive()
    this.invalidatePendingPlay()
    this.stopScheduledAudio()
    this.transport.pause()
  }

  public stop(): void {
    this.requireActive()
    this.invalidatePendingPlay()
    this.stopScheduledAudio()
    this.transport.stop()
  }

  public seek(tick: Tick): void {
    this.requireActive()
    this.invalidatePendingPlay()

    const wasPlaying = this.isPlaying()

    this.stopScheduledAudio()
    this.transport.seek(tick)

    if (wasPlaying) {
      this.startScheduling()
    }
  }

  public setLoop(range?: TickRange, enabled?: boolean): void {
    this.requireActive()
    this.invalidatePendingPlay()

    const wasPlaying = this.isPlaying()

    this.stopScheduledAudio()
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

    this.invalidatePendingPlay()
    this.stopScheduledAudio()

    this.transport.dispose()
    await this.audioEngine.dispose()

    this.workspace = undefined
    this.schedule = undefined
  }

  private async beginPlayback(requestId: number): Promise<void> {
    try {
      await this.audioEngine.initialize()

      if (!this.isCurrentPlayRequest(requestId)) {
        return
      }

      this.audioEngine.stopAll()
      this.transport.play()

      if (this.isPlaying()) {
        this.startScheduling()
      }
    }
    catch (error) {
      if (!this.isCurrentPlayRequest(requestId)) {
        return
      }

      this.stopScheduledAudio()
      this.transport.stop()

      throw error
    }
  }

  private startScheduling(): void {
    const schedule = this.requireSchedule()

    this.stopScheduling()

    const transportSnapshot = this.transport.getSnapshot()
    const startAudioTime = this.audioEngine.getCurrentTime() + (PLAYBACK_START_DELAY_MS / 1000)

    const loopRange = transportSnapshot.loopEnabled
      ? transportSnapshot.loopRange
      : undefined

    const startTick = this.transport.setPlaybackAnchor()

    this.scheduleCursor = new PlaybackScheduleCursor({
      schedule,
      startTick,
      startAudioTime,
      loopRange,
      secondsBetweenTicks: (startTick, endTick) =>
        this.transport.getSecondsBetweenTicks(
          startTick,
          endTick,
        ),
      tickAfterSeconds: (startTick, seconds, endTick) =>
        this.transport.getTickAfterSeconds(
          startTick,
          seconds,
          endTick,
        ),
    })

    this.scheduledThroughSeconds = startAudioTime

    this.schedulerTimerId = setInterval(
      this.scheduleLookahead,
      SCHEDULE_INTERVAL_MS,
    )

    this.scheduleLookahead()
  }

  private replaceScheduleCursor(
    schedule: PlaybackSchedule,
  ): void {
    if (!this.scheduleCursor) {
      return
    }

    this.scheduleCursor = this.scheduleCursor.replaceSchedule(
      schedule,
      this.scheduledThroughSeconds,
    )
  }

  private scheduleLookahead = (): void => {
    if (!this.isPlaying()) {
      this.stopScheduling()
      return
    }

    const cursor = this.scheduleCursor

    if (!cursor) {
      return
    }

    try {
      const currentTime = this.audioEngine.getCurrentTime()
      const windowStartSeconds = Math.max(currentTime, this.scheduledThroughSeconds)
      const windowEndSeconds = currentTime + SCHEDULE_LOOKAHEAD_SECONDS

      if (windowEndSeconds <= windowStartSeconds) {
        return
      }

      const occurrences = cursor.readWindow(
        windowStartSeconds,
        windowEndSeconds,
      )

      for (const occurrence of occurrences) {
        this.audioEngine.scheduleTrigger(occurrence)
      }

      this.scheduledThroughSeconds = windowEndSeconds

      if (cursor.isFinished()) {
        this.stopScheduling()
      }
    }
    catch (error) {
      console.error('Playback scheduling failed', error)

      this.stopScheduledAudio()
      this.transport.stop()
    }
  }

  private stopScheduledAudio(): void {
    this.stopScheduling()
    this.audioEngine.stopAll()
  }

  private stopScheduling(): void {
    if (this.schedulerTimerId !== undefined) {
      clearInterval(this.schedulerTimerId)
    }

    this.schedulerTimerId = undefined
    this.scheduleCursor = undefined
    this.scheduledThroughSeconds = 0
  }

  private invalidatePendingPlay(): void {
    this.playRequestId += 1
    this.playTask = undefined
  }

  private isCurrentPlayRequest(
    requestId: number,
  ): boolean {
    return !this.disposed && requestId === this.playRequestId
  }

  private isPlaying(): boolean {
    return this.transport.getSnapshot().status === 'playing'
  }

  private requireSchedule(): PlaybackSchedule {
    if (!this.schedule) {
      throw new Error('No playback schedule has been loaded')
    }

    return this.schedule
  }

  private requireActive(): void {
    if (this.disposed) {
      throw new Error('Playback engine has been disposed')
    }
  }
}
