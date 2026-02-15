"use client";

/**
 * Task command bar - sticky toolbar below navbar
 * Primary actions (always visible): back, create
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings, edit, delete
 */

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import { Separator } from "@helvety/ui/separator";
import {
  ArrowLeftIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SettingsIcon,
  Trash2Icon,
} from "lucide-react";

/** Props for the TaskCommandBar component. */
interface TaskCommandBarProps {
  /** Callback for back navigation (if provided, shows back button) */
  onBack?: () => void;
  /** Callback to open the create dialog */
  onCreateClick: () => void;
  /** Label for the create button - "New Unit", "New Space", "New Item" */
  createLabel: string;
  /** Callback to refresh the data (if provided, shows refresh button) */
  onRefresh?: () => void;
  /** Whether a refresh operation is in progress */
  isRefreshing?: boolean;
  /** Callback to open the settings panel */
  onSettings: () => void;
  /** Callback to open the edit dialog (if provided, shows edit button) */
  onEdit?: () => void;
  /** Label for the edit button - "Edit Unit", "Edit Space" */
  editLabel?: string;
  /** Callback to delete the current entity (if provided, shows delete button) */
  onDelete?: () => void;
  /** Label for the delete button - "Delete Unit", "Delete Space" */
  deleteLabel?: string;
  /** Callback to export task data (if provided, shows export button) */
  onExport?: () => void;
  /** Whether an export operation is in progress */
  isExporting?: boolean;
}

/**
 * Renders the task command bar with primary actions always visible
 * and secondary actions collapsed into a dropdown on mobile.
 */
export function TaskCommandBar({
  onBack,
  onCreateClick,
  createLabel,
  onRefresh,
  isRefreshing,
  onSettings,
  onEdit,
  editLabel,
  onDelete,
  deleteLabel,
  onExport,
  isExporting,
}: TaskCommandBarProps) {
  return (
    <nav
      className={
        "bg-card/70 supports-[backdrop-filter]:bg-card/50 sticky top-0 z-40 w-full border-b backdrop-blur min-[2000px]:border-x"
      }
    >
      <div className="container mx-auto px-4 py-2 md:py-0">
        <div className="flex items-center gap-1 md:h-12 md:gap-2">
          {/* Left group: Back, New */}
          {onBack && (
            <>
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeftIcon className="mr-1.5 size-4 shrink-0" />
                <span>Back</span>
              </Button>
              <Separator
                orientation="vertical"
                className="mx-2 hidden self-stretch md:block"
              />
            </>
          )}
          <Button size="sm" onClick={onCreateClick}>
            <PlusIcon className="mr-1.5 size-4 shrink-0" />
            <span>{createLabel}</span>
          </Button>

          {/* Desktop only: Refresh */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="hidden md:inline-flex"
            >
              <RefreshCwIcon
                className={cn(
                  "mr-1.5 size-4 shrink-0",
                  isRefreshing && "animate-spin"
                )}
              />
              <span>Refresh</span>
            </Button>
          )}

          {/* Spacer pushes right group to the end */}
          <div className="flex-1" />

          {/* Desktop only: Export, Settings, Edit, Delete */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isExporting}
              className="hidden md:inline-flex"
            >
              {isExporting ? (
                <Loader2Icon className="mr-1.5 size-4 shrink-0 animate-spin" />
              ) : (
                <DownloadIcon className="mr-1.5 size-4 shrink-0" />
              )}
              <span>{isExporting ? "Exporting..." : "Export Data"}</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onSettings}
            className="hidden md:inline-flex"
          >
            <SettingsIcon className="mr-1.5 size-4 shrink-0" />
            <span>Settings</span>
          </Button>
          {onEdit && editLabel && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="hidden md:inline-flex"
            >
              <PencilIcon className="mr-1.5 size-4 shrink-0" />
              <span>{editLabel}</span>
            </Button>
          )}
          {onDelete && deleteLabel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="hidden md:inline-flex"
            >
              <Trash2Icon className="mr-1.5 size-4 shrink-0" />
              <span>{deleteLabel}</span>
            </Button>
          )}

          {/* Mobile only: overflow dropdown for secondary actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onRefresh && (
                <DropdownMenuItem onClick={onRefresh} disabled={isRefreshing}>
                  <RefreshCwIcon className="mr-2 size-4" />
                  <span>Refresh</span>
                </DropdownMenuItem>
              )}
              {onExport && (
                <DropdownMenuItem onClick={onExport} disabled={isExporting}>
                  <DownloadIcon className="mr-2 size-4" />
                  <span>{isExporting ? "Exporting..." : "Export Data"}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onSettings}>
                <SettingsIcon className="mr-2 size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              {onEdit && editLabel && (
                <DropdownMenuItem onClick={onEdit}>
                  <PencilIcon className="mr-2 size-4" />
                  <span>{editLabel}</span>
                </DropdownMenuItem>
              )}
              {onDelete && deleteLabel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2Icon className="mr-2 size-4" />
                    <span>{deleteLabel}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
