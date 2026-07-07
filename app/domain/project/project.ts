export type ProjectId = string

export type ProjectMetadata = {
  description?: string
  tags: string[]
}

export type ProjectVersion = {
  schemaVersion: number
  revision: number
}

export type Project = {
  id: ProjectId
  name: string
  createdAt: string
  updatedAt: string
  version: ProjectVersion
  metadata: ProjectMetadata
}

export function validateProject(project: Project): string[] {
  const errors: string[] = []

  if (project.name.trim() === '') {
    errors.push(`Project ${project.id} must have a name.`)
  }

  return errors
}
