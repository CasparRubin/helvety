"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDateTime } from "@helvety/shared/dates";
import { Button } from "@helvety/ui/button";
import {
  BriefcaseIcon,
  Building2Icon,
  CircleIcon,
  GripVerticalIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
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
  categoryIcon?: string;
  /** Navigation URL — when provided, renders Link for declarative nav to reduce stale imperative-push callbacks */
  href?: string;
  onClick?: () => void;
  onPrefetch?: () => void;
  onDelete?: () => void;
}

/** Renders a row icon from the configured category icon name. */
function renderCategoryIcon(
  categoryIcon?: string,
  className = "size-4 shrink-0"
) {
  switch (categoryIcon) {
    case "users":
      return <UsersIcon className={className} />;
    case "briefcase":
      return <BriefcaseIcon className={className} />;
    case "building-2":
      return <Building2Icon className={className} />;
    case "circle":
      return <CircleIcon className={className} />;
    default:
      return <UserIcon className={className} />;
  }
}

/**
 * ContactRow - A single row in the contacts list.
 *
 * Shows drag handle, icon, full name, email (subtle), date, and actions.
 * Drag handle is desktop-only; delete action is available across screen sizes.
 */
export const ContactRow = memo(
  ({
    id,
    firstName,
    lastName,
    email,
    createdAt,
    categoryColor,
    categoryIcon,
    href,
    onClick,
    onPrefetch,
    onDelete,
  }: ContactRowProps) => {
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
        {renderCategoryIcon(categoryIcon, "size-4 shrink-0")}

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

        {/* Actions: Delete */}
        <div className="flex shrink-0 items-center gap-0.5">
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
      ...(categoryColor ? { borderLeft: `2px solid ${categoryColor}` } : {}),
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

ContactRow.displayName = "ContactRow";
