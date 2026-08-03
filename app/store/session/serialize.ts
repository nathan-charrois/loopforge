import { createSession } from './factory'
import { type Session } from './type'
import { createEditor } from '~/store/editor'
import { deserializeWorkspace, serializeWorkspace } from '~/store/workspace'

export function serializeSession(
  session: Session,
): string {
  return serializeWorkspace(session.workspace)
}

export function deserializeSession(
  contents: string,
): Session {
  const workspace = deserializeWorkspace(contents)

  return createSession(
    workspace,
    createEditor(),
  )
}
