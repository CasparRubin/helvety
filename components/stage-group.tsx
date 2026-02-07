"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, { useState } from "react";

import { renderStageIcon } from "@/lib/icons";

import type { Stage } from "@/lib/types";

/**
 * Props for the StageGroup component
 */
interface StageGroupProps {
  stage: Stage;
  /** IDs of entities in this stage (for SortableContext) */
  entityIds: string[];
  /** Count of entities */
  count: number;
  children: React.ReactNode;
  /** Whether this stage is highlighted (e.g., during drag-over of child entities) */
  isHighlighted?: boolean;
}

/**
 * StageGroup - A collapsible group header for entities in a specific stage.
 * Acts as a droppable zone for DnD.
 *
 * Supports "rows shown by default" feature:
 * - If default_rows_shown === 0: starts collapsed
 * - If default_rows_shown > 0 && count > default_rows_shown: shows limited rows with "Show all" link
 * - If default_rows_shown > 0 && count <= default_rows_shown: shows all rows
 */
export function StageGroup({
  stage,
  entityIds,
  count,
  children,
  isHighlighted = false,
}: StageGroupProps) {
  // Initialize collapsed state based on default_rows_shown (0 = collapsed by default)
  const [isCollapsed, setIsCollapsed] = useState(
    stage.default_rows_shown === 0
  );
  // Track whether user has clicked "Show all"
  const [isShowingAll, setIsShowingAll] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: "stage", stageId: stage.id },
  });

  // Combine both signals - either direct isOver OR highlighted from parent
  const showHighlight = isOver || isHighlighted;

  // Determine how many rows to show and whether to show "Show all" link
  const childrenArray = React.Children.toArray(children);
  const defaultRowsShown = stage.default_rows_shown;
  const shouldLimitRows =
    defaultRowsShown > 0 && count > defaultRowsShown && !isShowingAll;
  const visibleChildren = shouldLimitRows
    ? childrenArray.slice(0, defaultRowsShown)
    : childrenArray;
  const hiddenCount = shouldLimitRows ? count - defaultRowsShown : 0;

  // IDs for visible entities only (for SortableContext)
  const visibleEntityIds = shouldLimitRows
    ? entityIds.slice(0, defaultRowsShown)
    : entityIds;

  return (
    <div className="mb-2">
      {/* Stage Header */}
      <button
        type="button"
        className={`hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
          showHighlight ? "bg-primary/5 ring-primary/30 ring-2" : ""
        }`}
        style={
          stage.color
            ? { backgroundColor: `${stage.color}14` } // 8% opacity
            : undefined
        }
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Collapse chevron */}
        {isCollapsed ? (
          <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" />
        )}

        {/* Stage icon */}
        {renderStageIcon(stage.icon, "size-4 shrink-0", {
          color: stage.color ?? "var(--muted-foreground)",
        })}

        {/* Color dot */}
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: stage.color ?? "var(--muted-foreground)" }}
        />

        {/* Stage name */}
        <span className="text-sm font-medium">{stage.name}</span>

        {/* Count */}
        <span className="text-muted-foreground text-xs">({count})</span>
      </button>

      {/* Entity rows */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`border-border ml-2 border-l-2 transition-colors ${
            showHighlight ? "border-primary/40" : ""
          }`}
          style={
            stage.color
              ? { borderLeftColor: showHighlight ? undefined : stage.color }
              : undefined
          }
        >
          <SortableContext
            items={visibleEntityIds}
            strategy={verticalListSortingStrategy}
          >
            {visibleChildren}
          </SortableContext>

          {/* Show all link */}
          {shouldLimitRows && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground w-full py-2 pl-4 text-left text-xs transition-colors"
              onClick={() => setIsShowingAll(true)}
            >
              Show all ({hiddenCount} more)
            </button>
          )}

          {/* Show less link when expanded */}
          {isShowingAll && count > defaultRowsShown && defaultRowsShown > 0 && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground w-full py-2 pl-4 text-left text-xs transition-colors"
              onClick={() => setIsShowingAll(false)}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * UnstagedGroup - Group for entities without a stage assignment.
 */
export function UnstagedGroup({
  entityIds,
  count,
  children,
  isHighlighted = false,
}: {
  entityIds: string[];
  count: number;
  children: React.ReactNode;
  isHighlighted?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: "stage-unstaged",
    data: { type: "stage", stageId: null },
  });

  // Combine both signals - either direct isOver OR highlighted from parent
  const showHighlight = isOver || isHighlighted;

  return (
    <div className="mb-2">
      <button
        type="button"
        className={`hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
          showHighlight ? "bg-primary/5 ring-primary/30 ring-2" : ""
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" />
        )}
        <span className="bg-muted-foreground/40 size-2.5 shrink-0 rounded-full" />
        <span className="text-muted-foreground text-sm font-medium">
          Unstaged
        </span>
        <span className="text-muted-foreground text-xs">({count})</span>
      </button>

      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`border-muted-foreground/30 ml-2 border-l-2 transition-colors ${
            showHighlight ? "border-primary/40" : ""
          }`}
        >
          <SortableContext
            items={entityIds}
            strategy={verticalListSortingStrategy}
          >
            {children}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
