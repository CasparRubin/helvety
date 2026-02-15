"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BREAKPOINTS, COLUMNS } from "@/lib/constants";
import { addOklchAlpha } from "@/lib/pdf-colors";
import { cn } from "@/lib/utils";

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
  const [showColumnSlider, setShowColumnSlider] = React.useState(false);

  // Detect screen width for column slider visibility
  React.useEffect(() => {
    const checkScreenWidth = (): void => {
      setShowColumnSlider(window.innerWidth >= BREAKPOINTS.MULTI_COLUMN);
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
        "w-80 flex-shrink-0",
        "flex-col gap-6",
        "h-full max-h-full"
      )}
    >
      <div
        className={cn(
          "bg-muted/30 border-border/50 border p-6",
          "flex flex-col gap-6",
          "flex-1 overflow-y-auto"
        )}
      >
        {/* Display - Column Slider (only show when screen width >= 1231px and files are uploaded) */}
        {pdfFiles.length > 0 &&
          showColumnSlider &&
          columns !== undefined &&
          onColumnsChange && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Display</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="column-slider" className="text-sm">
                    Pages per row
                  </Label>
                  <span className="text-muted-foreground text-xs">
                    {columns} {columns === 1 ? "page" : "pages"}
                  </span>
                </div>
                <Slider
                  id="column-slider"
                  min={COLUMNS.SLIDER_MIN}
                  max={COLUMNS.MAX}
                  step={1}
                  value={[columns]}
                  onValueChange={(value) =>
                    onColumnsChange(value[0] ?? COLUMNS.SLIDER_MIN)
                  }
                  className="w-full"
                />
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

/**
 * Custom comparison function for React.memo to optimize re-renders.
 * Only re-renders when props actually change.
 */
function arePropsEqual(
  prevProps: PdfToolkitProps,
  nextProps: PdfToolkitProps
): boolean {
  // Compare primitive values first (fastest check)
  if (
    prevProps.columns !== nextProps.columns ||
    prevProps.totalPages !== nextProps.totalPages ||
    prevProps.deletedCount !== nextProps.deletedCount ||
    prevProps.rotatedCount !== nextProps.rotatedCount
  ) {
    return false; // Props changed, re-render
  }

  // Compare array length first (fast check)
  if (prevProps.pdfFiles.length !== nextProps.pdfFiles.length) {
    return false; // Array length changed, re-render
  }

  // Compare array reference (if reference is same, array hasn't changed)
  if (prevProps.pdfFiles !== nextProps.pdfFiles) {
    // Deep comparison only if references differ
    // Check if any file changed by comparing IDs (more efficient than deep object comparison)
    const prevIds = new Set(prevProps.pdfFiles.map((f) => f.id));
    const nextIds = new Set(nextProps.pdfFiles.map((f) => f.id));
    if (prevIds.size !== nextIds.size) {
      return false;
    }
    for (const id of prevIds) {
      if (!nextIds.has(id)) {
        return false;
      }
    }
  }

  // Compare function references (if they're stable, this is fine)
  // If functions changed, we want to re-render anyway
  return (
    prevProps.onRemoveFile === nextProps.onRemoveFile &&
    prevProps.onColumnsChange === nextProps.onColumnsChange
  );
}

// Memoize component to prevent unnecessary re-renders
export const PdfToolkit = React.memo(PdfToolkitComponent, arePropsEqual);
