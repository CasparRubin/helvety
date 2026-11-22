/**
 * Blur redaction shared by the editor canvas and the PNG/JPEG export.
 *
 * Konva's `Filters.Blur` only sees the cached pixels of the node. For a blur
 * box that was a crop of exactly the box, so a radius larger than the box
 * (a thin box over one line of text) had almost nothing to average: the
 * stack blur clamps at the edges, edge rows dominate, and the text stayed
 * readable. Here the source is sampled with a margin around the box, reduced
 * to a coarse grid by area averaging, blurred on that grid, and scaled back up
 * with bilinear interpolation. Every output pixel therefore mixes a
 * neighbourhood that does not depend on the box size, and a higher strength
 * always means a wider neighbourhood.
 */

/** RGBA pixels in row-major order, like `ImageData`. */
export interface PixelBuffer {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

/** Integer pixel rectangle. */
export interface PixelRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** How a blur strength maps onto the downsample-and-blur pipeline. */
export interface RedactionParams {
  /** Size in source pixels of one averaged grid cell. */
  readonly cellSize: number;
  /** Box-blur radius in grid cells (applied three times per axis). */
  readonly blurCells: number;
  /** Source pixels sampled on every side of the box. */
  readonly margin: number;
}

/** Strength above which the result no longer changes visibly. */
const MAX_STRENGTH = 400;

/** Box-blur passes per axis; three passes approximate a Gaussian. */
const BLUR_PASSES = 3;

/** Box-blur radius (grid cells) used once cells are larger than 1 px. */
const MAX_BLUR_CELLS = 3;

/** Target Gaussian sigma as a fraction of the strength (px). */
const SIGMA_PER_STRENGTH = 0.55;

/** Maps a user-facing blur strength (px) to pipeline parameters. */
export function getRedactionParams(strength: number): RedactionParams {
  const s = Math.min(
    MAX_STRENGTH,
    Math.max(1, Number.isFinite(strength) ? strength : 1)
  );
  const targetSigma = SIGMA_PER_STRENGTH * s;
  // Sigma of the pipeline is cellSize * (blurCells + 0.5) (see
  // getEffectiveSigma). Grow the blur radius on a 1 px grid first, then keep
  // it at MAX_BLUR_CELLS and grow the cells: both steps only ever increase.
  const maxSigmaAtOnePx = MAX_BLUR_CELLS + 0.5;
  const cellSize =
    targetSigma <= maxSigmaAtOnePx
      ? 1
      : Math.max(1, Math.round(targetSigma / maxSigmaAtOnePx));
  const blurCells =
    cellSize === 1
      ? Math.min(MAX_BLUR_CELLS, Math.max(1, Math.round(targetSigma - 0.5)))
      : MAX_BLUR_CELLS;
  const margin = cellSize * (BLUR_PASSES * blurCells + 2);
  return { cellSize, blurCells, margin };
}

/** Approximate Gaussian sigma (source px) the pipeline applies. */
export function getEffectiveSigma(params: RedactionParams): number {
  const { cellSize: c, blurCells: k } = params;
  // Area-average downsample + three box blurs + bilinear upsample.
  const variance = (c * c) / 12 + c * c * k * (k + 1) + (c * c) / 6;
  return Math.sqrt(variance);
}

/** Integer bounds that fully contain a fractional box. */
export function getPixelBounds(box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): PixelRect {
  const x = Math.floor(box.x);
  const y = Math.floor(box.y);
  const right = Math.ceil(box.x + box.width);
  const bottom = Math.ceil(box.y + box.height);
  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  };
}

/** Expands `rect` by `margin` on every side, clamped to the image. */
export function getPaddedRect(
  rect: PixelRect,
  margin: number,
  imageWidth: number,
  imageHeight: number
): PixelRect {
  const x = Math.max(0, Math.min(imageWidth - 1, rect.x - margin));
  const y = Math.max(0, Math.min(imageHeight - 1, rect.y - margin));
  const right = Math.min(
    imageWidth,
    Math.max(x + 1, rect.x + rect.width + margin)
  );
  const bottom = Math.min(
    imageHeight,
    Math.max(y + 1, rect.y + rect.height + margin)
  );
  return { x, y, width: right - x, height: bottom - y };
}

/** Separable box blur on a premultiplied float grid, edge-clamped. */
function boxBlurGrid(
  grid: Float64Array,
  width: number,
  height: number,
  radius: number
): void {
  const scratch = new Float64Array(grid.length);
  const div = 2 * radius + 1;

  for (let pass = 0; pass < BLUR_PASSES; pass++) {
    // Horizontal: grid -> scratch.
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let ch = 0; ch < 4; ch++) {
        let sum = 0;
        for (let i = -radius; i <= radius; i++) {
          const xi = Math.min(width - 1, Math.max(0, i));
          sum += grid[(row + xi) * 4 + ch]!;
        }
        for (let x = 0; x < width; x++) {
          scratch[(row + x) * 4 + ch] = sum / div;
          const outX = Math.max(0, x - radius);
          const inX = Math.min(width - 1, x + radius + 1);
          sum += grid[(row + inX) * 4 + ch]! - grid[(row + outX) * 4 + ch]!;
        }
      }
    }
    // Vertical: scratch -> grid.
    for (let x = 0; x < width; x++) {
      for (let ch = 0; ch < 4; ch++) {
        let sum = 0;
        for (let i = -radius; i <= radius; i++) {
          const yi = Math.min(height - 1, Math.max(0, i));
          sum += scratch[(yi * width + x) * 4 + ch]!;
        }
        for (let y = 0; y < height; y++) {
          grid[(y * width + x) * 4 + ch] = sum / div;
          const outY = Math.max(0, y - radius);
          const inY = Math.min(height - 1, y + radius + 1);
          sum +=
            scratch[(inY * width + x) * 4 + ch]! -
            scratch[(outY * width + x) * 4 + ch]!;
        }
      }
    }
  }
}

/**
 * Redacts `rect` of `source` and returns just that rectangle.
 *
 * `rect` is in `source` coordinates; pixels of `source` outside `rect` are
 * the context the blur mixes in, so pass a buffer padded by
 * {@link RedactionParams.margin} where the image allows it.
 */
export function redactPixels(
  source: PixelBuffer,
  rect: PixelRect,
  strength: number
): PixelBuffer {
  const { cellSize: c, blurCells } = getRedactionParams(strength);
  const gridW = Math.max(1, Math.ceil(source.width / c));
  const gridH = Math.max(1, Math.ceil(source.height / c));
  const grid = new Float64Array(gridW * gridH * 4);
  const src = source.data;

  // Area-average downsample in premultiplied alpha.
  for (let gy = 0; gy < gridH; gy++) {
    const y0 = gy * c;
    const y1 = Math.min(source.height, y0 + c);
    for (let gx = 0; gx < gridW; gx++) {
      const x0 = gx * c;
      const x1 = Math.min(source.width, x0 + c);
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let y = y0; y < y1; y++) {
        let p = (y * source.width + x0) * 4;
        for (let x = x0; x < x1; x++, p += 4) {
          const alpha = src[p + 3]!;
          r += src[p]! * alpha;
          g += src[p + 1]! * alpha;
          b += src[p + 2]! * alpha;
          a += alpha;
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      const q = (gy * gridW + gx) * 4;
      grid[q] = r / n;
      grid[q + 1] = g / n;
      grid[q + 2] = b / n;
      grid[q + 3] = a / n;
    }
  }

  boxBlurGrid(grid, gridW, gridH, blurCells);

  // Bilinear upsample of just the requested rectangle.
  const out = new Uint8ClampedArray(rect.width * rect.height * 4);
  for (let oy = 0; oy < rect.height; oy++) {
    const fy = Math.min(gridH - 1, Math.max(0, (rect.y + oy + 0.5) / c - 0.5));
    const gy0 = Math.floor(fy);
    const gy1 = Math.min(gridH - 1, gy0 + 1);
    const ty = fy - gy0;
    for (let ox = 0; ox < rect.width; ox++) {
      const fx = Math.min(
        gridW - 1,
        Math.max(0, (rect.x + ox + 0.5) / c - 0.5)
      );
      const gx0 = Math.floor(fx);
      const gx1 = Math.min(gridW - 1, gx0 + 1);
      const tx = fx - gx0;
      const w00 = (1 - tx) * (1 - ty);
      const w10 = tx * (1 - ty);
      const w01 = (1 - tx) * ty;
      const w11 = tx * ty;
      const q00 = (gy0 * gridW + gx0) * 4;
      const q10 = (gy0 * gridW + gx1) * 4;
      const q01 = (gy1 * gridW + gx0) * 4;
      const q11 = (gy1 * gridW + gx1) * 4;
      const sample = (ch: number): number =>
        grid[q00 + ch]! * w00 +
        grid[q10 + ch]! * w10 +
        grid[q01 + ch]! * w01 +
        grid[q11 + ch]! * w11;
      const alpha = sample(3);
      const p = (oy * rect.width + ox) * 4;
      if (alpha > 0) {
        out[p] = sample(0) / alpha;
        out[p + 1] = sample(1) / alpha;
        out[p + 2] = sample(2) / alpha;
      }
      out[p + 3] = alpha;
    }
  }

  return { data: out, width: rect.width, height: rect.height };
}

/** A redacted raster plus where its top-left sits in image coordinates. */
export interface RedactedRegion {
  readonly canvas: HTMLCanvasElement;
  /** Image-space x of the canvas's left edge. */
  readonly x: number;
  /** Image-space y of the canvas's top edge. */
  readonly y: number;
}

/** Neutral fill used when pixels cannot be read, so nothing leaks through. */
export const REDACTION_FALLBACK_FILL = "#808080";

/**
 * Renders the redacted pixels of `box` (image coordinates) to a canvas.
 *
 * Returns `null` only when no 2D canvas is available at all. If the source
 * pixels cannot be read (e.g. a tainted canvas), the canvas is filled with a
 * flat colour instead of showing the original.
 */
export function createRedactedRegion(
  sourceImage: HTMLImageElement,
  box: { x: number; y: number; width: number; height: number },
  strength: number
): RedactedRegion | null {
  if (typeof document === "undefined") return null;
  const imageWidth = sourceImage.naturalWidth || sourceImage.width;
  const imageHeight = sourceImage.naturalHeight || sourceImage.height;
  if (!imageWidth || !imageHeight) return null;

  const bounds = getPixelBounds(box);
  const { margin } = getRedactionParams(strength);
  const padded = getPaddedRect(bounds, margin, imageWidth, imageHeight);

  const output = document.createElement("canvas");
  output.width = bounds.width;
  output.height = bounds.height;
  const outputContext = output.getContext("2d");
  if (!outputContext) return null;

  try {
    const sampler = document.createElement("canvas");
    sampler.width = padded.width;
    sampler.height = padded.height;
    const samplerContext = sampler.getContext("2d", {
      willReadFrequently: true,
    });
    if (!samplerContext) throw new Error("2D context unavailable");
    samplerContext.drawImage(
      sourceImage,
      padded.x,
      padded.y,
      padded.width,
      padded.height,
      0,
      0,
      padded.width,
      padded.height
    );
    const pixels = samplerContext.getImageData(
      0,
      0,
      padded.width,
      padded.height
    );
    const redacted = redactPixels(
      pixels,
      {
        x: bounds.x - padded.x,
        y: bounds.y - padded.y,
        width: bounds.width,
        height: bounds.height,
      },
      strength
    );
    const imageData = outputContext.createImageData(
      redacted.width,
      redacted.height
    );
    imageData.data.set(redacted.data);
    outputContext.putImageData(imageData, 0, 0);
  } catch {
    outputContext.fillStyle = REDACTION_FALLBACK_FILL;
    outputContext.fillRect(0, 0, bounds.width, bounds.height);
  }

  return { canvas: output, x: bounds.x, y: bounds.y };
}
