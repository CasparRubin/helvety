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
import { Popover, PopoverContent, PopoverTrigger } from "@helvety/ui/popover";
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CropIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  EyeOffIcon,
  FocusIcon,
  LayersIcon,
  Maximize2Icon,
  MousePointer2Icon,
  SlidersHorizontalIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
  UploadIcon,
  ZoomInIcon,
  ZoomOutIcon,
  Loader2Icon,
} from "lucide-react";
import * as React from "react";

import { formatUserZoomPercent } from "@/lib/stage-zoom";

import type { EditorTool, ExportFormat } from "@/lib/editor-types";

/** Props for {@link ImageEditorCommandBar}. */
interface ImageEditorCommandBarProps {
  readonly hasImage: boolean;
  readonly activeTool: EditorTool;
  readonly isExporting: boolean;
  readonly canApplyCrop: boolean;
  readonly userZoom: number;
  readonly onOpenImage: () => void;
  readonly onReplaceImage: () => void;
  readonly onSetTool: (tool: EditorTool) => void;
  readonly onExport: (format: ExportFormat) => void;
  readonly onClear: () => void;
  readonly onApplyCrop: () => void;
  readonly onResetCrop: () => void;
  readonly onOpenLayers: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onFitToView: () => void;
}

const TOOL_BUTTONS: Array<{
  tool: EditorTool;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { tool: "select", label: "Select", icon: MousePointer2Icon },
  { tool: "text", label: "Text", icon: TypeIcon },
  { tool: "arrow", label: "Arrow", icon: ArrowUpRightIcon },
  { tool: "border", label: "Border", icon: SquareIcon },
  { tool: "highlight", label: "Highlight", icon: FocusIcon },
  { tool: "blur", label: "Blur", icon: EyeOffIcon },
  { tool: "crop", label: "Crop", icon: CropIcon },
];

/** Desktop zoom controls. */
function ZoomControls({
  userZoom,
  onZoomIn,
  onZoomOut,
  onFitToView,
  className,
}: {
  readonly userZoom: number;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onFitToView: () => void;
  readonly className?: string;
}): React.JSX.Element {
  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <ZoomOutIcon className="size-4" />
      </Button>
      <span className="text-muted-foreground min-w-[3rem] text-center text-xs tabular-nums">
        {formatUserZoomPercent(userZoom)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <ZoomInIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onFitToView}
        aria-label="Fit to view"
      >
        <Maximize2Icon className="size-4" />
        <span className="sr-only min-[500px]:not-sr-only">Fit</span>
      </Button>
    </div>
  );
}

/** Main command bar: tool buttons, crop actions, export, clear, and mobile layers. */
export function ImageEditorCommandBar({
  hasImage,
  activeTool,
  isExporting,
  canApplyCrop,
  userZoom,
  onOpenImage,
  onReplaceImage,
  onSetTool,
  onExport,
  onClear,
  onApplyCrop,
  onResetCrop,
  onOpenLayers,
  onZoomIn,
  onZoomOut,
  onFitToView,
}: ImageEditorCommandBarProps): React.JSX.Element {
  const [showClearDialog, setShowClearDialog] = React.useState(false);
  const addButtonLabel = hasImage ? "Add More" : "Add Image";

  return (
    <>
      <CommandBar>
        <Button
          type="button"
          size="sm"
          onClick={hasImage ? onReplaceImage : onOpenImage}
          aria-label={addButtonLabel}
        >
          <UploadIcon className="size-4 shrink-0 min-[400px]:mr-1.5" />
          <span className="sr-only min-[400px]:not-sr-only">
            {addButtonLabel}
          </span>
        </Button>

        {hasImage ? (
          <>
            {TOOL_BUTTONS.map(({ tool, label, icon }) => {
              const ToolIcon = icon;
              return (
                <Button
                  key={tool}
                  type="button"
                  variant={activeTool === tool ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSetTool(tool)}
                  aria-pressed={activeTool === tool}
                >
                  <ToolIcon className="size-4" />
                  <span className="sr-only min-[500px]:not-sr-only">
                    {label}
                  </span>
                </Button>
              );
            })}

            {activeTool === "crop" ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!canApplyCrop}
                  onClick={onApplyCrop}
                >
                  Apply Crop
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onResetCrop}
                >
                  Reset Crop
                </Button>
              </>
            ) : null}
          </>
        ) : null}

        <CommandBarSpacer />

        {hasImage ? (
          <>
            <ZoomControls
              userZoom={userZoom}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onFitToView={onFitToView}
              className="hidden items-center gap-1 md:flex"
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    disabled={isExporting}
                    aria-label={
                      isExporting ? "Export image (processing)" : "Export image"
                    }
                  />
                }
              >
                {isExporting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                <span className="sr-only min-[400px]:not-sr-only">
                  {isExporting ? "Processing..." : "Export"}
                </span>
                <ChevronDownIcon className="size-4 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport("png")}>
                  Export PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("jpeg")}>
                  Export JPEG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={onOpenLayers}
            >
              <LayersIcon className="size-4" />
              <span className="sr-only">Layers</span>
            </Button>

            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="md:hidden"
                    aria-label="View settings"
                  />
                }
              >
                <SlidersHorizontalIcon className="size-4" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 space-y-4">
                <div className="space-y-2">
                  <Label>Zoom</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={onZoomOut}
                      aria-label="Zoom out"
                    >
                      <ZoomOutIcon className="size-4" />
                    </Button>
                    <span className="text-muted-foreground flex-1 text-center text-sm tabular-nums">
                      {formatUserZoomPercent(userZoom)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={onZoomIn}
                      aria-label="Zoom in"
                    >
                      <ZoomInIcon className="size-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={onFitToView}
                    aria-label="Fit to view"
                  >
                    <Maximize2Icon className="size-4" />
                    Fit to view
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <AlertDialog
              open={showClearDialog}
              onOpenChange={setShowClearDialog}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex"
                  />
                }
              >
                <Trash2Icon className="mr-1.5 size-4 shrink-0" />
                <span className="sr-only min-[400px]:not-sr-only">
                  Clear Annotations
                </span>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Annotations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all layers and crop settings. The image stays
                    loaded.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      onClear();
                      setShowClearDialog(false);
                    }}
                  >
                    Clear Annotations
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    className="md:hidden"
                  />
                }
              >
                <EllipsisVerticalIcon className="size-4" />
                <span className="sr-only">More actions</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowClearDialog(true)}
                  variant="destructive"
                >
                  <Trash2Icon className="mr-2 size-4" />
                  <span>Clear Annotations</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </CommandBar>
    </>
  );
}
