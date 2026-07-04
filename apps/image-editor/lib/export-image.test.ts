import { describe, expect, it } from "vitest";

import { createHighlightElement, initialEditorState } from "./editor-reducer";
import {
  exportEditedImage,
  getLogicalStageSize,
  imageToStageCoords,
  pointerToImageCoords,
} from "./export-image";

describe("export-image helpers", () => {
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
});

/** Minimal image stub for export tests. */
class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
}
