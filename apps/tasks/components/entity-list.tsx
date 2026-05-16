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
import { getE2eeListTitle } from "@helvety/shared/e2ee-draft";
import { computeReorderUpdates } from "@helvety/shared/entity-list-reorder";
import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";
import {
  ListEmptySearchState,
  ListEmptyState,
  ListErrorState,
  ListLoadingState,
} from "@helvety/ui/list-states";
import { useE2eeEntityListDndSensors } from "@helvety/ui/use-e2ee-entity-list-dnd-sensors";
import { useCallback, useMemo, useState } from "react";

import { EntityRow } from "@/components/entity-row";
import { StageGroup } from "@/components/stage-group";

import type { Item, Stage, ReorderUpdate } from "@/lib/types";

/** Unified task row shape used by the list UI. */
type AnyEntity = Item & {
  title: string;
  description: string | null;
  stage_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  id: string;
};

/** Props for the stage-grouped task list. */
interface EntityListProps {
  /** The entities to display */
  entities: AnyEntity[];
  /** Whether entities are currently loading */
  isLoading: boolean;
  /** Whether entities are being refreshed while stale rows stay visible */
  isRefreshing?: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to retry after error (e.g. refresh) */
  onRetry?: () => void;
  /** Available stages for the current view */
  stages: Stage[];
  /** Callback when an entity row is clicked (fallback when entityHref not provided) */
  onEntityClick?: (entity: AnyEntity) => void;
  /** URL for entity navigation - use Link instead of imperative router.push callbacks where possible */
  entityHref?: (entity: AnyEntity) => string;
  /** Callback used to prefetch an entity route on hover/focus */
  onEntityPrefetch?: (entity: AnyEntity) => void;
  /** Callback to delete an entity (receives id and title for confirmation dialog) */
  onEntityDelete?: (id: string, title: string) => void;
  /** Callback for batch reorder (drag-and-drop) */
  onReorder?: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Shown when the list is empty because of an active client-side search (not the default empty state). */
  emptySearchMessage?: string;
  /** Empty state title (shown when no stages and no entities) */
  emptyTitle?: string;
  /** Empty state description (shown when no stages and no entities) */
  emptyDescription?: string;
}

/** Stage-aware task list with grouped and flat rendering modes. */
export function EntityList({
  entities,
  isLoading,
  error,
  onRetry,
  stages,
  onEntityClick,
  entityHref,
  onEntityPrefetch,
  onEntityDelete,
  onReorder,
  emptySearchMessage,
  emptyTitle = "No tasks yet",
  emptyDescription = "Create your first task to get started.",
}: EntityListProps) {
  const hasStages = stages.length > 0;
  const sortableDisabled = onReorder == null;

  const sensors = useE2eeEntityListDndSensors();

  // Track which stage is being hovered during drag
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // Handle drag over to track hovered stage
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setHoveredStageId(null);
        return;
      }

      if (over.data?.current?.type === "stage") {
        setHoveredStageId(over.data.current.stageId ?? null);
        return;
      }

      const overEntity = entities.find((e) => e.id === over.id);
      if (overEntity) {
        setHoveredStageId(overEntity.stage_id ?? null);
      }
    },
    [entities]
  );

  // Build a stage map for quick lookup
  const stageMap = useMemo(() => {
    const map = new Map<string, Stage>();
    for (const s of stages) {
      map.set(s.id, s);
    }
    return map;
  }, [stages]);

  // Group entities by stage
  const groupedEntities = useMemo(() => {
    if (!hasStages) return null;

    const groups = new Map<string, AnyEntity[]>();

    // Initialize groups in stage order
    for (const s of stages) {
      groups.set(s.id, []);
    }
    for (const entity of entities) {
      const key = entity.stage_id;
      if (!key) continue;
      const group = groups.get(key);
      if (group) {
        group.push(entity);
      }
    }

    for (const group of groups.values()) {
      group.sort((a, b) => a.sort_order - b.sort_order);
    }

    return groups;
  }, [entities, stages, hasStages]);

  // All entity IDs for SortableContext
  const entityIds = useMemo(() => entities.map((e) => e.id), [entities]);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      // Reset hovered stage when drag ends
      setHoveredStageId(null);

      const { active, over } = event;
      if (!over || !onReorder) return;
      if (active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Determine target stage
      let targetStageId: string | undefined;

      // Check if dropped on a stage group
      if (
        over.data?.current?.type === "stage" &&
        over.data.current.stageId !== undefined
      ) {
        targetStageId = over.data.current.stageId;
      }

      // Find entities involved
      const activeEntity = entities.find((e) => e.id === activeId);
      const overEntity = entities.find((e) => e.id === overId);

      if (!activeEntity) return;

      // If dropped over another entity, inherit that entity's stage
      if (overEntity?.stage_id && targetStageId === undefined) {
        targetStageId = overEntity.stage_id;
      }

      const updates = computeReorderUpdates({
        entities,
        activeId,
        overId,
        activeEntity,
        targetGroupId: targetStageId,
        groupKey: "stage_id",
        droppedOnGroupContainer: over.data?.current?.type === "stage",
      }).map((update) => ({
        id: update.id,
        sort_order: update.sort_order,
        stage_id: update.stage_id ?? null,
      })) satisfies ReorderUpdate[];

      if (updates.length === 0) return;

      await onReorder(updates);
    },
    [entities, onReorder]
  );

  // Move up/down handlers for mobile: move entity to previous/next stage
  const handleMoveUp = useCallback(
    (entityId: string) => {
      if (!onReorder || stages.length === 0) return;
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) return;

      const currentStageIdx = stages.findIndex((s) => s.id === entity.stage_id);

      let newStageId: string;
      if (currentStageIdx <= 0) {
        // Already in the first stage, cannot move up
        return;
      } else {
        const prevStage = stages[currentStageIdx - 1];
        if (!prevStage) return;
        newStageId = prevStage.id;
      }

      const updates: ReorderUpdate[] = [
        { id: entity.id, sort_order: entity.sort_order, stage_id: newStageId },
      ];
      void onReorder(updates);
    },
    [entities, stages, onReorder]
  );

  const handleMoveDown = useCallback(
    (entityId: string) => {
      if (!onReorder || stages.length === 0) return;
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) return;

      const currentStageIdx = stages.findIndex((s) => s.id === entity.stage_id);

      // Missing stage or already in the last stage → cannot move down
      if (currentStageIdx < 0 || currentStageIdx >= stages.length - 1) return;

      const nextStage = stages[currentStageIdx + 1];
      if (!nextStage) return;
      const newStageId = nextStage.id;

      const updates: ReorderUpdate[] = [
        { id: entity.id, sort_order: entity.sort_order, stage_id: newStageId },
      ];
      void onReorder(updates);
    },
    [entities, stages, onReorder]
  );

  // Loading state
  if (isLoading) {
    return <ListLoadingState />;
  }

  // Error state - friendly UI with retry (toast already shown by hooks)
  if (error) {
    return <ListErrorState message={GENERIC_USER_ERROR} onRetry={onRetry} />;
  }

  if (entities.length === 0 && emptySearchMessage) {
    return <ListEmptySearchState message={emptySearchMessage} />;
  }

  const sortedEntities = [...entities].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div className="space-y-4">
      {/* Column headers (desktop only) */}
      {entities.length > 0 && (
        <div className="text-muted-foreground border-border hidden items-center gap-2 border-b px-3 pb-2 text-xs font-medium md:flex">
          <span className="w-4 shrink-0" /> {/* drag handle space */}
          <span className="w-4 shrink-0" /> {/* icon space */}
          <span className="flex-1">Title</span>
          <span className="w-24 shrink-0 text-right">Created</span>
          <span className="w-8 shrink-0" /> {/* actions space */}
        </div>
      )}

      {/* Stage groups - always shown when stages exist */}
      {hasStages ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div>
            {stages.map((stage, stageIndex) => {
              const stageEntities = groupedEntities?.get(stage.id) ?? [];
              const isFirstStage = stageIndex === 0;
              const isLastStage = stageIndex === stages.length - 1;
              return (
                <StageGroup
                  key={stage.id}
                  stage={stage}
                  entityIds={stageEntities.map((e) => e.id)}
                  count={stageEntities.length}
                  isHighlighted={hoveredStageId === stage.id}
                >
                  {stageEntities.map((entity) => (
                    <EntityRow
                      key={entity.id}
                      id={entity.id}
                      title={getE2eeListTitle(entity.title)}
                      description={entity.description}
                      createdAt={entity.created_at}
                      stageColor={
                        stageMap.get(entity.stage_id ?? "")?.color ?? undefined
                      }
                      isFirst={isFirstStage}
                      isLast={isLastStage}
                      href={entityHref?.(entity)}
                      onClick={() => onEntityClick?.(entity)}
                      onPrefetch={() => onEntityPrefetch?.(entity)}
                      onDelete={
                        onEntityDelete
                          ? () => onEntityDelete(entity.id, entity.title)
                          : undefined
                      }
                      onMoveUp={
                        stages.length > 1
                          ? () => handleMoveUp(entity.id)
                          : undefined
                      }
                      onMoveDown={
                        stages.length > 1
                          ? () => handleMoveDown(entity.id)
                          : undefined
                      }
                      sortableDisabled={sortableDisabled}
                    />
                  ))}
                </StageGroup>
              );
            })}
          </div>
        </DndContext>
      ) : entities.length === 0 ? (
        /* Empty state - only shown when no stages AND no entities */
        <ListEmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        /* Flat list (no stages) */
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
              {sortedEntities.map((entity, idx) => (
                <EntityRow
                  key={entity.id}
                  id={entity.id}
                  title={getE2eeListTitle(entity.title)}
                  description={entity.description}
                  createdAt={entity.created_at}
                  isFirst={idx === 0}
                  isLast={idx === sortedEntities.length - 1}
                  href={entityHref?.(entity)}
                  onClick={() => onEntityClick?.(entity)}
                  onPrefetch={() => onEntityPrefetch?.(entity)}
                  onDelete={
                    onEntityDelete
                      ? () => onEntityDelete(entity.id, entity.title)
                      : undefined
                  }
                  onMoveUp={
                    stages.length > 1
                      ? () => handleMoveUp(entity.id)
                      : undefined
                  }
                  onMoveDown={
                    stages.length > 1
                      ? () => handleMoveDown(entity.id)
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
