import { getBlockEndTick } from '../arrangement'
import type { Tick } from '../musicPrimitives'
import type { Project } from './index'

export function getProjectEndTick(project: Project): Tick {
  const sectionEndTicks = project.arrangement.sections.map(section => section.startTick + section.lengthTicks)
  const blockEndTicks = project.arrangement.blocks.map(getBlockEndTick)

  return Math.max(0, ...sectionEndTicks, ...blockEndTicks)
}

export function getHighestBlockEndTick(project: Project): Tick {
  return project.arrangement.blocks.reduce((latestEndTick, block) => Math.max(latestEndTick, getBlockEndTick(block)), 0)
}
