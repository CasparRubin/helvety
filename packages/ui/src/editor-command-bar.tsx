"use client";

import { cn } from "@helvety/shared/utils";
import {
  CheckIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
} from "lucide-react";

import { Button } from "./button";
import { CommandBar, CommandBarSpacer } from "./command-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Separator } from "./separator";

import type { ReactNode } from "react";

/** Save-state visual variants used by editor command bars. */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Secondary desktop/mobile overflow action definition. */
export interface EditorCommandBarAction {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "outline" | "destructive";
}

/** Shared editor command bar contract for tasks/contacts-like screens. */
export interface EditorCommandBarProps {
  backIcon: ReactNode;
  backLabel?: string;
  onBack: () => void;
  showBack?: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  saveStatus?: SaveStatus;
  desktopActions?: EditorCommandBarAction[];
}

/**
 * Orange "Save Changes" CTA with visible label (only state that shows save text).
 */
function isSaveChangesLabelVisible(
  isSaving: boolean | undefined,
  hasUnsavedChanges: boolean | undefined,
  saveStatus: SaveStatus
): boolean {
  return Boolean(hasUnsavedChanges && !isSaving && saveStatus === "idle");
}

/** Save button contents: icon-only + sr-only, except orange unsaved-changes state. */
function getSaveButtonContent(
  isSaving: boolean | undefined,
  hasUnsavedChanges: boolean | undefined,
  saveStatus: SaveStatus
): ReactNode {
  if (isSaveChangesLabelVisible(isSaving, hasUnsavedChanges, saveStatus)) {
    return (
      <>
        <span className="size-1.5 animate-pulse rounded-full bg-white" />
        <SaveIcon className="size-4 shrink-0" />
        <span>Save Changes</span>
      </>
    );
  }
  if (isSaving) {
    return (
      <>
        <Loader2Icon className="size-4 shrink-0 animate-spin" />
        <span className="sr-only">Saving…</span>
      </>
    );
  }
  if (saveStatus === "saved") {
    return (
      <>
        <CheckIcon className="size-4 shrink-0" />
        <span className="sr-only">Saved</span>
      </>
    );
  }
  if (saveStatus === "error") {
    return (
      <>
        <SaveIcon className="size-4 shrink-0" />
        <span className="sr-only">Retry save</span>
      </>
    );
  }
  return (
    <>
      <SaveIcon className="size-4 shrink-0" />
      <span className="sr-only">Save</span>
    </>
  );
}

/**
 * Shared responsive command bar for editor pages. Compose inside `CommandBar`;
 * parent pages should wrap toolbar + body in `CommandBarPageLayout` so the bar
 * stays pinned while editor content scrolls.
 */
export function EditorCommandBar({
  backIcon,
  backLabel = "Back",
  onBack,
  showBack = true,
  onRefresh,
  isRefreshing,
  onSave,
  isSaving,
  hasUnsavedChanges,
  saveStatus = "idle",
  desktopActions = [],
}: EditorCommandBarProps): React.JSX.Element {
  const showSaveChangesLabel = isSaveChangesLabelVisible(
    isSaving,
    hasUnsavedChanges,
    saveStatus
  );

  return (
    <CommandBar>
      {showBack && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className="shrink-0 gap-0"
          >
            {backIcon}
            <span className="sr-only">{backLabel}</span>
          </Button>
          <Separator
            orientation="vertical"
            className="mx-2 hidden self-stretch md:block"
          />
        </>
      )}
      {onSave && (
        <Button
          variant={hasUnsavedChanges ? "default" : "outline"}
          size={showSaveChangesLabel ? "sm" : "icon-sm"}
          onClick={onSave}
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
          disabled={isSaving || !hasUnsavedChanges}
          className={cn(
            saveStatus === "error" &&
              "border-destructive text-destructive hover:bg-destructive/10",
            hasUnsavedChanges &&
              saveStatus === "idle" &&
              !isSaving &&
              "bg-primary text-primary-foreground hover:bg-primary/90",
            !showSaveChangesLabel && "gap-0"
          )}
        >
          {getSaveButtonContent(isSaving, hasUnsavedChanges, saveStatus)}
        </Button>
      )}
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="hidden shrink-0 gap-0 md:inline-flex"
      >
        <RefreshCwIcon
          className={cn("size-4 shrink-0", isRefreshing && "animate-spin")}
        />
        <span className="sr-only">Refresh</span>
      </Button>

      <CommandBarSpacer />

      {desktopActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant ?? "outline"}
          size="icon-sm"
          onClick={action.onClick}
          className="hidden shrink-0 gap-0 md:inline-flex"
        >
          {action.icon}
          <span className="sr-only">{action.label}</span>
        </Button>
      ))}

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
          {desktopActions.length > 0 && <DropdownMenuSeparator />}
          {desktopActions.map((action) => (
            <DropdownMenuItem
              key={action.id}
              onClick={action.onClick}
              className={
                action.variant === "destructive"
                  ? "text-destructive focus:text-destructive"
                  : undefined
              }
            >
              {action.icon}
              <span>{action.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </CommandBar>
  );
}
