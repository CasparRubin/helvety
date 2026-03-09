"use client";

import { EditorCommandBar } from "@helvety/ui/editor-command-bar";
import { ArrowLeftIcon, SettingsIcon, Trash2Icon } from "lucide-react";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the ItemCommandBar component. */
interface ItemCommandBarProps {
  /** Callback for back navigation */
  onBack: () => void;
  /** Whether to show the back button */
  showBack?: boolean;
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
  showBack = true,
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
  return (
    <EditorCommandBar
      backIcon={<ArrowLeftIcon className="mr-1.5 size-4 shrink-0" />}
      onBack={onBack}
      showBack={showBack}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      onSave={onSave}
      isSaving={isSaving}
      hasUnsavedChanges={hasUnsavedChanges}
      saveStatus={saveStatus}
      desktopActions={[
        ...(onSettings
          ? [
              {
                id: "settings",
                label: "Settings",
                icon: <SettingsIcon className="mr-1.5 size-4 shrink-0" />,
                onClick: onSettings,
              },
            ]
          : []),
        ...(onDelete && deleteLabel
          ? [
              {
                id: "delete",
                label: deleteLabel,
                icon: <Trash2Icon className="mr-1.5 size-4 shrink-0" />,
                onClick: onDelete,
                variant: "destructive" as const,
              },
            ]
          : []),
      ]}
    />
  );
}
