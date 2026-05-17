import { describe, expect, it } from "vitest";

import { HELVETY_ACCENT_RED, HELVETY_ACCENT_RED_RGB } from "./colors";
import {
  getHelvetyCanvasBackgroundRgb,
  getHelvetyCanvasIslandRgb,
  getHelvetyCanvasRoadRgb,
  getReactBitsHeadlightRgb,
  getReactBitsPrimaryColor,
  getReactBitsPrimaryRgb,
  HELVETY_CANVAS_BACKGROUND_DARK,
  HELVETY_CANVAS_BACKGROUND_LIGHT,
  REACT_BITS_PRIMARY_DARK,
  REACT_BITS_PRIMARY_LIGHT,
  REACT_BITS_PRIMARY_RGB_DARK,
  REACT_BITS_PRIMARY_RGB_LIGHT,
} from "./react-bits-palette";

describe("react-bits-palette", () => {
  it("uses white primary in dark mode and black in light mode", () => {
    expect(getReactBitsPrimaryColor(true)).toBe(REACT_BITS_PRIMARY_DARK);
    expect(getReactBitsPrimaryColor(false)).toBe(REACT_BITS_PRIMARY_LIGHT);
    expect(getReactBitsPrimaryRgb(true)).toBe(REACT_BITS_PRIMARY_RGB_DARK);
    expect(getReactBitsPrimaryRgb(false)).toBe(REACT_BITS_PRIMARY_RGB_LIGHT);
  });

  it("keeps accent red unchanged across themes", () => {
    expect(HELVETY_ACCENT_RED).toBe("#ff102a");
    expect(HELVETY_ACCENT_RED_RGB).toBe(0xff102a);
  });

  it("maps canvas backgrounds to theme-color meta values", () => {
    expect(HELVETY_CANVAS_BACKGROUND_LIGHT).toBe(0xfaf8f7);
    expect(HELVETY_CANVAS_BACKGROUND_DARK).toBe(0x1c1816);
    expect(getHelvetyCanvasBackgroundRgb(true)).toBe(
      HELVETY_CANVAS_BACKGROUND_DARK
    );
    expect(getHelvetyCanvasBackgroundRgb(false)).toBe(
      HELVETY_CANVAS_BACKGROUND_LIGHT
    );
  });

  it("provides road and island tints per theme", () => {
    expect(getHelvetyCanvasRoadRgb(true)).not.toBe(
      getHelvetyCanvasRoadRgb(false)
    );
    expect(getHelvetyCanvasIslandRgb(true)).not.toBe(
      getHelvetyCanvasIslandRgb(false)
    );
  });

  it("light-mode road and island are visibly darker than the canvas (Hyperspeed street)", () => {
    const bg = getHelvetyCanvasBackgroundRgb(false);
    const road = getHelvetyCanvasRoadRgb(false);
    const island = getHelvetyCanvasIslandRgb(false);

    const channelDelta = (a: number, b: number) =>
      Math.abs(((a >> 16) & 0xff) - ((b >> 16) & 0xff)) +
      Math.abs(((a >> 8) & 0xff) - ((b >> 8) & 0xff)) +
      Math.abs((a & 0xff) - (b & 0xff));

    expect(channelDelta(bg, road)).toBeGreaterThanOrEqual(48);
    expect(channelDelta(road, island)).toBeGreaterThanOrEqual(24);
  });

  it("swaps headlight streaks white to black on light mode", () => {
    expect(getReactBitsHeadlightRgb(true)).toContain(0xffffff);
    expect(getReactBitsHeadlightRgb(false)).toContain(0x000000);
  });
});
