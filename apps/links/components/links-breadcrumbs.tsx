"use client";

import { cn } from "@helvety/shared/utils";
import { ChevronRight, Home } from "lucide-react";

import type { FolderBreadcrumb } from "@/lib/link-tree";

/**
 *
 */
interface LinksBreadcrumbsProps {
  crumbs: FolderBreadcrumb[];
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

/**
 *
 */
export function LinksBreadcrumbs({
  crumbs,
  onNavigate,
  className,
}: LinksBreadcrumbsProps): React.JSX.Element {
  return (
    <nav
      aria-label="Folder path"
      className={cn("flex flex-wrap items-center gap-1 text-sm", className)}
    >
      <button
        type="button"
        onClick={() => onNavigate(null)}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <Home className="size-4" aria-hidden />
        <span>Home</span>
      </button>
      {crumbs.map((crumb) => (
        <span key={crumb.id} className="inline-flex items-center gap-1">
          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
          <button
            type="button"
            onClick={() => onNavigate(crumb.id)}
            className="text-muted-foreground hover:text-foreground max-w-[12rem] truncate"
          >
            {crumb.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
