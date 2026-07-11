"use client";

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Textarea } from "@helvety/ui/textarea";
import { CopyIcon, Loader2Icon, UploadIcon } from "lucide-react";
import * as React from "react";

import { OCR_FILE_INPUT_ACCEPT, OCR_MAX_PDF_PAGES } from "@/lib/constants";
import { describeOcrProgress } from "@/lib/progress-copy";

import type { OcrProgress, OcrStatus } from "@/lib/types";

/** Props for the OCR workspace (drop zone, processing state, text output). */
interface OcrWorkspaceProps {
  readonly hasFile: boolean;
  readonly status: OcrStatus;
  readonly progress: OcrProgress | null;
  readonly text: string;
  readonly isDragging: boolean;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly onPickFile: () => void;
  readonly onFileInputChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  readonly onCopy: () => void;
}

/** Drop zone empty state, in-progress indicator, and selectable text output. */
export function OcrWorkspace({
  hasFile,
  status,
  progress,
  text,
  isDragging,
  fileInputRef,
  onPickFile,
  onFileInputChange,
  onCopy,
}: OcrWorkspaceProps): React.JSX.Element {
  const isProcessing = status === "processing";
  const showEmptyState = !hasFile;
  const hasText = text.trim().length > 0;

  return (
    <section
      className={cn(
        "relative min-h-full w-full transition-colors",
        isDragging
          ? "border-primary bg-primary/5 border-2 border-dashed"
          : showEmptyState
            ? "border-border cursor-pointer border-2 border-dashed"
            : "border-0"
      )}
      role={showEmptyState ? "button" : undefined}
      tabIndex={showEmptyState ? 0 : undefined}
      onClick={showEmptyState ? onPickFile : undefined}
      onKeyDown={
        showEmptyState
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPickFile();
              }
            }
          : undefined
      }
      aria-label={
        showEmptyState
          ? "File drop zone. Click to select a PDF or image."
          : "OCR workspace"
      }
    >
      {showEmptyState && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-12 text-center">
          <div className="flex flex-col items-center gap-2">
            <UploadIcon
              className="text-muted-foreground h-12 w-12"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium" role="heading" aria-level={2}>
                Drag and drop a PDF or image here
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Or use the command bar above to add your file
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Processed locally in your browser. No server upload. No account.
              </p>
            </div>
            <p className="text-muted-foreground text-xs">
              PDF or PNG, JPEG, WebP up to 100 MB. PDFs up to{" "}
              {OCR_MAX_PDF_PAGES} pages.
            </p>
          </div>
        </div>
      )}

      {hasFile && (
        <div className="flex h-full min-h-0 flex-col gap-3">
          {isProcessing ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12 text-center">
              <Loader2Icon
                className="text-muted-foreground h-8 w-8 animate-spin"
                aria-hidden="true"
              />
              <p
                className={cn(
                  "text-sm",
                  "processing-shine [--processing-shine-base:var(--color-violet-700)] dark:[--processing-shine-base:var(--color-violet-300)]"
                )}
                role="status"
              >
                {progress ? describeOcrProgress(progress) : "Processing"}
              </p>
            </div>
          ) : hasText ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Extracted text</h2>
                <Button size="sm" variant="outline" onClick={onCopy}>
                  <CopyIcon className="mr-1.5 size-4 shrink-0" />
                  Copy
                </Button>
              </div>
              <Textarea
                readOnly
                value={text}
                aria-label="Extracted text"
                className="min-h-0 flex-1 resize-none font-mono leading-relaxed"
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
              <p className="text-sm font-medium">No text found</p>
              <p className="text-muted-foreground text-xs">
                We couldn&apos;t find any readable text in this file. Try a
                clearer scan or a different language.
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={OCR_FILE_INPUT_ACCEPT}
        onChange={onFileInputChange}
        className="hidden"
        aria-label="Upload a PDF or image"
      />
    </section>
  );
}
