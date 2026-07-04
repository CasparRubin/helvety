"use client";

import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { useDragDrop } from "@helvety/shared/hooks/use-drag-drop";
import { cn } from "@helvety/shared/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@helvety/ui/sheet";
import { UploadIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { EditorCanvas } from "@/components/editor/editor-canvas";
import { ImageEditorCommandBar } from "@/components/image-editor-command-bar";
import { LayersPanel } from "@/components/layers-panel";
import { useEditorKeyboard } from "@/hooks/use-editor-keyboard";
import { useEditorState } from "@/hooks/use-editor-state";
import { useSourceImage } from "@/hooks/use-source-image";
import { useStageFit } from "@/hooks/use-stage-fit";
import {
  clampOutputDimensions,
  getCanvasExportLimitsCached,
} from "@/lib/canvas-export-limits";
import { exportEditedImage } from "@/lib/export-image";
import {
  createDownloadName,
  imageValidationMessage,
  validateImageFile,
} from "@/lib/image-validation";

import type { CropRect, ExportFormat } from "@/lib/editor-types";

/** Main image editor workspace. */
export function HelvetyImageEditor(): React.JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const { source, loadFile, clear } = useSourceImage();
  const { state, dispatch, setTool, select, setCrop, resetAnnotations } =
    useEditorState();
  const [isExporting, setIsExporting] = React.useState(false);
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [pendingCrop, setPendingCrop] = React.useState<CropRect | null>(null);

  const logicalWidth = source ? (state.crop?.width ?? source.naturalWidth) : 0;
  const logicalHeight = source
    ? (state.crop?.height ?? source.naturalHeight)
    : 0;
  const fitScale = useStageFit(canvasContainerRef, logicalWidth, logicalHeight);

  const openFilePicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFiles = React.useCallback(
    async (files: FileList | File[]) => {
      const file = files[0];
      if (!file) return;

      const validation = validateImageFile(file);
      if (!validation.ok && validation.error) {
        toast.error(imageValidationMessage(validation.error), {
          duration: TOAST_DURATIONS.ERROR,
        });
        return;
      }

      try {
        resetAnnotations();
        setPendingCrop(null);
        await loadFile(file);
      } catch {
        toast.error("Could not load that image.", {
          duration: TOAST_DURATIONS.ERROR,
        });
      }
    },
    [loadFile, resetAnnotations]
  );

  const dragDrop = useDragDrop();

  const handleDropWithFiles = React.useCallback(
    (files: FileList) => {
      void handleFiles(files);
    },
    [handleFiles]
  );

  const handleReplaceImage = React.useCallback(() => {
    resetAnnotations();
    setPendingCrop(null);
    clear();
    openFilePicker();
  }, [clear, openFilePicker, resetAnnotations]);

  const handleExport = React.useCallback(
    async (format: ExportFormat) => {
      if (!source) return;
      setIsExporting(true);
      try {
        const limits = await getCanvasExportLimitsCached();
        const targetWidth = state.crop?.width ?? source.naturalWidth;
        const targetHeight = state.crop?.height ?? source.naturalHeight;
        const clamped = clampOutputDimensions(
          targetWidth,
          targetHeight,
          limits
        );
        if (clamped.clamped) {
          toast.info("Output size limited by your browser.", {
            duration: TOAST_DURATIONS.INFO,
          });
        }

        const blob = await exportEditedImage(source.image, state, format);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = createDownloadName(source.file.name, format);
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("Image exported.", {
          duration: TOAST_DURATIONS.SUCCESS,
        });
      } catch {
        toast.error("Export failed.", { duration: TOAST_DURATIONS.ERROR });
      } finally {
        setIsExporting(false);
      }
    },
    [source, state]
  );

  const handleApplyCrop = React.useCallback(() => {
    if (!pendingCrop) return;
    setCrop(pendingCrop);
    setTool("select");
  }, [pendingCrop, setCrop, setTool]);

  const handleResetCrop = React.useCallback(() => {
    setCrop(null);
    setPendingCrop(null);
  }, [setCrop]);

  useEditorKeyboard({
    enabled: Boolean(source),
    onDelete: () => {
      if (state.selectedId) {
        dispatch({ type: "DELETE_ELEMENT", id: state.selectedId });
      }
    },
    onEscape: () => {
      if (state.activeTool === "crop") {
        setTool("select");
        return;
      }
      select(null);
    },
  });

  React.useEffect(() => {
    if (state.activeTool === "crop" && source && !pendingCrop) {
      setPendingCrop(
        state.crop ?? {
          x: 0,
          y: 0,
          width: source.naturalWidth,
          height: source.naturalHeight,
        }
      );
    }
  }, [state.activeTool, state.crop, source, pendingCrop]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const files = event.target.files;
          if (files) void handleFiles(files);
          event.target.value = "";
        }}
      />

      <ImageEditorCommandBar
        hasImage={Boolean(source)}
        activeTool={state.activeTool}
        isExporting={isExporting}
        canApplyCrop={Boolean(pendingCrop)}
        onOpenImage={openFilePicker}
        onReplaceImage={handleReplaceImage}
        onSetTool={setTool}
        onExport={(format) => void handleExport(format)}
        onClear={resetAnnotations}
        onApplyCrop={handleApplyCrop}
        onResetCrop={handleResetCrop}
        onOpenLayers={() => setLayersOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {source ? (
          <LayersPanel
            className="hidden lg:flex"
            elements={state.elements}
            selectedId={state.selectedId}
            onSelect={select}
            onDelete={(id) => dispatch({ type: "DELETE_ELEMENT", id })}
            onReorder={(id, direction) =>
              dispatch({ type: "REORDER_ELEMENT", id, direction })
            }
            onUpdate={(id, patch) =>
              dispatch({ type: "UPDATE_ELEMENT", id, patch })
            }
          />
        ) : null}

        <section
          className={cn(
            "bg-muted/30 border-border/50 min-h-0 flex-1 overflow-auto border-t lg:border-t-0",
            dragDrop.isDragging && "border-primary bg-primary/5"
          )}
          onDragEnter={dragDrop.handleDragEnter}
          onDragOver={dragDrop.handleDragOver}
          onDragLeave={dragDrop.handleDragLeave}
          onDrop={(event) => dragDrop.handleDrop(event, handleDropWithFiles)}
        >
          {source ? (
            <div
              ref={canvasContainerRef}
              className="flex h-full min-h-[320px] items-center justify-center p-4"
            >
              <EditorCanvas
                sourceImage={source.image}
                imageWidth={source.naturalWidth}
                imageHeight={source.naturalHeight}
                state={state}
                dispatch={dispatch}
                fitScale={fitScale}
                pendingCrop={pendingCrop}
                onCropDraftChange={setPendingCrop}
              />
            </div>
          ) : (
            <button
              type="button"
              className="flex h-full min-h-[320px] w-full flex-col items-center justify-center px-6 py-12 text-center"
              onClick={openFilePicker}
            >
              <UploadIcon className="text-muted-foreground mb-3 size-10" />
              <p className="text-sm font-medium">Drag and drop an image here</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Processed locally in your browser. No server upload. No account.
              </p>
              <p className="text-muted-foreground text-xs">
                PNG, JPEG, or WebP up to 25 MB.
              </p>
            </button>
          )}
        </section>
      </div>

      <Sheet open={layersOpen} onOpenChange={setLayersOpen}>
        <SheetContent side="left" className="w-[320px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Layers</SheetTitle>
          </SheetHeader>
          {source ? (
            <LayersPanel
              elements={state.elements}
              selectedId={state.selectedId}
              onSelect={select}
              onDelete={(id) => dispatch({ type: "DELETE_ELEMENT", id })}
              onReorder={(id, direction) =>
                dispatch({ type: "REORDER_ELEMENT", id, direction })
              }
              onUpdate={(id, patch) =>
                dispatch({ type: "UPDATE_ELEMENT", id, patch })
              }
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
