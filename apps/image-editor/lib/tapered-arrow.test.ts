import { describe, expect, it, vi } from "vitest";

import { buildTaperedArrowPoints, drawTaperedArrowPath } from "./tapered-arrow";

describe("buildTaperedArrowPoints", () => {
  it("places the tip at the head point for a horizontal arrow", () => {
    const points = buildTaperedArrowPoints(0, 0, 100, 0, 6);

    expect(points[6]).toBe(100);
    expect(points[7]).toBe(0);
    expect(points.length).toBe(14);
  });

  it("returns a degenerate polygon for zero-length arrows", () => {
    const points = buildTaperedArrowPoints(10, 20, 10, 20, 4);

    expect(points).toEqual([10, 20, 10, 20, 10, 20]);
  });

  it("keeps the shaft narrower than the head at the neck", () => {
    const points = buildTaperedArrowPoints(0, 0, 100, 0, 8);
    const shaftEndSpread = Math.abs(points[3]! - points[11]!);
    const headSpread = Math.abs(points[5]! - points[9]!);

    expect(shaftEndSpread).toBeLessThan(headSpread);
  });

  it("produces a head clearly wider than the tail", () => {
    const points = buildTaperedArrowPoints(0, 0, 100, 0, 8);
    const tailSpread = Math.abs(points[1]! - points[13]!);
    const headSpread = Math.abs(points[5]! - points[9]!);

    expect(headSpread / tailSpread).toBeGreaterThanOrEqual(2.5);
  });

  it("uses a single tip vertex without lateral tip flare", () => {
    const points = buildTaperedArrowPoints(0, 0, 100, 0, 8);

    expect(points[6]).toBe(100);
    expect(points[7]).toBe(0);
    expect(points.length).toBe(14);
  });
});

describe("drawTaperedArrowPath", () => {
  it("draws a closed path through tapered arrow points", () => {
    const context = {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
    };

    drawTaperedArrowPath(context, 0, 0, 80, 0, 5);

    expect(context.beginPath).toHaveBeenCalledTimes(1);
    expect(context.moveTo).toHaveBeenCalled();
    expect(context.lineTo).toHaveBeenCalled();
    expect(context.closePath).toHaveBeenCalledTimes(1);
  });
});
