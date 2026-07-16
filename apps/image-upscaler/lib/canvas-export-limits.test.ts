import { describe, expect, it } from "vitest";

import { clampOutputDimensions } from "@/lib/canvas-export-limits";

describe("canvas-export-limits re-export", () => {
  it("re-exports clampOutputDimensions from @helvety/shared", () => {
    const result = clampOutputDimensions(2000, 1000, {
      maxWidth: 8192,
      maxHeight: 8192,
      maxTotalPixels: 67_108_864,
    });
    expect(result).toEqual({ width: 2000, height: 1000, clamped: false });
  });
});
