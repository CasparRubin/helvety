import { describe, expect, it } from "vitest";

import { buildTaperedArrowPoints } from "./tapered-arrow";

describe("buildTaperedArrowPoints", () => {
  it("places the tip at the head point for a horizontal arrow", () => {
    const points = buildTaperedArrowPoints(0, 0, 100, 0, 6);

    expect(points).toContain(100);
    expect(points).toContain(0);
    expect(points.length).toBeGreaterThanOrEqual(8);
  });

  it("returns a degenerate polygon for zero-length arrows", () => {
    const points = buildTaperedArrowPoints(10, 20, 10, 20, 4);

    expect(points).toEqual([10, 20, 10, 20, 10, 20]);
  });

  it("produces wider geometry near the head than the tail", () => {
    const points = buildTaperedArrowPoints(0, 0, 100, 0, 8);
    const tailSpread = Math.abs(points[1]! - points[points.length - 1]!);
    const headSpread = Math.abs(points[3]! - points[9]!);

    expect(headSpread).toBeGreaterThan(tailSpread);
  });
});
