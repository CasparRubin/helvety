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
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { EntityRow } from "@/components/entity-row";
import { StageGroup, UnstagedGroup } from "@/components/stage-group";
import { isItem } from "@/lib/types";

import type {
  Unit,
  Space,
  Item,
  Stage,
  Label,
  EntityType,
  ReorderUpdate,
} from "@/lib/types";

/**
 * Unified entity type for the list - can be Unit, Space, or Item
 */
type AnyEntity = (Unit | Space | Item) & {
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
  /** The type of entity being displayed */
  entityType: EntityType;
  /** The entities to display */
  entities: AnyEntity[];
  /** Whether entities are currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Available stages for the current config (empty if no config assigned) */
  stages: Stage[];
  /** Map of entity id -> child count (spaces for units, items for spaces) */
  childCounts?: Record<string, number>;
  /** Available labels for the current config (items only) */
  labels?: Label[];
  /** Callback when an entity row is clicked */
  onEntityClick?: (entity: AnyEntity) => void;
  /** Callback to delete an entity (receives id and title for confirmation dialog) */
  onEntityDelete?: (id: string, title: string) => void;
  /** Callback for batch reorder (drag-and-drop) */
  onReorder?: (updates: ReorderUpdate[]) => Promise<boolean>;
  /** Empty state title (only shown when no stages configured) */
  emptyTitle?: string;
  /** Empty state description (only shown when no stages configured) */
  emptyDescription?: string;
}

/**
 * EntityList - Generic list/table component for Units, Spaces, or Items.
 *
 * Features:
 * - Always shows stage groups when stages are configured (even with no entities)
 * - Flat list fallback (when no stages configured)
 * - Drag-and-drop reordering within and between stages (desktop)
 * - Mobile: up/down arrows to move entities between stages
 * - Consistent row layout across all entity types
 */
export function EntityList({
  entityType,
  entities,
  isLoading,
  error,
  stages,
  childCounts,
  labels,
  onEntityClick,
  onEntityDelete,
  onReorder,
  emptyTitle = "Nothing here yet",
  emptyDescription = "Create your first entry to get started.",
}: EntityListProps) {
  const hasStages = stages.length > 0;

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

      // If over a stage directly
      if (over.data?.current?.type === "stage") {
        setHoveredStageId(over.data.current.stageId ?? "unstaged");
        return;
      }

      // If over an entity, find which stage it belongs to
      const overEntity = entities.find((e) => e.id === over.id);
      if (overEntity) {
        setHoveredStageId(overEntity.stage_id ?? "unstaged");
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

  // Build a label map for quick lookup
  const labelMap = useMemo(() => {
    if (!labels || labels.length === 0) return null;
    const map = new Map<string, Label>();
    for (const l of labels) {
      map.set(l.id, l);
    }
    return map;
  }, [labels]);

  // Group entities by stage
  const groupedEntities = useMemo(() => {
    if (!hasStages) return null;

    const groups = new Map<string | null, AnyEntity[]>();

    // Initialize groups in stage order
    for (const s of stages) {
      groups.set(s.id, []);
    }
    groups.set(null, []); // Unstaged group

    for (const entity of entities) {
      const key = entity.stage_id;
      const group = groups.get(key);
      if (group) {
        group.push(entity);
      } else {
        // Entity has a stage_id not in current config -> unstaged
        const unstaged = groups.get(null);
        if (unstaged) unstaged.push(entity);
      }
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
      let targetStageId: string | null | undefined;

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
      if (overEntity && targetStageId === undefined) {
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

      // Generate updates with new sort_orders
      const updates: ReorderUpdate[] = sortedEntities.map((e, index) => {
        const update: ReorderUpdate = {
          id: e.id,
          sort_order: index,
        };
        if (e.id === activeId && targetStageId !== undefined) {
          update.stage_id = targetStageId;
        }
        return update;
      });

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
      if (currentStageIdx === -1) {
        // Unstaged → move to last stage
        const lastStage = stages[stages.length - 1];
        if (!lastStage) return;
        newStageId = lastStage.id;
      } else if (currentStageIdx <= 0) {
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

      // Unstaged or already in the last stage → cannot move down
      if (currentStageIdx === -1 || currentStageIdx >= stages.length - 1)
        return;

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

  // Error state
  if (error) {
    return (
      <div className="py-12 text-center">
        <p role="alert" className="text-destructive">
          {error}
        </p>
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
          {hasStages && (
            <span className="w-24 shrink-0 text-center">Stage</span>
          )}
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
                  {stageEntities
                    .toSorted((a, b) => {
                      const prioA = isItem(a) ? a.priority : 1;
                      const prioB = isItem(b) ? b.priority : 1;
                      if (prioB !== prioA) return prioB - prioA;
                      return (
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                      );
                    })
                    .map((entity) => (
                      <EntityRow
                        key={entity.id}
                        id={entity.id}
                        title={entity.title}
                        description={entity.description}
                        createdAt={entity.created_at}
                        entityType={entityType}
                        stage={stageMap.get(entity.stage_id ?? "")}
                        priority={isItem(entity) ? entity.priority : null}
                        label={
                          isItem(entity) && entity.label_id
                            ? (labelMap?.get(entity.label_id) ?? null)
                            : null
                        }
                        childCount={childCounts?.[entity.id]}
                        isFirst={isFirstStage}
                        isLast={isLastStage}
                        onClick={() => onEntityClick?.(entity)}
                        onDelete={
                          onEntityDelete
                            ? () => onEntityDelete(entity.id, entity.title)
                            : undefined
                        }
                        onMoveUp={() => handleMoveUp(entity.id)}
                        onMoveDown={() => handleMoveDown(entity.id)}
                      />
                    ))}
                </StageGroup>
              );
            })}

            {/* Unstaged entities */}
            {(() => {
              const unstagedEntities = groupedEntities?.get(null) ?? [];
              if (unstagedEntities.length === 0) return null;
              return (
                <UnstagedGroup
                  entityIds={unstagedEntities.map((e) => e.id)}
                  count={unstagedEntities.length}
                  isHighlighted={hoveredStageId === "unstaged"}
                >
                  {unstagedEntities
                    .toSorted((a, b) => {
                      const prioA = isItem(a) ? a.priority : 1;
                      const prioB = isItem(b) ? b.priority : 1;
                      if (prioB !== prioA) return prioB - prioA;
                      return (
                        new Date(b.updated_at).getTime() -
                        new Date(a.updated_at).getTime()
                      );
                    })
                    .map((entity) => (
                      <EntityRow
                        key={entity.id}
                        id={entity.id}
                        title={entity.title}
                        description={entity.description}
                        createdAt={entity.created_at}
                        entityType={entityType}
                        priority={isItem(entity) ? entity.priority : null}
                        label={
                          isItem(entity) && entity.label_id
                            ? (labelMap?.get(entity.label_id) ?? null)
                            : null
                        }
                        childCount={childCounts?.[entity.id]}
                        isFirst={false}
                        isLast={true}
                        onClick={() => onEntityClick?.(entity)}
                        onDelete={
                          onEntityDelete
                            ? () => onEntityDelete(entity.id, entity.title)
                            : undefined
                        }
                        onMoveUp={() => handleMoveUp(entity.id)}
                        onMoveDown={() => handleMoveDown(entity.id)}
                      />
                    ))}
                </UnstagedGroup>
              );
            })()}
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
                  entityType={entityType}
                  priority={isItem(entity) ? entity.priority : null}
                  label={
                    isItem(entity) && entity.label_id
                      ? (labelMap?.get(entity.label_id) ?? null)
                      : null
                  }
                  childCount={childCounts?.[entity.id]}
                  isFirst={idx === 0}
                  isLast={idx === sortedEntities.length - 1}
                  onClick={() => onEntityClick?.(entity)}
                  onDelete={
                    onEntityDelete
                      ? () => onEntityDelete(entity.id, entity.title)
                      : undefined
                  }
                  onMoveUp={() => handleMoveUp(entity.id)}
                  onMoveDown={() => handleMoveDown(entity.id)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
      )}
    </div>
  );
}
