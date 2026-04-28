/* eslint-disable jsdoc/require-jsdoc */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createDownloadName,
  IMAGE_FILE_SIZE_LIMIT_BYTES,
  MAX_IMAGE_PIXELS,
  calculateTargetSize,
  parseImageFilesSync,
  type UpscaleItem,
  upscaleItemsSequentially,
} from "@/lib/upscale-pipeline";

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
    width,
    height,
    status: "queued",
    error: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
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
    });
    expect(onProgress).toHaveBeenCalledWith(itemB.id, {
      status: "done",
      outputUrl: "blob:out-2",
      error: null,
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
    });

    expect(result.completedCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(workerMocks.upscale).not.toHaveBeenCalled();
    expect(onProgress).toHaveBeenCalledWith(
      huge.id,
      expect.objectContaining({
        status: "failed",
        error: expect.stringContaining("exceeds"),
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
    });

    expect(result.completedCount).toBe(1);
    expect(revokeSpy).toHaveBeenCalledWith("blob:stale");
    expect(onProgress).toHaveBeenCalledWith(item.id, {
      status: "done",
      outputUrl: "blob:updated",
      error: null,
    });
  });
});
