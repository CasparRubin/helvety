"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { useDragDrop } from "@helvety/shared/hooks/use-drag-drop";
import { cn } from "@helvety/shared/utils";
import {
  PUBLIC_TOOL_CANVAS_SHELL_CLASS,
  PUBLIC_TOOL_SIDEBAR_PANEL_CLASS,
  PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS,
  PUBLIC_TOOL_WORKSPACE_ROW_CLASS,
} from "@helvety/ui/public-tool-workspace";
import { toast } from "@helvety/ui/sonner";
import * as React from "react";

import { OcrCommandBar } from "@/components/ocr-command-bar";
import { OcrSidebar } from "@/components/ocr-sidebar";
import { OcrWorkspace } from "@/components/ocr-workspace";
import { useOcrJob } from "@/hooks/use-ocr-job";
import { createOcrDownloadName, downloadBlob } from "@/lib/file-download";

/**
 * Main Helvety OCR component. Wires the extraction state machine to the shared
 * public-tool layout: pinned command bar, drop/text workspace, desktop sidebar.
 */
export function HelvetyOcr(): React.JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragDrop = useDragDrop();
  const job = useOcrJob();

  const isProcessing = job.status === "processing";
  const canDownload = job.status === "done" && job.text.trim().length > 0;

  const pickFile = React.useCallback((): void => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const file = event.target.files?.[0];
      if (file) {
        job.loadFile(file);
      }
      event.currentTarget.value = "";
    },
    [job]
  );

  const handleDropWithFiles = React.useCallback(
    (files: FileList): void => {
      const file = files[0];
      if (file) {
        job.loadFile(file);
      }
    },
    [job]
  );

  const handleDownload = React.useCallback((): void => {
    if (!canDownload) {
      return;
    }
    const blob = new Blob([job.text], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, createOcrDownloadName(job.fileName ?? ""));
  }, [canDownload, job.fileName, job.text]);

  const handleCopy = React.useCallback((): void => {
    void navigator.clipboard
      .writeText(job.text)
      .then(() => {
        toast.success("Copied to clipboard.", {
          duration: TOAST_DURATIONS.SUCCESS,
        });
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard.", {
          duration: TOAST_DURATIONS.ERROR,
        });
      });
  }, [job.text]);

  return (
    <div className="flex h-full flex-col">
      <OcrCommandBar
        hasFile={job.hasFile}
        isProcessing={isProcessing}
        canDownload={canDownload}
        language={job.language}
        onAddFile={pickFile}
        onDownload={handleDownload}
        onClearFile={job.clear}
        onLanguageChange={job.setLanguage}
      />

      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          PUBLIC_TOOL_WORKSPACE_ROW_CLASS
        )}
        onDragEnter={dragDrop.handleDragEnter}
        onDragOver={dragDrop.handleDragOver}
        onDragLeave={dragDrop.handleDragLeave}
        onDrop={(event) => dragDrop.handleDrop(event, handleDropWithFiles)}
        role="region"
        aria-label="OCR workspace"
      >
        <div className="relative flex h-full max-h-full min-h-0 w-full flex-1 flex-col">
          <div
            className={cn(PUBLIC_TOOL_CANVAS_SHELL_CLASS, "overflow-y-auto")}
          >
            <OcrWorkspace
              hasFile={job.hasFile}
              status={job.status}
              progress={job.progress}
              text={job.text}
              isDragging={dragDrop.isDragging}
              fileInputRef={fileInputRef}
              onPickFile={pickFile}
              onFileInputChange={handleFileInputChange}
              onCopy={handleCopy}
            />
          </div>
        </div>

        <aside
          aria-label="OCR controls"
          className={cn("hidden lg:block", PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS)}
        >
          <div className={cn(PUBLIC_TOOL_SIDEBAR_PANEL_CLASS, "space-y-4")}>
            <OcrSidebar
              language={job.language}
              onLanguageChange={job.setLanguage}
              fileName={job.fileName}
              inputKind={job.inputKind}
              status={job.status}
              progress={job.progress}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
