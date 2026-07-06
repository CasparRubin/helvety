import { describe, expect, it } from "vitest";

import { buildSpotlightRects } from "./spotlight-rects";

describe("buildSpotlightRects", () => {
  it("returns four strips around a centered hole (crop overlay geometry)", () => {
    const rects = buildSpotlightRects(100, 50, 200, 100, 400, 300);

    expect(rects).toHaveLength(4);
    expect(rects).toContainEqual({ x: 0, y: 0, width: 400, height: 50 });
    expect(rects).toContainEqual({ x: 0, y: 150, width: 400, height: 150 });
    expect(rects).toContainEqual({ x: 0, y: 50, width: 100, height: 100 });
    expect(rects).toContainEqual({ x: 300, y: 50, width: 100, height: 100 });
  });

  it("skips zero-size strips at stage edges", () => {
    const rects = buildSpotlightRects(0, 0, 200, 100, 400, 300);

    expect(rects).toHaveLength(2);
    expect(rects).toContainEqual({ x: 0, y: 100, width: 400, height: 200 });
    expect(rects).toContainEqual({ x: 200, y: 0, width: 200, height: 100 });
  });

  it("returns empty array when hole covers entire stage", () => {
    expect(buildSpotlightRects(0, 0, 400, 300, 400, 300)).toEqual([]);
  });
});
