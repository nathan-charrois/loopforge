import type { Tick } from '~/domain'
import type { PerformancePlan } from '~/store/playback'
import type { Workspace } from '~/store/workspace'

export type PlaybackLoop = {
  startTick: Tick
  endTick: Tick
}

export type AudioEngine = {
  initialize(): Promise<void>

  load(workspace: Workspace, plan: PerformancePlan): Promise<void>
  play(): Promise<void>
  pause(): void
  stop(): void
  seek(tick: Tick): void

  setLoop(loop: PlaybackLoop | undefined): void

  dispose(): void
}
