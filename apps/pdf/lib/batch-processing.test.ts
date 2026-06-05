import { describe, expect, it, vi } from "vitest";

import { calculateBatchSize, yieldToBrowser } from "./batch-processing";

describe("calculateBatchSize", () => {
  it("returns larger batches for small documents and smaller batches for large ones", () => {
    expect(calculateBatchSize(5)).toBe(10);
    expect(calculateBatchSize(10)).toBe(10);
    expect(calculateBatchSize(11)).toBe(8);
    expect(calculateBatchSize(50)).toBe(8);
    expect(calculateBatchSize(51)).toBe(5);
    expect(calculateBatchSize(100)).toBe(5);
    expect(calculateBatchSize(101)).toBe(3);
  });

  it("rejects negative totals", () => {
    expect(() => calculateBatchSize(-1)).toThrow();
  });
});

describe("yieldToBrowser", () => {
  it("rejects invalid timeout values", () => {
    expect(() => {
      void yieldToBrowser(-1);
    }).toThrow(/Invalid timeout/);
  });

  it("resolves via setTimeout when requestIdleCallback is unavailable", async () => {
    const original = window.requestIdleCallback;
    Reflect.deleteProperty(window, "requestIdleCallback");

    const resolved = vi.fn();
    await yieldToBrowser(0).then(resolved);
    expect(resolved).toHaveBeenCalledOnce();

    if (original) {
      window.requestIdleCallback = original;
    }
  });
});
