import { createWorkspace } from './factory'
import { isWorkspace, type Workspace } from './type'

export function serializeWorkspace(
  workspace: Workspace,
): string {
  return JSON.stringify(workspace, null, 2)
}

export function deserializeWorkspace(
  contents: string,
): Workspace {
  const parsed = JSON.parse(contents)

  if (!isWorkspace(parsed)) {
    throw new Error('Invalid workspace file')
  }

  return createWorkspace(parsed)
}
