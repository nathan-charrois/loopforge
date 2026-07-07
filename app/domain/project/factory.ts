import type { Project, ProjectMetadata, ProjectVersion } from './project'

export function createProjectMetadata(input: Partial<ProjectMetadata> = {}): ProjectMetadata {
  return {
    description: input.description,
    tags: input.tags ?? [],
  }
}

export function createProjectVersion(input: Partial<ProjectVersion> = {}): ProjectVersion {
  return {
    revision: input.revision ?? 1,
    schemaVersion: input.schemaVersion ?? 1,
  }
}

export function createProject(input: Partial<Project>): Project {
  const createdAt = input.createdAt ?? new Date().toISOString()

  return {
    createdAt,
    id: input.id ?? `project_${Date.now()}`,
    metadata: input.metadata ?? createProjectMetadata(),
    name: input.name ?? 'Untitled',
    updatedAt: input.updatedAt ?? createdAt,
    version: input.version ?? createProjectVersion(),
  }
}

export function touchProject(project: Project, updatedAt = new Date().toISOString()): Project {
  return {
    ...project,
    updatedAt,
  }
}

export function renameProject(project: Project, name: string): Project {
  return touchProject({
    ...project,
    name,
  })
}

export function updateProjectMetadata(project: Project, metadata: ProjectMetadata): Project {
  return touchProject({
    ...project,
    metadata,
  })
}
