/** Base shape required for optimistic entity patching helpers. */
type WithIdAndUpdatedAt = {
  id: string;
  updated_at: string;
};

/**
 * Apply a local optimistic patch to one entity in a list.
 * Keeps unchanged rows referentially stable and updates `updated_at`.
 */
export function patchEntityInList<T extends WithIdAndUpdatedAt>(
  entities: T[],
  entityId: string,
  patch: Partial<Omit<T, "id" | "updated_at">>
): T[] {
  const now = new Date().toISOString();
  let hasPatched = false;

  const next = entities.map((entity) => {
    if (entity.id !== entityId) return entity;
    hasPatched = true;
    return {
      ...entity,
      ...patch,
      updated_at: now,
    };
  });

  return hasPatched ? next : entities;
}

/**
 * Apply a local optimistic patch to a selected single-entity state value.
 */
export function patchSingleEntity<T extends WithIdAndUpdatedAt>(
  entity: T | null,
  patch: Partial<Omit<T, "id" | "updated_at">>
): T | null {
  if (!entity) return entity;
  return {
    ...entity,
    ...patch,
    updated_at: new Date().toISOString(),
  };
}
