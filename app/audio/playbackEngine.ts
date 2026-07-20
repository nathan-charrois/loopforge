import type { AudioEngine } from './audioEngine'
import type { Tick, TickRange } from '~/domain'
import { buildPerformancePlan, type PerformancePlan } from '~/store/playback'
import { type Workspace } from '~/store/workspace'
import { buildSchedule } from '~/utils/schedule'
import {
  Transport,
  type TransportListener,
  type TransportSnapshot,
  type TransportStatus,
} from '~/utils/transport'

export class PlaybackEngine {
  private workspace: Workspace | undefined
  private performance: PerformancePlan | undefined
  private loadedPerformance: PerformancePlan | undefined
  private transport: Transport | undefined

  public constructor(
    private readonly audioEngine?: AudioEngine,
  ) {}

  public loadWorkspace(workspace: Workspace): void {
    if (workspace === this.workspace) {
      return
    }

    const schedule = buildSchedule(workspace)
    const performance = buildPerformancePlan(workspace, schedule)

    this.workspace = workspace
    this.performance = performance

    if (this.transport === undefined) {
      this.transport = new Transport(workspace)
    }

    this.transport.loadWorkspace(workspace, schedule)
  }

  public async play(): Promise<void> {
    const audioEngine = this.audioEngine

    const transport = this.requireTransport()
    const workspace = this.requireWorkspace()
    const performance = this.requirePerformance()

    if (audioEngine === undefined) {
      await transport.play()
      return
    }

    await audioEngine.initialize()

    if (performance !== this.loadedPerformance) {
      await audioEngine.load(
        workspace,
        performance,
      )

      this.loadedPerformance = performance
    }

    try {
      await Promise.all([
        transport.play(),
        audioEngine.play(),
      ])
    }
    catch (error) {
      transport.stop()
      audioEngine.stop()
      throw error
    }
  }

  public pause(): void {
    this.transport?.pause()
    this.audioEngine?.pause()
  }

  public stop(): void {
    this.transport?.stop()
    this.audioEngine?.stop()
  }

  public seek(tick: Tick): void {
    this.transport?.seek(tick)
    this.audioEngine?.seek(tick)
  }

  public setLoop(
    range: TickRange | undefined,
    enabled?: boolean,
  ): void {
    const transport = this.requireTransport()
    transport.setLoop(range, enabled)

    const snapshot = transport.getSnapshot()
    this.audioEngine?.setLoop(
      snapshot.loopEnabled ? snapshot.loopRange : undefined,
    )
  }

  public getPlayheadTick(): Tick {
    return this.requireTransport().getPlayheadTick()
  }

  public getSnapshot(): TransportSnapshot {
    return this.requireTransport().getSnapshot()
  }

  public getStatus(): TransportStatus {
    return this.transport?.status ?? 'stopped'
  }

  public subscribe(listener: TransportListener): () => void {
    return this.transport?.subscribe(listener) ?? (() => {})
  }

  public dispose(): void {
    this.transport?.destroy()
    this.audioEngine?.dispose()

    this.workspace = undefined
    this.performance = undefined
    this.loadedPerformance = undefined
  }

  private requireWorkspace(): Workspace {
    if (this.workspace === undefined) {
      throw new Error('No workspace has been loaded')
    }

    return this.workspace
  }

  private requirePerformance(): PerformancePlan {
    if (this.performance === undefined) {
      throw new Error('No performance has been loaded')
    }

    return this.performance
  }

  private requireTransport(): Transport {
    if (this.transport === undefined) {
      throw new Error('No transport has been loaded')
    }

    return this.transport
  }
}
