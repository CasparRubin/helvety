import { describe, expect, it } from "vitest";

import {
  createArrowElement,
  createBlurElement,
  createBorderElement,
  createHighlightElement,
  createTextElement,
  editorReducer,
  elementLabel,
  initialEditorState,
  normalizeRect,
} from "./editor-reducer";
import {
  DEFAULT_BLUR_RADIUS,
  DEFAULT_CORNER_RADIUS,
  DEFAULT_DIM_OPACITY,
  DEFAULT_STROKE,
} from "./editor-types";

describe("editorReducer", () => {
  it("adds, updates, deletes, and reorders elements", () => {
    const text = createTextElement(10, 20);
    const border = createBorderElement(0, 0, 100, 50);

    let state = editorReducer(initialEditorState, {
      type: "ADD_ELEMENT",
      element: text,
    });
    expect(state.elements).toHaveLength(1);
    expect(state.selectedId).toBe(text.id);

    state = editorReducer(state, {
      type: "ADD_ELEMENT",
      element: border,
    });
    expect(state.elements).toHaveLength(2);

    state = editorReducer(state, {
      type: "UPDATE_ELEMENT",
      id: text.id,
      patch: { text: "Hello" },
    });
    expect(state.elements[0]?.type === "text" && state.elements[0].text).toBe(
      "Hello"
    );

    state = editorReducer(state, {
      type: "REORDER_ELEMENT",
      id: text.id,
      direction: "up",
    });
    expect(state.elements[1]?.id).toBe(text.id);

    state = editorReducer(state, {
      type: "DELETE_ELEMENT",
      id: border.id,
    });
    expect(state.elements).toHaveLength(1);

    state = editorReducer(state, {
      type: "SET_CROP",
      crop: { x: 1, y: 2, width: 3, height: 4 },
    });
    expect(state.crop).toEqual({ x: 1, y: 2, width: 3, height: 4 });

    state = editorReducer(state, { type: "RESET_ANNOTATIONS" });
    expect(state.elements).toHaveLength(0);
    expect(state.crop).toBeNull();
    expect(state.activeTool).toBe("select");
  });

  it("switches to select when an element is selected", () => {
    const text = createTextElement(0, 0);
    let state = editorReducer(
      { ...initialEditorState, activeTool: "text" },
      { type: "ADD_ELEMENT", element: text }
    );

    state = editorReducer(state, { type: "SET_TOOL", tool: "arrow" });
    expect(state.activeTool).toBe("arrow");

    state = editorReducer(state, { type: "SELECT", id: text.id });
    expect(state.selectedId).toBe(text.id);
    expect(state.activeTool).toBe("select");
  });

  it("clears selection when deleting the selected element", () => {
    const border = createBorderElement(0, 0, 10, 10);
    let state = editorReducer(initialEditorState, {
      type: "ADD_ELEMENT",
      element: border,
    });

    state = editorReducer(state, {
      type: "DELETE_ELEMENT",
      id: border.id,
    });

    expect(state.elements).toHaveLength(0);
    expect(state.selectedId).toBeNull();
  });

  it("ignores reorder at z-order boundaries", () => {
    const bottom = createBorderElement(0, 0, 10, 10);
    const top = createTextElement(1, 1);
    let state = editorReducer(initialEditorState, {
      type: "ADD_ELEMENT",
      element: bottom,
    });
    state = editorReducer(state, {
      type: "ADD_ELEMENT",
      element: top,
    });

    const unchangedDown = editorReducer(state, {
      type: "REORDER_ELEMENT",
      id: bottom.id,
      direction: "down",
    });
    expect(unchangedDown.elements.map((element) => element.id)).toEqual(
      state.elements.map((element) => element.id)
    );

    const unchangedUp = editorReducer(state, {
      type: "REORDER_ELEMENT",
      id: top.id,
      direction: "up",
    });
    expect(unchangedUp.elements.map((element) => element.id)).toEqual(
      state.elements.map((element) => element.id)
    );
  });

  it("creates labeled elements and normalizes rects", () => {
    const arrow = createArrowElement(0, 0, 10, 10);
    expect(elementLabel(arrow)).toBe("Arrow");

    const rect = normalizeRect(10, 10, 0, 0, false);
    expect(rect).toEqual({ x: 0, y: 0, width: 10, height: 10 });

    const square = normalizeRect(0, 0, 20, 5, true);
    expect(square.width).toBe(square.height);
  });

  it("labels every element type for the layers panel", () => {
    const longText = createTextElement(0, 0);
    longText.text = "abcdefghijklmnopqrstuvwxyz";
    expect(elementLabel(longText)).toBe('Text: "abcdefghijklmnop…"');
    expect(elementLabel(createArrowElement(0, 0, 1, 1))).toBe("Arrow");
    expect(elementLabel(createBorderElement(0, 0, 1, 1))).toBe("Border");
    expect(elementLabel(createHighlightElement(0, 0, 1, 1))).toBe("Highlight");
    expect(elementLabel(createBlurElement(0, 0, 1, 1))).toBe("Blur");
  });

  it("applies optional color when creating drawable elements", () => {
    expect(createTextElement(0, 0, "#00ff00").fill).toBe("#00ff00");
    expect(createArrowElement(0, 0, 1, 1, "#112233").stroke).toBe("#112233");
    expect(createBorderElement(0, 0, 1, 1, "#445566").stroke).toBe("#445566");
    expect(createArrowElement(0, 0, 1, 1).stroke).toBe(DEFAULT_STROKE);
    expect(createBorderElement(0, 0, 1, 1).stroke).toBe(DEFAULT_STROKE);
  });

  it("scales default sizes from image dimensions", () => {
    const text = createTextElement(0, 0, undefined, {
      imageWidth: 3840,
      imageHeight: 2160,
    });
    expect(text.fontSize).toBe(72);

    const arrow = createArrowElement(0, 0, 1, 1, undefined, {
      imageWidth: 1920,
      imageHeight: 1080,
    });
    expect(arrow.strokeWidth).toBe(5);
  });

  it("honours explicit stroke width and font size overrides", () => {
    const arrow = createArrowElement(0, 0, 1, 1, undefined, {
      imageWidth: 3840,
      imageHeight: 2160,
      strokeWidth: 12,
    });
    expect(arrow.strokeWidth).toBe(12);

    const text = createTextElement(0, 0, undefined, {
      imageWidth: 3840,
      imageHeight: 2160,
      fontSize: 48,
    });
    expect(text.fontSize).toBe(48);
  });

  it("uses default blur, dim, and corner radius when options are omitted", () => {
    expect(createBlurElement(0, 0, 10, 10).blurRadius).toBe(
      DEFAULT_BLUR_RADIUS
    );
    expect(createHighlightElement(0, 0, 10, 10).dimOpacity).toBe(
      DEFAULT_DIM_OPACITY
    );
    expect(createBorderElement(0, 0, 10, 10).cornerRadius).toBe(
      DEFAULT_CORNER_RADIUS
    );
    expect(createHighlightElement(0, 0, 10, 10).cornerRadius).toBe(
      DEFAULT_CORNER_RADIUS
    );
    expect(createBlurElement(0, 0, 10, 10).cornerRadius).toBe(
      DEFAULT_CORNER_RADIUS
    );
  });

  it("honours explicit blur radius, dim opacity, and corner radius overrides", () => {
    expect(createBlurElement(0, 0, 10, 10, { blurRadius: 24 }).blurRadius).toBe(
      24
    );
    expect(
      createHighlightElement(0, 0, 10, 10, { dimOpacity: 0.35 }).dimOpacity
    ).toBe(0.35);
    expect(
      createBorderElement(0, 0, 10, 10, undefined, { cornerRadius: 0 })
        .cornerRadius
    ).toBe(0);
  });
});
