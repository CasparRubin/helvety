"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@helvety/ui/button";
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { EntityRow } from "@/components/entity-row";
import { StageGroup } from "@/components/stage-group";

import type { Item, Stage, ReorderUpdate } from "@/lib/types";

/**
 * Unified entity type for the list.
 */
type AnyEntity = Item & {
  title: string;
  description: string | null;
  stage_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  id: string;
};

/** Props for the stage-grouped entity list. */
interface EntityListProps {
  /** The entities to display */
  entities: AnyEntity[];
  /** Whether entities are currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Callback to retry after error (e.g. refresh) */
  onRetry?: () => void;
  /** Available stages for the current view */
  stages: Stage[];
  /** Optional precomputed map of entity id -> child count (unused in flat task flow) */
  childCounts?: Record<string, number>;
  /** Callback when an entity row is clicked (fallback when entityHref not provided) */
  onEntityClick?: (entity: AnyEntity) => void;
  /** URL for entity navigation — use Link instead of imperative router.push callbacks where possible */
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

/**
 * EntityList - Generic stage-aware list/table component.
 *
 * Features:
 * - Always shows stage groups when stages are available (even with no entities)
 * - Flat list fallback (when no stages are available)
 * - Drag-and-drop reordering within and between stages (desktop)
 * - Up/down arrows to move entities between stages on all screen sizes
 * - Consistent row layout across all entity types
 */
export function EntityList({
  entities,
  isLoading,
  error,
  onRetry,
  stages,
  childCounts,
  onEntityClick,
  entityHref,
  onEntityPrefetch,
  onEntityDelete,
  onReorder,
  emptySearchMessage,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Create your first entry to get started.",
}: EntityListProps) {
  const hasStages = stages.length > 0;
  const sortableDisabled = onReorder == null;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

      const activeId = active.id as string;
      const overId = over.id as string;

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

      // Build reorder updates
      // Calculate new sort_order based on position
      const sortedEntities = [...entities].sort(
        (a, b) => a.sort_order - b.sort_order
      );

      const oldIndex = sortedEntities.findIndex((e) => e.id === activeId);
      const newIndex = sortedEntities.findIndex((e) => e.id === overId);

      if (oldIndex === -1) return;

      // Remove active entity and reinsert at new position
      sortedEntities.splice(oldIndex, 1);
      const insertAt = newIndex === -1 ? sortedEntities.length : newIndex;
      sortedEntities.splice(insertAt, 0, activeEntity);

      // Generate only the minimal changed range to reduce rerender/load.
      const startIndex = Math.min(oldIndex, insertAt);
      const endIndex = Math.max(oldIndex, insertAt);
      const updates: ReorderUpdate[] = [];
      for (let index = startIndex; index <= endIndex; index++) {
        const entityAtIndex = sortedEntities[index];
        if (!entityAtIndex) continue;
        const originalEntity = entities.find((e) => e.id === entityAtIndex.id);
        if (!originalEntity) continue;

        const hasSortOrderChange = originalEntity.sort_order !== index;
        const isActiveEntity = entityAtIndex.id === activeId;
        const hasStageChange =
          isActiveEntity &&
          typeof targetStageId === "string" &&
          originalEntity.stage_id !== targetStageId;

        if (!hasSortOrderChange && !hasStageChange) continue;

        const update: ReorderUpdate = {
          id: entityAtIndex.id,
          sort_order: index,
        };
        if (hasStageChange) {
          update.stage_id = targetStageId;
        }
        updates.push(update);
      }

      // Handle stage-only moves where index did not change.
      if (
        updates.length === 0 &&
        typeof targetStageId === "string" &&
        activeEntity.stage_id !== targetStageId
      ) {
        updates.push({
          id: activeEntity.id,
          sort_order: activeEntity.sort_order,
          stage_id: targetStageId,
        });
      }

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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  // Error state - friendly UI with retry (toast already shown by hooks)
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
                      title={entity.title}
                      description={entity.description}
                      createdAt={entity.created_at}
                      stage={stageMap.get(entity.stage_id ?? "")}
                      childCount={childCounts?.[entity.id]}
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
        <div className="border-border flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <h3 className="mb-2 text-lg font-medium">{emptyTitle}</h3>
          <p className="text-muted-foreground text-center text-sm">
            {emptyDescription}
          </p>
        </div>
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
                  title={entity.title}
                  description={entity.description}
                  createdAt={entity.created_at}
                  childCount={childCounts?.[entity.id]}
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
