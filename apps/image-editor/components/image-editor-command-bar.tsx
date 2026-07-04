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
  readonly toolColor: string;
  readonly userZoom: number;
  readonly onOpenImage: () => void;
  readonly onReplaceImage: () => void;
  readonly onSetTool: (tool: EditorTool) => void;
  readonly onExport: (format: ExportFormat) => void;
  readonly onClear: () => void;
  readonly onApplyCrop: () => void;
  readonly onResetCrop: () => void;
  readonly onOpenLayers: () => void;
  readonly onToolColorChange: (color: string) => void;
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

/** Desktop color picker for the active drawing tool. */
function ToolColorPicker({
  toolColor,
  onToolColorChange,
  className,
}: {
  readonly toolColor: string;
  readonly onToolColorChange: (color: string) => void;
  readonly className?: string;
}): React.JSX.Element {
  return (
    <div className={className}>
      <Label htmlFor="tool-color" className="sr-only">
        Tool color
      </Label>
      <Input
        id="tool-color"
        type="color"
        value={toolColor}
        onChange={(event) => onToolColorChange(event.target.value)}
        className="h-8 w-10 cursor-pointer p-0.5"
        aria-label="Tool color"
      />
    </div>
  );
}

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

/** Toolbar: tool buttons, crop actions, export, clear, and mobile layers. */
export function ImageEditorCommandBar({
  hasImage,
  activeTool,
  isExporting,
  canApplyCrop,
  toolColor,
  userZoom,
  onOpenImage,
  onReplaceImage,
  onSetTool,
  onExport,
  onClear,
  onApplyCrop,
  onResetCrop,
  onOpenLayers,
  onToolColorChange,
  onZoomIn,
  onZoomOut,
  onFitToView,
}: ImageEditorCommandBarProps): React.JSX.Element {
  const [showClearDialog, setShowClearDialog] = React.useState(false);

  return (
    <>
      <CommandBar>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={hasImage ? onReplaceImage : onOpenImage}
        >
          <UploadIcon className="size-4" />
          <span className="sr-only min-[400px]:not-sr-only">
            {hasImage ? "Replace Image" : "Open Image"}
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

            <ToolColorPicker
              toolColor={toolColor}
              onToolColorChange={onToolColorChange}
              className="hidden md:block"
            />

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
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" disabled={isExporting}>
                  <DownloadIcon className="size-4" />
                  <span className="sr-only min-[400px]:not-sr-only">
                    Export
                  </span>
                  <ChevronDownIcon className="size-4 opacity-70" />
                </Button>
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
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="md:hidden"
                  aria-label="View settings"
                >
                  <SlidersHorizontalIcon className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile-tool-color">Tool color</Label>
                  <Input
                    id="mobile-tool-color"
                    type="color"
                    value={toolColor}
                    onChange={(event) => onToolColorChange(event.target.value)}
                    className="h-9 w-full cursor-pointer"
                  />
                </div>
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
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex"
                >
                  <Trash2Icon className="size-4" />
                  <span className="sr-only min-[400px]:not-sr-only">Clear</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear annotations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes all layers and crop settings. The image stays
                    loaded.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onClear();
                      setShowClearDialog(false);
                    }}
                  >
                    Clear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="lg:hidden"
                >
                  <EllipsisVerticalIcon className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowClearDialog(true)}>
                  Clear annotations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : null}
      </CommandBar>
    </>
  );
}
