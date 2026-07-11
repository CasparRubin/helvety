"use client";

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
import { Label } from "@helvety/ui/label";
import { NativeSelect } from "@helvety/ui/native-select";
import { Popover, PopoverContent, PopoverTrigger } from "@helvety/ui/popover";
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";

import { OCR_LANGUAGE_OPTIONS, type OcrLanguage } from "@/lib/types";

/** Props for the OCR command bar. */
interface OcrCommandBarProps {
  readonly hasFile: boolean;
  readonly isProcessing: boolean;
  readonly canDownload: boolean;
  readonly language: OcrLanguage;
  readonly onAddFile: () => void;
  readonly onDownload: () => void;
  readonly onClearFile: () => void;
  readonly onLanguageChange: (language: OcrLanguage) => void;
}

/** Command bar for OCR actions: add file, clear, download, mobile language. */
export function OcrCommandBar({
  hasFile,
  isProcessing,
  canDownload,
  language,
  onAddFile,
  onDownload,
  onClearFile,
  onLanguageChange,
}: OcrCommandBarProps): React.JSX.Element {
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const addLabel = hasFile ? "Add More" : "Add File";

  return (
    <>
      <CommandBar>
        <Button
          size="sm"
          onClick={onAddFile}
          disabled={isProcessing}
          aria-label={addLabel}
        >
          <UploadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          <span className="sr-only min-[400px]:not-sr-only">{addLabel}</span>
        </Button>

        {hasFile && (
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  className="hidden md:inline-flex"
                />
              }
            >
              <Trash2Icon className="mr-1.5 size-4 shrink-0" />
              <span>Clear All</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear File?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the current file and its extracted text. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearFile} variant="destructive">
                  Clear All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <CommandBarSpacer />

        <Button
          size="sm"
          onClick={onDownload}
          disabled={!canDownload || isProcessing}
          aria-label={
            isProcessing ? "Download text (processing)" : "Download text"
          }
        >
          {isProcessing ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin min-[400px]:mr-1.5" />
          ) : (
            <DownloadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          )}
          <span className="sr-only min-[400px]:not-sr-only">
            {isProcessing ? "Processing..." : "Download Text"}
          </span>
        </Button>

        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm" className="lg:hidden" />
            }
          >
            <SlidersHorizontalIcon className="size-4" />
            <span className="sr-only">OCR settings</span>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <div className="space-y-1.5">
              <Label htmlFor="mobile-ocr-language">Language</Label>
              <NativeSelect
                id="mobile-ocr-language"
                value={language}
                onChange={(event) =>
                  onLanguageChange(event.target.value as OcrLanguage)
                }
              >
                {OCR_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </PopoverContent>
        </Popover>

        {hasFile && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="md:hidden" />
              }
            >
              <EllipsisVerticalIcon className="size-4" />
              <span className="sr-only">More actions</span>
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

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear File?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the current file and its extracted text. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClearFile} variant="destructive">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
