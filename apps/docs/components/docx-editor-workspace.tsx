"use client";

import { DocxEditor, type DocxEditorRef } from "@eigenpal/docx-editor-react";
import { cn } from "@helvety/shared/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

/** Props for {@link DocxEditorWorkspace}. */
interface DocxEditorWorkspaceProps {
  readonly documentBuffer: ArrayBuffer | null | undefined;
  readonly className?: string;
}

/**
 * Client-only docx editor surface (loaded via dynamic import from the page).
 * Editor chrome theme comes from `styles/docx-editor-helvety-bridge.css` on `.ep-root`.
 */
export const DocxEditorWorkspace = forwardRef<
  DocxEditorRef,
  DocxEditorWorkspaceProps
>(({ documentBuffer, className }, ref) => {
  if (documentBuffer === undefined) {
    return (
      <div
        className={cn(
          "docx-editor-workspace bg-background text-muted-foreground flex h-full min-h-0 flex-1 items-center justify-center gap-2",
          className
        )}
      >
        <Loader2 className="size-6 animate-spin" />
        <span>Loading editor…</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "docx-editor-workspace bg-background flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        className
      )}
    >
      <DocxEditor
        ref={ref}
        className="h-full min-h-0 flex-1"
        documentBuffer={documentBuffer}
        mode="editing"
        showToolbar
        showRuler
        showZoomControl
      />
    </div>
  );
});

DocxEditorWorkspace.displayName = "DocxEditorWorkspace";
