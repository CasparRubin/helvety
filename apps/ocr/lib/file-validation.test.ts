import { describe, expect, it } from "vitest";

import { OCR_FILE_SIZE_LIMIT_BYTES } from "./constants";
import { validateOcrFile } from "./file-validation";

/** Builds a File with an overridden `size` for limit tests. */
function fileOfSize(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateOcrFile", () => {
  it("accepts a PDF by MIME type", () => {
    const result = validateOcrFile(
      new File(["%PDF"], "report.pdf", { type: "application/pdf" })
    );
    expect(result).toEqual({ ok: true, kind: "pdf" });
  });

  it("accepts PNG, JPEG, and WebP images", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      const result = validateOcrFile(new File(["x"], "scan", { type }));
      expect(result).toEqual({ ok: true, kind: "image" });
    }
  });

  it("falls back to the file extension when the MIME type is missing", () => {
    const result = validateOcrFile(new File(["x"], "scan.PNG", { type: "" }));
    expect(result).toEqual({ ok: true, kind: "image" });
  });

  it("rejects unsupported file types", () => {
    const result = validateOcrFile(
      new File(["x"], "notes.txt", { type: "text/plain" })
    );
    expect(result.ok).toBe(false);
  });

  it("rejects files above the size limit", () => {
    const oversized = fileOfSize(
      "huge.pdf",
      "application/pdf",
      OCR_FILE_SIZE_LIMIT_BYTES + 1
    );
    const result = validateOcrFile(oversized);
    expect(result.ok).toBe(false);
  });

  it("accepts files at exactly the size limit", () => {
    const atLimit = fileOfSize(
      "big.pdf",
      "application/pdf",
      OCR_FILE_SIZE_LIMIT_BYTES
    );
    expect(validateOcrFile(atLimit)).toEqual({ ok: true, kind: "pdf" });
  });
});
