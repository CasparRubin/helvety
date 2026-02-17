"use client";

/**
 * Item command bar - sticky toolbar for the item editor page
 * Primary actions (always visible): back, save
 * Secondary actions (desktop inline, mobile dropdown): refresh, settings, delete
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
  EllipsisVerticalIcon,
  RefreshCwIcon,
  SaveIcon,
  SettingsIcon,
  Trash2Icon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the ItemCommandBar component. */
interface ItemCommandBarProps {
  /** Callback for back navigation */
  onBack: () => void;
  /** Callback to refresh the item data */
  onRefresh: () => void;
  /** Whether a refresh operation is in progress */
  isRefreshing?: boolean;
  /** Callback to save the item */
  onSave?: () => void;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Current save status */
  saveStatus?: SaveStatus;
  /** Callback to open the settings panel */
  onSettings?: () => void;
  /** Callback to delete the current item (if provided, shows delete button) */
  onDelete?: () => void;
  /** Label for the delete button */
  deleteLabel?: string;
}

/**
 * Renders the item command bar with primary actions always visible
 * and secondary actions collapsed into a dropdown on mobile.
 */
export function ItemCommandBar({
  onBack,
  onRefresh,
  isRefreshing,
  onSave,
  isSaving,
  hasUnsavedChanges,
  saveStatus = "idle",
  onSettings,
  onDelete,
  deleteLabel,
}: ItemCommandBarProps) {
  // Determine save button state and appearance
  const getSaveButtonContent = () => {
    if (isSaving) {
      return (
        <>
          <Loader2Icon className="mr-1.5 size-4 shrink-0 animate-spin" />
          <span>Saving...</span>
        </>
      );
    }
    if (saveStatus === "saved") {
      return (
        <>
          <CheckIcon className="mr-1.5 size-4 shrink-0" />
          <span>Saved</span>
        </>
      );
    }
    if (saveStatus === "error") {
      return (
        <>
          <SaveIcon className="mr-1.5 size-4 shrink-0" />
          <span>Retry Save</span>
        </>
      );
    }
    if (hasUnsavedChanges) {
      return (
        <>
          <span className="size-1.5 animate-pulse rounded-full bg-white" />
          <SaveIcon className="mr-1.5 size-4 shrink-0" />
          <span>Save Changes</span>
        </>
      );
    }
    return (
      <>
        <SaveIcon className="mr-1.5 size-4 shrink-0" />
        <span>Save</span>
      </>
    );
  };

  return (
    <CommandBar>
      {/* Left group: Back, Save (always visible) */}
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeftIcon className="mr-1.5 size-4 shrink-0" />
        <span>Back</span>
      </Button>
      <Separator
        orientation="vertical"
        className="mx-2 hidden self-stretch md:block"
      />
      {onSave && (
        <Button
          variant={hasUnsavedChanges ? "default" : "outline"}
          size="sm"
          onClick={onSave}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
          disabled={isSaving || !hasUnsavedChanges}
          className={cn(
            saveStatus === "error" &&
              "border-destructive text-destructive hover:bg-destructive/10",
            hasUnsavedChanges &&
              saveStatus === "idle" &&
              !isSaving &&
              "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
          )}
        >
          {getSaveButtonContent()}
        </Button>
      )}

      {/* Desktop only: Refresh */}
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

      <CommandBarSpacer />

      {/* Desktop only: Settings, Delete */}
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
          <DropdownMenuItem onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCwIcon className="mr-2 size-4" />
            <span>Refresh</span>
          </DropdownMenuItem>
          {onSettings && (
            <DropdownMenuItem onClick={onSettings}>
              <SettingsIcon className="mr-2 size-4" />
              <span>Settings</span>
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
