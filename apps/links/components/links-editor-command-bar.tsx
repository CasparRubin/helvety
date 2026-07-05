"use client";

import { EditorCommandBar } from "@helvety/ui/editor-command-bar";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

/** Save status type */
type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Props for the links editor command bar. */
interface LinksEditorCommandBarProps {
  onBack: () => void;
  showBack?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  saveStatus?: SaveStatus;
  onDelete?: () => void;
  deleteLabel?: string;
}

/**
 * Editor command bar for link and folder detail sheets (parent uses CommandBarPageLayout).
 */
export function LinksEditorCommandBar({
  onBack,
  showBack = true,
  onRefresh,
  isRefreshing,
  onSave,
  isSaving,
  hasUnsavedChanges,
  saveStatus = "idle",
  onDelete,
  deleteLabel = "Delete",
}: LinksEditorCommandBarProps): React.JSX.Element {
  return (
    <EditorCommandBar
      backIcon={<ArrowLeftIcon className="size-4 shrink-0" />}
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
                label: deleteLabel,
                icon: <Trash2Icon className="size-4 shrink-0" />,
                onClick: onDelete,
                variant: "destructive" as const,
              },
            ]
          : []
      }
    />
  );
}
