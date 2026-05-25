"use client";

import { Button } from "@helvety/ui/button";
import {
  CloudUploadIcon,
  DownloadIcon,
  FilePlusIcon,
  FilesIcon,
  FolderOpenIcon,
  Loader2Icon,
} from "lucide-react";

/** Props for {@link DocsTitleBarActions}. */
export interface DocsTitleBarActionsProps {
  readonly isSaving: boolean;
  readonly canSaveToVault: boolean;
  readonly vaultDocId: string | null;
  readonly showMyDocuments: boolean;
  readonly onNewDocument: () => void;
  readonly onOpenFile: () => void;
  readonly onDownload: () => void;
  readonly onSaveToVault: () => void;
  readonly onOpenMyDocuments: () => void;
}

const actionButtonClassName =
  "docs-title-bar-action h-8 rounded-none px-2 text-xs";

/**
 * Helvety document + vault actions rendered in Eigenpal's title bar right slot
 * (`DocxEditor` `renderTitleBarRight`). Local export: Download button and Cmd+S (`onSave`).
 */
export function DocsTitleBarActions({
  isSaving,
  canSaveToVault,
  vaultDocId,
  showMyDocuments,
  onNewDocument,
  onOpenFile,
  onDownload,
  onSaveToVault,
  onOpenMyDocuments,
}: DocsTitleBarActionsProps): React.JSX.Element {
  return (
    <div className="docs-title-bar-actions flex shrink-0 items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={actionButtonClassName}
        onClick={onNewDocument}
        aria-label="New document"
      >
        <FilePlusIcon className="size-4 shrink-0 min-[400px]:mr-1" />
        <span className="sr-only min-[400px]:not-sr-only">New</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={actionButtonClassName}
        onClick={onOpenFile}
        aria-label="Open document"
      >
        <FolderOpenIcon className="size-4 shrink-0 min-[400px]:mr-1" />
        <span className="sr-only min-[400px]:not-sr-only">Open</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={actionButtonClassName}
        onClick={onDownload}
        aria-label="Download document"
      >
        <DownloadIcon className="size-4 shrink-0 min-[400px]:mr-1" />
        <span className="sr-only min-[400px]:not-sr-only">Download</span>
      </Button>
      {showMyDocuments ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={actionButtonClassName}
          onClick={onOpenMyDocuments}
          aria-label="My documents"
        >
          <FilesIcon className="size-4 shrink-0 min-[400px]:mr-1" />
          <span className="sr-only min-[400px]:not-sr-only">My documents</span>
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className={`${actionButtonClassName} docs-title-bar-action--vault`}
        onClick={onSaveToVault}
        disabled={!canSaveToVault || isSaving}
        aria-label={vaultDocId ? "Update vault document" : "Save to vault"}
      >
        {isSaving ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin min-[400px]:mr-1" />
        ) : (
          <CloudUploadIcon className="size-4 shrink-0 min-[400px]:mr-1" />
        )}
        <span className="sr-only min-[400px]:not-sr-only">
          {vaultDocId ? "Update vault" : "Save to vault"}
        </span>
      </Button>
    </div>
  );
}
