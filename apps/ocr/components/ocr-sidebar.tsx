"use client";

import { cn } from "@helvety/shared/utils";
import { Label } from "@helvety/ui/label";
import { NativeSelect } from "@helvety/ui/native-select";
import * as React from "react";

import { describeOcrProgress } from "@/lib/progress-copy";
import {
  OCR_LANGUAGE_OPTIONS,
  type OcrInputKind,
  type OcrLanguage,
  type OcrProgress,
  type OcrStatus,
} from "@/lib/types";

/** Props for the desktop OCR settings + status sidebar. */
interface OcrSidebarProps {
  readonly language: OcrLanguage;
  readonly onLanguageChange: (language: OcrLanguage) => void;
  readonly fileName: string | null;
  readonly inputKind: OcrInputKind | null;
  readonly status: OcrStatus;
  readonly progress: OcrProgress | null;
}

const INPUT_KIND_LABELS: Record<OcrInputKind, string> = {
  pdf: "PDF document",
  image: "Image",
};

/** Desktop sidebar: language selection, file info, and extraction progress. */
export function OcrSidebar({
  language,
  onLanguageChange,
  fileName,
  inputKind,
  status,
  progress,
}: OcrSidebarProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Settings</h3>
        <div className="space-y-2">
          <Label htmlFor="desktop-ocr-language">Language</Label>
          <NativeSelect
            id="desktop-ocr-language"
            value={language}
            onChange={(event) =>
              onLanguageChange(event.target.value as OcrLanguage)
            }
            className="h-10 py-2"
          >
            {OCR_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {fileName && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">File</h3>
          <p className="truncate text-sm" title={fileName}>
            {fileName}
          </p>
          {inputKind && (
            <p className="text-muted-foreground text-xs">
              {INPUT_KIND_LABELS[inputKind]}
            </p>
          )}
        </div>
      )}

      {(status === "processing" || status === "done") && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Status</h3>
          {status === "processing" ? (
            <p
              className={cn(
                "text-sm",
                "processing-shine [--processing-shine-base:var(--color-violet-700)] dark:[--processing-shine-base:var(--color-violet-300)]"
              )}
            >
              {progress ? describeOcrProgress(progress) : "Processing"}
            </p>
          ) : (
            <p className="text-sm text-teal-700 dark:text-teal-300">Done</p>
          )}
        </div>
      )}
    </div>
  );
}
