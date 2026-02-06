"use client";

/**
 * Item command bar - sticky toolbar for the item editor page
 * Contains back button, save button, and refresh functionality
 */

import {
  ArrowLeftIcon,
  RefreshCwIcon,
  SaveIcon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
}

/**
 * Renders the item command bar with back button, save, and refresh.
 */
export function ItemCommandBar({
  onBack,
  onRefresh,
  isRefreshing,
  onSave,
  isSaving,
  hasUnsavedChanges,
  saveStatus = "idle",
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
        <div className="flex items-center gap-2 md:h-12">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="justify-center md:justify-start"
          >
            <ArrowLeftIcon className="mr-1.5 size-4 shrink-0" />
            <span>Back</span>
          </Button>
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          {onSave && (
            <Button
              variant={hasUnsavedChanges ? "default" : "outline"}
              size="sm"
              onClick={onSave}
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR is intentional
              disabled={isSaving || !hasUnsavedChanges}
              className={cn(
                "justify-center md:justify-start",
                saveStatus === "error" &&
                  "border-destructive text-destructive hover:bg-destructive/10"
              )}
            >
              {getSaveButtonContent()}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="justify-center md:justify-start"
          >
            <RefreshCwIcon
              className={cn(
                "mr-1.5 size-4 shrink-0",
                isRefreshing && "animate-spin"
              )}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
