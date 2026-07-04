import { describe, expect, it } from "vitest";

import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_IMAGE_FILE_BYTES,
  createDownloadName,
  imageValidationMessage,
  validateImageFile,
} from "./image-validation";

describe("image-validation", () => {
  it("documents accepted mime types and size limit", () => {
    expect(ACCEPTED_IMAGE_MIME_TYPES).toEqual([
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
    expect(MAX_IMAGE_FILE_BYTES).toBe(25 * 1024 * 1024);
  });
  it("accepts supported image types within size limit", () => {
    const file = new File([new Uint8Array(10)], "photo.png", {
      type: "image/png",
    });
    expect(validateImageFile(file)).toEqual({ ok: true });
  });

  it("rejects unsupported types and oversized files", () => {
    const badType = new File([new Uint8Array(10)], "photo.gif", {
      type: "image/gif",
    });
    expect(validateImageFile(badType)).toEqual({
      ok: false,
      error: "unsupported-type",
    });

    const huge = new File([new Uint8Array(26 * 1024 * 1024)], "photo.png", {
      type: "image/png",
    });
    expect(validateImageFile(huge)).toEqual({
      ok: false,
      error: "too-large",
    });
  });

  it("builds download names and validation messages", () => {
    expect(createDownloadName("vacation.jpg", "jpeg")).toBe(
      "vacation-edited.jpg"
    );
    expect(createDownloadName("photo.png", "png")).toBe("photo-edited.png");
    expect(imageValidationMessage("unsupported-type")).toContain("PNG");
    expect(imageValidationMessage("too-large")).toContain("25 MB");
    expect(imageValidationMessage("not-image")).toContain("image file");
  });
});
