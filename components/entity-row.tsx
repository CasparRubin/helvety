"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVerticalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  TrashIcon,
  VectorSquareIcon,
  BoxesIcon,
  BoxIcon,
} from "lucide-react";

import { getDescriptionPlainText } from "@/components/tiptap-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import { getPriorityConfig } from "@/lib/priorities";

import type { Stage, EntityType } from "@/lib/types";

const ENTITY_ICONS: Record<EntityType, typeof VectorSquareIcon> = {
  unit: VectorSquareIcon,
  space: BoxesIcon,
  item: BoxIcon,
};

/**
 *
 */
interface EntityRowProps {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  entityType: EntityType;
  stage?: Stage | null;
  /** Priority level (items only, 0-3). Shown as a badge on hover. */
  priority?: number | null;
  /** Number of child entities (spaces for units, items for spaces) */
  childCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * EntityRow - A single row in the entity list/table.
 *
 * Desktop: drag handle, icon (stage-colored), title, description (subtle), date, actions
 * Mobile: up/down arrows, icon (stage-colored), title, actions
 */
export function EntityRow({
  id,
  title,
  description,
  createdAt,
  entityType,
  stage,
  priority,
  childCount,
  isFirst = false,
  isLast = false,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
}: EntityRowProps) {
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

  const Icon = ENTITY_ICONS[entityType] ?? VectorSquareIcon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border-border flex items-center gap-2 border-b px-3 py-2.5 transition-colors last:border-b-0 ${
        isDragging
          ? "bg-muted/80 z-50 rounded-md shadow-lg"
          : "hover:bg-muted/40"
      }`}
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

      {/* Mobile: Up/Down arrows */}
      <div className="flex shrink-0 flex-col gap-0.5 md:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-5"
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp?.();
          }}
          disabled={isFirst}
        >
          <ChevronUpIcon className="size-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-5"
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown?.();
          }}
          disabled={isLast}
        >
          <ChevronDownIcon className="size-3" />
        </Button>
      </div>

      {/* Icon */}
      <Icon
        className="size-4 shrink-0"
        style={stage?.color ? { color: stage.color } : undefined}
      />

      {/* Title + Description (clickable area) */}
      <div
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
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
        <span className="truncate font-medium">{title}</span>
        {childCount !== undefined && (
          <span className="text-muted-foreground shrink-0 text-xs">
            ({childCount})
          </span>
        )}
        {description && (
          <span className="text-muted-foreground hidden truncate text-sm md:inline">
            {getDescriptionPlainText(description)}
          </span>
        )}
      </div>

      {/* Priority badge (items only, desktop, hover-only) */}
      {priority != null &&
        (() => {
          const prioConfig = getPriorityConfig(priority);
          const PriorityIcon = prioConfig.icon;
          return (
            <Badge
              variant="outline"
              className="hidden shrink-0 opacity-0 transition-opacity group-hover:opacity-100 md:inline-flex"
              style={{ borderColor: prioConfig.color, color: prioConfig.color }}
            >
              <PriorityIcon className="size-3" />
              {prioConfig.label}
            </Badge>
          );
        })()}

      {/* Date (desktop only) */}
      <span className="text-muted-foreground hidden shrink-0 text-xs md:inline">
        {formatDateTime(createdAt)}
      </span>

      {/* Delete */}
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
  );
}
