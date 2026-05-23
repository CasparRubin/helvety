import { TOAST_DURATIONS } from "@helvety/shared/constants";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HelvetyImageUpscaler } from "@/components/helvety-image-upscaler";
import { upscaleItemsSequentially } from "@/lib/upscale-pipeline";

import type * as UpscalePipelineModule from "@/lib/upscale-pipeline";

const toastMocks = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
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
    readImageDimensions: vi
      .fn()
      .mockResolvedValue({ width: 1200, height: 800 }),
  };
});

const mockUpscaleItemsSequentially = vi.mocked(upscaleItemsSequentially);

describe("HelvetyImageUpscaler", () => {
  const originalWebAssembly = globalThis.WebAssembly;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("WebAssembly", originalWebAssembly);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("WebAssembly", originalWebAssembly);
  });

  /** Uploads a single valid image file into the hidden input. */
  function uploadImageFile(): void {
    const input = screen.getByLabelText("Upload images");
    const file = new File(["image"], "sample.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [file] } });
  }

  it("renders empty state for local-only processing", () => {
    render(<HelvetyImageUpscaler />);

    expect(screen.getByText("Drag and drop images here")).toBeInTheDocument();
    expect(
      screen.getByText(/Processed locally in your browser\./)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upscale all" })).toBeDisabled();
  });

  it("shows command-bar actions for a queued image", async () => {
    render(<HelvetyImageUpscaler />);

    uploadImageFile();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add More" })).toBeEnabled();
    });
    expect(screen.getByRole("button", { name: "Add More" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "Clear All", hidden: true })
    ).toBeEnabled();
  });

  it("shows clear confirmation copy from the command bar", async () => {
    render(<HelvetyImageUpscaler />);

    uploadImageFile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Clear All" })).toBeEnabled();
    });
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

    const modeSelect = screen.getByLabelText("Mode");
    expect(modeSelect).toBeInTheDocument();
    fireEvent.change(modeSelect, { target: { value: "target" } });

    expect(screen.getAllByDisplayValue("Width").length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue("2048")).not.toHaveLength(0);
  });

  it("supports opening compact mobile settings in command bar", () => {
    render(<HelvetyImageUpscaler />);

    fireEvent.click(screen.getByRole("button", { name: "Upscale settings" }));

    expect(document.getElementById("mobile-upscale-mode")).toBeInTheDocument();
    expect(document.getElementById("mobile-upscale-engine")).toBeNull();
  });

  it("keeps mobile settings controls wired to upscale state", () => {
    render(<HelvetyImageUpscaler />);

    fireEvent.click(screen.getByRole("button", { name: "Upscale settings" }));

    const mobileModeSelect = document.getElementById(
      "mobile-upscale-mode"
    ) as HTMLSelectElement | null;
    if (!mobileModeSelect) {
      throw new Error("Mobile Mode select was not rendered.");
    }
    fireEvent.change(mobileModeSelect, { target: { value: "target" } });

    const mobileTargetValue = document.getElementById(
      "mobile-upscale-target"
    ) as HTMLInputElement | null;
    if (!mobileTargetValue) {
      throw new Error("Mobile Target value input was not rendered.");
    }
    fireEvent.change(mobileTargetValue, { target: { value: "3000" } });
    expect(screen.getAllByDisplayValue("3000").length).toBeGreaterThan(0);
  });

  it("toggles per-image action between upscale and download based on settings", async () => {
    mockUpscaleItemsSequentially.mockImplementationOnce(async (options) => {
      const [firstItem] = options.items;
      if (firstItem) {
        options.onProgress(firstItem.id, {
          status: "processing",
          error: null,
          exportDimensions: null,
        });
        options.onProgress(firstItem.id, {
          status: "done",
          outputUrl: "blob:out-1",
          error: null,
          exportDimensions: { width: 2400, height: 1600 },
        });
      }
      return {
        runtime: "webgpu",
        totalCount: 1,
        completedCount: 1,
        failedCount: 0,
      };
    });
    render(<HelvetyImageUpscaler />);
    uploadImageFile();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Upscale" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
    });

    const modeSelect = screen.getByLabelText("Mode");
    fireEvent.change(modeSelect, { target: { value: "target" } });

    expect(screen.getByRole("button", { name: "Upscale" })).toBeEnabled();
  });

  it("uses success toast when all items complete", async () => {
    mockUpscaleItemsSequentially.mockResolvedValueOnce({
      runtime: "webgpu",
      totalCount: 1,
      completedCount: 1,
      failedCount: 0,
    });
    render(<HelvetyImageUpscaler />);
    uploadImageFile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Upscale all" }));

    await waitFor(() => {
      expect(toastMocks.success).toHaveBeenCalledWith(
        "Upscaling complete (1/1 images).",
        { duration: TOAST_DURATIONS.SUCCESS }
      );
    });
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
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Upscale all" }));

    await waitFor(() => {
      expect(toastMocks.warning).toHaveBeenCalledWith(
        "Upscaling finished with errors (2 succeeded, 1 failed).",
        { duration: TOAST_DURATIONS.INFO }
      );
    });
  });

  it("uses error toast when the processing call throws", async () => {
    mockUpscaleItemsSequentially.mockRejectedValueOnce(
      new Error("Worker failed")
    );
    render(<HelvetyImageUpscaler />);
    uploadImageFile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Upscale all" }));

    await waitFor(() => {
      expect(toastMocks.error).toHaveBeenCalledWith("Worker failed", {
        duration: TOAST_DURATIONS.ERROR,
      });
    });
  });

  it("shows a missing-out notice and uses canvas when WebAssembly is unavailable", async () => {
    vi.stubGlobal("WebAssembly", undefined);
    mockUpscaleItemsSequentially.mockResolvedValueOnce({
      runtime: "canvas",
      totalCount: 1,
      completedCount: 1,
      failedCount: 0,
    });

    render(<HelvetyImageUpscaler />);

    expect(
      screen.getByText("Your browser is missing out on AI upscaling.")
    ).toBeInTheDocument();
    uploadImageFile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: "Upscale all" }));

    await waitFor(() => {
      expect(mockUpscaleItemsSequentially).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: "canvas" })
      );
    });
  });

  it("shows info toast when the pipeline reports clamped output dimensions", async () => {
    mockUpscaleItemsSequentially.mockImplementationOnce(async (options) => {
      options.onOutputClamped?.({
        fileName: "sample.png",
        requested: { width: 8064, height: 6048 },
        applied: { width: 4096, height: 3072 },
      });
      const [first] = options.items;
      if (first) {
        options.onProgress(first.id, {
          status: "processing",
          error: null,
          exportDimensions: null,
        });
        options.onProgress(first.id, {
          status: "done",
          outputUrl: "blob:out",
          error: null,
          exportDimensions: { width: 4096, height: 3072 },
        });
      }
      return {
        runtime: "wasm-fallback",
        totalCount: 1,
        completedCount: 1,
        failedCount: 0,
      };
    });
    render(<HelvetyImageUpscaler />);
    uploadImageFile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Upscale all" }));

    await waitFor(() => {
      expect(toastMocks.info).toHaveBeenCalledWith(
        "Output size limited by your browser",
        expect.objectContaining({
          description: expect.stringContaining("8064×6048"),
        })
      );
    });
  });

  it("applies shimmer styling while an image is processing", async () => {
    mockUpscaleItemsSequentially.mockImplementationOnce(async (options) => {
      const [first] = options.items;
      if (first) {
        options.onProgress(first.id, {
          status: "processing",
          error: null,
          exportDimensions: null,
        });
      }
      return {
        runtime: "webgpu",
        totalCount: 1,
        completedCount: 0,
        failedCount: 1,
      };
    });

    render(<HelvetyImageUpscaler />);
    uploadImageFile();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Upscale all" })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole("button", { name: "Upscale all" }));

    await waitFor(() => {
      const processingLabel = screen.getByText("Processing");
      expect(processingLabel).toHaveClass("processing-shine");
    });
  });
});
