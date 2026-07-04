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
import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  CropIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  LayersIcon,
  MousePointer2Icon,
  SquareIcon,
  EyeOffIcon,
  SparklesIcon,
  Trash2Icon,
  TypeIcon,
  UploadIcon,
} from "lucide-react";
import * as React from "react";

import type { EditorTool, ExportFormat } from "@/lib/editor-types";

/** Props for {@link ImageEditorCommandBar}. */
interface ImageEditorCommandBarProps {
  readonly hasImage: boolean;
  readonly activeTool: EditorTool;
  readonly isExporting: boolean;
  readonly canApplyCrop: boolean;
  readonly onOpenImage: () => void;
  readonly onReplaceImage: () => void;
  readonly onSetTool: (tool: EditorTool) => void;
  readonly onExport: (format: ExportFormat) => void;
  readonly onClear: () => void;
  readonly onApplyCrop: () => void;
  readonly onResetCrop: () => void;
  readonly onOpenLayers: () => void;
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
  { tool: "highlight", label: "Highlight", icon: SparklesIcon },
  { tool: "blur", label: "Blur", icon: EyeOffIcon },
  { tool: "crop", label: "Crop", icon: CropIcon },
];

/** Toolbar: tool buttons, crop actions, export, clear, and mobile layers. */
export function ImageEditorCommandBar({
  hasImage,
  activeTool,
  isExporting,
  canApplyCrop,
  onOpenImage,
  onReplaceImage,
  onSetTool,
  onExport,
  onClear,
  onApplyCrop,
  onResetCrop,
  onOpenLayers,
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
