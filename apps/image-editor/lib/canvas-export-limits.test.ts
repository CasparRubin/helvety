import { beforeEach, describe, expect, it } from "vitest";

import {
  clampOutputDimensions,
  getCanvasExportLimitsCached,
  resetCanvasExportLimitsCacheForTests,
} from "@/lib/canvas-export-limits";

describe("clampOutputDimensions", () => {
  beforeEach(() => {
    resetCanvasExportLimitsCacheForTests();
  });

  it("does not change dimensions when within limits", () => {
    const result = clampOutputDimensions(2000, 1000, {
      maxWidth: 8192,
      maxHeight: 8192,
      maxTotalPixels: 67_108_864,
    });
    expect(result).toEqual({ width: 2000, height: 1000, clamped: false });
  });

  it("clamps iPhone 12MP 2× output to legacy iOS 4096 canvas cap", () => {
    const result = clampOutputDimensions(8064, 6048, {
      maxWidth: 4096,
      maxHeight: 4096,
      maxTotalPixels: 16_777_216,
    });
    expect(result).toEqual({
      width: 4096,
      height: 3072,
      clamped: true,
    });
  });
});

describe("getCanvasExportLimitsCached", () => {
  beforeEach(() => {
    resetCanvasExportLimitsCacheForTests();
  });

  it("returns positive limits in the test environment", async () => {
    const limits = await getCanvasExportLimitsCached();

    expect(limits.maxWidth).toBeGreaterThan(0);
    expect(limits.maxHeight).toBeGreaterThan(0);
    expect(limits.maxTotalPixels).toBeGreaterThan(0);
  });
});
