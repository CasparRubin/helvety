/* eslint-disable jsdoc/require-jsdoc */

import { describe, expect, it } from "vitest";

import {
  createDownloadName,
  IMAGE_FILE_SIZE_LIMIT_BYTES,
  calculateTargetSize,
  parseImageFilesSync,
  type UpscaleItem,
} from "@/lib/upscale-pipeline";

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
    const fileA = new File(["dup"], "same.png", { type: "image/png" });
    const fileB = new File(["dup"], "same.png", { type: "image/png" });
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
