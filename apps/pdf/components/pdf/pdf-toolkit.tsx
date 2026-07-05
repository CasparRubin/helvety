"use client";

import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Button } from "@helvety/ui/button";
import { Label } from "@helvety/ui/label";
import { NativeSelect } from "@helvety/ui/native-select";
import {
  PUBLIC_TOOL_SIDEBAR_PANEL_CLASS,
  PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS,
} from "@helvety/ui/public-tool-workspace";
import { X } from "lucide-react";
import * as React from "react";

import { BREAKPOINTS, COLUMNS } from "@/lib/constants";
import { addOklchAlpha } from "@/lib/pdf-colors";

import type { PdfFile } from "@/lib/types";

/** Props for the PdfToolkit component */
interface PdfToolkitProps {
  readonly pdfFiles: ReadonlyArray<PdfFile>;
  readonly totalPages: number;
  readonly deletedCount: number;
  readonly rotatedCount: number;
  readonly onRemoveFile: (fileId: string) => void;
  readonly columns?: number;
  readonly onColumnsChange?: (columns: number) => void;
}

/**
 * PDF toolkit panel with display settings, statistics, and file management.
 * Desktop only (hidden on stacked/mobile layout via parent).
 * Actions (add files, download, clear all) are handled by the command bar.
 */
function PdfToolkitComponent({
  pdfFiles,
  totalPages,
  deletedCount,
  rotatedCount,
  onRemoveFile,
  columns,
  onColumnsChange,
}: PdfToolkitProps): React.JSX.Element {
  const [showColumnSelector, setShowColumnSelector] = React.useState(false);

  // Detect screen width for column selector visibility
  React.useEffect(() => {
    const checkScreenWidth = (): void => {
      setShowColumnSelector(window.innerWidth >= BREAKPOINTS.MULTI_COLUMN);
    };

    // Check on mount
    checkScreenWidth();

    // Listen for resize events
    window.addEventListener("resize", checkScreenWidth);
    return () => window.removeEventListener("resize", checkScreenWidth);
  }, []);

  return (
    <div
      className={cn(
        "flex",
        PUBLIC_TOOL_SIDEBAR_WIDTH_CLASS,
        "flex-col gap-6",
        "h-full max-h-full"
      )}
    >
      <div
        className={cn(
          PUBLIC_TOOL_SIDEBAR_PANEL_CLASS,
          "flex flex-col gap-6",
          "flex-1 overflow-y-auto"
        )}
      >
        {/* Display - Column selector (desktop/tablet only, and only when files are uploaded) */}
        {pdfFiles.length > 0 &&
          showColumnSelector &&
          columns !== undefined &&
          onColumnsChange && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Display</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="column-selector" className="text-sm">
                    Pages per row
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    {columns} {columns === 1 ? "page" : "pages"}
                  </span>
                </div>
                <NativeSelect
                  id="column-selector"
                  value={columns}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    onColumnsChange(
                      Number.isNaN(parsed) ? COLUMNS.DEFAULT_LARGE : parsed
                    );
                  }}
                >
                  {Array.from(
                    { length: COLUMNS.MAX - COLUMNS.MIN + 1 },
                    (_, index) => {
                      const value = COLUMNS.MIN + index;
                      return (
                        <option key={value} value={value}>
                          {value} {value === 1 ? "page" : "pages"}
                        </option>
                      );
                    }
                  )}
                </NativeSelect>
              </div>
            </div>
          )}

        {/* Statistics */}
        {pdfFiles.length > 0 && columns !== 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Pages</span>
                  <Badge variant="secondary">{totalPages}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Files</span>
                <Badge variant="secondary">{pdfFiles.length}</Badge>
              </div>
              {deletedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deleted</span>
                  <Badge variant="destructive">{deletedCount}</Badge>
                </div>
              )}
              {rotatedCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rotated</span>
                  <Badge variant="default">{rotatedCount}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* File List */}
        {pdfFiles.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Files</h3>
            <div className="space-y-2">
              {pdfFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2",
                    "border-border border",
                    "group"
                  )}
                  style={{
                    backgroundColor: addOklchAlpha(file.color, 0.15),
                  }}
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: file.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-xs font-medium"
                      title={file.file.name}
                    >
                      {file.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {file.pageCount} {file.pageCount === 1 ? "page" : "pages"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onRemoveFile(file.id)}
                    aria-label={`Remove ${file.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize with default shallow comparison to avoid stale renders from custom comparators.
export const PdfToolkit = React.memo(PdfToolkitComponent);
