"use client";

import {
  createEmptyDocument,
  DocxEditor,
  type DocxEditorRef,
} from "@eigenpal/docx-editor-react";
import { cn } from "@helvety/shared/utils";
import { forwardRef, useMemo, useRef } from "react";

import { useHideVendorFileMenuItems } from "@/hooks/use-hide-vendor-file-menu-items";

/** Editor document chrome passed from {@link HelvetyDocsShell}. */
interface DocxEditorChromeProps {
  readonly documentName: string;
  readonly onDocumentNameChange: (name: string) => void;
  readonly onDownload: (buffer: ArrayBuffer) => void;
}

/** Props for {@link DocxEditorWorkspace}. */
interface DocxEditorWorkspaceProps extends DocxEditorChromeProps {
  /** Loaded `.docx` bytes; `null` selects a fresh blank doc via `createEmptyDocument()`. */
  readonly documentBuffer: ArrayBuffer | null;
  /** Bumps when the editor should remount (New, open file, open vault doc). */
  readonly sessionKey: number;
  readonly className?: string;
}

/**
 * Client-only docx editor surface (loaded via dynamic import from the page).
 * Blank documents use Eigenpal `createEmptyDocument()` (`document` prop), not `documentBuffer={null}`.
 * Helvety document/vault actions live in {@link DocsCommandBar}; vendor File → Open/Save/New are hidden.
 * Comment UI is suppressed via CSS Layer 6 only; do not pass Eigenpal `comments` props.
 * Export uses `onSave={onDownload}` so Cmd+S matches the command bar Download path.
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
          documentName={documentName}
          onDocumentNameChange={onDocumentNameChange}
          onSave={onDownload}
          {...editorProps}
        />
      </div>
    );
  }
);

DocxEditorWorkspace.displayName = "DocxEditorWorkspace";
