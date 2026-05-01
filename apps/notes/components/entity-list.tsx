"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { computeReorderUpdates } from "@helvety/shared/entity-list-reorder";
import { Button } from "@helvety/ui/button";
import { useE2eeEntityListDndSensors } from "@helvety/ui/use-e2ee-entity-list-dnd-sensors";
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { NoteCategoryGroup } from "@/components/category-group";
import { EntityRow } from "@/components/entity-row";

import type { DefaultNoteCategory } from "@/lib/config/default-note-categories";
import type { Item, ReorderUpdate } from "@/lib/types";

/** Decrypted note row as shown in the main list. */
type AnyEntity = Item;

/** Props for the category-grouped notes entity list. */
interface EntityListProps {
  entities: AnyEntity[];
  isLoading: boolean;
  isRefreshing?: boolean;
  error: string | null;
  onRetry?: () => void;
  categories: DefaultNoteCategory[];
  onEntityClick?: (entity: AnyEntity) => void;
  entityHref?: (entity: AnyEntity) => string;
  onEntityPrefetch?: (entity: AnyEntity) => void;
  onEntityDelete?: (id: string, title: string) => void;
  onReorder?: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Shown when the list is empty because of an active client-side search. */
  emptySearchMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Category-grouped list for notes (matches Contacts list UX).
 */
export function EntityList({
  entities,
  isLoading,
  error,
  onRetry,
  categories,
  onEntityClick,
  entityHref,
  onEntityPrefetch,
  onEntityDelete,
  onReorder,
  emptySearchMessage,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Create your first entry to get started.",
}: EntityListProps) {
  const hasCategories = categories.length > 0;
  const sortableDisabled = onReorder == null;

  const sensors = useE2eeEntityListDndSensors();

  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setHoveredCategoryId(null);
        return;
      }

      if (over.data?.current?.type === "category") {
        setHoveredCategoryId(over.data.current.categoryId ?? null);
        return;
      }

      const overEntity = entities.find((e) => e.id === over.id);
      if (overEntity) {
        setHoveredCategoryId(overEntity.category_id);
      }
    },
    [entities]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setHoveredCategoryId(null);
      const { active, over } = event;
      if (!over || !onReorder) return;
      if (active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;
      const activeEntity = entities.find((entity) => entity.id === activeId);
      const overEntity = entities.find((entity) => entity.id === overId);

      if (!activeEntity) return;

      let targetCategoryId: string | undefined;
      if (
        over.data?.current?.type === "category" &&
        over.data.current.categoryId !== undefined
      ) {
        targetCategoryId = over.data.current.categoryId;
      }
      if (overEntity?.category_id && targetCategoryId === undefined) {
        targetCategoryId = overEntity.category_id;
      }

      const updates = computeReorderUpdates({
        entities,
        activeId,
        overId,
        activeEntity,
        targetGroupId: targetCategoryId,
        groupKey: "category_id",
        droppedOnGroupContainer:
          !overEntity && over.data?.current?.type === "category",
      }) as ReorderUpdate[];

      if (updates.length === 0) return;

      await onReorder(updates);
    },
    [entities, onReorder]
  );

  const handleMoveUp = useCallback(
    (entityId: string) => {
      if (!onReorder || !hasCategories) return;
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) return;

      const currentCategoryIdx = categories.findIndex(
        (c) => c.id === entity.category_id
      );
      if (currentCategoryIdx <= 0) return;
      const previousCategory = categories[currentCategoryIdx - 1];
      if (!previousCategory) return;

      void onReorder([
        {
          id: entity.id,
          sort_order: entity.sort_order,
          category_id: previousCategory.id,
        },
      ]);
    },
    [categories, entities, hasCategories, onReorder]
  );

  const handleMoveDown = useCallback(
    (entityId: string) => {
      if (!onReorder || !hasCategories) return;
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) return;

      const currentCategoryIdx = categories.findIndex(
        (c) => c.id === entity.category_id
      );
      if (
        currentCategoryIdx < 0 ||
        currentCategoryIdx >= categories.length - 1
      ) {
        return;
      }
      const nextCategory = categories[currentCategoryIdx + 1];
      if (!nextCategory) return;

      void onReorder([
        {
          id: entity.id,
          sort_order: entity.sort_order,
          category_id: nextCategory.id,
        },
      ]);
    },
    [categories, entities, hasCategories, onReorder]
  );

  const groupedEntities = useMemo(() => {
    if (!hasCategories) {
      return new Map<string, AnyEntity[]>();
    }
    const sorted = [...entities].sort((a, b) => a.sort_order - b.sort_order);
    const groups = new Map<string, AnyEntity[]>();
    for (const c of categories) {
      groups.set(c.id, []);
    }
    for (const entity of sorted) {
      const bucket =
        groups.get(entity.category_id) ?? groups.get(categories[0]?.id ?? "");
      bucket?.push(entity);
    }
    return groups;
  }, [categories, entities, hasCategories]);

  const sortedEntitiesFlat = useMemo(() => {
    if (hasCategories) {
      return [];
    }
    return [...entities].sort((a, b) => a.sort_order - b.sort_order);
  }, [entities, hasCategories]);

  const entityIds = useMemo(() => {
    if (hasCategories) {
      return [];
    }
    return entities.map((e) => e.id);
  }, [entities, hasCategories]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-muted/30 flex flex-col items-center justify-center gap-3 py-12">
        <p role="alert" className="text-muted-foreground text-sm">
          Something went wrong
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={() => onRetry()}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (entities.length === 0 && emptySearchMessage) {
    return (
      <div className="text-muted-foreground flex justify-center py-12 text-center text-sm">
        {emptySearchMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entities.length > 0 && (
        <div className="text-muted-foreground border-border hidden items-center gap-2 border-b px-3 pb-2 text-xs font-medium md:flex">
          <span className="w-4 shrink-0" />
          <span className="w-4 shrink-0" />
          <span className="flex-1">Title</span>
          <span className="w-24 shrink-0 text-right">Created</span>
          <span className="w-8 shrink-0" />
        </div>
      )}

      {hasCategories ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div>
            {categories.map((category, categoryIndex) => {
              const categoryEntities = groupedEntities.get(category.id) ?? [];
              const isFirstCategory = categoryIndex === 0;
              const isLastCategory = categoryIndex === categories.length - 1;
              return (
                <NoteCategoryGroup
                  key={category.id}
                  category={category}
                  entityIds={categoryEntities.map((e) => e.id)}
                  count={categoryEntities.length}
                  isHighlighted={hoveredCategoryId === category.id}
                >
                  {categoryEntities.map((entity) => (
                    <EntityRow
                      key={entity.id}
                      id={entity.id}
                      title={entity.title}
                      description={entity.description}
                      createdAt={entity.created_at}
                      categoryColor={category.color}
                      isFirst={isFirstCategory}
                      isLast={isLastCategory}
                      href={entityHref?.(entity)}
                      onClick={() => onEntityClick?.(entity)}
                      onPrefetch={() => onEntityPrefetch?.(entity)}
                      onDelete={
                        onEntityDelete
                          ? () => onEntityDelete(entity.id, entity.title)
                          : undefined
                      }
                      onMoveUp={
                        categories.length > 1
                          ? () => handleMoveUp(entity.id)
                          : undefined
                      }
                      onMoveDown={
                        categories.length > 1
                          ? () => handleMoveDown(entity.id)
                          : undefined
                      }
                      sortableDisabled={sortableDisabled}
                    />
                  ))}
                </NoteCategoryGroup>
              );
            })}
          </div>
        </DndContext>
      ) : entities.length === 0 ? (
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <h3 className="mb-2 text-lg font-medium">{emptyTitle}</h3>
          <p className="text-muted-foreground text-center text-sm">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="border-border divide-border overflow-hidden rounded-lg border">
            <SortableContext
              items={entityIds}
              strategy={verticalListSortingStrategy}
            >
              {sortedEntitiesFlat.map((entity, idx) => (
                <EntityRow
                  key={entity.id}
                  id={entity.id}
                  title={entity.title}
                  description={entity.description}
                  createdAt={entity.created_at}
                  isFirst={idx === 0}
                  isLast={idx === sortedEntitiesFlat.length - 1}
                  href={entityHref?.(entity)}
                  onClick={() => onEntityClick?.(entity)}
                  onPrefetch={() => onEntityPrefetch?.(entity)}
                  onDelete={
                    onEntityDelete
                      ? () => onEntityDelete(entity.id, entity.title)
                      : undefined
                  }
                  sortableDisabled={sortableDisabled}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
}
