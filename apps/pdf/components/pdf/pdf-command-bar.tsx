"use client";

/**
 * PDF command bar - sticky toolbar below navbar for the PDF app.
 * Primary actions (always visible): add files, download
 * Secondary actions (desktop inline, mobile dropdown): clear all
 */

import {
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      <nav
        className={
          "bg-card/70 supports-[backdrop-filter]:bg-card/50 sticky top-0 z-40 w-full border-b backdrop-blur min-[2000px]:border-x"
        }
      >
        <div className="container mx-auto px-4 py-2 md:py-0">
          <div className="flex items-center gap-1 md:h-12 md:gap-2">
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
                    <AlertDialogAction
                      onClick={onClearAll}
                      variant="destructive"
                    >
                      Clear All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Desktop only: Download */}
            {hasFiles && (
              <Button
                size="sm"
                onClick={onDownload}
                disabled={isProcessing}
                className="hidden md:inline-flex"
              >
                {isProcessing ? (
                  <Loader2Icon className="mr-1.5 size-4 shrink-0 animate-spin" />
                ) : (
                  <DownloadIcon className="mr-1.5 size-4 shrink-0" />
                )}
                <span>{isProcessing ? "Processing..." : "Download PDF"}</span>
              </Button>
            )}

            {/* Mobile only: Download (always visible when files exist) */}
            {hasFiles && (
              <Button
                size="sm"
                onClick={onDownload}
                disabled={isProcessing}
                className="md:hidden"
              >
                {isProcessing ? (
                  <Loader2Icon className="mr-1.5 size-4 shrink-0 animate-spin" />
                ) : (
                  <DownloadIcon className="mr-1.5 size-4 shrink-0" />
                )}
                <span>{isProcessing ? "Processing..." : "Download"}</span>
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
          </div>
        </div>
      </nav>

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
