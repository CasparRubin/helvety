import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HelvetyImageUpscaler } from "@/components/helvety-image-upscaler";
import { upscaleItemsSequentially } from "@/lib/upscale-pipeline";

import type * as UpscalePipelineModule from "@/lib/upscale-pipeline";

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
}));

vi.mock("@/lib/upscale-pipeline", async (importOriginal) => {
  const actual: typeof UpscalePipelineModule = await importOriginal();
  return {
    ...actual,
    upscaleItemsSequentially: vi.fn(actual.upscaleItemsSequentially),
  };
});

const mockUpscaleItemsSequentially = vi.mocked(upscaleItemsSequentially);

describe("HelvetyImageUpscaler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Uploads a single valid image file into the hidden input. */
  function uploadImageFile(): void {
    const input = screen.getByLabelText("Upload images");
    const file = new File(["image"], "sample.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
  }

  it("renders empty state and default runtime text", () => {
    render(<HelvetyImageUpscaler />);

    expect(screen.getByText("Drag and drop images here")).toBeInTheDocument();
    expect(
      screen.getByText(/Processed locally in your browser\./)
    ).toBeInTheDocument();
    expect(screen.getByText("Runtime: pending")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upscale" })).toBeDisabled();
  });

  it("shows command-bar actions for a queued image", () => {
    render(<HelvetyImageUpscaler />);

    uploadImageFile();

    expect(screen.getByRole("button", { name: "Add More" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Upscale" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Clear All", hidden: true })
    ).toBeEnabled();
  });

  it("shows clear confirmation copy from the command bar", () => {
    render(<HelvetyImageUpscaler />);

    uploadImageFile();
    fireEvent.click(screen.getByRole("button", { name: "Clear All" }));

    expect(screen.getByText("Clear all images?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This will remove all queued and processed images. This action cannot be undone."
      )
    ).toBeInTheDocument();
  });

  it("shows target input controls when target dimension mode is selected", () => {
    render(<HelvetyImageUpscaler />);

    const [modeSelect] = screen.getAllByRole("combobox");
    expect(modeSelect).toBeDefined();
    if (!modeSelect) {
      throw new Error("Mode select was not rendered.");
    }
    fireEvent.change(modeSelect, { target: { value: "target" } });

    expect(screen.getByDisplayValue("Width")).toBeInTheDocument();
    expect(screen.getAllByDisplayValue("2048")).not.toHaveLength(0);
  });

  it("supports opening compact mobile settings in command bar", () => {
    render(<HelvetyImageUpscaler />);

    fireEvent.click(screen.getByRole("button", { name: "Upscale settings" }));

    expect(screen.getByLabelText("Mode")).toBeInTheDocument();
  });

  it("keeps mobile settings controls wired to upscale state", () => {
    render(<HelvetyImageUpscaler />);

    fireEvent.click(screen.getByRole("button", { name: "Upscale settings" }));

    fireEvent.change(screen.getByLabelText("Mode"), {
      target: { value: "target" },
    });
    expect(screen.getByLabelText("Dimension")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Target value"), {
      target: { value: "3000" },
    });
    expect(screen.getAllByDisplayValue("3000")).not.toHaveLength(0);
  });

  it("uses success toast and runtime label when all items complete", async () => {
    mockUpscaleItemsSequentially.mockResolvedValueOnce({
      runtime: "webgpu",
      totalCount: 1,
      completedCount: 1,
      failedCount: 0,
    });
    render(<HelvetyImageUpscaler />);
    uploadImageFile();

    fireEvent.click(screen.getByRole("button", { name: "Upscale" }));

    await waitFor(() => {
      expect(toastMocks.success).toHaveBeenCalledWith(
        "Upscaling complete (1/1 images)."
      );
    });
    expect(screen.getByText("Runtime: webgpu")).toBeInTheDocument();
  });

  it("uses warning toast when upscaling partially succeeds", async () => {
    mockUpscaleItemsSequentially.mockResolvedValueOnce({
      runtime: "wasm-fallback",
      totalCount: 3,
      completedCount: 2,
      failedCount: 1,
    });
    render(<HelvetyImageUpscaler />);
    uploadImageFile();

    fireEvent.click(screen.getByRole("button", { name: "Upscale" }));

    await waitFor(() => {
      expect(toastMocks.warning).toHaveBeenCalledWith(
        "Upscaling finished with errors (2 succeeded, 1 failed)."
      );
    });
  });

  it("uses error toast when the processing call throws", async () => {
    mockUpscaleItemsSequentially.mockRejectedValueOnce(
      new Error("Worker failed")
    );
    render(<HelvetyImageUpscaler />);
    uploadImageFile();

    fireEvent.click(screen.getByRole("button", { name: "Upscale" }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith("Worker failed");
    });
  });
});
