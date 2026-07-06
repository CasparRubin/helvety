import { getRangeInputByLabel } from "@helvety/shared/test-utils/base-ui-test-helpers";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createHighlightElement,
  initialEditorState,
} from "@/lib/editor-reducer";

const dispatchMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-editor-state", () => ({
  useEditorState: () => ({
    state: {
      ...initialEditorState,
      activeTool: "highlight" as const,
      elements: [createHighlightElement(10, 20, 100, 80)],
      selectedId: null,
    },
    dispatch: dispatchMock,
    setTool: vi.fn(),
    select: vi.fn(),
    setCrop: vi.fn(),
    resetAnnotations: vi.fn(),
  }),
}));

vi.mock("@/components/editor/editor-canvas", () => ({
  EditorCanvas: () => <div data-testid="editor-canvas" />,
}));

vi.mock("@/lib/export-image", () => ({
  exportEditedImage: vi
    .fn()
    .mockResolvedValue(new Blob(["png"], { type: "image/png" })),
}));

vi.mock("@/lib/canvas-export-limits", () => ({
  getCanvasExportLimitsCached: vi.fn().mockResolvedValue({
    maxWidth: 8192,
    maxHeight: 8192,
    maxTotalPixels: 67_108_864,
  }),
  clampOutputDimensions: vi.fn((width: number, height: number) => ({
    width,
    height,
    clamped: false,
  })),
}));

import { HelvetyImageEditor } from "./helvety-image-editor";

/** Minimal `Image` stub so upload flows resolve dimensions in tests. */
class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    this.onload?.();
  }
}

describe("HelvetyImageEditor highlight dim", () => {
  const originalImage = globalThis.Image;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("Image", MockImage);
    URL.createObjectURL = vi.fn(() => "blob:mock-image");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.stubGlobal("Image", originalImage);
    vi.restoreAllMocks();
  });

  it("dispatches SYNC_HIGHLIGHT_DIM when the tool dim slider changes", async () => {
    render(<HelvetyImageEditor />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["pixels"], "photo.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(getRangeInputByLabel(screen, "Dim")).toBeInTheDocument();
    });

    const slider = getRangeInputByLabel(screen, "Dim");
    slider.focus();
    fireEvent.keyDown(slider, { key: "ArrowLeft" });

    expect(dispatchMock).toHaveBeenCalledWith({
      type: "SYNC_HIGHLIGHT_DIM",
      dimOpacity: 0.5,
    });
  });
});
