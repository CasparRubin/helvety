"use client";

import { Button } from "@helvety/ui/button";
import { CommandBar, CommandBarSpacer } from "@helvety/ui/command-bar";
import {
  CloudUploadIcon,
  DownloadIcon,
  FilePlusIcon,
  FilesIcon,
  FolderOpenIcon,
  Loader2Icon,
} from "lucide-react";

/** Props for {@link DocsCommandBar}. */
interface DocsCommandBarProps {
  readonly hasDocument: boolean;
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

const commandButtonClassName = "rounded-none";

/** Pinned toolbar for the Docs editor. */
export function DocsCommandBar({
  hasDocument,
  isSaving,
  canSaveToVault,
  vaultDocId,
  showMyDocuments,
  onNewDocument,
  onOpenFile,
  onDownload,
  onSaveToVault,
  onOpenMyDocuments,
}: DocsCommandBarProps): React.JSX.Element {
  return (
    <CommandBar className="border-b-0">
      <Button
        size="sm"
        variant="outline"
        className={commandButtonClassName}
        onClick={onNewDocument}
        aria-label="New document"
      >
        <FilePlusIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">New</span>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className={commandButtonClassName}
        onClick={onOpenFile}
        aria-label="Open document"
      >
        <FolderOpenIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">Open</span>
      </Button>
      <Button
        size="sm"
        className={commandButtonClassName}
        onClick={onDownload}
        disabled={!hasDocument}
        aria-label="Download document"
      >
        <DownloadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">Download</span>
      </Button>
      {showMyDocuments ? (
        <Button
          size="sm"
          variant="outline"
          className={commandButtonClassName}
          onClick={onOpenMyDocuments}
          aria-label="My documents"
        >
          <FilesIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          <span className="sr-only min-[400px]:not-sr-only">My documents</span>
        </Button>
      ) : null}
      <CommandBarSpacer />
      <Button
        size="sm"
        variant="secondary"
        className={commandButtonClassName}
        onClick={onSaveToVault}
        disabled={!hasDocument || !canSaveToVault || isSaving}
        aria-label={vaultDocId ? "Update vault document" : "Save to vault"}
      >
        {isSaving ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin min-[400px]:mr-1.5" />
        ) : (
          <CloudUploadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        )}
        <span className="sr-only min-[400px]:not-sr-only">
          {vaultDocId ? "Update vault" : "Save to vault"}
        </span>
      </Button>
    </CommandBar>
  );
}
