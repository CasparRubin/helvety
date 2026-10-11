import { fromBlob } from "image-resize-compress";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  RESIZE_TARGET_MIN_BYTES,
  clampResizeTargetBytes,
  compressImageToTargetSize,
} from "./resize-image";

vi.mock("image-resize-compress", () => ({
  fromBlob: vi.fn(),
}));

const fromBlobMock = vi.mocked(fromBlob);

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("clampResizeTargetBytes", () => {
  it("never exceeds the current size and stays above the floor when possible", () => {
    expect(clampResizeTargetBytes(5_000_000, 1024 * 1024)).toBe(1024 * 1024);
    expect(clampResizeTargetBytes(10_000, 1024 * 1024)).toBe(
      RESIZE_TARGET_MIN_BYTES
    );
    expect(clampResizeTargetBytes(80_000, 40_000)).toBe(40_000);
  });
});

describe("compressImageToTargetSize", () => {
  it("returns the JPEG source unchanged when already under the target", async () => {
    const source = new Blob([new Uint8Array(100_000)], {
      type: "image/jpeg",
    });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 800,
        height: 600,
        close: vi.fn(),
      }))
    );

    const result = await compressImageToTargetSize(source, {
      targetSize: 200_000,
      maxWidthOrHeight: 800,
    });

    expect(fromBlobMock).not.toHaveBeenCalled();
    expect(result.blob).toBe(source);
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("calls fromBlob with JPEG targetSize and no-upscale max edge", async () => {
    const source = new Blob([new Uint8Array(2_000_000)], {
      type: "image/jpeg",
    });
    const compressed = new Blob([new Uint8Array(500_000)], {
      type: "image/jpeg",
    });
    fromBlobMock.mockResolvedValue(compressed);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 640,
        height: 480,
        close: vi.fn(),
      }))
    );

    const signal = new AbortController().signal;
    const result = await compressImageToTargetSize(source, {
      targetSize: 1024 * 1024,
      maxWidthOrHeight: 1920,
      signal,
    });

    expect(fromBlobMock).toHaveBeenCalledWith(source, {
      format: "jpeg",
      targetSize: 1024 * 1024,
      maxWidthOrHeight: 1920,
      worker: true,
      signal,
      onProgress: undefined,
      backgroundColor: "#ffffff",
    });
    expect(result.blob).toBe(compressed);
    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
  });

  it("keeps the smaller JPEG when compression would grow the file", async () => {
    const source = new Blob([new Uint8Array(100_000)], {
      type: "image/jpeg",
    });
    const larger = new Blob([new Uint8Array(150_000)], {
      type: "image/jpeg",
    });
    fromBlobMock.mockResolvedValue(larger);
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 100,
        height: 100,
        close: vi.fn(),
      }))
    );

    const result = await compressImageToTargetSize(source, {
      targetSize: 50_000,
      maxWidthOrHeight: 100,
    });

    expect(result.blob).toBe(source);
  });
});
