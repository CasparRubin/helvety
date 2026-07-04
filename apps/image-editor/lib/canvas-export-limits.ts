import canvasSize from "canvas-size";

export interface CanvasExportLimits {
  maxWidth: number;
  maxHeight: number;
  maxTotalPixels: number;
}

const DEFAULT_LIMITS: CanvasExportLimits = {
  maxWidth: 16_384,
  maxHeight: 16_384,
  maxTotalPixels: 268_435_456,
};

const PROBE_FALLBACK_LIMITS: CanvasExportLimits = {
  maxWidth: 4096,
  maxHeight: 4096,
  maxTotalPixels: 16_777_216,
};

interface CanvasSizeProbeRow {
  width: number;
  height: number;
  success?: boolean;
}

function isCanvasSizeProbeRow(value: unknown): value is CanvasSizeProbeRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.width === "number" &&
    typeof row.height === "number" &&
    Number.isFinite(row.width) &&
    Number.isFinite(row.height)
  );
}

async function runCanvasSizeProbe(
  probe: () => false | Promise<unknown>
): Promise<CanvasSizeProbeRow> {
  const started = probe();
  if (started === false) {
    return { width: PROBE_FALLBACK_LIMITS.maxWidth, height: 1, success: false };
  }
  const resolved = await started;
  if (!isCanvasSizeProbeRow(resolved)) {
    return { width: PROBE_FALLBACK_LIMITS.maxWidth, height: 1, success: false };
  }
  return {
    width: resolved.width,
    height: resolved.height,
    success: resolved.success !== false,
  };
}

function roundEven(value: number): number {
  const rounded = Math.max(1, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

/**
 * Scales output dimensions down (preserving aspect ratio) so they fit canvas
 * backing-store limits from {@link getCanvasExportLimits}.
 */
export function clampOutputDimensions(
  targetWidth: number,
  targetHeight: number,
  limits: CanvasExportLimits
): { width: number; height: number; clamped: boolean } {
  const tw = Math.max(1, targetWidth);
  const th = Math.max(1, targetHeight);

  const scaleByEdge = Math.min(1, limits.maxWidth / tw, limits.maxHeight / th);
  const scaleByArea = Math.min(1, Math.sqrt(limits.maxTotalPixels / (tw * th)));
  const scale = Math.min(scaleByEdge, scaleByArea);

  if (scale >= 1 - 1e-9) {
    return {
      width: roundEven(tw),
      height: roundEven(th),
      clamped: false,
    };
  }

  let width = roundEven(tw * scale);
  let height = roundEven(th * scale);

  for (let i = 0; i < 4; i += 1) {
    if (
      width <= limits.maxWidth &&
      height <= limits.maxHeight &&
      width * height <= limits.maxTotalPixels
    ) {
      break;
    }
    const shrink = Math.min(
      limits.maxWidth / width,
      limits.maxHeight / height,
      Math.sqrt(limits.maxTotalPixels / (width * height))
    );
    width = roundEven(width * shrink);
    height = roundEven(height * shrink);
  }

  return { width, height, clamped: true };
}

async function getCanvasExportLimits(): Promise<CanvasExportLimits> {
  if (typeof window === "undefined") {
    return DEFAULT_LIMITS;
  }
  if (!("HTMLCanvasElement" in window)) {
    return DEFAULT_LIMITS;
  }

  try {
    const [widthRow, heightRow, areaRow] = await Promise.all([
      runCanvasSizeProbe(() => canvasSize.maxWidth()),
      runCanvasSizeProbe(() => canvasSize.maxHeight()),
      runCanvasSizeProbe(() => canvasSize.maxArea()),
    ]);

    const maxWidth = widthRow.success
      ? widthRow.width
      : PROBE_FALLBACK_LIMITS.maxWidth;
    const maxHeight = heightRow.success
      ? heightRow.height
      : PROBE_FALLBACK_LIMITS.maxHeight;

    // If the area probe fails, maxWidth*maxHeight can overestimate (e.g. very
    // large one-axis limits). Cap by a conservative total pixel budget.
    const maxFromArea =
      areaRow.success && areaRow.width > 0 && areaRow.height > 0
        ? areaRow.width * areaRow.height
        : Math.min(maxWidth * maxHeight, PROBE_FALLBACK_LIMITS.maxTotalPixels);

    return {
      maxWidth: Math.max(1, Math.floor(maxWidth)),
      maxHeight: Math.max(1, Math.floor(maxHeight)),
      maxTotalPixels: Math.max(1, Math.floor(maxFromArea)),
    };
  } catch {
    return { ...PROBE_FALLBACK_LIMITS };
  }
}

let cachedPromise: Promise<CanvasExportLimits> | null = null;

export function getCanvasExportLimitsCached(): Promise<CanvasExportLimits> {
  if (typeof window === "undefined") {
    return Promise.resolve(DEFAULT_LIMITS);
  }
  cachedPromise ??= getCanvasExportLimits();
  return cachedPromise;
}

/** Clears cached probe results (Vitest only). */
export function resetCanvasExportLimitsCacheForTests(): void {
  cachedPromise = null;
}
