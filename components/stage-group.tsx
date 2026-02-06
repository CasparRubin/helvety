"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import type { Stage } from "@/lib/types";

/**
 *
 */
interface StageGroupProps {
  stage: Stage;
  /** IDs of entities in this stage (for SortableContext) */
  entityIds: string[];
  /** Count of entities */
  count: number;
  children: React.ReactNode;
}

/**
 * StageGroup - A collapsible group header for entities in a specific stage.
 * Acts as a droppable zone for DnD.
 */
export function StageGroup({
  stage,
  entityIds,
  count,
  children,
}: StageGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: "stage", stageId: stage.id },
  });

  return (
    <div className="mb-2">
      {/* Stage Header */}
      <button
        type="button"
        className={`hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
          isOver ? "bg-primary/5 ring-primary/30 ring-2" : ""
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Collapse chevron */}
        {isCollapsed ? (
          <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" />
        )}

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
            isOver ? "border-primary/40" : ""
          }`}
          style={
            stage.color
              ? { borderLeftColor: isOver ? undefined : stage.color }
              : undefined
          }
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

/**
 * UnstagedGroup - Group for entities without a stage assignment.
 */
export function UnstagedGroup({
  entityIds,
  count,
  children,
}: {
  entityIds: string[];
  count: number;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: "stage-unstaged",
    data: { type: "stage", stageId: null },
  });

  return (
    <div className="mb-2">
      <button
        type="button"
        className={`hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
          isOver ? "bg-primary/5 ring-primary/30 ring-2" : ""
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
            isOver ? "border-primary/40" : ""
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
