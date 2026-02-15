"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDateTime } from "@helvety/shared/dates";
import { Button } from "@helvety/ui/button";
import {
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";

import type { Category } from "@/lib/types";

/** Props for a single contact row in the list view. */
interface ContactRowProps {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  createdAt: string;
  category?: Category | null;
  isFirst?: boolean;
  isLast?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * ContactRow - A single row in the contacts list.
 *
 * Desktop: drag handle, icon (category-colored), full name, email (subtle), date, actions
 * Mobile: icon (category-colored), full name, category arrows + delete
 */
export function ContactRow({
  id,
  firstName,
  lastName,
  email,
  createdAt,
  category,
  isFirst = false,
  isLast = false,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ContactRowProps) {
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

  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border-border flex cursor-pointer items-center gap-2 overflow-hidden border-b px-3 py-2.5 transition-colors last:border-b-0 ${
        isDragging
          ? "bg-muted/80 z-50 rounded-md shadow-lg"
          : "hover:bg-muted/40"
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
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
      <UserIcon
        className="size-4 shrink-0"
        style={category?.color ? { color: category.color } : undefined}
      />

      {/* Name + Email */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate font-medium">{fullName}</span>
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

      {/* Actions: Mobile category arrows + Delete */}
      <div className="flex shrink-0 items-center gap-0.5">
        {(onMoveUp ?? onMoveDown) && (
          <div className="flex items-center gap-0.5 md:hidden">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground size-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              disabled={isFirst}
              aria-label="Move to previous category"
            >
              <ChevronUpIcon className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground size-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              disabled={isLast}
              aria-label="Move to next category"
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
    </div>
  );
}
