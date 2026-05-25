import { getSupabaseUrl } from "@helvety/shared/env-validation";

/**
 * Registry of available upscale engines.
 *
 * Helvety ships a single user-facing AI engine - `realesr-general-x4v3` - and
 * a canvas resampler (`canvas`) used silently as an automatic fallback when
 * the browser cannot run WebAssembly. There is no user-facing selector; the
 * effective engine is decided once at app boot via
 * {@link getDefaultEngineForRuntime}.
 *
 * The ONNX engine is hosted in a public Supabase Storage bucket
 * ({@link UPSCALE_MODEL_BUCKET}) and downloaded lazily on first use, then
 * cached in the browser via the Cache API. URLs are derived from
 * {@link getSupabaseUrl} so each environment (local, staging, production)
 * automatically resolves against its own Supabase project.
 */

/** Identifier for one of the registered upscale engines. */
export type UpscaleModelId = "canvas" | "realesr-general-x4v3";

/**
 * Coarse classification used by the worker to dispatch between the canvas
 * resampler and the ONNX inference path.
 */
type UpscaleEngineKind = "canvas" | "onnx";

/**
 * Preferred tile geometry used by ONNX tiled inference.
 *
 * The runtime may clamp `size` when a loaded model declares fixed input
 * dimensions (for example 128x128). Overlap and padding semantics stay the
 * same; this config remains the default target for dynamic-shape models.
 */
interface OnnxTileConfig {
  /** Tile edge length in source pixels. */
  readonly size: number;
  /** Per-side overlap in source pixels (used for linear-blend stitching). */
  readonly overlap: number;
  /** Round each tile up to a multiple of this (architectural pad). */
  readonly padMultiple: number;
}

/**
 * Sidecar weight file for ONNX models stored in the external-data format.
 *
 * Some upstream exports (e.g. Qualcomm AI Hub) ship the model as a small
 * `.onnx` graph file plus a separate `.data` blob that holds the initializer
 * tensors. onnxruntime-web's
 * {@link https://onnxruntime.ai/docs/api/js/interfaces/OnnxModelOptions.html | OnnxModelOptions.externalData}
 * accepts these files at session creation time, so we can host both files
 * verbatim instead of converting to a single self-contained `.onnx`.
 */
interface OnnxExternalDataFile {
  /** Public URL of the sidecar file in Supabase Storage. */
  readonly url: string;
  /**
   * Path string that the `.onnx` protobuf uses to reference this file
   * (typically the basename, e.g. `real_esrgan_general_x4v3.data`). Must
   * match the on-disk reference exactly, otherwise ORT cannot resolve it.
   */
  readonly path: string;
  /** Optional SHA-256 digest used to verify integrity of the sidecar. */
  readonly sha256: string | null;
}

/** Single registry entry describing one upscale engine. */
export interface UpscaleModel {
  readonly id: UpscaleModelId;
  readonly kind: UpscaleEngineKind;
  /**
   * Short human-readable label. Used in toasts (e.g. "Downloading {label}
   * model") and as an accessibility hint; keep it terse so it composes well.
   */
  readonly label: string;
  /** One-line description (used in product copy and developer tooling). */
  readonly description: string;
  /**
   * Free-form bullet points retained for product copy, documentation, and
   * any future internal surface (e.g. an admin debug panel). The runtime UI
   * does not render these - engine selection is automatic.
   */
  readonly recommendedFor: readonly string[];
  /** Approximate download size in MB. Zero for the canvas engine. */
  readonly sizeMb: number;
  /** Native upscale factor produced by the model. Null for canvas (any). */
  readonly scale: 2 | 4 | null;
  /**
   * Absolute URL to the model asset. Null for canvas. ONNX models resolve
   * against the active environment's Supabase Storage bucket (see
   * {@link UPSCALE_MODEL_BUCKET}); the URL is computed at module load.
   */
  readonly url: string | null;
  /** Tile inference configuration. Null for canvas. */
  readonly tile: OnnxTileConfig | null;
  /**
   * Optional SHA-256 hex digest used to verify the downloaded weights. Leave
   * `null` until you have downloaded the file once and run `shasum -a 256`.
   */
  readonly sha256: string | null;
  /**
   * Optional sidecar files for ONNX models stored in the external-data format.
   * When set, the worker downloads each sidecar alongside the main `.onnx` and
   * passes them to `InferenceSession.create` via the `externalData` option.
   */
  readonly externalData: readonly OnnxExternalDataFile[] | null;
  /**
   * Hard cap on input pixels (width × height). For ONNX engines the tiled
   * stitcher allocates Float32 accumulator buffers proportional to the
   * upscaled output size; left uncapped, large photos would exhaust browser
   * memory (e.g. 12 MP × 4× ≈ 3 GB of float buffers).
   */
  readonly maxInputPixels: number;
  readonly license: string;
  readonly source: string;
}

const TILE_X4: OnnxTileConfig = {
  size: 256,
  overlap: 16,
  padMultiple: 4,
};

/**
 * Cap for ONNX 4× engines: 4 MP source → 64 MP output. Float32 accumulators
 * for that output use ≈ 1 GB total (4 channels × 4 bytes), which is the
 * upper bound we are willing to allocate inside a browser worker.
 */
const ONNX_X4_MAX_INPUT_PIXELS = 4_000_000;

/**
 * Cap for the canvas (non-AI) engine. Canvas resampling has minimal memory
 * overhead, so we allow up to the export pipeline's overall ceiling.
 */
const CANVAS_MAX_INPUT_PIXELS = 32_000_000;

/**
 * Public Supabase Storage bucket that hosts the ONNX weights. Files are
 * uploaded once with `Cache-Control: public, max-age=31536000, immutable` so
 * browsers and Supabase's CDN cache them aggressively. See
 * `apps/image-upscaler/public/models/README.md` for the upload runbook.
 */
export const UPSCALE_MODEL_BUCKET = "image-upscaler-models";

/**
 * Resolves the public Storage URL for an asset stored in
 * {@link UPSCALE_MODEL_BUCKET}, based on the configured Supabase project.
 *
 * Falls back to a deterministic placeholder when env validation is unavailable
 * (e.g. Vitest without stubbed public Supabase vars).
 */
function resolveModelAssetUrl(filename: string): string {
  let supabaseUrl = "";
  try {
    supabaseUrl = getSupabaseUrl();
  } catch {
    supabaseUrl = "";
  }
  const base = supabaseUrl
    ? supabaseUrl.replace(/\/+$/, "")
    : "https://supabase-not-configured.invalid";
  return `${base}/storage/v1/object/public/${UPSCALE_MODEL_BUCKET}/${filename}`;
}

/**
 * Engine registry.
 *
 * The ONNX entry uses Qualcomm AI Hub's external-data export verbatim so the
 * objects we upload to {@link UPSCALE_MODEL_BUCKET} (and any redownloads) keep
 * the original references intact. The `path` value of each sidecar must equal
 * the location string baked into the `.onnx` protobuf (verified by inspecting
 * the file), otherwise ORT cannot resolve it.
 */
export const UPSCALE_MODELS: readonly UpscaleModel[] = [
  {
    id: "realesr-general-x4v3",
    kind: "onnx",
    label: "Real-ESRGAN",
    description: "General-purpose 4x AI upscale. Small download, fast.",
    recommendedFor: [
      "Photos",
      "Screenshots",
      "Mixed content",
      "Most everyday use cases",
    ],
    sizeMb: 5,
    scale: 4,
    url: resolveModelAssetUrl("real_esrgan_general_x4v3.onnx"),
    tile: TILE_X4,
    sha256: "a848eba3a04de14cc5846733032c3fdc2eee175fd29df264067c3e85ab29d9b3",
    externalData: [
      {
        url: resolveModelAssetUrl("real_esrgan_general_x4v3.data"),
        path: "real_esrgan_general_x4v3.data",
        sha256:
          "512d0ec9940c2e9d85d27f2952f12a0b77b7841dc22df4ce9f3ea458bc98f37f",
      },
    ],
    maxInputPixels: ONNX_X4_MAX_INPUT_PIXELS,
    license: "BSD-3-Clause (Real-ESRGAN)",
    source: "https://github.com/xinntao/Real-ESRGAN",
  },
  {
    id: "canvas",
    kind: "canvas",
    label: "Fast resize (no AI)",
    description: "High-quality canvas resampling. Instant, no download.",
    recommendedFor: [
      "Browsers without WebAssembly support",
      "Quick previews",
      "Low-power or older devices",
    ],
    sizeMb: 0,
    scale: null,
    url: null,
    tile: null,
    sha256: null,
    externalData: null,
    maxInputPixels: CANVAS_MAX_INPUT_PIXELS,
    license: "n/a",
    source: "Browser canvas API",
  },
];

export const DEFAULT_UPSCALE_MODEL_ID: UpscaleModelId = "realesr-general-x4v3";

/**
 * Strictest input-pixel cap across AI upscaling. The dropzone advertises
 * this value as the user-visible limit; deriving it from the registry rather
 * than hardcoding keeps the hint in lockstep with
 * {@link UpscaleModel.maxInputPixels}.
 */
export const MIN_ONNX_INPUT_PIXELS: number = UPSCALE_MODELS.filter(
  (model) => model.kind === "onnx"
).reduce<number>(
  (smallest, model) => Math.min(smallest, model.maxInputPixels),
  Number.POSITIVE_INFINITY
);

const MODEL_INDEX = new Map<UpscaleModelId, UpscaleModel>(
  UPSCALE_MODELS.map((model) => [model.id, model])
);

/** Returns the model entry for an id, throwing if unknown. */
export function getModelById(id: UpscaleModelId): UpscaleModel {
  const model = MODEL_INDEX.get(id);
  if (!model) {
    throw new Error(`Unknown upscale model id: ${String(id)}`);
  }
  return model;
}

/**
 * Picks the effective upscale engine for the current runtime.
 *
 * The AI engine requires WebAssembly; if the host environment does not expose
 * `WebAssembly` (extremely rare in modern browsers but possible in locked-down
 * embedded webviews), we fall back silently to the canvas resampler. This is
 * the single decision point - no other code branches on browser capabilities.
 */
export function getDefaultEngineForRuntime(): UpscaleModelId {
  return typeof WebAssembly !== "undefined"
    ? DEFAULT_UPSCALE_MODEL_ID
    : "canvas";
}
