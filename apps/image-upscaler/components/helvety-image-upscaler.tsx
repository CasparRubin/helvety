"use client";

import { useDragDrop } from "@helvety/shared/hooks/use-drag-drop";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { Input } from "@helvety/ui/input";
import { Label } from "@helvety/ui/label";
import { Download, Upload, X } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { ImageUpscalerCommandBar } from "@/components/image-upscaler-command-bar";
import {
  getDefaultEngineForRuntime,
  getModelById,
  MIN_ONNX_INPUT_PIXELS,
  type UpscaleModelId,
} from "@/lib/models";
import {
  calculateTargetSize,
  createDownloadName,
  IMAGE_FILE_SIZE_LIMIT_BYTES,
  MAX_BULK_FILES,
  MAX_IMAGE_PIXELS,
  parseImageFiles,
  readImageDimensions,
  type SizeMode,
  type UpscaleItem,
  upscaleItemsSequentially,
} from "@/lib/upscale-pipeline";

const MODEL_DOWNLOAD_TOAST_ID = "image-upscaler-model-download";

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
  const [modelId] = React.useState<UpscaleModelId>(getDefaultEngineForRuntime);
  const itemsRef = React.useRef<UpscaleItem[]>([]);

  const targetValue = Number.parseInt(targetInput, 10) || 0;
  const targetIsValid =
    sizeMode !== "target" ||
    (Number.isInteger(targetValue) &&
      Number.isFinite(targetValue) &&
      targetValue > 0);
  const activeOutputSignature =
    sizeMode === "scale"
      ? `scale:${scale}:${modelId}`
      : `target:${targetMode}:${targetIsValid ? targetValue : "invalid"}:${modelId}`;
  const activeModel = getModelById(modelId);
  const isCanvasFallback = activeModel.kind === "canvas";

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addFiles = React.useCallback((fileList: FileList): void => {
    const parsed = parseImageFiles(fileList);
    parsed.errors.forEach((message) => toast.error(message));
    if (parsed.items.length === 0) return;

    void (async () => {
      const hydrated = await Promise.all(
        parsed.items.map(async (item) => {
          try {
            const dimensions = await readImageDimensions(item.file);
            return { item: { ...item, ...dimensions }, error: null };
          } catch (error) {
            return {
              item: null,
              error:
                error instanceof Error
                  ? error.message
                  : `Failed to decode "${item.file.name}".`,
            };
          }
        })
      );

      hydrated.forEach((result) => {
        if (result.error) toast.error(result.error);
      });

      const decodedItems = hydrated
        .map((result) => result.item)
        .filter((item): item is UpscaleItem => item !== null);

      if (decodedItems.length === 0) return;

      setItems((current) => {
        const availableSlots = Math.max(0, MAX_BULK_FILES - current.length);
        const accepted = decodedItems.slice(0, availableSlots);
        if (decodedItems.length > availableSlots) {
          toast.error(`Maximum ${MAX_BULK_FILES} files per batch.`);
        }
        return [...current, ...accepted];
      });
    })();
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
    setItems((current) => {
      const removed = current.find((item) => item.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        if (removed.outputUrl) {
          URL.revokeObjectURL(removed.outputUrl);
        }
      }
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const clearAll = React.useCallback((): void => {
    setItems((current) => {
      current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      });
      return [];
    });
  }, []);

  React.useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      });
    };
  }, []);

  const runUpscaleForIds = React.useCallback(
    async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;
      if (!targetIsValid) {
        toast.error("Target value must be a positive whole number.");
        return;
      }

      const idSet = new Set(ids);
      const selectedItems = items.filter((item) => idSet.has(item.id));
      if (selectedItems.length === 0) return;

      setIsProcessing(true);
      try {
        const result = await upscaleItemsSequentially({
          items: selectedItems,
          sizeMode,
          scale,
          targetMode,
          targetValue,
          modelId,
          onProgress: (id, partial) => {
            setItems((current) =>
              current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      ...partial,
                      outputSignature:
                        partial.status === "done"
                          ? activeOutputSignature
                          : item.outputSignature,
                    }
                  : item
              )
            );
          },
          onOutputClamped: (payload) => {
            toast.info("Output size limited by your browser", {
              description: `${payload.fileName}: ${payload.requested.width}×${payload.requested.height} → ${payload.applied.width}×${payload.applied.height}.`,
            });
          },
          onModelDownloadProgress: (progress) => {
            if (activeModel.kind !== "onnx") return;
            const total = progress.total ?? activeModel.sizeMb * 1024 * 1024;
            const percent =
              total > 0
                ? Math.min(100, Math.round((progress.received / total) * 100))
                : 0;
            const description =
              progress.received >= total && total > 0
                ? "Preparing model..."
                : `${percent}% (${(progress.received / (1024 * 1024)).toFixed(1)} / ${(total / (1024 * 1024)).toFixed(0)} MB)`;
            toast.loading(`Downloading ${activeModel.label} model`, {
              id: MODEL_DOWNLOAD_TOAST_ID,
              description,
            });
            if (progress.received >= total && total > 0) {
              toast.dismiss(MODEL_DOWNLOAD_TOAST_ID);
            }
          },
        });
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
    },
    [
      activeOutputSignature,
      activeModel,
      items,
      modelId,
      scale,
      sizeMode,
      targetIsValid,
      targetMode,
      targetValue,
    ]
  );

  const runUpscale = React.useCallback(async (): Promise<void> => {
    if (items.length === 0) return;
    if (!targetIsValid) {
      toast.error("Target value must be a positive whole number.");
      return;
    }
    await runUpscaleForIds(items.map((item) => item.id));
  }, [items, runUpscaleForIds, targetIsValid]);

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

      {isCanvasFallback && (
        <div
          className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <p className="font-medium">
            Your browser is missing out on AI upscaling.
          </p>
          <p className="mt-1">
            WebAssembly is unavailable here, so Helvety is using a basic
            high-quality resize fallback instead of the Real-ESRGAN AI model.
          </p>
        </div>
      )}

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
                      MB each, {MAX_IMAGE_PIXELS.toLocaleString("en-US")} pixels
                      max. AI upscaling additionally caps at{" "}
                      {MIN_ONNX_INPUT_PIXELS.toLocaleString("en-US")} pixels per
                      image.
                    </p>
                  </div>
                </div>
              )}

              {items.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {items.map((item) => {
                    const hasDimensions = item.width > 0 && item.height > 0;
                    const hasFreshOutput =
                      !!item.outputUrl &&
                      item.outputSignature === activeOutputSignature;
                    const target = hasDimensions
                      ? calculateTargetSize(item, {
                          sizeMode,
                          scale,
                          targetMode,
                          targetValue: Number.parseInt(targetInput, 10) || 0,
                        })
                      : null;
                    const dimensionSummary = (() => {
                      if (!hasDimensions) {
                        return "Reading image dimensions...";
                      }
                      if (
                        item.exportDimensions &&
                        item.status === "done" &&
                        hasFreshOutput
                      ) {
                        return `${item.width}×${item.height} → ${item.exportDimensions.width}×${item.exportDimensions.height}`;
                      }
                      if (target) {
                        return `${item.width}×${item.height} → ${target.width}×${target.height}`;
                      }
                      return "Reading image dimensions...";
                    })();
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
                              {dimensionSummary}
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
                            src={
                              hasFreshOutput && item.outputUrl
                                ? item.outputUrl
                                : item.previewUrl
                            }
                            alt={item.file.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "text-xs",
                              item.status === "processing" && "text-blue-600",
                              item.status === "done" &&
                                hasFreshOutput &&
                                "text-emerald-600",
                              item.status !== "processing" &&
                                !(item.status === "done" && hasFreshOutput) &&
                                "invisible"
                            )}
                          >
                            {item.status === "processing"
                              ? "Processing"
                              : item.status === "done" && hasFreshOutput
                                ? "Done"
                                : "Status"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                            onClick={() => {
                              if (hasFreshOutput) {
                                downloadItem(item);
                                return;
                              }
                              void runUpscaleForIds([item.id]);
                            }}
                          >
                            {hasFreshOutput ? (
                              <>
                                <Download className="h-4 w-4" />
                                Download
                              </>
                            ) : (
                              <>Upscale</>
                            )}
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
              <Label htmlFor="desktop-upscale-mode">Mode</Label>
              <select
                id="desktop-upscale-mode"
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
                <Label htmlFor="desktop-upscale-scale">Scale</Label>
                <select
                  id="desktop-upscale-scale"
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
                  <Label htmlFor="desktop-upscale-dimension">Dimension</Label>
                  <select
                    id="desktop-upscale-dimension"
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
                  <Label htmlFor="desktop-upscale-target">Target value</Label>
                  <Input
                    id="desktop-upscale-target"
                    value={targetInput}
                    onChange={(event) => setTargetInput(event.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
