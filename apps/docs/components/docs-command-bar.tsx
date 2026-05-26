"use client";

import { Button } from "@helvety/ui/button";
import { CommandBar, CommandBarSpacer } from "@helvety/ui/command-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import {
  CloudUploadIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  FilePlusIcon,
  FilesIcon,
  FolderOpenIcon,
  Loader2Icon,
} from "lucide-react";

/** Props for {@link DocsCommandBar}. */
export interface DocsCommandBarProps {
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

/**
 * Helvety command bar for Docs (document + vault actions).
 * Eigenpal editor chrome (File/Format/Insert, formatting toolbar) sits below.
 */
export function DocsCommandBar({
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
  const saveToVaultLabel = vaultDocId ? "Update vault" : "Save to vault";
  const saveToVaultAriaLabel = vaultDocId
    ? "Update vault document"
    : "Save to vault";

  return (
    <CommandBar>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onNewDocument}
        aria-label="New document"
      >
        <FilePlusIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">New</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onOpenFile}
        aria-label="Open document"
      >
        <FolderOpenIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">Open</span>
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onDownload}
        aria-label="Download document"
      >
        <DownloadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        <span className="sr-only min-[400px]:not-sr-only">Download</span>
      </Button>

      {showMyDocuments ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onOpenMyDocuments}
          aria-label="My documents"
          className="hidden md:inline-flex"
        >
          <FilesIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          <span className="sr-only min-[400px]:not-sr-only">My documents</span>
        </Button>
      ) : null}

      <CommandBarSpacer />

      <Button
        type="button"
        size="sm"
        onClick={onSaveToVault}
        disabled={!canSaveToVault || isSaving}
        aria-label={saveToVaultAriaLabel}
        className="hidden md:inline-flex"
      >
        {isSaving ? (
          <Loader2Icon className="size-4 shrink-0 animate-spin min-[400px]:mr-1.5" />
        ) : (
          <CloudUploadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
        )}
        <span className="sr-only min-[400px]:not-sr-only">
          {saveToVaultLabel}
        </span>
      </Button>

      {showMyDocuments ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="md:hidden"
              aria-label="More document actions"
            >
              <EllipsisVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpenMyDocuments}>
              <FilesIcon className="mr-2 size-4" />
              <span>My documents</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canSaveToVault || isSaving}
              onClick={onSaveToVault}
            >
              {isSaving ? (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              ) : (
                <CloudUploadIcon className="mr-2 size-4" />
              )}
              <span>{saveToVaultLabel}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </CommandBar>
  );
}
