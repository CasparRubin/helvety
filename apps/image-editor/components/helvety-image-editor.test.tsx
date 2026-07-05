import { TOAST_DURATIONS } from "@helvety/shared/constants";
import {
  getRangeInputByLabel,
  openMenuTrigger,
} from "@helvety/shared/test-utils/base-ui-test-helpers";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
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

import { clampOutputDimensions } from "@/lib/canvas-export-limits";
import { getDefaultToolSizes } from "@/lib/default-tool-sizes";
import { exportEditedImage } from "@/lib/export-image";

import { HelvetyImageEditor } from "./helvety-image-editor";

/**
 * Minimal `Image` stub so upload flows resolve dimensions in tests.
 */
class MockImage {
  naturalWidth = 800;
  naturalHeight = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    this.onload?.();
  }
}

describe("HelvetyImageEditor", () => {
  const originalImage = globalThis.Image;
  const createObjectURL = vi.fn(() => "blob:mock-image");
  const revokeObjectURL = vi.fn();
  const clickSpy = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("Image", MockImage);
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(clickSpy);
  });

  afterEach(() => {
    vi.stubGlobal("Image", originalImage);
    vi.restoreAllMocks();
  });

  /** Upload a PNG through the hidden file input. */
  function uploadImageFile(name = "sample.png"): void {
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["pixels"], name, { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
  }

  it("shows empty dropzone before an image is loaded", () => {
    render(<HelvetyImageEditor />);
    expect(screen.getByText("Drag and drop an image here")).toBeInTheDocument();
    expect(
      screen.getByText(/Processed locally in your browser/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Upload image")).toBeInTheDocument();
  });

  it("rejects unsupported uploads via toast", () => {
    render(<HelvetyImageEditor />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["x"], "bad.gif", { type: "image/gif" });
    fireEvent.change(input, { target: { files: [file] } });

    expect(toastMocks.error).toHaveBeenCalledWith(
      expect.stringContaining("PNG"),
      { duration: TOAST_DURATIONS.ERROR }
    );
  });

  it("rejects oversized uploads via toast", () => {
    render(<HelvetyImageEditor />);

    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File([new Uint8Array(26 * 1024 * 1024)], "huge.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [file] } });

    expect(toastMocks.error).toHaveBeenCalledWith(
      expect.stringContaining("25 MB"),
      { duration: TOAST_DURATIONS.ERROR }
    );
  });

  it("shows the layers panel empty state before an image is loaded", () => {
    render(<HelvetyImageEditor />);

    expect(
      screen.getByRole("region", { name: "Image editor workspace" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "Image editor layer controls" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Open an image to see layers.")
    ).toBeInTheDocument();
  });

  it("shows the canvas and command-bar tools after a valid upload", async () => {
    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(screen.getByTestId("editor-canvas")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Text" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Highlight" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Export image/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    expect(
      screen.getByText("Select a tool or layer to edit properties.")
    ).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("shows tool properties when a drawing tool is selected", async () => {
    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Text" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Text" }));

    expect(screen.getByLabelText("Color")).toBeInTheDocument();
  });

  it("shows blur and highlight sliders when those tools are active", async () => {
    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Blur" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Blur" }));
    expect(getRangeInputByLabel(screen, "Blur")).toHaveAttribute(
      "aria-valuenow",
      "12"
    );

    fireEvent.click(screen.getByRole("button", { name: "Highlight" }));
    expect(getRangeInputByLabel(screen, "Dim")).toHaveAttribute(
      "aria-valuenow",
      "0.55"
    );
  });

  it("shows stroke slider when arrow or border tools are active", async () => {
    render(<HelvetyImageEditor />);
    uploadImageFile();

    const { strokeWidth } = getDefaultToolSizes(800, 600);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Arrow" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Arrow" }));
    expect(getRangeInputByLabel(screen, "Stroke")).toHaveAttribute(
      "aria-valuenow",
      String(strokeWidth)
    );

    fireEvent.click(screen.getByRole("button", { name: "Border" }));
    expect(getRangeInputByLabel(screen, "Stroke")).toHaveAttribute(
      "aria-valuenow",
      String(strokeWidth)
    );
  });

  it("opens the file picker from the drop zone via keyboard", () => {
    render(<HelvetyImageEditor />);

    const dropZone = screen.getByRole("button", {
      name: "File drop zone. Click to select an image.",
    });
    const input = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.keyDown(dropZone, { key: "Enter" });

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("shows clear confirmation copy from the command bar", async () => {
    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByText("Clear annotations?")).toBeInTheDocument();
    expect(
      screen.getByText(/removes all layers and crop settings/i)
    ).toBeInTheDocument();
  });

  it("exports the edited image and triggers download", async () => {
    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Export image/i })
      ).toBeEnabled();
    });

    openMenuTrigger(screen.getByRole("button", { name: /Export image/i }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Export PNG" })
    );

    await waitFor(() => {
      expect(exportEditedImage).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(toastMocks.success).toHaveBeenCalledWith("Image exported.", {
        duration: TOAST_DURATIONS.SUCCESS,
      });
    });
    expect(revokeObjectURL).toHaveBeenCalled();
  });

  it("shows an info toast when export dimensions are clamped", async () => {
    vi.mocked(clampOutputDimensions).mockReturnValueOnce({
      width: 4096,
      height: 3072,
      clamped: true,
    });

    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Export image/i })
      ).toBeEnabled();
    });

    openMenuTrigger(screen.getByRole("button", { name: /Export image/i }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Export PNG" })
    );

    await waitFor(() => {
      expect(toastMocks.info).toHaveBeenCalledWith(
        "Output size limited by your browser.",
        { duration: TOAST_DURATIONS.INFO }
      );
    });
  });

  it("shows an error toast when export fails", async () => {
    vi.mocked(exportEditedImage).mockRejectedValueOnce(
      new Error("canvas fail")
    );

    render(<HelvetyImageEditor />);
    uploadImageFile();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Export image/i })
      ).toBeEnabled();
    });

    openMenuTrigger(screen.getByRole("button", { name: /Export image/i }));
    fireEvent.click(
      await screen.findByRole("menuitem", { name: "Export PNG" })
    );

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith("Export failed.", {
        duration: TOAST_DURATIONS.ERROR,
      });
    });
  });
});
