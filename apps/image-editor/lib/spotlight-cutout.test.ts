import { describe, expect, it } from "vitest";

import { clampCornerRadius, drawSpotlightCutout } from "./spotlight-cutout";

describe("clampCornerRadius", () => {
  it("returns zero for non-positive radius", () => {
    expect(clampCornerRadius(0, 100, 80)).toBe(0);
    expect(clampCornerRadius(-4, 100, 80)).toBe(0);
  });

  it("clamps radius to half the shorter side", () => {
    expect(clampCornerRadius(50, 100, 80)).toBe(40);
    expect(clampCornerRadius(12, 100, 80)).toBe(12);
  });
});

describe("drawSpotlightCutout", () => {
  it("dims the stage and punches out a rectangular hole when radius is zero", () => {
    const fills: Array<{ op: string; alpha: number }> = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      beginPath: () => undefined,
      fill: () => undefined,
      fillRect: () => {
        fills.push({
          op: context.globalCompositeOperation,
          alpha: context.globalAlpha,
        });
      },
      rect: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    drawSpotlightCutout(context, {
      stageWidth: 400,
      stageHeight: 300,
      holeX: 100,
      holeY: 50,
      holeWidth: 200,
      holeHeight: 100,
      cornerRadius: 0,
      opacity: 0.55,
    });

    expect(fills).toHaveLength(1);
    expect(fills[0]?.alpha).toBe(0.55);
  });

  it("uses destination-out compositing for rounded holes", () => {
    const operations: string[] = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
      beginPath: () => undefined,
      fill: () => {
        operations.push(context.globalCompositeOperation);
      },
      fillRect: () => undefined,
      roundRect: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
      rect: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    drawSpotlightCutout(context, {
      stageWidth: 400,
      stageHeight: 300,
      holeX: 100,
      holeY: 50,
      holeWidth: 200,
      holeHeight: 100,
      cornerRadius: 12,
      opacity: 0.55,
    });

    expect(operations).toContain("destination-out");
  });
});
