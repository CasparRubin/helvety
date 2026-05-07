/**
 * Browser cache for ONNX upscale model weights.
 *
 * - First load: streams the main `.onnx` file (and any external-data `.data`
 *   sidecars referenced via `UpscaleModel.externalData`) from the public
 *   Supabase Storage bucket declared in `lib/models.ts`, reports progress,
 *   optionally verifies SHA-256, and stores each response in the Cache API
 *   under {@link MODEL_CACHE_NAME}.
 * - Subsequent loads: served straight from the cache. Survives reloads and
 *   works offline once cached.
 *
 * Object keys in the bucket mirror upstream filenames verbatim (see
 * `public/models/README.md`) so paths referenced inside the `.onnx` protobuf —
 * e.g. `real_esrgan_general_x4v3.data` — resolve correctly when ORT loads the
 * external initializers.
 *
 * Designed to run inside a DedicatedWorker (where `caches` is exposed in all
 * supported browsers). Falls back to a plain fetch when the Cache API is not
 * available.
 */

export const MODEL_CACHE_NAME = "upscale-models-v1";

/**
 * Streaming download progress for a single asset (main `.onnx` or sidecar).
 * `total` is `null` when the response did not advertise a content-length.
 */
export interface ModelLoadProgress {
  readonly modelId: string;
  readonly received: number;
  readonly total: number | null;
}

/**
 * External-data sidecar bytes for a single referenced file.
 *
 * The `path` is the location string baked into the `.onnx` protobuf and is
 * what onnxruntime-web matches against when resolving external initializers
 * (see `OnnxModelOptions.externalData`).
 */
export interface ExternalDataLoadResult {
  readonly path: string;
  readonly bytes: Uint8Array;
}

/** Resolved bytes for a model and its sidecars, ready for ORT session creation. */
export interface ModelLoadResult {
  /**
   * Raw model bytes ready to hand to `InferenceSession.create`. The
   * `Uint8Array` overload is the preferred shape per the onnxruntime-web
   * docs and avoids an internal ArrayBuffer copy.
   */
  readonly bytes: Uint8Array;
  /**
   * Sidecar weight files for ONNX models stored in the external-data format.
   * Empty for self-contained `.onnx` exports.
   */
  readonly externalData: readonly ExternalDataLoadResult[];
  readonly fromCache: boolean;
}

/** External-data sidecar reference (URL + protobuf path + optional integrity hash). */
interface ExternalDataDescriptor {
  readonly url: string;
  readonly path: string;
  readonly sha256: string | null;
}

/** Internal shape used by {@link getModelBytes} — a subset of `UpscaleModel`. */
interface ModelDescriptor {
  readonly id: string;
  readonly url: string;
  readonly sha256: string | null;
  readonly externalData: readonly ExternalDataDescriptor[] | null;
}

/** Hex-encodes a byte buffer (lower case). */
function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i];
    if (byte === undefined) continue;
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

/**
 * Returns a fresh ArrayBuffer covering exactly the view's bytes. We can't
 * reuse the underlying `bytes.buffer` directly because it may be a slice of a
 * larger backing buffer that contains unrelated data.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

/**
 * Verifies that `bytes` matches `expectedHex` (SHA-256 hex digest) and throws
 * a descriptive error otherwise. No-ops when `crypto.subtle` is unavailable
 * (e.g. legacy webviews); failure modes cannot be tightened in that case.
 */
async function verifySha256(
  bytes: Uint8Array,
  expectedHex: string,
  modelId: string
): Promise<void> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    return;
  }
  const digest = await crypto.subtle.digest("SHA-256", toArrayBuffer(bytes));
  const actual = bytesToHex(new Uint8Array(digest));
  if (actual.toLowerCase() !== expectedHex.toLowerCase()) {
    throw new Error(
      `Model integrity check failed for "${modelId}": expected ${expectedHex}, got ${actual}.`
    );
  }
}

/** Returns cached bytes for `url`, or `null` if absent / Cache API unavailable. */
async function readCacheEntry(url: string): Promise<Uint8Array | null> {
  if (typeof globalThis.caches === "undefined") return null;
  try {
    const cache = await globalThis.caches.open(MODEL_CACHE_NAME);
    const cached = await cache.match(url);
    if (!cached) return null;
    const buffer = await cached.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

/**
 * Stores a freshly downloaded asset under `url`. Best-effort: failures here
 * (storage quota, private mode, etc.) are swallowed so they don't break the
 * current inference run.
 */
async function writeCacheEntry(url: string, bytes: Uint8Array): Promise<void> {
  if (typeof globalThis.caches === "undefined") return;
  try {
    const cache = await globalThis.caches.open(MODEL_CACHE_NAME);
    await cache.put(
      url,
      new Response(toArrayBuffer(bytes), {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      })
    );
  } catch {
    // Cache writes are best-effort; failures shouldn't block inference.
  }
}

/**
 * Fetches `url` as a single contiguous `Uint8Array`, streaming the body and
 * forwarding progress to `onProgress` whenever a chunk arrives. Throws with a
 * descriptive message when the response is not OK so the caller can surface
 * something better than the default `Failed to fetch`.
 */
async function streamFetch(
  url: string,
  modelId: string,
  onProgress?: (progress: ModelLoadProgress) => void
): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download model "${modelId}" (HTTP ${response.status} ${response.statusText}).`
    );
  }

  const contentLengthHeader = response.headers.get("content-length");
  const total =
    contentLengthHeader && Number.isFinite(Number(contentLengthHeader))
      ? Number(contentLengthHeader)
      : null;

  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onProgress?.({
      modelId,
      received: buffer.byteLength,
      total: total ?? buffer.byteLength,
    });
    return new Uint8Array(buffer);
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.byteLength;
    onProgress?.({ modelId, received, total });
  }

  const merged = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged;
}

/**
 * Loads bytes for a single asset (the main `.onnx` file or one of its
 * external-data sidecars). Reports progress under the given `modelId`
 * regardless of which asset is being fetched, so the UI can display a single
 * combined progress bar.
 */
async function loadAsset(
  url: string,
  modelId: string,
  expectedSha256: string | null,
  onProgress?: (progress: ModelLoadProgress) => void
): Promise<{ bytes: Uint8Array; fromCache: boolean }> {
  const cached = await readCacheEntry(url);
  if (cached) {
    onProgress?.({
      modelId,
      received: cached.byteLength,
      total: cached.byteLength,
    });
    return { bytes: cached, fromCache: true };
  }

  const downloaded = await streamFetch(url, modelId, onProgress);

  if (expectedSha256) {
    await verifySha256(downloaded, expectedSha256, modelId);
  }

  await writeCacheEntry(url, downloaded);

  return { bytes: downloaded, fromCache: false };
}

/**
 * Returns the model bytes (and any external-data sidecars), transparently
 * using the Cache API and reporting download progress.
 */
export async function getModelBytes(
  model: ModelDescriptor,
  onProgress?: (progress: ModelLoadProgress) => void
): Promise<ModelLoadResult> {
  const main = await loadAsset(model.url, model.id, model.sha256, onProgress);

  const sidecars: ExternalDataLoadResult[] = [];
  let allFromCache = main.fromCache;
  if (model.externalData && model.externalData.length > 0) {
    for (const sidecar of model.externalData) {
      const entry = await loadAsset(
        sidecar.url,
        model.id,
        sidecar.sha256,
        onProgress
      );
      sidecars.push({ path: sidecar.path, bytes: entry.bytes });
      allFromCache = allFromCache && entry.fromCache;
    }
  }

  return {
    bytes: main.bytes,
    externalData: sidecars,
    fromCache: allFromCache,
  };
}

/** Tests whether a given model is already present in the browser cache. */
export async function isModelCached(url: string): Promise<boolean> {
  if (typeof globalThis.caches === "undefined") return false;
  try {
    const cache = await globalThis.caches.open(MODEL_CACHE_NAME);
    const match = await cache.match(url);
    return Boolean(match);
  } catch {
    return false;
  }
}

/**
 * Removes a single model (and any of its external-data sidecars) from the
 * cache, e.g. when an integrity check fails so the next attempt re-downloads.
 */
export async function evictModel(
  url: string,
  externalDataUrls: readonly string[] = []
): Promise<void> {
  if (typeof globalThis.caches === "undefined") return;
  try {
    const cache = await globalThis.caches.open(MODEL_CACHE_NAME);
    await Promise.all(
      [url, ...externalDataUrls].map((entryUrl) =>
        cache.delete(entryUrl).catch(() => undefined)
      )
    );
  } catch {
    // Ignore.
  }
}
