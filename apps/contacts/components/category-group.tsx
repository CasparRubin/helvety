"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { renderIcon } from "@helvety/ui/icon-renderer";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import React, { useState } from "react";

import type { DefaultCategory } from "@/lib/config/default-categories";

/** Props for the category group container. */
interface CategoryGroupProps {
  category: DefaultCategory;
  contactIds: string[];
  count: number;
  children: React.ReactNode;
  isHighlighted?: boolean;
}

/**
 * CategoryGroup mirrors tasks StageGroup UX for contacts.
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
      <button
        type="button"
        className={`hover:bg-muted/40 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
          showHighlight ? "bg-primary/5 ring-primary/30 ring-2" : ""
        }`}
        style={{ backgroundColor: `${category.color}14` }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" />
        ) : (
          <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" />
        )}
        {renderIcon(category.icon, "size-4 shrink-0", {
          color: category.color ?? "var(--muted-foreground)",
        })}
        <span className="min-w-0 truncate text-sm font-medium">
          {category.name}
        </span>
        <span className="text-muted-foreground text-xs">({count})</span>
      </button>

      {!isCollapsed && (
        <div
          ref={setNodeRef}
          className={`border-border ml-2 border-l-2 transition-colors ${
            showHighlight ? "border-primary/40" : ""
          }`}
          style={{
            borderLeftColor: showHighlight ? undefined : category.color,
          }}
        >
          <SortableContext
            items={visibleContactIds}
            strategy={verticalListSortingStrategy}
          >
            {visibleChildren}
          </SortableContext>
          {shouldLimitRows && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground w-full py-2 pl-4 text-left text-xs transition-colors"
              onClick={() => setIsShowingAll(true)}
            >
              Show all ({hiddenCount} more)
            </button>
          )}
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
