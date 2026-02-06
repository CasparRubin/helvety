"use client";

/**
 * Task command bar - sticky toolbar below navbar
 * Contains navigation, action buttons (Stage Configuration, New), and optional delete
 */

import {
  AlignVerticalSpaceAround,
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/** Props for the TaskCommandBar component. */
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
      <div className="container mx-auto px-4 py-2 md:py-0">
        <div className="grid grid-cols-2 gap-1 md:flex md:h-12 md:items-center md:gap-2">
          {onBack && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="justify-center md:justify-start"
              >
                <ArrowLeftIcon className="mr-1.5 size-4 shrink-0" />
                <span>Back</span>
              </Button>
              <Separator
                orientation="vertical"
                className="hidden h-6 md:block"
              />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onConfigureStages}
            className="justify-center md:justify-start"
          >
            <AlignVerticalSpaceAround className="mr-1.5 size-4 shrink-0" />
            <span>Stage Configuration</span>
          </Button>
          <Button
            size="sm"
            onClick={onCreateClick}
            className="justify-center md:justify-start"
          >
            <PlusIcon className="mr-1.5 size-4 shrink-0" />
            <span>{createLabel}</span>
          </Button>
          {onDelete && deleteLabel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="justify-center md:ml-auto md:justify-start"
            >
              <Trash2Icon className="mr-1.5 size-4 shrink-0" />
              <span>{deleteLabel}</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
