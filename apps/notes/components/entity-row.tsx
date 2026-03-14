"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDateTime } from "@helvety/shared/dates";
import { Button } from "@helvety/ui/button";
import { getRichTextPlainText } from "@helvety/ui/tiptap-utils";
import {
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  BoxIcon,
} from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import type { Stage } from "@/lib/types";

/** Props for a single entity row in the list view. */
interface EntityRowProps {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  stage?: Stage | null;
  /** Legacy child-count indicator (not used in current item-first flow) */
  childCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
  /** Navigation URL — when provided, renders Link for declarative nav to reduce stale imperative-push callbacks */
  href?: string;
  onClick?: () => void;
  onPrefetch?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * EntityRow - A single row in the entity list/table.
 *
 * Shows drag handle, icon (stage-colored), title, description (subtle), date, and actions.
 * Stage move arrows and delete actions are available across screen sizes.
 */
export const EntityRow = memo(
  ({
    id,
    title,
    description,
    createdAt,
    stage,
    childCount,
    isFirst = false,
    isLast = false,
    href,
    onClick,
    onPrefetch,
    onDelete,
    onMoveUp,
    onMoveDown,
  }: EntityRowProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const rowClassName = `group border-border flex cursor-pointer items-center gap-2 overflow-hidden border-b px-3 py-2.5 transition-colors [contain-intrinsic-size:auto_52px] last:border-b-0 ${
      isDragging
        ? "bg-muted/80 z-50 rounded-md shadow-lg"
        : "hover:bg-muted/40 [content-visibility:auto]"
    }`;

    const rowContent = (
      <>
        {/* Desktop: Drag Handle */}
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hidden shrink-0 cursor-grab touch-none focus-visible:outline-none md:flex"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="size-4" />
        </button>

        {/* Icon */}
        <BoxIcon
          className="size-4 shrink-0"
          style={stage?.color ? { color: stage.color } : undefined}
        />

        {/* Title + Description */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="truncate font-medium">{title}</span>
          {childCount !== undefined && (
            <span className="text-muted-foreground shrink-0 text-xs">
              ({childCount})
            </span>
          )}
          {description && (
            <span className="text-muted-foreground hidden truncate text-sm md:inline">
              {getRichTextPlainText(description)}
            </span>
          )}
        </div>

        {/* Date (desktop only) */}
        <span className="text-muted-foreground hidden shrink-0 text-xs md:inline">
          {formatDateTime(createdAt)}
        </span>

        {/* Actions: Stage arrows + Delete */}
        <div className="flex shrink-0 items-center gap-0.5">
          {(onMoveUp ?? onMoveDown) && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground size-7"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMoveUp?.();
                }}
                disabled={isFirst}
                aria-label="Move to previous stage"
              >
                <ChevronUpIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground size-7"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMoveDown?.();
                }}
                disabled={isLast}
                aria-label="Move to next stage"
              >
                <ChevronDownIcon className="size-4" />
              </Button>
            </div>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon className="size-4" />
            </Button>
          )}
        </div>
      </>
    );

    const sharedProps = {
      ref: setNodeRef,
      style,
      className: rowClassName,
      onMouseEnter: () => onPrefetch?.(),
      onFocus: () => onPrefetch?.(),
    };

    if (href) {
      return (
        <Link
          href={href}
          // Avoid noisy RSC prefetch 404s from stale/deleted dynamic IDs in dense lists.
          prefetch={false}
          {...sharedProps}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              (e.currentTarget as HTMLAnchorElement).click();
            }
          }}
        >
          {rowContent}
        </Link>
      );
    }

    return (
      <div
        {...sharedProps}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {rowContent}
      </div>
    );
  }
);

EntityRow.displayName = "EntityRow";
