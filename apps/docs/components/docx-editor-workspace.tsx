"use client";

import {
  createEmptyDocument,
  DocxEditor,
  type DocxEditorRef,
} from "@eigenpal/docx-editor-react";
import { cn } from "@helvety/shared/utils";
import { forwardRef, useMemo } from "react";

/** Props for {@link DocxEditorWorkspace}. */
interface DocxEditorWorkspaceProps {
  /** Loaded `.docx` bytes; `null` selects a fresh blank doc via `createEmptyDocument()`. */
  readonly documentBuffer: ArrayBuffer | null;
  /** Bumps when the editor should remount (New, open file, open vault doc). */
  readonly sessionKey: number;
  readonly className?: string;
}

/**
 * Client-only docx editor surface (loaded via dynamic import from the page).
 * Blank documents use Eigenpal `createEmptyDocument()` (`document` prop), not `documentBuffer={null}`.
 * Editor chrome theme and title-bar overrides come from `styles/docx-editor-helvety-bridge.css` on `.ep-root`.
 */
export const DocxEditorWorkspace = forwardRef<
  DocxEditorRef,
  DocxEditorWorkspaceProps
>(({ documentBuffer, sessionKey, className }, ref) => {
  const blankDocument = useMemo(() => {
    void sessionKey;
    return createEmptyDocument();
  }, [sessionKey]);

  const editorProps =
    documentBuffer !== null ? { documentBuffer } : { document: blankDocument };

  return (
    <div
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
        {...editorProps}
      />
    </div>
  );
});

DocxEditorWorkspace.displayName = "DocxEditorWorkspace";
