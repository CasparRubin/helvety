import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  konvaTestLayerAdds,
  resetKonvaTestLayerAdds,
} from "../vitest.konva-mock";

import { getTextShadowProps } from "./default-tool-sizes";
import {
  createArrowElement,
  createBlurElement,
  createBorderElement,
  createHighlightElement,
  createTextElement,
  initialEditorState,
} from "./editor-reducer";
import { DEFAULT_CORNER_RADIUS } from "./editor-types";
import {
  exportEditedImage,
  getImagePointerFromStage,
  getLogicalStageSize,
  imageToStageCoords,
  pointerToImageCoords,
} from "./export-image";

import type Konva from "konva";

/** Records compositing used by the shared highlight dim export node. */
function getHighlightDimCompositing(): {
  fillRectCount: number;
  compositeOperations: string[];
  holeFillCount: number;
} {
  const dimNode = konvaTestLayerAdds.find(
    (node): node is { attrs: { sceneFunc: (context: unknown) => void } } =>
      typeof node === "object" &&
      node !== null &&
      "attrs" in node &&
      typeof (node as { attrs: { sceneFunc?: unknown } }).attrs.sceneFunc ===
        "function"
  );
  if (!dimNode) {
    return { fillRectCount: 0, compositeOperations: [], holeFillCount: 0 };
  }

  let fillRectCount = 0;
  let holeFillCount = 0;
  const compositeOperations: string[] = [];
  const context = {
    _context: {
      save: () => undefined,
      restore: () => undefined,
      fillStyle: "",
      globalAlpha: 1,
      beginPath: () => undefined,
      fill: () => {
        holeFillCount += 1;
      },
      fillRect: () => {
        fillRectCount += 1;
      },
      rect: () => undefined,
      roundRect: () => undefined,
      moveTo: () => undefined,
      lineTo: () => undefined,
      quadraticCurveTo: () => undefined,
    },
  };
  Object.defineProperty(context._context, "globalCompositeOperation", {
    get: () => compositeOperations.at(-1) ?? "source-over",
    set: (value: string) => {
      compositeOperations.push(value);
    },
  });

  dimNode.attrs.sceneFunc(context);
  return { fillRectCount, compositeOperations, holeFillCount };
}

/** Counts shared highlight dim export nodes (sceneFunc shapes). */
function countHighlightDimNodes(): number {
  return konvaTestLayerAdds.filter(
    (node) =>
      typeof node === "object" &&
      node !== null &&
      "attrs" in node &&
      typeof (node as { attrs: { sceneFunc?: unknown } }).attrs.sceneFunc ===
        "function"
  ).length;
}

describe("export-image helpers", () => {
  beforeEach(() => {
    resetKonvaTestLayerAdds();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        blob: async () => new Blob(["png"], { type: "image/png" }),
      }))
    );
  });

  it("uses full image dimensions when crop is unset", () => {
    const size = getLogicalStageSize(initialEditorState, 800, 600);

    expect(size.width).toBe(800);
    expect(size.height).toBe(600);
    expect(size.crop).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });

  it("uses committed crop for logical stage size", () => {
    const size = getLogicalStageSize(
      {
        ...initialEditorState,
        crop: { x: 100, y: 50, width: 400, height: 300 },
      },
      800,
      600
    );

    expect(size.width).toBe(400);
    expect(size.height).toBe(300);
    expect(size.crop).toEqual({ x: 100, y: 50, width: 400, height: 300 });
  });

  it("converts between stage and image coordinates using crop offset", () => {
    const crop = { x: 20, y: 10, width: 200, height: 150 };

    expect(pointerToImageCoords(30, 40, crop)).toEqual({ x: 50, y: 50 });
    expect(imageToStageCoords(50, 50, crop)).toEqual({ x: 30, y: 40 });
  });

  it("round-trips stage and image coordinates", () => {
    const crop = { x: 100, y: 50, width: 400, height: 300 };
    const stage = { x: 120, y: 80 };
    const image = pointerToImageCoords(stage.x, stage.y, crop);
    expect(imageToStageCoords(image.x, image.y, crop)).toEqual(stage);
  });

  it("reads pointer position from a Konva stage", () => {
    const crop = { x: 20, y: 10, width: 200, height: 150 };
    const stage = {
      getRelativePointerPosition: () => ({ x: 30, y: 40 }),
    } as unknown as Konva.Stage;

    expect(getImagePointerFromStage(stage, crop)).toEqual({ x: 50, y: 50 });
  });

  it("returns null when the stage has no pointer position", () => {
    const stage = {
      getRelativePointerPosition: () => null,
    } as unknown as Konva.Stage;

    expect(
      getImagePointerFromStage(stage, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      })
    ).toBeNull();
  });

  it("exports a PNG blob through the offscreen Konva stage", async () => {
    const image = new MockImage() as unknown as HTMLImageElement;
    const highlight = createHighlightElement(50, 50, 100, 80);
    const state = {
      ...initialEditorState,
      elements: [highlight],
    };

    const blob = await exportEditedImage(image, state, "png");

    expect(blob.type).toBe("image/png");
  });

  it("exports JPEG with the jpeg mime type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        blob: async () => new Blob(["jpeg"], { type: "image/jpeg" }),
      }))
    );

    const image = new MockImage() as unknown as HTMLImageElement;
    const blob = await exportEditedImage(image, initialEditorState, "jpeg");

    expect(blob.type).toBe("image/jpeg");
  });

  it("renders tapered arrow lines into the export layer", async () => {
    const image = new MockImage() as unknown as HTMLImageElement;
    const arrow = createArrowElement(10, 20, 110, 80, "#ff0000", {
      imageWidth: 800,
      imageHeight: 600,
      strokeWidth: 5,
    });
    const state = {
      ...initialEditorState,
      elements: [arrow],
    };

    await exportEditedImage(image, state, "png");

    const lineNode = konvaTestLayerAdds.find(
      (node): node is { attrs: Record<string, unknown> } =>
        typeof node === "object" &&
        node !== null &&
        "attrs" in node &&
        (node as { attrs: Record<string, unknown> }).attrs.closed === true
    );
    expect(lineNode).toBeDefined();
    expect(lineNode?.attrs.fill).toBe("#ff0000");
    expect(lineNode?.attrs.points).toEqual(expect.any(Array));
  });

  it("renders text with shadow props into the export layer", async () => {
    const image = new MockImage() as unknown as HTMLImageElement;
    const text = createTextElement(12, 24, "#ffffff", {
      imageWidth: 1920,
      imageHeight: 1080,
    });
    const state = {
      ...initialEditorState,
      elements: [text],
    };

    await exportEditedImage(image, state, "png");

    const textNode = konvaTestLayerAdds.find(
      (node): node is { attrs: Record<string, unknown> } =>
        typeof node === "object" &&
        node !== null &&
        "attrs" in node &&
        typeof (node as { attrs: Record<string, unknown> }).attrs.text ===
          "string"
    );
    expect(textNode).toBeDefined();
    expect(textNode?.attrs.text).toBe("Text");
    expect(textNode?.attrs).toMatchObject(getTextShadowProps(text.fontSize));
  });

  it("renders border strokes offset by crop", async () => {
    const image = new MockImage() as unknown as HTMLImageElement;
    const border = createBorderElement(120, 80, 40, 30, "#00ff00", {
      strokeWidth: 4,
    });
    const state = {
      ...initialEditorState,
      crop: { x: 100, y: 50, width: 400, height: 300 },
      elements: [border],
    };

    await exportEditedImage(image, state, "png");

    const borderNode = konvaTestLayerAdds.find(
      (node): node is { attrs: Record<string, unknown> } =>
        typeof node === "object" &&
        node !== null &&
        "attrs" in node &&
        (node as { attrs: Record<string, unknown> }).attrs.stroke === "#00ff00"
    );
    expect(borderNode?.attrs.x).toBe(20);
    expect(borderNode?.attrs.y).toBe(30);
    expect(borderNode?.attrs.strokeWidth).toBe(4);
    expect(borderNode?.attrs.cornerRadius).toBe(DEFAULT_CORNER_RADIUS);
  });

  it("renders blur regions with filters into the export layer", async () => {
    const image = new MockImage() as unknown as HTMLImageElement;
    const blur = createBlurElement(40, 30, 120, 90, {
      blurRadius: 18,
      cornerRadius: 0,
    });
    const state = {
      ...initialEditorState,
      elements: [blur],
    };

    await exportEditedImage(image, state, "png");

    const blurNode = konvaTestLayerAdds.find(
      (node): node is { attrs: Record<string, unknown>; cache: () => void } =>
        typeof node === "object" &&
        node !== null &&
        "attrs" in node &&
        Array.isArray(
          (node as { attrs: Record<string, unknown> }).attrs.filters
        )
    );
    expect(blurNode).toBeDefined();
    expect(blurNode?.attrs.blurRadius).toBe(18);
    expect(blurNode?.attrs.cornerRadius).toBe(0);
    expect(blurNode?.cache).toHaveBeenCalled();
  });

  it("renders rounded blur regions with corner radius on the export node", async () => {
    const image = new MockImage() as unknown as HTMLImageElement;
    const blur = createBlurElement(40, 30, 120, 90, {
      blurRadius: 18,
      cornerRadius: DEFAULT_CORNER_RADIUS,
    });
    const state = {
      ...initialEditorState,
      elements: [blur],
    };

    await exportEditedImage(image, state, "png");

    const blurNode = konvaTestLayerAdds.find(
      (node): node is { attrs: Record<string, unknown> } =>
        typeof node === "object" &&
        node !== null &&
        "attrs" in node &&
        Array.isArray(
          (node as { attrs: Record<string, unknown> }).attrs.filters
        )
    );
    expect(blurNode?.attrs.cornerRadius).toBe(DEFAULT_CORNER_RADIUS);
  });

  describe("highlight dim export", () => {
    it("renders one shared dim layer with fill-once and destination-out punches", async () => {
      const image = new MockImage() as unknown as HTMLImageElement;
      const highlight = createHighlightElement(50, 50, 100, 80, {
        cornerRadius: DEFAULT_CORNER_RADIUS,
      });

      await exportEditedImage(
        image,
        { ...initialEditorState, elements: [highlight] },
        "png"
      );

      expect(countHighlightDimNodes()).toBe(1);
      const dim = getHighlightDimCompositing();
      expect(dim.fillRectCount).toBe(1);
      expect(dim.holeFillCount).toBe(1);
      expect(dim.compositeOperations).toContain("destination-out");
    });

    it.each([
      { label: "rounded corners", cornerRadius: DEFAULT_CORNER_RADIUS },
      { label: "square corners", cornerRadius: 0 },
    ])(
      "punches out a single highlight hole ($label)",
      async ({ cornerRadius }) => {
        const image = new MockImage() as unknown as HTMLImageElement;
        const highlight = createHighlightElement(50, 50, 100, 80, {
          cornerRadius,
        });

        await exportEditedImage(
          image,
          { ...initialEditorState, elements: [highlight] },
          "png"
        );

        expect(getHighlightDimCompositing().holeFillCount).toBe(1);
      }
    );

    it("exports multiple highlights as one shared dim layer", async () => {
      const image = new MockImage() as unknown as HTMLImageElement;
      const highlightA = createHighlightElement(20, 20, 80, 60);
      const highlightB = createHighlightElement(200, 120, 100, 70);

      await exportEditedImage(
        image,
        { ...initialEditorState, elements: [highlightA, highlightB] },
        "png"
      );

      expect(countHighlightDimNodes()).toBe(1);
      const dim = getHighlightDimCompositing();
      expect(dim.fillRectCount).toBe(1);
      expect(dim.holeFillCount).toBe(2);
    });

    it("does not add a dim layer when there are no highlights", async () => {
      const image = new MockImage() as unknown as HTMLImageElement;
      const blur = createBlurElement(40, 30, 120, 90);

      await exportEditedImage(
        image,
        { ...initialEditorState, elements: [blur] },
        "png"
      );

      expect(countHighlightDimNodes()).toBe(0);
    });

    it("keeps a single dim layer when highlights are mixed with other elements", async () => {
      const image = new MockImage() as unknown as HTMLImageElement;
      const highlightA = createHighlightElement(20, 20, 80, 60);
      const blur = createBlurElement(40, 30, 120, 90);
      const highlightB = createHighlightElement(200, 120, 100, 70);

      await exportEditedImage(
        image,
        {
          ...initialEditorState,
          elements: [highlightA, blur, highlightB],
        },
        "png"
      );

      expect(countHighlightDimNodes()).toBe(1);
      expect(getHighlightDimCompositing().holeFillCount).toBe(2);
    });
  });
});

/** Minimal image stub for export tests. */
class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
}
