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
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@helvety/ui/popover";
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  SlidersHorizontalIcon,
  Trash2Icon,
  UploadIcon,
  WandSparklesIcon,
} from "lucide-react";
import * as React from "react";

import type { SizeMode } from "@/lib/upscale-pipeline";

/** Props for the image upscaler command bar. */
interface ImageUpscalerCommandBarProps {
  readonly hasItems: boolean;
  readonly hasOutput: boolean;
  readonly isProcessing: boolean;
  readonly sizeMode: SizeMode;
  readonly scale: 2 | 4;
  readonly targetMode: "width" | "height";
  readonly targetInput: string;
  readonly onAddImages: () => void;
  readonly onUpscale: () => void;
  readonly onDownloadAll: () => void;
  readonly onClearAll: () => void;
  readonly onSizeModeChange: (mode: SizeMode) => void;
  readonly onScaleChange: (scale: 2 | 4) => void;
  readonly onTargetModeChange: (mode: "width" | "height") => void;
  readonly onTargetInputChange: (value: string) => void;
}

/** Shared command-bar implementation for image upscaler actions and settings. */
export function ImageUpscalerCommandBar({
  hasItems,
  hasOutput,
  isProcessing,
  sizeMode,
  scale,
  targetMode,
  targetInput,
  onAddImages,
  onUpscale,
  onDownloadAll,
  onClearAll,
  onSizeModeChange,
  onScaleChange,
  onTargetModeChange,
  onTargetInputChange,
}: ImageUpscalerCommandBarProps): React.JSX.Element {
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const addLabel = hasItems ? "Add More" : "Add Images";

  return (
    <>
      <CommandBar>
        <Button
          size="sm"
          onClick={onAddImages}
          disabled={isProcessing}
          aria-label={addLabel}
        >
          <UploadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          <span className="sr-only min-[400px]:not-sr-only">{addLabel}</span>
        </Button>

        <Button
          size="sm"
          onClick={onUpscale}
          disabled={isProcessing || !hasItems}
          aria-label={isProcessing ? "Upscale all (processing)" : "Upscale all"}
        >
          {isProcessing ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin min-[400px]:mr-1.5" />
          ) : (
            <WandSparklesIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          )}
          {isProcessing ? (
            <span className="sr-only min-[400px]:not-sr-only">
              Processing...
            </span>
          ) : (
            <span className="sr-only min-[400px]:not-sr-only">Upscale all</span>
          )}
        </Button>

        {hasItems && (
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
                <AlertDialogTitle>Clear all images?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all queued and processed images. This action
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
        )}

        <CommandBarSpacer />

        {hasOutput && (
          <Button
            size="sm"
            onClick={onDownloadAll}
            disabled={isProcessing}
            aria-label="Download All"
          >
            <DownloadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
            <span className="sr-only min-[400px]:not-sr-only">
              Download All
            </span>
          </Button>
        )}

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontalIcon className="size-4" />
              <span className="sr-only">Upscale settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mobile-upscale-mode">Mode</Label>
                <select
                  id="mobile-upscale-mode"
                  value={sizeMode}
                  onChange={(event) =>
                    onSizeModeChange(event.target.value as SizeMode)
                  }
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="scale">Scale</option>
                  <option value="target">Target dimension</option>
                </select>
              </div>

              {sizeMode === "scale" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="mobile-upscale-scale">Scale</Label>
                  <select
                    id="mobile-upscale-scale"
                    value={String(scale)}
                    onChange={(event) =>
                      onScaleChange(event.target.value === "4" ? 4 : 2)
                    }
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <option value="2">2x</option>
                    <option value="4">4x</option>
                  </select>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile-upscale-dimension">Dimension</Label>
                    <select
                      id="mobile-upscale-dimension"
                      value={targetMode}
                      onChange={(event) =>
                        onTargetModeChange(
                          event.target.value as "width" | "height"
                        )
                      }
                      className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <option value="width">Width</option>
                      <option value="height">Height</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mobile-upscale-target">Target value</Label>
                    <Input
                      id="mobile-upscale-target"
                      value={targetInput}
                      onChange={(event) =>
                        onTargetInputChange(event.target.value)
                      }
                      inputMode="numeric"
                    />
                  </div>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {hasItems && (
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

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all images?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all queued and processed images. This action
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
