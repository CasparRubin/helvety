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
import { ImageEditorToolPropertiesBar } from "@/components/image-editor-tool-properties-bar";
import { LayersPanel } from "@/components/layers-panel";
import { useEditorKeyboard } from "@/hooks/use-editor-keyboard";
import { useEditorState } from "@/hooks/use-editor-state";
import { useSourceImage } from "@/hooks/use-source-image";
import { useStageFit } from "@/hooks/use-stage-fit";
import {
  clampOutputDimensions,
  getCanvasExportLimitsCached,
} from "@/lib/canvas-export-limits";
import { getDefaultToolSizes } from "@/lib/default-tool-sizes";
import { DEFAULT_STROKE } from "@/lib/editor-types";
import { exportEditedImage } from "@/lib/export-image";
import {
  createDownloadName,
  imageValidationMessage,
  validateImageFile,
} from "@/lib/image-validation";
import { clampUserZoom, USER_ZOOM_STEP } from "@/lib/stage-zoom";

import type { CropRect, ExportFormat } from "@/lib/editor-types";

/** Main image editor workspace. */
export function HelvetyImageEditor(): React.JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const canvasSizerRef = React.useRef<HTMLDivElement>(null);
  const canvasContainerRef = React.useRef<HTMLDivElement>(null);
  const { source, loadFile, clear } = useSourceImage();
  const { state, dispatch, setTool, select, setCrop, resetAnnotations } =
    useEditorState();
  const [isExporting, setIsExporting] = React.useState(false);
  const [layersOpen, setLayersOpen] = React.useState(false);
  const [pendingCrop, setPendingCrop] = React.useState<CropRect | null>(null);
  const [userZoom, setUserZoom] = React.useState(1);
  const [toolColor, setToolColor] = React.useState(DEFAULT_STROKE);
  const [toolStrokeWidth, setToolStrokeWidth] = React.useState(5);

  const logicalWidth = source ? (state.crop?.width ?? source.naturalWidth) : 0;
  const logicalHeight = source
    ? (state.crop?.height ?? source.naturalHeight)
    : 0;
  const fitScale = useStageFit(canvasSizerRef, logicalWidth, logicalHeight);
  const displayScale = fitScale * userZoom;

  const resetCanvasView = React.useCallback(() => {
    setUserZoom(1);
    const container = canvasContainerRef.current;
    if (container) {
      container.scrollTop = 0;
      container.scrollLeft = 0;
    }
  }, []);

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
        setUserZoom(1);
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
    setUserZoom(1);
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
    resetCanvasView();
  }, [pendingCrop, resetCanvasView, setCrop, setTool]);

  const handleResetCrop = React.useCallback(() => {
    setCrop(null);
    setPendingCrop(null);
  }, [setCrop]);

  const handleZoomIn = React.useCallback(() => {
    setUserZoom((current) => clampUserZoom(current + USER_ZOOM_STEP));
  }, []);

  const handleZoomOut = React.useCallback(() => {
    setUserZoom((current) => clampUserZoom(current - USER_ZOOM_STEP));
  }, []);

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
    if (!source) return;
    const defaults = getDefaultToolSizes(
      source.naturalWidth,
      source.naturalHeight
    );
    setToolStrokeWidth(defaults.strokeWidth);
  }, [source]);

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

  React.useEffect(() => {
    if (!source) return;
    requestAnimationFrame(() => {
      resetCanvasView();
    });
  }, [source, logicalWidth, logicalHeight, resetCanvasView]);

  React.useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container || !source) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      setUserZoom((current) =>
        clampUserZoom(
          current + (event.deltaY < 0 ? USER_ZOOM_STEP : -USER_ZOOM_STEP)
        )
      );
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [source]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        aria-label="Upload image"
        aria-describedby="image-editor-drop-description"
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
        userZoom={userZoom}
        onOpenImage={openFilePicker}
        onReplaceImage={handleReplaceImage}
        onSetTool={setTool}
        onExport={(format) => void handleExport(format)}
        onClear={resetAnnotations}
        onApplyCrop={handleApplyCrop}
        onResetCrop={handleResetCrop}
        onOpenLayers={() => setLayersOpen(true)}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitToView={resetCanvasView}
      />

      <ImageEditorToolPropertiesBar
        hasImage={Boolean(source)}
        activeTool={state.activeTool}
        elements={state.elements}
        selectedId={state.selectedId}
        toolColor={toolColor}
        toolStrokeWidth={toolStrokeWidth}
        onToolColorChange={setToolColor}
        onToolStrokeWidthChange={setToolStrokeWidth}
        onUpdate={(id, patch) =>
          dispatch({ type: "UPDATE_ELEMENT", id, patch })
        }
      />

      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden",
          "flex flex-col gap-4 lg:flex-row",
          "py-4"
        )}
        onDragEnter={dragDrop.handleDragEnter}
        onDragOver={dragDrop.handleDragOver}
        onDragLeave={dragDrop.handleDragLeave}
        onDrop={(event) => dragDrop.handleDrop(event, handleDropWithFiles)}
        role="region"
        aria-label="Image editor workspace"
      >
        <div
          ref={canvasSizerRef}
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            "h-full max-h-full min-h-0",
            "relative"
          )}
        >
          <div
            ref={canvasContainerRef}
            className={cn(
              "bg-muted/30 border-border/50 flex min-h-0 flex-1 [scrollbar-gutter:stable] flex-col overflow-auto border p-6",
              dragDrop.isDragging && "border-primary bg-primary/5"
            )}
          >
            {source ? (
              <div className="flex min-h-full items-start justify-start">
                <EditorCanvas
                  sourceImage={source.image}
                  imageWidth={source.naturalWidth}
                  imageHeight={source.naturalHeight}
                  state={state}
                  dispatch={dispatch}
                  displayScale={displayScale}
                  toolColor={toolColor}
                  toolStrokeWidth={toolStrokeWidth}
                  pendingCrop={pendingCrop}
                  onCropDraftChange={setPendingCrop}
                />
              </div>
            ) : (
              <section
                className={cn(
                  "relative min-h-full w-full transition-colors",
                  dragDrop.isDragging
                    ? "border-primary bg-primary/5 border-2 border-dashed"
                    : "border-border cursor-pointer border-2 border-dashed"
                )}
                role="button"
                tabIndex={0}
                aria-label="File drop zone. Click to select an image."
                aria-live="polite"
                aria-describedby="image-editor-drop-description"
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
              >
                <span id="image-editor-drop-description" className="sr-only">
                  Drag and drop an image here, click to select a file, or use
                  the command bar above to open an image. PNG, JPEG, or WebP up
                  to 25 MB.
                </span>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-12 text-center">
                  <UploadIcon
                    className="text-muted-foreground h-12 w-12"
                    aria-hidden="true"
                  />
                  <div>
                    <p
                      className="text-sm font-medium"
                      role="heading"
                      aria-level={2}
                    >
                      Drag and drop an image here
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Or use the command bar above to open your image
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Processed locally in your browser. No server upload. No
                    account.
                  </p>
                  <p className="text-muted-foreground text-xs">
                    PNG, JPEG, or WebP up to 25 MB.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        <aside
          aria-label="Image editor layer controls"
          className="hidden flex-shrink-0 lg:block"
        >
          <LayersPanel
            hasImage={Boolean(source)}
            className="h-full"
            elements={state.elements}
            selectedId={state.selectedId}
            onSelect={select}
            onDelete={(id) => dispatch({ type: "DELETE_ELEMENT", id })}
            onReorder={(id, direction) =>
              dispatch({ type: "REORDER_ELEMENT", id, direction })
            }
          />
        </aside>
      </div>

      <Sheet open={layersOpen} onOpenChange={setLayersOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Layers</SheetTitle>
          </SheetHeader>
          <LayersPanel
            hasImage={Boolean(source)}
            elements={state.elements}
            selectedId={state.selectedId}
            onSelect={select}
            onDelete={(id) => dispatch({ type: "DELETE_ELEMENT", id })}
            onReorder={(id, direction) =>
              dispatch({ type: "REORDER_ELEMENT", id, direction })
            }
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
