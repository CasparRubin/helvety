"use client";

import { EditorCommandBar } from "@helvety/ui/editor-command-bar";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the ContactEditorCommandBar component. */
interface ContactEditorCommandBarProps {
  /** Callback for back navigation */
  onBack: () => void;
  /** Whether to show the back button */
  showBack?: boolean;
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
  showBack = true,
  onRefresh,
  isRefreshing,
  onSave,
  isSaving,
  hasUnsavedChanges,
  saveStatus = "idle",
  onDelete,
}: ContactEditorCommandBarProps) {
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
      desktopActions={
        onDelete
          ? [
              {
                id: "delete",
                label: "Delete Contact",
                icon: <Trash2Icon className="mr-1.5 size-4 shrink-0" />,
                onClick: onDelete,
                variant: "destructive" as const,
              },
            ]
          : []
      }
    />
  );
}
