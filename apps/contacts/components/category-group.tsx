"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, { useState } from "react";

import { renderCategoryIcon } from "@/lib/icons";

import type { Category } from "@/lib/types";

/**
 * Props for the CategoryGroup component
 */
interface CategoryGroupProps {
  category: Category;
  /** IDs of contacts in this category (for SortableContext) */
  contactIds: string[];
  /** Count of contacts */
  count: number;
  children: React.ReactNode;
  /** Whether this category is highlighted (e.g., during drag-over) */
  isHighlighted?: boolean;
}

/**
 * CategoryGroup - A collapsible group header for contacts in a specific category.
 * Acts as a droppable zone for DnD.
 */
export function CategoryGroup({
  category,
  contactIds,
  count,
  children,
  isHighlighted = false,
}: CategoryGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(
    category.default_rows_shown === 0
  );
  const [isShowingAll, setIsShowingAll] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `category-${category.id}`,
    data: { type: "category", categoryId: category.id },
  });

  const showHighlight = isOver || isHighlighted;

  const childrenArray = React.Children.toArray(children);
  const defaultRowsShown = category.default_rows_shown;
  const shouldLimitRows =
    defaultRowsShown > 0 && count > defaultRowsShown && !isShowingAll;
  const visibleChildren = shouldLimitRows
    ? childrenArray.slice(0, defaultRowsShown)
    : childrenArray;
  const hiddenCount = shouldLimitRows ? count - defaultRowsShown : 0;

  const visibleContactIds = shouldLimitRows
    ? contactIds.slice(0, defaultRowsShown)
    : contactIds;

  return (
    <div className="mb-2">
      {/* Category Header */}
      <button
        type="button"
        className={`hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
          showHighlight ? "bg-primary/5 ring-primary/30 ring-2" : ""
        }`}
        style={
          category.color
            ? { backgroundColor: `${category.color}14` }
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

        {/* Category icon */}
        {renderCategoryIcon(category.icon, "size-4 shrink-0", {
          color: category.color ?? "var(--muted-foreground)",
        })}

        {/* Color dot */}
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: category.color ?? "var(--muted-foreground)",
          }}
        />

        {/* Category name */}
        <span className="min-w-0 truncate text-sm font-medium">
          {category.name}
        </span>

        {/* Count */}
        <span className="text-muted-foreground text-xs">({count})</span>
      </button>

      {/* Contact rows */}
      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`border-border ml-2 border-l-2 transition-colors ${
            showHighlight ? "border-primary/40" : ""
          }`}
          style={
            category.color
              ? { borderLeftColor: showHighlight ? undefined : category.color }
              : undefined
          }
        >
          <SortableContext
            items={visibleContactIds}
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
 * UncategorizedGroup - Group for contacts without a category assignment.
 */
export function UncategorizedGroup({
  contactIds,
  count,
  children,
  isHighlighted = false,
}: {
  contactIds: string[];
  count: number;
  children: React.ReactNode;
  isHighlighted?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: "category-uncategorized",
    data: { type: "category", categoryId: null },
  });

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
          Uncategorized
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
            items={contactIds}
            strategy={verticalListSortingStrategy}
          >
            {children}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
