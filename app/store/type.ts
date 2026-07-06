export type EntityStore<T> = {
  byId: Record<string, T>
  allIds: string[]
}
