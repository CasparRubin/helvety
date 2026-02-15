"use client";

/**
 * PDF command bar - sticky toolbar below navbar for the PDF app.
 * Primary actions (always visible): add files, download
 * Secondary actions (desktop inline, mobile dropdown): clear all
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@helvety/ui/alert-dialog";
import { Button } from "@helvety/ui/button";
import { CommandBar, CommandBarSpacer } from "@helvety/ui/command-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@helvety/ui/dropdown-menu";
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";

/** Props for the PdfCommandBar component. */
interface PdfCommandBarProps {
  /** Number of loaded PDF files */
  readonly fileCount: number;
  /** Callback to open the file picker */
  readonly onAddFiles: () => void;
  /** Callback to download the merged PDF */
  readonly onDownload: () => void;
  /** Callback to clear all files */
  readonly onClearAll: () => void;
  /** Whether a PDF processing operation is in progress */
  readonly isProcessing: boolean;
}

/**
 * Renders the PDF command bar with primary actions always visible
 * and secondary actions collapsed into a dropdown on mobile.
 */
export function PdfCommandBar({
  fileCount,
  onAddFiles,
  onDownload,
  onClearAll,
  isProcessing,
}: PdfCommandBarProps): React.JSX.Element {
  const hasFiles = fileCount > 0;

  // State for mobile clear-all confirmation (opened from dropdown)
  const [showClearDialog, setShowClearDialog] = React.useState(false);

  return (
    <>
      <CommandBar>
        {/* Add Files button - always visible */}
        <Button size="sm" onClick={onAddFiles} disabled={isProcessing}>
          <UploadIcon className="mr-1.5 size-4 shrink-0" />
          <span>{hasFiles ? "Add More" : "Add Files"}</span>
        </Button>

        {/* Desktop only: Clear All with confirmation */}
        {hasFiles && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessing}
                className="hidden md:inline-flex"
              >
                <Trash2Icon className="mr-1.5 size-4 shrink-0" />
                <span>Clear All</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear All Files?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all files and pages from the canvas. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll} variant="destructive">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <CommandBarSpacer />

        {/* Download - always visible when files exist */}
        {hasFiles && (
          <Button size="sm" onClick={onDownload} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2Icon className="mr-1.5 size-4 shrink-0 animate-spin" />
            ) : (
              <DownloadIcon className="mr-1.5 size-4 shrink-0" />
            )}
            <span>{isProcessing ? "Processing..." : "Download PDF"}</span>
          </Button>
        )}

        {/* Mobile only: overflow dropdown for secondary actions */}
        {hasFiles && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={isProcessing}
                onClick={() => setShowClearDialog(true)}
                variant="destructive"
              >
                <Trash2Icon className="mr-2 size-4" />
                <span>Clear All</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CommandBar>

      {/* Mobile clear-all confirmation dialog (triggered from dropdown) */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Files?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all files and pages from the canvas. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClearAll} variant="destructive">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
