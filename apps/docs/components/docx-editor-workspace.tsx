"use client";

import { DocxEditor, type DocxEditorRef } from "@eigenpal/docx-editor-react";
import "@eigenpal/docx-editor-react/styles.css";
import { cn } from "@helvety/shared/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

/** Props for {@link DocxEditorWorkspace}. */
interface DocxEditorWorkspaceProps {
  readonly documentBuffer: ArrayBuffer | null | undefined;
  readonly className?: string;
}

/** Client-only docx editor surface (loaded via dynamic import from the page). */
export const DocxEditorWorkspace = forwardRef<
  DocxEditorRef,
  DocxEditorWorkspaceProps
>(({ documentBuffer, className }, ref) => {
  if (documentBuffer === undefined) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex flex-1 items-center justify-center gap-2",
          className
        )}
      >
        <Loader2 className="size-6 animate-spin" />
        <span>Loading editor…</span>
      </div>
    );
  }

  return (
    <div className={cn("min-h-0 flex-1 overflow-hidden", className)}>
      <DocxEditor
        ref={ref}
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
