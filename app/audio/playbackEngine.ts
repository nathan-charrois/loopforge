import type { AudioEngine } from './audioEngine'
import { buildPerformancePlan, type PerformancePlan } from '~/store/playback'
import { type Workspace } from '~/store/workspace'
import { buildSchedule } from '~/utils/schedule'

export class PlaybackEngine {
  private workspace: Workspace | undefined
  private performance: PerformancePlan | undefined
  private loadedPerformance: PerformancePlan | undefined

  public constructor(
    private readonly audioEngine?: AudioEngine,
  ) {}

  public loadWorkspace(workspace: Workspace): void {
    if (workspace === this.workspace) {
      return
    }

    this.workspace = workspace
    this.performance = buildPerformancePlan(workspace, buildSchedule(workspace))
  }

  public async play(): Promise<void> {
    if (!this.workspace || !this.performance) {
      throw new Error('No performance has been loaded')
    }

    if (this.audioEngine === undefined) {
      throw new Error('No audio engine has been configured')
    }

    await this.audioEngine.initialize()

    if (this.performance !== this.loadedPerformance) {
      await this.audioEngine.load(
        this.workspace,
        this.performance,
      )

      this.loadedPerformance = this.performance
    }

    await this.audioEngine.play()
  }

  public pause(): void {
    this.audioEngine?.pause()
  }

  public stop(): void {
    this.audioEngine?.stop()
  }

  public dispose(): void {
    this.audioEngine?.dispose()

    this.workspace = undefined
    this.performance = undefined
    this.loadedPerformance = undefined
  }
}
