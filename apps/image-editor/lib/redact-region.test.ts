import { describe, expect, it } from "vitest";

import {
  getEffectiveSigma,
  getPaddedRect,
  getPixelBounds,
  getRedactionParams,
  redactPixels,
} from "./redact-region";

import type { PixelBuffer, PixelRect } from "./redact-region";

const IMAGE_WIDTH = 400;
const IMAGE_HEIGHT = 200;
const GLYPH_COLS = 7;
const GLYPH_ROWS = 12;
const GLYPH_PITCH = 11;
const TEXT_X = 140;
const TEXT_Y = 94;

/** Deterministic 7x12 "glyph" bitmap per character (stand-in for a font). */
function glyphBits(char: string): boolean[] {
  let seed = char.charCodeAt(0) * 2654435761;
  const bits: boolean[] = [];
  for (let i = 0; i < GLYPH_COLS * GLYPH_ROWS; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    bits.push(((seed >>> 16) & 3) === 0);
  }
  return bits;
}

/** White image with one line of dark monospace-like text. */
function renderText(text: string): PixelBuffer {
  const data = new Uint8ClampedArray(IMAGE_WIDTH * IMAGE_HEIGHT * 4).fill(255);
  [...text].forEach((char, index) => {
    const bits = glyphBits(char);
    for (let gy = 0; gy < GLYPH_ROWS; gy++) {
      for (let gx = 0; gx < GLYPH_COLS; gx++) {
        if (!bits[gy * GLYPH_COLS + gx]) continue;
        const p =
          ((TEXT_Y + gy) * IMAGE_WIDTH + TEXT_X + index * GLYPH_PITCH + gx) * 4;
        data[p] = 20;
        data[p + 1] = 20;
        data[p + 2] = 20;
      }
    }
  });
  return { data, width: IMAGE_WIDTH, height: IMAGE_HEIGHT };
}

/** Same steps as `createRedactedRegion`, minus the canvas plumbing. */
function redactBox(
  image: PixelBuffer,
  box: PixelRect,
  strength: number
): PixelBuffer {
  const bounds = getPixelBounds(box);
  const { margin } = getRedactionParams(strength);
  const padded = getPaddedRect(bounds, margin, image.width, image.height);
  const data = new Uint8ClampedArray(padded.width * padded.height * 4);
  for (let y = 0; y < padded.height; y++) {
    const from = ((padded.y + y) * image.width + padded.x) * 4;
    data.set(
      image.data.subarray(from, from + padded.width * 4),
      y * padded.width * 4
    );
  }
  return redactPixels(
    { data, width: padded.width, height: padded.height },
    {
      x: bounds.x - padded.x,
      y: bounds.y - padded.y,
      width: bounds.width,
      height: bounds.height,
    },
    strength
  );
}

/** Largest per-channel difference between two equally sized buffers. */
function maxDifference(a: PixelBuffer, b: PixelBuffer): number {
  let max = 0;
  for (let i = 0; i < a.data.length; i++) {
    max = Math.max(max, Math.abs(a.data[i]! - b.data[i]!));
  }
  return max;
}

/** Thin box (~30 px tall) drawn tightly over the line of text. */
const THIN_BOX: PixelRect = { x: 134, y: 85, width: 145, height: 30 };
/** Tall box around the same text. */
const TALL_BOX: PixelRect = { x: 82, y: 65, width: 250, height: 70 };

const TEXT_A = "ABX-4471-KQ9";
const TEXT_B = "ZRM-0582-WP3";

describe("redactPixels", () => {
  it("sanity: the two test strings differ strongly before redaction", () => {
    const a = renderText(TEXT_A);
    const b = renderText(TEXT_B);
    expect(maxDifference(a, b)).toBeGreaterThan(200);
  });

  it("makes different text indistinguishable in a thin box at the default strength", () => {
    const a = redactBox(renderText(TEXT_A), THIN_BOX, 28);
    const b = redactBox(renderText(TEXT_B), THIN_BOX, 28);
    // Readable text would differ by ~235 per channel; a few levels is noise.
    expect(maxDifference(a, b)).toBeLessThanOrEqual(12);
  });

  it("does not depend on the box size (region versus radius)", () => {
    // A thin box must blur exactly like the same rows of a tall box: the
    // blur neighbourhood comes from the strength, not from the box.
    const image = renderText(TEXT_A);
    for (const strength of [10, 28, 60, 100]) {
      const thin = redactBox(image, THIN_BOX, strength);
      const tall = redactBox(image, TALL_BOX, strength);
      const offsetX = THIN_BOX.x - TALL_BOX.x;
      const offsetY = THIN_BOX.y - TALL_BOX.y;
      let max = 0;
      for (let y = 0; y < thin.height; y++) {
        for (let x = 0; x < thin.width; x++) {
          for (let ch = 0; ch < 4; ch++) {
            const t = thin.data[(y * thin.width + x) * 4 + ch]!;
            const u =
              tall.data[((y + offsetY) * tall.width + x + offsetX) * 4 + ch]!;
            max = Math.max(max, Math.abs(t - u));
          }
        }
      }
      expect(max, `strength ${strength}`).toBeLessThanOrEqual(1);
    }
  });

  it("never gets weaker as the strength goes up", () => {
    const leak = (strength: number): number =>
      maxDifference(
        redactBox(renderText(TEXT_A), THIN_BOX, strength),
        redactBox(renderText(TEXT_B), THIN_BOX, strength)
      );
    const strengths = [4, 10, 28, 45, 60, 100, 250];
    const leaks = strengths.map(leak);
    for (let i = 1; i < leaks.length; i++) {
      expect(leaks[i], `strength ${strengths[i]}`).toBeLessThanOrEqual(
        leaks[i - 1]! + 1
      );
    }
  });

  it("keeps a flat area flat and preserves alpha", () => {
    const data = new Uint8ClampedArray(40 * 40 * 4);
    for (let i = 0; i < data.length; i += 4) {
      data.set([10, 120, 200, 128], i);
    }
    const out = redactPixels(
      { data, width: 40, height: 40 },
      { x: 5, y: 5, width: 20, height: 10 },
      28
    );
    for (let i = 0; i < out.data.length; i += 4) {
      expect(Math.abs(out.data[i]! - 10)).toBeLessThanOrEqual(1);
      expect(Math.abs(out.data[i + 1]! - 120)).toBeLessThanOrEqual(1);
      expect(Math.abs(out.data[i + 2]! - 200)).toBeLessThanOrEqual(1);
      expect(Math.abs(out.data[i + 3]! - 128)).toBeLessThanOrEqual(1);
    }
  });
});

describe("getRedactionParams", () => {
  it("increases the effective blur monotonically with strength", () => {
    let previous = 0;
    for (let strength = 1; strength <= 400; strength++) {
      const sigma = getEffectiveSigma(getRedactionParams(strength));
      expect(sigma, `strength ${strength}`).toBeGreaterThanOrEqual(previous);
      previous = sigma;
    }
  });

  it("samples a margin at least as wide as the blur reach", () => {
    for (const strength of [1, 28, 100, 400]) {
      const params = getRedactionParams(strength);
      expect(params.margin).toBeGreaterThanOrEqual(
        params.cellSize * 3 * params.blurCells
      );
    }
  });

  it("treats invalid strengths as the minimum", () => {
    expect(getRedactionParams(Number.NaN)).toEqual(getRedactionParams(1));
    expect(getRedactionParams(-5)).toEqual(getRedactionParams(1));
  });
});

describe("getPaddedRect", () => {
  it("clamps the margin to the image", () => {
    expect(
      getPaddedRect({ x: 5, y: 5, width: 10, height: 10 }, 20, 30, 18)
    ).toEqual({ x: 0, y: 0, width: 30, height: 18 });
  });
});
