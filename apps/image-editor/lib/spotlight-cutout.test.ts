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
  const hasCanvas2d = (() => {
    const canvas = document.createElement("canvas");
    return canvas.getContext("2d") !== null;
  })();

  it("fills the dim ring with evenodd compositing", () => {
    const fills: Array<{ rule: string; alpha: number }> = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: (rule?: string) => {
        fills.push({
          rule: rule ?? "nonzero",
          alpha: context.globalAlpha,
        });
      },
      rect: () => undefined,
      roundRect: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
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

    expect(fills).toHaveLength(1);
    expect(fills[0]?.rule).toBe("evenodd");
    expect(fills[0]?.alpha).toBe(0.55);
  });

  it("builds one evenodd path from the stage rect and hole geometry", () => {
    let beginPathCalls = 0;
    let rectCalls = 0;
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => {
        beginPathCalls += 1;
      },
      fill: () => undefined,
      rect: () => {
        rectCalls += 1;
      },
      roundRect: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
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

    expect(beginPathCalls).toBe(1);
    expect(rectCalls).toBe(2);
  });

  it("does not use destination-out compositing", () => {
    const compositeOperations: string[] = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: () => undefined,
      rect: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
    } as unknown as CanvasRenderingContext2D;
    Object.defineProperty(context, "globalCompositeOperation", {
      get: () => compositeOperations.at(-1) ?? "source-over",
      set: (value: string) => {
        compositeOperations.push(value);
      },
    });

    drawSpotlightCutout(context, {
      stageWidth: 400,
      stageHeight: 300,
      holeX: 100,
      holeY: 50,
      holeWidth: 200,
      holeHeight: 100,
      cornerRadius: 8,
      opacity: 0.55,
    });

    expect(compositeOperations).not.toContain("destination-out");
  });

  it("offsets hole and stage geometry by the group position", () => {
    const rects: Array<[number, number, number, number]> = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: () => undefined,
      rect: (x: number, y: number, width: number, height: number) => {
        rects.push([x, y, width, height]);
      },
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    drawSpotlightCutout(context, {
      stageWidth: 400,
      stageHeight: 300,
      holeX: 120,
      holeY: 80,
      holeWidth: 200,
      holeHeight: 100,
      cornerRadius: 0,
      opacity: 0.55,
      groupOffsetX: 120,
      groupOffsetY: 80,
    });

    expect(rects[0]).toEqual([-120, -80, 400, 300]);
    expect(rects[1]).toEqual([0, 0, 200, 100]);
  });

  it.skipIf(!hasCanvas2d)(
    "leaves the hole transparent and dims outside on a real canvas",
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

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

      const inside = context.getImageData(200, 100, 1, 1).data;
      const outside = context.getImageData(10, 10, 1, 1).data;

      expect(inside[3]).toBe(0);
      expect(outside[3]).toBeGreaterThan(0);
      expect(outside[3]).toBeLessThan(255);
    }
  );
});
