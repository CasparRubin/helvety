import { describe, expect, it } from "vitest";

import {
  FONT_SIZE_BASE,
  getDefaultToolSizes,
  getTextShadowCss,
  getTextShadowProps,
  imageScaleFactor,
  STROKE_WIDTH_BASE,
  STROKE_WIDTH_MIN,
} from "./default-tool-sizes";

describe("imageScaleFactor", () => {
  it("returns 1 at the reference long edge", () => {
    expect(imageScaleFactor(1920, 1080)).toBe(1);
  });

  it("doubles for 4K long edge", () => {
    expect(imageScaleFactor(3840, 2160)).toBe(2);
  });

  it("returns 1 when dimensions are invalid", () => {
    expect(imageScaleFactor(0, 0)).toBe(1);
  });
});

describe("getDefaultToolSizes", () => {
  it("returns base sizes at 1920×1080", () => {
    expect(getDefaultToolSizes(1920, 1080)).toEqual({
      fontSize: FONT_SIZE_BASE,
      strokeWidth: STROKE_WIDTH_BASE,
    });
  });

  it("scales up for 4K images", () => {
    const sizes = getDefaultToolSizes(3840, 2160);
    expect(sizes.fontSize).toBe(FONT_SIZE_BASE * 2);
    expect(sizes.strokeWidth).toBe(STROKE_WIDTH_BASE * 2);
  });

  it("clamps small images to minimum stroke width", () => {
    const sizes = getDefaultToolSizes(640, 480);
    expect(sizes.strokeWidth).toBeGreaterThanOrEqual(STROKE_WIDTH_MIN);
    expect(sizes.fontSize).toBeGreaterThanOrEqual(18);
  });
});

describe("getTextShadowProps", () => {
  it("derives shadow dimensions from font size", () => {
    const shadow = getTextShadowProps(36);
    expect(shadow.shadowBlur).toBeGreaterThan(0);
    expect(shadow.shadowOffsetX).toBeGreaterThan(0);
    expect(shadow.shadowColor).toContain("rgba");
  });
});

describe("getTextShadowCss", () => {
  it("returns a CSS text-shadow string scaled to font size", () => {
    const css = getTextShadowCss(36);
    expect(css).toMatch(/^\d+px \d+px \d+px rgba\(0,0,0,0\.85\)$/);
  });

  it("uses at least 1px offset for small font sizes", () => {
    const css = getTextShadowCss(8);
    expect(css.startsWith("1px 1px")).toBe(true);
  });
});
