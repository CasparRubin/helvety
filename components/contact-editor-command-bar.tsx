"use client";

/**
 * Contact editor command bar - sticky toolbar for the contact editor page
 * Primary actions (always visible): back, save
 * Secondary actions (desktop inline, mobile dropdown): refresh, delete
 */

import {
  ArrowLeftIcon,
  EllipsisVerticalIcon,
  RefreshCwIcon,
  SaveIcon,
  Trash2Icon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the ContactEditorCommandBar component. */
interface ContactEditorCommandBarProps {
  /** Callback for back navigation */
  onBack: () => void;
  /** Callback to refresh the contact data */
  onRefresh: () => void;
  /** Whether a refresh operation is in progress */
  isRefreshing?: boolean;
  /** Callback to save the contact */
  onSave?: () => void;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Current save status */
  saveStatus?: SaveStatus;
  /** Callback to delete the current contact */
  onDelete?: () => void;
}

/**
 * Renders the contact editor command bar.
 */
export function ContactEditorCommandBar({
  onBack,
  onRefresh,
  isRefreshing,
  onSave,
  isSaving,
  hasUnsavedChanges,
  saveStatus = "idle",
  onDelete,
}: ContactEditorCommandBarProps) {
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
    return (
      <>
        <SaveIcon className="mr-1.5 size-4 shrink-0" />
        <span>Save</span>
      </>
    );
  };

  return (
    <nav
      className={
        "bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur"
      }
    >
      <div className="container mx-auto px-4 py-2 md:py-0">
        <div className="flex items-center gap-1 md:h-12 md:gap-2">
          {/* Left group: Back, Save (always visible) */}
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeftIcon className="mr-1.5 size-4 shrink-0" />
            <span>Back</span>
          </Button>
          <Separator
            orientation="vertical"
            className="hidden self-stretch md:block"
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
                  "border-destructive text-destructive hover:bg-destructive/10"
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

          {/* Spacer */}
          <div className="flex-1" />

          {/* Desktop only: Delete */}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="hidden md:inline-flex"
            >
              <Trash2Icon className="mr-1.5 size-4 shrink-0" />
              <span>Delete Contact</span>
            </Button>
          )}

          {/* Mobile only: overflow dropdown */}
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
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2Icon className="mr-2 size-4" />
                    <span>Delete Contact</span>
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
