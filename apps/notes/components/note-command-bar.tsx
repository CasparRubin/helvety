"use client";

/**
 * Note command bar - sticky toolbar below navbar
 * Primary actions: create (and optional back when enabled)
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings, edit, delete
 */

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { CommandBar, CommandBarSpacer } from "@helvety/ui/command-bar";
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

/** Props for the NoteCommandBar component. */
interface NoteCommandBarProps {
  /** Callback for back navigation (if provided, shows back button) */
  onBack?: () => void;
  /** Callback to open the create dialog */
  onCreateClick: () => void;
  /** Label for the create button - e.g. "New Note" */
  createLabel: string;
  /** Callback to refresh the data (if provided, shows refresh button) */
  onRefresh?: () => void;
  /** Whether a refresh operation is in progress */
  isRefreshing?: boolean;
  /** Callback to open the settings panel */
  onSettings?: () => void;
  /** Callback to open the edit dialog (if provided, shows edit button) */
  onEdit?: () => void;
  /** Label for the edit button - e.g. "Edit Note" */
  editLabel?: string;
  /** Callback to delete the current entity (if provided, shows delete button) */
  onDelete?: () => void;
  /** Label for the delete button - e.g. "Delete Note" */
  deleteLabel?: string;
  /** Callback to export note data (if provided, shows export button) */
  onExport?: () => void;
  /** Whether an export operation is in progress */
  isExporting?: boolean;
}

/**
 * Renders the note command bar with a primary create action,
 * optional back action, and secondary actions collapsed on mobile.
 */
export function NoteCommandBar({
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
}: NoteCommandBarProps) {
  return (
    <CommandBar>
      {/* Left group: Back, New */}
      {onBack && (
        <>
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Back">
            <ArrowLeftIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
            <span className="sr-only min-[400px]:not-sr-only">Back</span>
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 hidden self-stretch md:block"
          />
        </>
      )}
      <Button size="sm" onClick={onCreateClick} aria-label={createLabel}>
        <PlusIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">{createLabel}</span>
      </Button>

      {/* Desktop only: Refresh */}
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "hidden md:inline-flex",
            isRefreshing &&
              "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          )}
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

      <CommandBarSpacer />

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
      {onSettings && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSettings}
          className="hidden md:inline-flex"
        >
          <SettingsIcon className="mr-1.5 size-4 shrink-0" />
          <span>Settings</span>
        </Button>
      )}
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
          {onSettings && (
            <DropdownMenuItem onClick={onSettings}>
              <SettingsIcon className="mr-2 size-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          )}
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
    </CommandBar>
  );
}
