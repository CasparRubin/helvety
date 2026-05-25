"use client";

import {
  createEmptyDocument,
  DocxEditor,
  type DocxEditorRef,
} from "@eigenpal/docx-editor-react";
import { cn } from "@helvety/shared/utils";
import { forwardRef, useCallback, useMemo, useRef } from "react";

import { DocsTitleBarActions } from "@/components/docs-title-bar-actions";
import { useHideVendorFileMenuItems } from "@/hooks/use-hide-vendor-file-menu-items";

/** Controlled empty comments: Helvety disables comment UI via the theme bridge. */
function noopCommentsChange(): void {
  /* comment UI suppressed in docx-editor-helvety-bridge.css Layer 6 */
}

/** Chrome callbacks/state passed from {@link HelvetyDocsShell}. */
export interface DocxEditorChromeProps {
  readonly documentName: string;
  readonly onDocumentNameChange: (name: string) => void;
  readonly onDownload: (buffer: ArrayBuffer) => void;
  readonly isSaving: boolean;
  readonly canSaveToVault: boolean;
  readonly vaultDocId: string | null;
  readonly showMyDocuments: boolean;
  readonly onNewDocument: () => void;
  readonly onOpenFile: () => void;
  /** Triggers validated local `.docx` export (editor ref save when no buffer). */
  readonly onDownloadFile: () => void;
  readonly onSaveToVault: () => void;
  readonly onOpenMyDocuments: () => void;
}

/** Props for {@link DocxEditorWorkspace}. */
export interface DocxEditorWorkspaceProps extends DocxEditorChromeProps {
  /** Loaded `.docx` bytes; `null` selects a fresh blank doc via `createEmptyDocument()`. */
  readonly documentBuffer: ArrayBuffer | null;
  /** Bumps when the editor should remount (New, open file, open vault doc). */
  readonly sessionKey: number;
  readonly className?: string;
}

/**
 * Client-only docx editor surface (loaded via dynamic import from the page).
 * Blank documents use Eigenpal `createEmptyDocument()` (`document` prop), not `documentBuffer={null}`.
 * Helvety actions live in the title bar right slot; vendor File → Open/Save are hidden via hook + bridge.
 */
export const DocxEditorWorkspace = forwardRef<
  DocxEditorRef,
  DocxEditorWorkspaceProps
>(
  (
    {
      documentBuffer,
      sessionKey,
      className,
      documentName,
      onDocumentNameChange,
      onDownload,
      isSaving,
      canSaveToVault,
      vaultDocId,
      showMyDocuments,
      onNewDocument,
      onOpenFile,
      onDownloadFile,
      onSaveToVault,
      onOpenMyDocuments,
    },
    ref
  ) => {
    const workspaceRef = useRef<HTMLDivElement>(null);
    useHideVendorFileMenuItems(workspaceRef);

    const blankDocument = useMemo(() => {
      void sessionKey;
      return createEmptyDocument();
    }, [sessionKey]);

    const editorProps =
      documentBuffer !== null
        ? { documentBuffer }
        : { document: blankDocument };

    const handleSave = useCallback(
      (buffer: ArrayBuffer) => {
        onDownload(buffer);
      },
      [onDownload]
    );

    const renderTitleBarRight = useCallback(
      () => (
        <DocsTitleBarActions
          isSaving={isSaving}
          canSaveToVault={canSaveToVault}
          vaultDocId={vaultDocId}
          showMyDocuments={showMyDocuments}
          onNewDocument={onNewDocument}
          onOpenFile={onOpenFile}
          onDownload={onDownloadFile}
          onSaveToVault={onSaveToVault}
          onOpenMyDocuments={onOpenMyDocuments}
        />
      ),
      [
        isSaving,
        canSaveToVault,
        vaultDocId,
        showMyDocuments,
        onNewDocument,
        onOpenFile,
        onDownloadFile,
        onSaveToVault,
        onOpenMyDocuments,
      ]
    );

    return (
      <div
        ref={workspaceRef}
        className={cn(
          "docx-editor-workspace bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden",
          className
        )}
      >
        <DocxEditor
          key={sessionKey}
          ref={ref}
          className="h-full min-h-0 flex-1"
          mode="editing"
          showToolbar
          showRuler
          showZoomControl
          comments={[]}
          onCommentsChange={noopCommentsChange}
          documentName={documentName}
          onDocumentNameChange={onDocumentNameChange}
          onSave={handleSave}
          renderTitleBarRight={renderTitleBarRight}
          {...editorProps}
        />
      </div>
    );
  }
);

DocxEditorWorkspace.displayName = "DocxEditorWorkspace";
