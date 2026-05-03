import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampOutputDimensions,
  resetCanvasExportLimitsCacheForTests,
  type CanvasExportLimits,
} from "@/lib/canvas-export-limits";
import { UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE } from "@/lib/upscale-export-limit-message";
import {
  createDownloadName,
  IMAGE_FILE_SIZE_LIMIT_BYTES,
  MAX_IMAGE_PIXELS,
  calculateTargetSize,
  parseImageFilesSync,
  type UpscaleItem,
  upscaleItemsSequentially,
} from "@/lib/upscale-pipeline";

const UNCLAMPED_TEST_CANVAS_LIMITS: CanvasExportLimits = {
  maxWidth: 60_000,
  maxHeight: 60_000,
  maxTotalPixels: 3_000_000_000,
};

const workerMocks = vi.hoisted(() => ({
  getRuntime: vi.fn(),
  upscale: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("@/lib/upscale-worker-client", () => ({
  createUpscaleWorkerClient: () => workerMocks,
}));

function createItem(width: number, height: number): UpscaleItem {
  return {
    id: "id",
    file: new File(["x"], "sample.png", { type: "image/png" }),
    previewUrl: "blob:preview",
    outputUrl: null,
    outputSignature: null,
    width,
    height,
    status: "queued",
    error: null,
    exportDimensions: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetCanvasExportLimitsCacheForTests();
});

describe("calculateTargetSize", () => {
  it("calculates scale mode dimensions", () => {
    const item = createItem(1000, 500);
    const result = calculateTargetSize(item, {
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
    });
    expect(result).toEqual({ width: 2000, height: 1000 });
  });

  it("calculates target width while preserving aspect ratio", () => {
    const item = createItem(1600, 900);
    const result = calculateTargetSize(item, {
      sizeMode: "target",
      scale: 2,
      targetMode: "width",
      targetValue: 1200,
    });
    expect(result).toEqual({ width: 1200, height: 676 });
  });

  it("calculates target height while preserving aspect ratio", () => {
    const item = createItem(1200, 800);
    const result = calculateTargetSize(item, {
      sizeMode: "target",
      scale: 2,
      targetMode: "height",
      targetValue: 1500,
    });
    expect(result).toEqual({ width: 2250, height: 1500 });
  });
});

describe("parseImageFilesSync", () => {
  it("accepts image files and rejects unsupported files", () => {
    const png = new File(["a"], "ok.png", { type: "image/png" });
    const txt = new File(["a"], "bad.txt", { type: "text/plain" });
    const files: FileList = {
      0: png,
      1: txt,
      length: 2,
      item(index: number) {
        return [png, txt][index] ?? null;
      },
      [Symbol.iterator]() {
        return [png, txt][Symbol.iterator]();
      },
    };

    const { accepted, errors } = parseImageFilesSync(files);

    expect(accepted).toHaveLength(1);
    expect(errors).toHaveLength(1);
  });

  it("deduplicates duplicate files by name/size/lastModified", () => {
    const sharedLastModified = 1_717_171_717_000;
    const fileA = new File(["dup"], "same.png", {
      type: "image/png",
      lastModified: sharedLastModified,
    });
    const fileB = new File(["dup"], "same.png", {
      type: "image/png",
      lastModified: sharedLastModified,
    });
    const files: FileList = {
      0: fileA,
      1: fileB,
      length: 2,
      item(index: number) {
        return [fileA, fileB][index] ?? null;
      },
      [Symbol.iterator]() {
        return [fileA, fileB][Symbol.iterator]();
      },
    };

    const { accepted, errors } = parseImageFilesSync(files);
    expect(errors).toHaveLength(0);
    expect(accepted).toHaveLength(1);
  });

  it("rejects oversized files", () => {
    const oversized = new File(
      [new Uint8Array(IMAGE_FILE_SIZE_LIMIT_BYTES + 1)],
      "huge.png",
      { type: "image/png" }
    );
    const files: FileList = {
      0: oversized,
      length: 1,
      item(index: number) {
        return [oversized][index] ?? null;
      },
      [Symbol.iterator]() {
        return [oversized][Symbol.iterator]();
      },
    };

    const { accepted, errors } = parseImageFilesSync(files);
    expect(accepted).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("exceeds");
  });
});

describe("createDownloadName", () => {
  it("appends -upscaled and forces png extension", () => {
    expect(createDownloadName("photo.webp")).toBe("photo-upscaled.png");
    expect(createDownloadName("no-extension")).toBe(
      "no-extension-upscaled.png"
    );
  });
});

describe("upscaleItemsSequentially", () => {
  it("processes items sequentially and disposes the worker", async () => {
    workerMocks.getRuntime.mockResolvedValueOnce("webgpu");
    workerMocks.upscale
      .mockResolvedValueOnce({ outputUrl: "blob:out-1" })
      .mockResolvedValueOnce({ outputUrl: "blob:out-2" });
    const onProgress = vi.fn();
    const itemA = createItem(100, 50);
    const itemB = createItem(200, 100);

    const result = await upscaleItemsSequentially({
      items: [itemA, itemB],
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
      onProgress,
      canvasLimitsOverride: UNCLAMPED_TEST_CANVAS_LIMITS,
    });

    expect(result).toEqual({
      runtime: "webgpu",
      totalCount: 2,
      completedCount: 2,
      failedCount: 0,
    });
    expect(workerMocks.upscale).toHaveBeenNthCalledWith(1, {
      file: itemA.file,
      width: 200,
      height: 100,
    });
    expect(workerMocks.upscale).toHaveBeenNthCalledWith(2, {
      file: itemB.file,
      width: 400,
      height: 200,
    });
    expect(onProgress).toHaveBeenCalledWith(itemA.id, {
      status: "processing",
      error: null,
      exportDimensions: null,
    });
    expect(onProgress).toHaveBeenCalledWith(itemB.id, {
      status: "done",
      outputUrl: "blob:out-2",
      error: null,
      exportDimensions: { width: 400, height: 200 },
    });
    expect(workerMocks.dispose).toHaveBeenCalledTimes(1);
  });

  it("marks oversized images as failed without calling worker upscaling", async () => {
    workerMocks.getRuntime.mockResolvedValueOnce("wasm-fallback");
    const onProgress = vi.fn();
    const huge = createItem(MAX_IMAGE_PIXELS, 2);

    const result = await upscaleItemsSequentially({
      items: [huge],
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
      onProgress,
      canvasLimitsOverride: UNCLAMPED_TEST_CANVAS_LIMITS,
    });

    expect(result.completedCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(workerMocks.upscale).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(
      huge.id,
      expect.objectContaining({
        status: "failed",
        error: expect.stringContaining("exceeds"),
        exportDimensions: null,
      })
    );
  });

  it("revokes stale output URLs before replacing with new output", async () => {
    const revokeSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {
        return;
      });
    workerMocks.getRuntime.mockResolvedValueOnce("webgpu");
    workerMocks.upscale.mockResolvedValueOnce({ outputUrl: "blob:updated" });
    const onProgress = vi.fn();
    const item = { ...createItem(120, 60), outputUrl: "blob:stale" };

    const result = await upscaleItemsSequentially({
      items: [item],
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
      onProgress,
      canvasLimitsOverride: UNCLAMPED_TEST_CANVAS_LIMITS,
    });

    expect(result.completedCount).toBe(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:stale");
    expect(onProgress).toHaveBeenCalledWith(item.id, {
      status: "done",
      outputUrl: "blob:updated",
      error: null,
      exportDimensions: { width: 240, height: 120 },
    });
  });

  it("clamps full-resolution phone 2× output to strict canvas limits and notifies", async () => {
    workerMocks.getRuntime.mockResolvedValueOnce("wasm-fallback");
    workerMocks.upscale.mockResolvedValueOnce({ outputUrl: "blob:phone" });
    const onProgress = vi.fn();
    const onOutputClamped = vi.fn();
    const phonePhoto = createItem(4032, 3024);
    const strictLimits: CanvasExportLimits = {
      maxWidth: 4096,
      maxHeight: 4096,
      maxTotalPixels: 16_777_216,
    };
    const expectedApplied = clampOutputDimensions(8064, 6048, strictLimits);

    const result = await upscaleItemsSequentially({
      items: [phonePhoto],
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
      onProgress,
      onOutputClamped,
      canvasLimitsOverride: strictLimits,
    });

    expect(result.completedCount).toBe(1);
    expect(onOutputClamped).toHaveBeenCalledTimes(1);
    expect(onOutputClamped).toHaveBeenCalledWith({
      fileName: phonePhoto.file.name,
      requested: { width: 8064, height: 6048 },
      applied: {
        width: expectedApplied.width,
        height: expectedApplied.height,
      },
    });
    expect(workerMocks.upscale).toHaveBeenCalledWith({
      file: phonePhoto.file,
      width: expect.any(Number),
      height: expect.any(Number),
    });
    const firstCall = workerMocks.upscale.mock.calls[0];
    if (!firstCall) {
      throw new Error("expected upscale to be called");
    }
    const upscaleArg = firstCall[0];
    expect(upscaleArg.width).toBeLessThanOrEqual(4096);
    expect(upscaleArg.height).toBeLessThanOrEqual(4096);
    expect(upscaleArg.width * upscaleArg.height).toBeLessThanOrEqual(
      16_777_216
    );
  });

  it("maps invalid state worker errors to the shared export limit message", async () => {
    workerMocks.getRuntime.mockResolvedValueOnce("wasm-fallback");
    workerMocks.upscale.mockRejectedValueOnce(
      new Error("The object is in an invalid state.")
    );
    const onProgress = vi.fn();
    const item = createItem(100, 50);

    await upscaleItemsSequentially({
      items: [item],
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
      onProgress,
      canvasLimitsOverride: UNCLAMPED_TEST_CANVAS_LIMITS,
    });

    expect(onProgress).toHaveBeenCalledWith(item.id, {
      status: "failed",
      error: UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE,
      exportDimensions: null,
    });
  });

  it("maps DOMException InvalidStateError to the shared export limit message", async () => {
    workerMocks.getRuntime.mockResolvedValueOnce("wasm-fallback");
    workerMocks.upscale.mockRejectedValueOnce(
      new DOMException(
        "The object is in an invalid state.",
        "InvalidStateError"
      )
    );
    const onProgress = vi.fn();
    const item = createItem(100, 50);

    await upscaleItemsSequentially({
      items: [item],
      sizeMode: "scale",
      scale: 2,
      targetMode: "width",
      targetValue: 0,
      onProgress,
      canvasLimitsOverride: UNCLAMPED_TEST_CANVAS_LIMITS,
    });

    expect(onProgress).toHaveBeenCalledWith(item.id, {
      status: "failed",
      error: UPSCALE_EXPORT_SIZE_LIMIT_MESSAGE,
      exportDimensions: null,
    });
  });
});
