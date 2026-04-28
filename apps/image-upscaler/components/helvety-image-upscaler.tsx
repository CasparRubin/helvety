"use client";

import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Download, Upload, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ImageUpscalerCommandBar } from "@/components/image-upscaler-command-bar";
import { useDragDrop } from "@/hooks/use-drag-drop";
import {
  calculateTargetSize,
  createDownloadName,
  IMAGE_FILE_SIZE_LIMIT_BYTES,
  MAX_BULK_FILES,
  MAX_IMAGE_PIXELS,
  parseImageFiles,
  type SizeMode,
  type UpscaleItem,
  upscaleItemsSequentially,
} from "@/lib/upscale-pipeline";

/* eslint-disable @next/next/no-img-element */

/**
 * Main Image Upscaler component.
 */
export function HelvetyImageUpscaler(): React.JSX.Element {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragDrop = useDragDrop();
  const [items, setItems] = React.useState<UpscaleItem[]>([]);
  const [sizeMode, setSizeMode] = React.useState<SizeMode>("scale");
  const [scale, setScale] = React.useState<2 | 4>(2);
  const [targetMode, setTargetMode] = React.useState<"width" | "height">(
    "width"
  );
  const [targetInput, setTargetInput] = React.useState<string>("2048");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [runtime, setRuntime] = React.useState<string | null>(null);

  const addFiles = React.useCallback((fileList: FileList): void => {
    const parsed = parseImageFiles(fileList);
    parsed.errors.forEach((message) => toast.error(message));
    if (parsed.items.length === 0) return;

    setItems((current) => {
      const availableSlots = Math.max(0, MAX_BULK_FILES - current.length);
      const accepted = parsed.items.slice(0, availableSlots);
      if (parsed.items.length > availableSlots) {
        toast.error(`Maximum ${MAX_BULK_FILES} files per batch.`);
      }
      return [...current, ...accepted];
    });
  }, []);

  const handleFileInput = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (event.target.files) {
        addFiles(event.target.files);
      }
      event.currentTarget.value = "";
    },
    [addFiles]
  );

  const handleDropWithFiles = React.useCallback(
    (files: FileList): void => {
      addFiles(files);
    },
    [addFiles]
  );

  const removeItem = React.useCallback((id: string): void => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clearAll = React.useCallback((): void => {
    setItems((current) => {
      current.forEach((item) => {
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      });
      return [];
    });
  }, []);

  const runUpscale = React.useCallback(async (): Promise<void> => {
    if (items.length === 0) return;
    const target = Number(targetInput);
    if (
      sizeMode === "target" &&
      (!Number.isInteger(target) || !Number.isFinite(target) || target <= 0)
    ) {
      toast.error("Target value must be a positive whole number.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await upscaleItemsSequentially({
        items,
        sizeMode,
        scale,
        targetMode,
        targetValue: target,
        onProgress: (id, partial) => {
          setItems((current) =>
            current.map((item) =>
              item.id === id ? { ...item, ...partial } : item
            )
          );
        },
      });
      setRuntime(result.runtime);
      if (result.failedCount === 0) {
        toast.success(
          `Upscaling complete (${result.completedCount}/${result.totalCount} images).`
        );
      } else if (result.completedCount === 0) {
        toast.error(`Upscaling failed for all ${result.totalCount} images.`);
      } else {
        toast.warning(
          `Upscaling finished with errors (${result.completedCount} succeeded, ${result.failedCount} failed).`
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upscale."
      );
    } finally {
      setIsProcessing(false);
    }
  }, [items, scale, sizeMode, targetInput, targetMode]);

  const downloadItem = React.useCallback((item: UpscaleItem): void => {
    if (!item.outputUrl) return;
    const anchor = document.createElement("a");
    anchor.href = item.outputUrl;
    anchor.download = createDownloadName(item.file.name);
    anchor.click();
  }, []);

  const downloadAll = React.useCallback((): void => {
    items.forEach((item) => {
      if (item.outputUrl) {
        downloadItem(item);
      }
    });
  }, [downloadItem, items]);

  const hasOutput = items.some((item) => item.outputUrl);

  return (
    <div className="flex h-full flex-col">
      <ImageUpscalerCommandBar
        hasItems={items.length > 0}
        hasOutput={hasOutput}
        isProcessing={isProcessing}
        runtime={runtime}
        sizeMode={sizeMode}
        scale={scale}
        targetMode={targetMode}
        targetInput={targetInput}
        onAddImages={() => fileInputRef.current?.click()}
        onUpscale={() => void runUpscale()}
        onDownloadAll={downloadAll}
        onClearAll={clearAll}
        onSizeModeChange={setSizeMode}
        onScaleChange={setScale}
        onTargetModeChange={setTargetMode}
        onTargetInputChange={setTargetInput}
      />

      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden py-4",
          "flex flex-col gap-4 lg:flex-row"
        )}
        onDragEnter={dragDrop.handleDragEnter}
        onDragOver={dragDrop.handleDragOver}
        onDragLeave={dragDrop.handleDragLeave}
        onDrop={(e) => dragDrop.handleDrop(e, handleDropWithFiles)}
        role="region"
        aria-label="Image upscaler workspace"
      >
        <div
          className={cn(
            "relative flex h-full max-h-full min-h-0 w-full flex-1 flex-col"
          )}
        >
          <div
            className={cn(
              "bg-muted/30 border-border/50 flex min-h-0 flex-1 flex-col overflow-y-auto border p-6"
            )}
          >
            <section
              className={cn(
                "relative min-h-full w-full transition-colors",
                dragDrop.isDragging
                  ? "border-primary bg-primary/5 border-2 border-dashed"
                  : items.length === 0
                    ? "border-border cursor-pointer border-2 border-dashed"
                    : "border-0"
              )}
              role={items.length === 0 ? "button" : undefined}
              tabIndex={items.length === 0 ? 0 : undefined}
              onClick={() =>
                items.length === 0 && fileInputRef.current?.click()
              }
              aria-label={
                items.length === 0
                  ? "File drop zone. Click to select images."
                  : "File drop zone"
              }
            >
              {items.length === 0 && (
                <div
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center gap-4 p-12"
                  )}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload
                      className="text-muted-foreground h-12 w-12"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        Drag and drop images here
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Processed locally in your browser. No server upload. No
                        account.
                      </p>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      Limits: up to {MAX_BULK_FILES} files,{" "}
                      {(IMAGE_FILE_SIZE_LIMIT_BYTES / (1024 * 1024)).toFixed(0)}
                      MB each, {MAX_IMAGE_PIXELS.toLocaleString()} pixels max.
                    </p>
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((item) => {
                    const target = calculateTargetSize(item, {
                      sizeMode,
                      scale,
                      targetMode,
                      targetValue: Number.parseInt(targetInput, 10) || 0,
                    });
                    return (
                      <article
                        key={item.id}
                        className="bg-card rounded-lg border p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {item.file.name}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {item.width}x{item.height} → {target.width}x
                              {target.height}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="bg-muted mb-2 flex aspect-video items-center justify-center overflow-hidden rounded-md">
                          <img
                            src={item.outputUrl ?? item.previewUrl}
                            alt={item.file.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {item.status}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!item.outputUrl}
                            onClick={() => downloadItem(item)}
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                        {item.error && (
                          <p className="mt-2 text-xs text-red-500">
                            {item.error}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleFileInput}
                className="hidden"
                aria-label="Upload images"
              />
            </section>
          </div>
        </div>

        <aside
          aria-label="Image upscaler controls"
          className="hidden w-[320px] flex-shrink-0 lg:block"
        >
          <div className="bg-card space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <select
                value={sizeMode}
                onChange={(event) =>
                  setSizeMode(event.target.value as SizeMode)
                }
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="scale">Scale</option>
                <option value="target">Target dimension</option>
              </select>
            </div>
            {sizeMode === "scale" ? (
              <div className="space-y-2">
                <Label>Scale</Label>
                <select
                  value={String(scale)}
                  onChange={(event) =>
                    setScale(event.target.value === "4" ? 4 : 2)
                  }
                  className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <option value="2">2x</option>
                  <option value="4">4x</option>
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Dimension</Label>
                  <select
                    value={targetMode}
                    onChange={(event) =>
                      setTargetMode(event.target.value as "width" | "height")
                    }
                    className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <option value="width">Width</option>
                    <option value="height">Height</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Target value</Label>
                  <Input
                    value={targetInput}
                    onChange={(event) => setTargetInput(event.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </>
            )}
            <p className="text-muted-foreground text-xs">
              WebGPU-first runtime with safe fallback. Bulk runs sequentially
              for memory stability.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
