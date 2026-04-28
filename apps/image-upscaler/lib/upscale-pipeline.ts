"use client";
/* eslint-disable jsdoc/require-jsdoc */

import { createUpscaleWorkerClient } from "@/lib/upscale-worker-client";

export const MAX_BULK_FILES = 5;
export const IMAGE_FILE_SIZE_LIMIT_BYTES = 25 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 32_000_000;

export type SizeMode = "scale" | "target";
export type UpscaleStatus = "queued" | "processing" | "done" | "failed";

export interface UpscaleItem {
  id: string;
  file: File;
  previewUrl: string;
  outputUrl: string | null;
  width: number;
  height: number;
  status: UpscaleStatus;
  error: string | null;
}

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

function loadImageDimensions(
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
    width: 0,
    height: 0,
    status: "queued" as const,
    error: null,
  }));
  return { items, errors };
}

export async function upscaleItemsSequentially(options: {
  items: UpscaleItem[];
  sizeMode: SizeMode;
  scale: 2 | 4;
  targetMode: "width" | "height";
  targetValue: number;
  onProgress: (id: string, patch: Partial<UpscaleItem>) => void;
}): Promise<{ runtime: string }> {
  const worker = createUpscaleWorkerClient();
  let runtime = "wasm-fallback";

  try {
    runtime = await worker.getRuntime();
    for (const item of options.items) {
      options.onProgress(item.id, { status: "processing", error: null });
      try {
        const dimensions =
          item.width > 0 && item.height > 0
            ? { width: item.width, height: item.height }
            : await loadImageDimensions(item.file);

        if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) {
          throw new Error(
            `"${item.file.name}" exceeds ${MAX_IMAGE_PIXELS.toLocaleString()} pixels.`
          );
        }

        options.onProgress(item.id, {
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

        const output = await worker.upscale({
          file: item.file,
          width: target.width,
          height: target.height,
        });

        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
        options.onProgress(item.id, {
          status: "done",
          outputUrl: output.outputUrl,
          error: null,
        });
      } catch (error) {
        options.onProgress(item.id, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unexpected error",
        });
      }
    }
  } finally {
    worker.dispose();
  }

  return { runtime };
}
