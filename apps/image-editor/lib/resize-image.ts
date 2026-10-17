import { RESIZE_TARGET_MIN_BYTES } from "./resize-constants";

/** Options for {@link compressImageToTargetSize}. */
export interface CompressToTargetOptions {
  /** Desired maximum output size in bytes. */
  readonly targetSize: number;
  /** Longest edge of the source composite; used as a no-upscale cap. */
  readonly maxWidthOrHeight: number;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: number) => void;
}

/** Result of a successful resize/compress pass. */
export interface CompressToTargetResult {
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
}

/** Clamps a slider target to [floor, currentBytes] (never above current). */
export function clampResizeTargetBytes(
  targetBytes: number,
  currentBytes: number
): number {
  const max = Math.max(1, Math.round(currentBytes));
  const min = Math.min(RESIZE_TARGET_MIN_BYTES, max);
  return Math.min(max, Math.max(min, Math.round(targetBytes)));
}

/** Reads natural pixel size from a blob via createImageBitmap / Image. */
async function readBlobDimensions(
  blob: Blob,
  signal?: AbortSignal
): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    try {
      signal?.throwIfAborted();
      return { width: bitmap.width, height: bitmap.height };
    } finally {
      bitmap.close();
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      const onAbort = () => {
        cleanup();
        reject(new DOMException("Aborted", "AbortError"));
      };
      const cleanup = () => {
        img.onload = null;
        img.onerror = null;
        signal?.removeEventListener("abort", onAbort);
      };
      img.onload = () => {
        cleanup();
        resolve(img);
      };
      img.onerror = () => {
        cleanup();
        reject(new Error("Failed to decode image dimensions"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      img.src = objectUrl;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Compresses a composite image blob toward a target file size (JPEG only).
 * Never upscales: longest edge is capped at the source max edge.
 * If the input is already under the target, returns it unchanged (re-typed as JPEG only when needed).
 */
export async function compressImageToTargetSize(
  source: Blob,
  options: CompressToTargetOptions
): Promise<CompressToTargetResult> {
  const targetSize = Math.max(1, Math.round(options.targetSize));
  const maxEdge = Math.max(1, Math.round(options.maxWidthOrHeight));

  if (source.size <= targetSize && source.type === "image/jpeg") {
    const dimensions = await readBlobDimensions(source, options.signal);
    return { blob: source, ...dimensions };
  }

  const { fromBlob } = await import("image-resize-compress");
  const blob = await fromBlob(source, {
    format: "jpeg",
    targetSize,
    maxWidthOrHeight: maxEdge,
    worker: true,
    signal: options.signal,
    onProgress: options.onProgress,
    backgroundColor: "#ffffff",
  });

  options.signal?.throwIfAborted();

  // Prefer the smaller of input vs output when targeting below current size.
  const output =
    blob.size > source.size && source.type === "image/jpeg" ? source : blob;
  const dimensions = await readBlobDimensions(output, options.signal);
  return { blob: output, ...dimensions };
}
