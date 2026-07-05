"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDateTime } from "@helvety/shared/dates";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { ICON_SIZE_CLASS } from "@helvety/ui/icon-size";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripVerticalIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { memo } from "react";

/** Props for a single contact row in the list view. */
interface ContactRowProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: string;
  categoryColor?: string;
  /** Navigation URL - when provided, renders Link for declarative nav to reduce stale imperative-push callbacks */
  href?: string;
  isFirst?: boolean;
  isLast?: boolean;
  onClick?: () => void;
  onPrefetch?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** When true, row is not draggable (e.g. list filtered by client-side search). */
  sortableDisabled?: boolean;
}

/**
 * ContactRow - A single row in the contacts list.
 *
 * Shows drag handle, icon, full name, email (subtle), date, and actions.
 * Drag handle is desktop-only; category move arrows and delete action are available across screen sizes.
 */
export const ContactRow = memo(
  ({
    id,
    firstName,
    lastName,
    email,
    createdAt,
    categoryColor,
    href,
    isFirst = false,
    isLast = false,
    onClick,
    onPrefetch,
    onDelete,
    onMoveUp,
    onMoveDown,
    sortableDisabled = false,
  }: ContactRowProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id, disabled: sortableDisabled });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const fullName = `${firstName} ${lastName}`.trim();

    const rowClassName = `group border-border flex cursor-pointer items-center gap-2 overflow-hidden border-b px-3 py-2.5 transition-colors [contain-intrinsic-size:auto_52px] last:border-b-0 ${
      isDragging
        ? "bg-muted/80 z-50 rounded-md shadow-lg"
        : "hover:bg-muted/40 [content-visibility:auto]"
    }`;

    const rowContent = (
      <>
        {/* Desktop: Drag Handle */}
        {sortableDisabled ? (
          <span className="hidden w-4 shrink-0 md:block" aria-hidden />
        ) : (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground hidden shrink-0 cursor-grab touch-none focus-visible:outline-none md:flex"
            {...attributes}
            {...listeners}
          >
            <GripVerticalIcon className={ICON_SIZE_CLASS} />
          </button>
        )}

        {/* Icon */}
        <UserIcon
          className={cn(ICON_SIZE_CLASS, "shrink-0")}
          style={categoryColor ? { color: categoryColor } : undefined}
        />

        {/* Name + Email */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="min-w-0 truncate font-medium">{fullName}</span>
          {email && (
            <span className="text-muted-foreground hidden truncate text-sm md:inline">
              {email}
            </span>
          )}
        </div>

        {/* Date (desktop only) */}
        <span className="text-muted-foreground hidden shrink-0 text-xs md:inline">
          {formatDateTime(createdAt)}
        </span>

        {/* Actions: Category arrows + Delete */}
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
                aria-label="Move to previous category"
              >
                <ChevronUpIcon className={ICON_SIZE_CLASS} />
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
                aria-label="Move to next category"
              >
                <ChevronDownIcon className={ICON_SIZE_CLASS} />
              </Button>
            </div>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive shrink-0"
              aria-label={`Delete ${fullName}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2Icon className={ICON_SIZE_CLASS} />
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
              e.currentTarget.click();
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

ContactRow.displayName = "ContactRow";
