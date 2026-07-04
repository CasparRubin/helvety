import { describe, expect, it } from "vitest";

import {
  USER_ZOOM_MAX,
  USER_ZOOM_MIN,
  clampUserZoom,
  formatUserZoomPercent,
} from "./stage-zoom";

describe("stage-zoom", () => {
  it("clamps zoom to the allowed range and snaps to step", () => {
    expect(clampUserZoom(0)).toBe(USER_ZOOM_MIN);
    expect(clampUserZoom(10)).toBe(USER_ZOOM_MAX);
    expect(clampUserZoom(1.12)).toBe(1);
    expect(clampUserZoom(1.38)).toBe(1.5);
  });

  it("formats zoom as a whole-number percentage", () => {
    expect(formatUserZoomPercent(1)).toBe("100%");
    expect(formatUserZoomPercent(1.5)).toBe("150%");
    expect(formatUserZoomPercent(0.25)).toBe("25%");
  });
});
