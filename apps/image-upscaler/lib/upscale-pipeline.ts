"use client";

import { GENERIC_USER_ERROR } from "@helvety/shared/user-facing-errors";

import {
  clampOutputDimensions,
  getCanvasExportLimitsCached,
  type CanvasExportLimits,
} from "@/lib/canvas-export-limits";
import { getModelById, type UpscaleModelId } from "@/lib/models";
import { UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE } from "@/lib/upscale-export-limit-message";
import {
  createUpscaleWorkerClient,
  type ModelDownloadProgress,
} from "@/lib/upscale-worker-client";

function normalizeUpscaleWorkerError(error: unknown): string {
  if (error instanceof DOMException && error.name === "InvalidStateError") {
    return UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE;
  }
  if (error instanceof Error) {
    if (/invalid state/i.test(error.message)) {
      return UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE;
    }
    return error.message;
  }
  return GENERIC_USER_ERROR;
}

export const MAX_BULK_FILES = 5;
export const IMAGE_FILE_SIZE_LIMIT_BYTES = 25 * 1024 * 1024;
/**
 * Hard upper bound shown in the dropzone hint. The active engine is decided
 * automatically (AI when WebAssembly is available, canvas otherwise), and
 * each engine has its own stricter `UpscaleModel.maxInputPixels`. We advertise
 * this most-permissive ceiling because images that exceed even the canvas
 * fallback's cap will fail upfront, regardless of engine.
 */
export const MAX_IMAGE_PIXELS = 32_000_000;

export type SizeMode = "scale" | "target";
export type UpscaleStatus = "queued" | "processing" | "done" | "failed";

export interface UpscaleItem {
  id: string;
  file: File;
  previewUrl: string;
  outputUrl: string | null;
  outputSignature: string | null;
  width: number;
  height: number;
  status: UpscaleStatus;
  error: string | null;
  /** Last successful export pixel size (after browser canvas limits); null if none or cleared. */
  exportDimensions: { width: number; height: number } | null;
}

/** Fired when output dimensions are reduced to fit the browser canvas limit. */
export interface OutputClampedPayload {
  fileName: string;
  requested: { width: number; height: number };
  applied: { width: number; height: number };
}

export type { CanvasExportLimits };

interface ParsedFiles {
  items: UpscaleItem[];
  errors: string[];
}

interface TargetOptions {
  sizeMode: SizeMode;
  scale: 2 | 4;
  targetMode: "width" | "height";
  targetValue: number;
}

export function createDownloadName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex > -1 ? name.slice(0, dotIndex) : name;
  return `${base}-upscaled.png`;
}

function isSupportedImage(file: File): boolean {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
}

function roundEven(value: number): number {
  const rounded = Math.max(1, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

export function calculateTargetSize(
  item: UpscaleItem,
  options: TargetOptions
): {
  width: number;
  height: number;
} {
  if (options.sizeMode === "scale") {
    return {
      width: roundEven(item.width * options.scale),
      height: roundEven(item.height * options.scale),
    };
  }

  if (options.targetMode === "width") {
    const width = roundEven(options.targetValue);
    const height = roundEven((item.height * width) / item.width);
    return { width, height };
  }

  const height = roundEven(options.targetValue);
  const width = roundEven((item.width * height) / item.height);
  return { width, height };
}

export function readImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to decode "${file.name}".`));
    };
    img.src = url;
  });
}

export function parseImageFilesSync(files: FileList): {
  accepted: File[];
  errors: string[];
} {
  const errors: string[] = [];
  const accepted: File[] = [];
  const unique = new Set<string>();

  for (const file of Array.from(files)) {
    const dedupeKey = `${file.name}:${file.size}:${file.lastModified}`;
    if (unique.has(dedupeKey)) continue;
    unique.add(dedupeKey);

    if (!isSupportedImage(file)) {
      errors.push(`"${file.name}" is not supported. Use PNG, JPG, or WebP.`);
      continue;
    }
    if (file.size > IMAGE_FILE_SIZE_LIMIT_BYTES) {
      errors.push(
        `"${file.name}" exceeds ${(IMAGE_FILE_SIZE_LIMIT_BYTES / (1024 * 1024)).toFixed(0)}MB.`
      );
      continue;
    }
    accepted.push(file);
  }

  return { accepted, errors };
}

export function parseImageFiles(files: FileList): ParsedFiles {
  const { accepted, errors } = parseImageFilesSync(files);
  const items = accepted.map((file) => ({
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
    outputUrl: null,
    outputSignature: null,
    width: 0,
    height: 0,
    status: "queued" as const,
    error: null,
    exportDimensions: null,
  }));
  return { items, errors };
}

export async function upscaleItemsSequentially(options: {
  items: UpscaleItem[];
  sizeMode: SizeMode;
  scale: 2 | 4;
  targetMode: "width" | "height";
  targetValue: number;
  modelId: UpscaleModelId;
  onProgress: (id: string, patch: Partial<UpscaleItem>) => void;
  onOutputClamped?: (payload: OutputClampedPayload) => void;
  onModelDownloadProgress?: (progress: ModelDownloadProgress) => void;
  /** Vitest: skip canvas-size probe and use fixed limits. */
  canvasLimitsOverride?: CanvasExportLimits;
  signal?: AbortSignal;
}): Promise<{
  runtime: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
}> {
  if (options.items.length > MAX_BULK_FILES) {
    throw new Error(`You can upscale up to ${MAX_BULK_FILES} files at once.`);
  }

  const worker = createUpscaleWorkerClient();
  let runtime = "wasm-fallback";
  let completedCount = 0;
  let failedCount = 0;

  const limits =
    options.canvasLimitsOverride ?? (await getCanvasExportLimitsCached());
  const model = getModelById(options.modelId);

  const reportProgress = (id: string, patch: Partial<UpscaleItem>): void => {
    if (options.signal?.aborted) return;
    options.onProgress(id, patch);
  };

  try {
    runtime = await worker.getRuntime();
    if (options.signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }
    for (const item of options.items) {
      if (options.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      reportProgress(item.id, {
        status: "processing",
        error: null,
        exportDimensions: null,
      });
      try {
        const dimensions =
          item.width > 0 && item.height > 0
            ? { width: item.width, height: item.height }
            : await readImageDimensions(item.file);

        const inputPixels = dimensions.width * dimensions.height;
        if (inputPixels > model.maxInputPixels) {
          // Engine selection is automatic (no user-facing picker), so the only
          // actionable advice is to provide a smaller image.
          throw new Error(
            `"${item.file.name}" exceeds ${model.maxInputPixels.toLocaleString()} pixels. Try a smaller image.`
          );
        }

        reportProgress(item.id, {
          width: dimensions.width,
          height: dimensions.height,
        });

        const target = calculateTargetSize(
          { ...item, ...dimensions },
          {
            sizeMode: options.sizeMode,
            scale: options.scale,
            targetMode: options.targetMode,
            targetValue: options.targetValue,
          }
        );

        const requested = { width: target.width, height: target.height };
        const { width, height, clamped } = clampOutputDimensions(
          target.width,
          target.height,
          limits
        );
        if (clamped && options.onOutputClamped) {
          options.onOutputClamped({
            fileName: item.file.name,
            requested,
            applied: { width, height },
          });
        }

        const output = await worker.upscale({
          file: item.file,
          width,
          height,
          modelId: options.modelId,
          onModelDownloadProgress: options.onModelDownloadProgress,
        });

        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
        reportProgress(item.id, {
          status: "done",
          outputUrl: output.outputUrl,
          error: null,
          exportDimensions: { width, height },
        });
        completedCount += 1;
      } catch (error) {
        reportProgress(item.id, {
          status: "failed",
          error: normalizeUpscaleWorkerError(error),
          exportDimensions: null,
        });
        failedCount += 1;
      }
    }
  } finally {
    worker.dispose();
  }

  return {
    runtime,
    totalCount: options.items.length,
    completedCount,
    failedCount,
  };
}
