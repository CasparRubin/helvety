"use client";

/**
 * Task command bar - sticky toolbar below navbar
 * Contains navigation, action buttons (Stages, New), and optional delete
 */

import {
  AlignVerticalSpaceAround,
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 *
 */
interface TaskCommandBarProps {
  /** Callback for back navigation (if provided, shows back button) */
  onBack?: () => void;
  /** Callback to open the stage configurator */
  onConfigureStages: () => void;
  /** Callback to open the create dialog */
  onCreateClick: () => void;
  /** Label for the create button - "New Unit", "New Space", "New Item" */
  createLabel: string;
  /** Callback to delete the current entity (if provided, shows delete button) */
  onDelete?: () => void;
  /** Label for the delete button - "Delete Unit", "Delete Space" */
  deleteLabel?: string;
}

/**
 * Renders the task command bar with navigation, actions, and optional delete.
 */
export function TaskCommandBar({
  onBack,
  onConfigureStages,
  onCreateClick,
  createLabel,
  onDelete,
  deleteLabel,
}: TaskCommandBarProps) {
  return (
    <nav
      className={
        "bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b backdrop-blur"
      }
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: back button + action buttons */}
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeftIcon className="mr-1.5 size-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onConfigureStages}>
              <AlignVerticalSpaceAround className="mr-1.5 size-4" />
              <span className="hidden sm:inline">Stages</span>
            </Button>
            <Button size="sm" onClick={onCreateClick}>
              <PlusIcon className="mr-1.5 size-4" />
              <span className="hidden sm:inline">{createLabel}</span>
            </Button>
          </div>

          {/* Right side: delete button */}
          {onDelete && deleteLabel && (
            <div className="flex shrink-0 items-center">
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2Icon className="mr-1.5 size-4" />
                <span className="hidden sm:inline">{deleteLabel}</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
