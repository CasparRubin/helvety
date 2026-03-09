"use client";

import { cn } from "@helvety/shared/utils";
import {
  CheckIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  RefreshCwIcon,
  SaveIcon,
} from "lucide-react";

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

/** Returns contextual save button icon/text based on current save state. */
function getSaveButtonContent(
  isSaving?: boolean,
  hasUnsavedChanges?: boolean,
  saveStatus: SaveStatus = "idle"
): ReactNode {
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
}

/** Shared responsive command bar for editor pages. */
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
  return (
    <CommandBar>
      {showBack && (
        <>
          <Button variant="ghost" size="sm" onClick={onBack}>
            {backIcon}
            <span>{backLabel}</span>
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
          {getSaveButtonContent(isSaving, hasUnsavedChanges, saveStatus)}
        </Button>
      )}
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

      {desktopActions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant ?? "outline"}
          size="sm"
          onClick={action.onClick}
          className="hidden md:inline-flex"
        >
          {action.icon}
          <span>{action.label}</span>
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
