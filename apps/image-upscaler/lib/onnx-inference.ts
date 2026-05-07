/**
 * Tiled ONNX inference for upscale models.
 *
 * Workflow:
 *   1. Load the model bytes (Cache API or network) and create an ORT session.
 *   2. Derive effective tile geometry from {@link OnnxTileConfig} plus model
 *      input metadata (fixed-shape models may clamp configured tile size).
 *   3. Walk the source image in those effective tiles with a per-side overlap
 *      of {@link OnnxTileConfig.overlap} pixels.
 *   4. For each tile, edge-replicate to a multiple of `padMultiple` and run the
 *      model (NCHW float32 in [0, 1]).
 *   5. Stitch outputs with a separable linear-blend weight in the overlap band
 *      to remove tile seams.
 *   6. If the requested target dimensions differ from the model's native
 *      output size (typically 4× the input), down/up-scale to target using
 *      a high-quality canvas resample as a final step.
 *
 * Designed to run inside a DedicatedWorker.
 */

/* eslint-disable jsdoc/require-jsdoc */

import * as ort from "onnxruntime-web";

import {
  evictModel,
  getModelBytes,
  type ExternalDataLoadResult,
  type ModelLoadProgress,
} from "@/lib/model-cache";

import type { UpscaleModel } from "@/lib/models";

const sessionCache = new Map<string, ort.InferenceSession>();

interface OnnxModel extends UpscaleModel {
  readonly kind: "onnx";
  readonly url: string;
  readonly tile: NonNullable<UpscaleModel["tile"]>;
  readonly scale: 2 | 4;
}

function assertOnnxModel(model: UpscaleModel): asserts model is OnnxModel {
  if (model.kind !== "onnx" || !model.url || !model.tile || !model.scale) {
    throw new Error(`Model "${model.id}" is not an ONNX upscale model.`);
  }
}

function supportsWebGpu(): boolean {
  const nav = navigator as Navigator & { gpu?: unknown };
  return typeof navigator !== "undefined" && typeof nav.gpu !== "undefined";
}

async function createSession(
  bytes: Uint8Array,
  externalData: readonly ExternalDataLoadResult[]
): Promise<ort.InferenceSession> {
  const executionProviders: ort.InferenceSession.SessionOptions["executionProviders"] =
    supportsWebGpu() ? ["webgpu", "wasm"] : ["wasm"];
  // Per onnxruntime-web docs the byte-array overload accepts a Uint8Array and
  // avoids an internal copy that the ArrayBuffer overload performs.
  const sessionOptions: ort.InferenceSession.SessionOptions = {
    executionProviders,
    graphOptimizationLevel: "all",
  };
  if (externalData.length > 0) {
    // ORT matches each entry's `path` against the location string baked into
    // the .onnx protobuf; passing pre-fetched Uint8Array buffers lets us reuse
    // the cached download without a second network round-trip.
    sessionOptions.externalData = externalData.map((entry) => ({
      path: entry.path,
      data: entry.bytes,
    }));
  }
  return await ort.InferenceSession.create(bytes, sessionOptions);
}

/**
 * Returns a cached ORT session for the model, fetching and instantiating on
 * first use. Subsequent calls for the same model id are no-op.
 */
export async function ensureSession(
  model: UpscaleModel,
  onProgress?: (progress: ModelLoadProgress) => void
): Promise<ort.InferenceSession> {
  assertOnnxModel(model);

  const cached = sessionCache.get(model.id);
  if (cached) return cached;

  let bytes: Uint8Array;
  let externalData: readonly ExternalDataLoadResult[] = [];
  try {
    const result = await getModelBytes(
      {
        id: model.id,
        url: model.url,
        sha256: model.sha256,
        externalData: model.externalData,
      },
      onProgress
    );
    bytes = result.bytes;
    externalData = result.externalData;
  } catch (error) {
    // If integrity check fails, evict so the next attempt re-downloads.
    await evictModel(
      model.url,
      (model.externalData ?? []).map((entry) => entry.url)
    );
    throw error;
  }

  const session = await createSession(bytes, externalData);
  sessionCache.set(model.id, session);
  return session;
}

/** Releases all loaded sessions; call from the worker on dispose. */
export async function disposeAllSessions(): Promise<void> {
  const sessions = Array.from(sessionCache.values());
  sessionCache.clear();
  await Promise.all(
    sessions.map((session) => session.release().catch(() => undefined))
  );
}

/**
 * Yields control to the worker event loop so the next macrotask (download
 * progress message, error from a different request, etc.) can run between
 * tile inferences. `setTimeout(0)` is the cross-browser equivalent of the
 * proposed `scheduler.yield()` — `await Promise.resolve()` only runs the
 * microtask queue and wouldn't service `MessagePort` events.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

interface ReadImageDataResult {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

async function readImageDataFromFile(file: File): Promise<ReadImageDataResult> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      throw new Error("2D canvas is not available in this browser.");
    }
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return {
      data: imageData.data,
      width: bitmap.width,
      height: bitmap.height,
    };
  } finally {
    bitmap.close();
  }
}

/**
 * Fill a pre-allocated NCHW float32 tile (RGB in [0, 1]) with edge replication.
 * The buffer is reused across tiles to avoid allocating a fresh
 * `tileSize × tileSize × 3 × 4` block per inference step.
 */
function writeTileTensor(
  out: Float32Array,
  src: ReadImageDataResult,
  tileX: number,
  tileY: number,
  tileW: number,
  tileH: number,
  padW: number,
  padH: number
): void {
  const planeSize = padW * padH;
  const { data, width: srcW, height: srcH } = src;

  for (let py = 0; py < padH; py += 1) {
    const sy = Math.min(srcH - 1, Math.max(0, tileY + Math.min(py, tileH - 1)));
    for (let px = 0; px < padW; px += 1) {
      const sx = Math.min(
        srcW - 1,
        Math.max(0, tileX + Math.min(px, tileW - 1))
      );
      const srcIdx = (sy * srcW + sx) * 4;
      const tileIdx = py * padW + px;
      out[tileIdx] = (data[srcIdx] ?? 0) / 255;
      out[planeSize + tileIdx] = (data[srcIdx + 1] ?? 0) / 255;
      out[2 * planeSize + tileIdx] = (data[srcIdx + 2] ?? 0) / 255;
    }
  }
}

/** Linear ramp weight in [0, 1] at output pixel `p` along an axis of length `len`. */
function blendWeight1D(
  p: number,
  len: number,
  overlapPx: number,
  blendStart: boolean,
  blendEnd: boolean
): number {
  let w = 1;
  if (blendStart && p < overlapPx) {
    w *= Math.max(0, Math.min(1, (p + 0.5) / overlapPx));
  }
  if (blendEnd && p >= len - overlapPx) {
    w *= Math.max(0, Math.min(1, (len - p - 0.5) / overlapPx));
  }
  return w;
}

interface InferTilesResult {
  rgba: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
}

interface SessionInputSpatialShape {
  readonly fixedHeight: number | null;
  readonly fixedWidth: number | null;
}

interface EffectiveTileGeometry {
  readonly tileSize: number;
  readonly stride: number;
}

function normalizePositiveDimension(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  if (value <= 0 || !Number.isInteger(value)) {
    return null;
  }
  return value;
}

function hasTensorShape(
  value: unknown
): value is { isTensor: true; shape: readonly unknown[] } {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as { isTensor?: unknown; shape?: unknown };
  return candidate.isTensor === true && Array.isArray(candidate.shape);
}

/**
 * Derives fixed spatial constraints from the first model input metadata.
 *
 * Many super-resolution ONNX exports keep dynamic H/W, but some ship
 * fixed NCHW dimensions (e.g. 1x3x128x128). We treat configured tile size
 * as a preference and clamp to the model's fixed shape when required.
 */
export function getSessionInputSpatialShape(
  session: ort.InferenceSession
): SessionInputSpatialShape {
  const metadata = session.inputMetadata[0];
  if (!hasTensorShape(metadata)) {
    return { fixedHeight: null, fixedWidth: null };
  }
  const dims = metadata.shape;
  if (dims.length < 4) {
    return { fixedHeight: null, fixedWidth: null };
  }
  return {
    fixedHeight: normalizePositiveDimension(dims[2]),
    fixedWidth: normalizePositiveDimension(dims[3]),
  };
}

export function getEffectiveTileGeometry(
  configuredTileSize: number,
  overlap: number,
  fixedHeight: number | null,
  fixedWidth: number | null
): EffectiveTileGeometry {
  const fixedLimit = Math.min(
    fixedHeight ?? Number.POSITIVE_INFINITY,
    fixedWidth ?? Number.POSITIVE_INFINITY
  );
  const tileSize = Math.max(1, Math.min(configuredTileSize, fixedLimit));
  return {
    tileSize,
    stride: Math.max(1, tileSize - overlap),
  };
}

async function runTiledInference(
  session: ort.InferenceSession,
  src: ReadImageDataResult,
  model: OnnxModel
): Promise<InferTilesResult> {
  const { size: configuredTileSize, overlap, padMultiple } = model.tile;
  const { fixedHeight, fixedWidth } = getSessionInputSpatialShape(session);
  const { tileSize, stride } = getEffectiveTileGeometry(
    configuredTileSize,
    overlap,
    fixedHeight,
    fixedWidth
  );
  const scale = model.scale;

  const dstWidth = src.width * scale;
  const dstHeight = src.height * scale;
  const dstPlane = dstWidth * dstHeight;

  const accR = new Float32Array(dstPlane);
  const accG = new Float32Array(dstPlane);
  const accB = new Float32Array(dstPlane);
  const accW = new Float32Array(dstPlane);

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  if (!inputName || !outputName) {
    throw new Error(
      `Model "${model.id}" exposes no input/output names; cannot run inference.`
    );
  }

  const overlapOut = overlap * scale;

  if (fixedHeight && fixedHeight % padMultiple !== 0) {
    throw new Error(
      `Model "${model.id}" requires fixed input height ${fixedHeight}, which is incompatible with padMultiple=${padMultiple}.`
    );
  }
  if (fixedWidth && fixedWidth % padMultiple !== 0) {
    throw new Error(
      `Model "${model.id}" requires fixed input width ${fixedWidth}, which is incompatible with padMultiple=${padMultiple}.`
    );
  }

  // Pre-allocate the tile input buffer at the maximum possible shape we will
  // feed into ORT for this model/session.
  const maxPadW =
    fixedWidth ??
    Math.max(padMultiple, Math.ceil(tileSize / padMultiple) * padMultiple);
  const maxPadH =
    fixedHeight ??
    Math.max(padMultiple, Math.ceil(tileSize / padMultiple) * padMultiple);
  const tileBuffer = new Float32Array(3 * maxPadW * maxPadH);

  for (let tileY = 0; tileY < src.height; tileY += stride) {
    const tileH = Math.min(tileSize, src.height - tileY);
    const blendTop = tileY > 0;
    const blendBottom = tileY + tileH < src.height;

    for (let tileX = 0; tileX < src.width; tileX += stride) {
      const tileW = Math.min(tileSize, src.width - tileX);
      const blendLeft = tileX > 0;
      const blendRight = tileX + tileW < src.width;

      const dynamicPadW = Math.max(
        padMultiple,
        Math.ceil(tileW / padMultiple) * padMultiple
      );
      const dynamicPadH = Math.max(
        padMultiple,
        Math.ceil(tileH / padMultiple) * padMultiple
      );
      const padW = fixedWidth ?? dynamicPadW;
      const padH = fixedHeight ?? dynamicPadH;
      if (padW < tileW || padH < tileH) {
        throw new Error(
          `Model "${model.id}" fixed input shape ${padH}x${padW} cannot fit source tile ${tileH}x${tileW}.`
        );
      }
      const planeSize = padW * padH;

      // Slice the tail off the reusable buffer and zero-fill it; the writer
      // then fills exactly the planes it owns.
      const tileInput = tileBuffer.subarray(0, 3 * planeSize);
      tileInput.fill(0);
      writeTileTensor(tileInput, src, tileX, tileY, tileW, tileH, padW, padH);

      const inputTensor = new ort.Tensor("float32", tileInput, [
        1,
        3,
        padH,
        padW,
      ]);

      const result = await session.run({ [inputName]: inputTensor });
      const output = result[outputName];
      if (!output || !(output.data instanceof Float32Array)) {
        throw new Error(
          `Model "${model.id}" returned an unsupported output tensor.`
        );
      }
      const outDims = output.dims;
      if (outDims.length !== 4) {
        throw new Error(
          `Model "${model.id}" output must be NCHW; got ${outDims.length}D.`
        );
      }
      const outH = Number(outDims[2]);
      const outW = Number(outDims[3]);
      const outPlane = outH * outW;
      const outData = output.data;

      const usableW = tileW * scale;
      const usableH = tileH * scale;
      const dstX = tileX * scale;
      const dstY = tileY * scale;

      for (let py = 0; py < usableH; py += 1) {
        const dy = dstY + py;
        if (dy >= dstHeight) break;
        const wy = blendWeight1D(
          py,
          usableH,
          overlapOut,
          blendTop,
          blendBottom
        );
        if (wy <= 0) continue;
        const tileRow = py * outW;
        const dstRow = dy * dstWidth;
        for (let px = 0; px < usableW; px += 1) {
          const dx = dstX + px;
          if (dx >= dstWidth) break;
          const wx = blendWeight1D(
            px,
            usableW,
            overlapOut,
            blendLeft,
            blendRight
          );
          const w = wx * wy;
          if (w <= 0) continue;

          const ti = tileRow + px;
          const oi = dstRow + dx;
          accR[oi] = (accR[oi] ?? 0) + (outData[ti] ?? 0) * w;
          accG[oi] = (accG[oi] ?? 0) + (outData[outPlane + ti] ?? 0) * w;
          accB[oi] = (accB[oi] ?? 0) + (outData[2 * outPlane + ti] ?? 0) * w;
          accW[oi] = (accW[oi] ?? 0) + w;
        }
      }

      // Allow the worker to service queued messages (e.g. progress callbacks
      // fired by the cache during a separate download) between heavy tiles.
      await yieldToEventLoop();
    }
  }

  const rgba = new Uint8ClampedArray(new ArrayBuffer(dstPlane * 4));
  for (let i = 0; i < dstPlane; i += 1) {
    const w = accW[i];
    const denom = w && w > 0 ? w : 1;
    rgba[i * 4] = Math.max(
      0,
      Math.min(255, Math.round(((accR[i] ?? 0) / denom) * 255))
    );
    rgba[i * 4 + 1] = Math.max(
      0,
      Math.min(255, Math.round(((accG[i] ?? 0) / denom) * 255))
    );
    rgba[i * 4 + 2] = Math.max(
      0,
      Math.min(255, Math.round(((accB[i] ?? 0) / denom) * 255))
    );
    rgba[i * 4 + 3] = 255;
  }

  return { rgba, width: dstWidth, height: dstHeight };
}

async function rgbaToPngBlob(
  rgba: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  const intermediateCanvas = new OffscreenCanvas(width, height);
  const intermediateCtx = intermediateCanvas.getContext("2d", { alpha: false });
  if (!intermediateCtx) {
    throw new Error("2D canvas is not available in this browser.");
  }
  intermediateCtx.putImageData(new ImageData(rgba, width, height), 0, 0);

  if (width === targetWidth && height === targetHeight) {
    return await intermediateCanvas.convertToBlob({
      type: "image/png",
      quality: 0.95,
    });
  }

  const finalCanvas = new OffscreenCanvas(targetWidth, targetHeight);
  const finalCtx = finalCanvas.getContext("2d", { alpha: false });
  if (!finalCtx) {
    throw new Error("2D canvas is not available in this browser.");
  }
  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = "high";
  finalCtx.drawImage(intermediateCanvas, 0, 0, targetWidth, targetHeight);
  return await finalCanvas.convertToBlob({
    type: "image/png",
    quality: 0.95,
  });
}

export interface OnnxUpscaleOptions {
  readonly file: File;
  readonly model: UpscaleModel;
  readonly targetWidth: number;
  readonly targetHeight: number;
  readonly onProgress?: (progress: ModelLoadProgress) => void;
}

/**
 * Runs an ONNX upscale model on a file and returns a PNG Blob at the requested
 * target dimensions. The model output is downscaled (or, rarely, upscaled) via
 * canvas to match the exact target size when it differs from the native scale.
 */
export async function upscaleWithOnnx(
  options: OnnxUpscaleOptions
): Promise<Blob> {
  assertOnnxModel(options.model);
  const session = await ensureSession(options.model, options.onProgress);
  const src = await readImageDataFromFile(options.file);
  const inferred = await runTiledInference(session, src, options.model);
  return await rgbaToPngBlob(
    inferred.rgba,
    inferred.width,
    inferred.height,
    options.targetWidth,
    options.targetHeight
  );
}
