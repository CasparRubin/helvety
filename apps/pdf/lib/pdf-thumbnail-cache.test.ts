import { describe, expect, it, vi } from "vitest";

import {
  buildPdfThumbnailCacheKey,
  cachePdfPageCanvas,
} from "./pdf-thumbnail-cache";

describe("pdf-thumbnail-cache", () => {
  it("buildPdfThumbnailCacheKey includes url, page, width, dpr, and rotation", () => {
    expect(
      buildPdfThumbnailCacheKey({
        fileUrl: "blob:abc",
        pageNumber: 2,
        pageWidth: 120,
        devicePixelRatio: 2,
        isHighQuality: true,
        rotation: 90,
      })
    ).toBe("blob:abc:2:120:2:90");
  });

  it("buildPdfThumbnailCacheKey lowers effective dpr when not high quality", () => {
    expect(
      buildPdfThumbnailCacheKey({
        fileUrl: "blob:abc",
        pageNumber: 1,
        pageWidth: 100,
        devicePixelRatio: 2,
        isHighQuality: false,
      })
    ).toBe("blob:abc:1:100:1.5:0");
  });

  it("cachePdfPageCanvas writes createImageBitmap output to the cache", async () => {
    const bitmap = { close: vi.fn() } as unknown as ImageBitmap;
    const createImageBitmap = vi.fn().mockResolvedValue(bitmap);
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const canvas = document.createElement("canvas");
    const set = vi.fn();
    const result = await cachePdfPageCanvas(canvas, "key-1", { set });

    expect(createImageBitmap).toHaveBeenCalledWith(canvas);
    expect(set).toHaveBeenCalledWith("key-1", bitmap);
    expect(result).toBe(bitmap);

    vi.unstubAllGlobals();
  });

  it("cachePdfPageCanvas returns null when createImageBitmap is unavailable", async () => {
    vi.stubGlobal("createImageBitmap", undefined);

    const canvas = document.createElement("canvas");
    const set = vi.fn();
    const result = await cachePdfPageCanvas(canvas, "key-2", { set });

    expect(result).toBeNull();
    expect(set).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("cachePdfPageCanvas returns null for zero-sized canvases", async () => {
    const createImageBitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", createImageBitmap);

    const canvas = document.createElement("canvas");
    canvas.width = 0;
    canvas.height = 0;
    const set = vi.fn();
    const result = await cachePdfPageCanvas(canvas, "key-3", { set });

    expect(result).toBeNull();
    expect(createImageBitmap).not.toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
