/** Base shape required to compute drag-drop reorder updates. */
type ReorderableEntity = {
  id: string;
  sort_order: number;
};

/** Output row shape returned by drag-drop reorder computation. */
type ReorderComputationResult<TGroupKey extends string> = {
  id: string;
  sort_order: number;
} & Partial<Record<TGroupKey, string>>;

/**
 * Build minimal reorder updates for drag-drop operations.
 * Supports optional group-field moves (e.g. category_id or stage_id).
 */
export function computeReorderUpdates<
  TGroupKey extends string,
  TEntity extends ReorderableEntity &
    Partial<Record<TGroupKey, string | null | undefined>>,
>({
  entities,
  activeId,
  overId,
  activeEntity,
  targetGroupId,
  groupKey,
  droppedOnGroupContainer,
}: {
  entities: TEntity[];
  activeId: string;
  overId: string;
  activeEntity: TEntity;
  targetGroupId?: string;
  groupKey: TGroupKey;
  droppedOnGroupContainer: boolean;
}): ReorderComputationResult<TGroupKey>[] {
  const entitiesById = new Map(entities.map((entity) => [entity.id, entity]));
  const sortedEntities = [...entities].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const oldIndex = sortedEntities.findIndex((entity) => entity.id === activeId);
  const newIndex = droppedOnGroupContainer
    ? -1
    : sortedEntities.findIndex((entity) => entity.id === overId);

  if (oldIndex === -1) {
    return [];
  }

  sortedEntities.splice(oldIndex, 1);
  const insertAt = newIndex === -1 ? sortedEntities.length : newIndex;
  sortedEntities.splice(insertAt, 0, activeEntity);

  const startIndex = Math.min(oldIndex, insertAt);
  const endIndex = Math.max(oldIndex, insertAt);
  const updates: ReorderComputationResult<TGroupKey>[] = [];

  for (let index = startIndex; index <= endIndex; index++) {
    const entityAtIndex = sortedEntities[index];
    if (!entityAtIndex) continue;
    const originalEntity = entitiesById.get(entityAtIndex.id);
    if (!originalEntity) continue;

    const hasSortOrderChange = originalEntity.sort_order !== index;
    const isActiveEntity = entityAtIndex.id === activeId;
    const originalGroupValue = originalEntity[groupKey];
    const hasGroupChange =
      isActiveEntity &&
      typeof targetGroupId === "string" &&
      originalGroupValue !== targetGroupId;
    if (!hasSortOrderChange && !hasGroupChange) continue;

    const update: Record<string, unknown> = {
      id: entityAtIndex.id,
      sort_order: index,
    };
    if (hasGroupChange) {
      update[groupKey] = targetGroupId;
    }
    updates.push(update as ReorderComputationResult<TGroupKey>);
  }

  if (
    updates.length === 0 &&
    typeof targetGroupId === "string" &&
    activeEntity[groupKey] !== targetGroupId
  ) {
    const update: Record<string, unknown> = {
      id: activeEntity.id,
      sort_order: activeEntity.sort_order,
    };
    update[groupKey] = targetGroupId;
    updates.push(update as ReorderComputationResult<TGroupKey>);
  }

  return updates;
}
