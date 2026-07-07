export type EntityStore<T> = {
  byId: Record<string, T>
  allIds: string[]
}

export type EntityWithId = {
  id: string
}

export function createEmptyEntityStore<T>(): EntityStore<T> {
  return {
    allIds: [],
    byId: {},
  }
}

export function createEntityStore<TEntity extends EntityWithId>(entities: readonly TEntity[] = []): EntityStore<TEntity> {
  return entities.reduce(
    (store, entity) => addEntity(store, entity),
    createEmptyEntityStore<TEntity>(),
  )
}

export function addEntity<TEntity extends EntityWithId>(
  store: EntityStore<TEntity>,
  entity: TEntity,
): EntityStore<TEntity> {
  return {
    allIds: store.allIds.includes(entity.id)
      ? store.allIds
      : [...store.allIds, entity.id],
    byId: {
      ...store.byId,
      [entity.id]: entity,
    },
  }
}

export function updateEntity<TEntity extends EntityWithId>(
  store: EntityStore<TEntity>,
  entity: TEntity,
): EntityStore<TEntity> {
  if (!store.allIds.includes(entity.id)) {
    return store
  }

  return {
    ...store,
    byId: {
      ...store.byId,
      [entity.id]: entity,
    },
  }
}

export function removeEntity<TEntity>(
  store: EntityStore<TEntity>,
  entityId: string,
): EntityStore<TEntity> {
  if (!store.allIds.includes(entityId)) {
    return store
  }

  const byId = { ...store.byId }
  delete byId[entityId]

  return {
    allIds: store.allIds.filter(currentId => currentId !== entityId),
    byId,
  }
}
