import { describe, expect, it } from "vitest";

import {
  DEFAULT_BLUR_RADIUS,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_DIM_OPACITY,
  SLIDER_MAX_PX,
} from "./editor-types";

describe("editor-types defaults", () => {
  it("uses a stronger default blur than the legacy 12px default", () => {
    expect(DEFAULT_BLUR_RADIUS).toBeGreaterThan(12);
  });

  it("defaults new rect annotations to a slightly rounded corner radius", () => {
    expect(DEFAULT_CORNER_RADIUS).toBeGreaterThan(0);
    expect(DEFAULT_CORNER_RADIUS).toBeLessThanOrEqual(SLIDER_MAX_PX);
  });

  it("keeps dim opacity in a usable middle range", () => {
    expect(DEFAULT_DIM_OPACITY).toBeGreaterThan(0);
    expect(DEFAULT_DIM_OPACITY).toBeLessThan(1);
  });

  it("caps property sliders at 100px", () => {
    expect(SLIDER_MAX_PX).toBe(100);
  });
});
