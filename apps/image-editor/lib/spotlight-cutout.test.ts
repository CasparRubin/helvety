import { describe, expect, it } from "vitest";

import {
  clampCornerRadius,
  drawSpotlightCutout,
  drawSpotlightCutouts,
} from "./spotlight-cutout";

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

describe("drawSpotlightCutouts", () => {
  it("dims the stage once then punches out each hole with destination-out", () => {
    const fillRects: Array<{ alpha: number }> = [];
    const holeFills: number[] = [];
    const compositeOperations: string[] = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: () => {
        holeFills.push(context.globalAlpha);
      },
      fillRect: () => {
        fillRects.push({ alpha: context.globalAlpha });
      },
      rect: () => undefined,
      roundRect: () => undefined,
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

    drawSpotlightCutouts(context, {
      stageWidth: 400,
      stageHeight: 300,
      holes: [
        { x: 50, y: 40, width: 100, height: 80, cornerRadius: 8 },
        { x: 200, y: 120, width: 80, height: 60, cornerRadius: 0 },
      ],
      opacity: 0.55,
    });

    expect(fillRects).toHaveLength(1);
    expect(fillRects[0]?.alpha).toBe(0.55);
    expect(compositeOperations).toContain("destination-out");
    expect(holeFills).toHaveLength(2);
    expect(holeFills.every((alpha) => alpha === 1)).toBe(true);
  });

  it("does nothing when there are no holes", () => {
    let fillRectCalls = 0;
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      fillRect: () => {
        fillRectCalls += 1;
      },
    } as unknown as CanvasRenderingContext2D;

    drawSpotlightCutouts(context, {
      stageWidth: 400,
      stageHeight: 300,
      holes: [],
      opacity: 0.55,
    });

    expect(fillRectCalls).toBe(0);
  });

  const hasCanvas2d = (() => {
    const canvas = document.createElement("canvas");
    return canvas.getContext("2d") !== null;
  })();

  it.skipIf(!hasCanvas2d)(
    "keeps overlapping holes at full transparency on a real canvas",
    () => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 300;
      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      drawSpotlightCutouts(context, {
        stageWidth: 400,
        stageHeight: 300,
        holes: [
          { x: 80, y: 60, width: 120, height: 90, cornerRadius: 0 },
          { x: 140, y: 90, width: 120, height: 90, cornerRadius: 0 },
        ],
        opacity: 0.55,
      });

      const overlap = context.getImageData(170, 120, 1, 1).data;
      const outside = context.getImageData(10, 10, 1, 1).data;

      expect(overlap[3]).toBe(0);
      expect(outside[3]).toBeGreaterThan(0);
      expect(outside[3]).toBeLessThan(255);
    }
  );

  it.skipIf(!hasCanvas2d)(
    "does not compound dim opacity outside holes when more holes are added",
    () => {
      const sampleOutsideAlpha = (holeCount: number): number => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        const context = canvas.getContext("2d");
        if (!context) {
          return -1;
        }

        const holes =
          holeCount === 1
            ? [{ x: 80, y: 60, width: 120, height: 90, cornerRadius: 0 }]
            : [
                { x: 80, y: 60, width: 120, height: 90, cornerRadius: 0 },
                { x: 220, y: 140, width: 100, height: 80, cornerRadius: 0 },
              ];

        drawSpotlightCutouts(context, {
          stageWidth: 400,
          stageHeight: 300,
          holes,
          opacity: 0.55,
        });

        return context.getImageData(10, 10, 1, 1).data[3] ?? -1;
      };

      const oneHoleAlpha = sampleOutsideAlpha(1);
      const twoHoleAlpha = sampleOutsideAlpha(2);

      expect(oneHoleAlpha).toBeGreaterThan(0);
      expect(twoHoleAlpha).toBe(oneHoleAlpha);
    }
  );
});

describe("drawSpotlightCutout", () => {
  it("delegates to drawSpotlightCutouts for a single hole", () => {
    const fillRects: Array<{ alpha: number }> = [];
    const compositeOperations: string[] = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: () => undefined,
      fillRect: () => {
        fillRects.push({ alpha: context.globalAlpha });
      },
      rect: () => undefined,
      roundRect: () => undefined,
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
      cornerRadius: 12,
      opacity: 0.55,
    });

    expect(fillRects).toHaveLength(1);
    expect(fillRects[0]?.alpha).toBe(0.55);
    expect(compositeOperations).toContain("destination-out");
  });

  it("offsets hole and stage geometry by the group position", () => {
    const fillRectArgs: Array<[number, number, number, number]> = [];
    const holeRects: Array<[number, number, number, number]> = [];
    const context = {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: () => undefined,
      fillRect: (x: number, y: number, width: number, height: number) => {
        fillRectArgs.push([x, y, width, height]);
      },
      rect: (x: number, y: number, width: number, height: number) => {
        holeRects.push([x, y, width, height]);
      },
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
    } as unknown as CanvasRenderingContext2D;
    Object.defineProperty(context, "globalCompositeOperation", {
      get: () => "source-over",
      set: () => undefined,
    });

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

    expect(fillRectArgs[0]).toEqual([-120, -80, 400, 300]);
    expect(holeRects[0]).toEqual([0, 0, 200, 100]);
  });

  const hasCanvas2d = (() => {
    const canvas = document.createElement("canvas");
    return canvas.getContext("2d") !== null;
  })();

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
