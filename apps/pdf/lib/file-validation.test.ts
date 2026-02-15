import { describe, expect, it } from "vitest";

import {
  isPdfFile,
  isImageFile,
  isValidPdfFileSync,
  isValidImageFileSync,
  validateFileType,
  validateFileSize,
} from "./file-validation";

/**
 * Helper to create a mock File object with given properties.
 */
function createMockFile(name: string, type: string, size: number = 1024): File {
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

// =============================================================================
// isPdfFile
// =============================================================================

describe("isPdfFile", () => {
  it("returns true for PDF files", () => {
    const file = createMockFile("test.pdf", "application/pdf");
    expect(isPdfFile(file)).toBe(true);
  });

  it("returns false for non-PDF files", () => {
    const file = createMockFile("test.jpg", "image/jpeg");
    expect(isPdfFile(file)).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isPdfFile(null)).toBe(false);
    expect(isPdfFile(undefined)).toBe(false);
  });
});

// =============================================================================
// isImageFile
// =============================================================================

describe("isImageFile", () => {
  it("returns true for JPEG files", () => {
    const file = createMockFile("photo.jpg", "image/jpeg");
    expect(isImageFile(file)).toBe(true);
  });

  it("returns true for PNG files", () => {
    const file = createMockFile("image.png", "image/png");
    expect(isImageFile(file)).toBe(true);
  });

  it("returns true for WebP files", () => {
    const file = createMockFile("image.webp", "image/webp");
    expect(isImageFile(file)).toBe(true);
  });

  it("returns true for GIF files", () => {
    const file = createMockFile("animation.gif", "image/gif");
    expect(isImageFile(file)).toBe(true);
  });

  it("returns false for SVG files (excluded for XSS safety)", () => {
    const file = createMockFile("icon.svg", "image/svg+xml");
    expect(isImageFile(file)).toBe(false);
  });

  it("returns false for PDF files", () => {
    const file = createMockFile("doc.pdf", "application/pdf");
    expect(isImageFile(file)).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isImageFile(null)).toBe(false);
    expect(isImageFile(undefined)).toBe(false);
  });
});

// =============================================================================
// isValidPdfFileSync
// =============================================================================

describe("isValidPdfFileSync", () => {
  it("accepts application/pdf MIME type", () => {
    const file = createMockFile("test.pdf", "application/pdf");
    expect(isValidPdfFileSync(file)).toBe(true);
  });

  it("accepts .pdf extension with generic MIME type", () => {
    const file = createMockFile("test.pdf", "application/octet-stream");
    expect(isValidPdfFileSync(file)).toBe(true);
  });

  it("accepts .pdf extension with empty MIME type", () => {
    const file = createMockFile("test.pdf", "");
    expect(isValidPdfFileSync(file)).toBe(true);
  });

  it("rejects non-PDF MIME types with non-PDF extension", () => {
    const file = createMockFile("test.txt", "text/plain");
    expect(isValidPdfFileSync(file)).toBe(false);
  });

  it("accepts uppercase .PDF extension with empty MIME type", () => {
    const file = createMockFile("test.PDF", "");
    expect(isValidPdfFileSync(file)).toBe(true);
  });

  it("rejects file with no extension and non-PDF MIME type", () => {
    const file = createMockFile("myfile", "text/plain");
    expect(isValidPdfFileSync(file)).toBe(false);
  });
});

// =============================================================================
// isValidImageFileSync
// =============================================================================

describe("isValidImageFileSync", () => {
  it("accepts common image MIME types", () => {
    expect(isValidImageFileSync(createMockFile("a.jpg", "image/jpeg"))).toBe(
      true
    );
    expect(isValidImageFileSync(createMockFile("a.png", "image/png"))).toBe(
      true
    );
    expect(isValidImageFileSync(createMockFile("a.gif", "image/gif"))).toBe(
      true
    );
    expect(isValidImageFileSync(createMockFile("a.webp", "image/webp"))).toBe(
      true
    );
    // SVG excluded for XSS safety
    expect(isValidImageFileSync(createMockFile("a.svg", "image/svg+xml"))).toBe(
      false
    );
  });

  it("accepts image extension with generic MIME type", () => {
    expect(
      isValidImageFileSync(
        createMockFile("photo.jpg", "application/octet-stream")
      )
    ).toBe(true);
    expect(
      isValidImageFileSync(
        createMockFile("image.png", "application/octet-stream")
      )
    ).toBe(true);
  });

  it("rejects non-image files", () => {
    expect(
      isValidImageFileSync(createMockFile("doc.pdf", "application/pdf"))
    ).toBe(false);
    expect(
      isValidImageFileSync(createMockFile("data.json", "application/json"))
    ).toBe(false);
  });
});

// =============================================================================
// validateFileType
// =============================================================================

describe("validateFileType", () => {
  it("validates PDF files as valid", () => {
    const result = validateFileType(
      createMockFile("test.pdf", "application/pdf")
    );
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("validates image files as valid", () => {
    const result = validateFileType(createMockFile("photo.jpg", "image/jpeg"));
    expect(result.valid).toBe(true);
  });

  it("returns error for unsupported file types", () => {
    const result = validateFileType(
      createMockFile("data.json", "application/json")
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("not a supported file type");
  });

  it("detects MIME type / extension mismatch for PDFs", () => {
    const result = validateFileType(createMockFile("doc.pdf", "text/plain"));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("MIME type");
  });

  it("detects MIME type / extension mismatch for images", () => {
    const result = validateFileType(
      createMockFile("photo.jpg", "application/json")
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("MIME type");
  });

  it("rejects double extensions disguising file type", () => {
    const result = validateFileType(
      createMockFile("report.pdf.exe", "application/octet-stream")
    );
    expect(result.valid).toBe(false);
  });

  it("rejects file with empty filename", () => {
    const result = validateFileType(
      createMockFile("", "application/octet-stream")
    );
    expect(result.valid).toBe(false);
  });
});

// =============================================================================
// validateFileSize
// =============================================================================

describe("validateFileSize", () => {
  it("accepts non-empty files", () => {
    const result = validateFileSize(
      createMockFile("test.pdf", "application/pdf", 1024)
    );
    expect(result.valid).toBe(true);
  });

  it("rejects empty files", () => {
    const result = validateFileSize(
      createMockFile("empty.pdf", "application/pdf", 0)
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain("empty");
  });

  it("accepts files at 1 byte (minimum valid size)", () => {
    const result = validateFileSize(
      createMockFile("tiny.pdf", "application/pdf", 1)
    );
    expect(result.valid).toBe(true);
  });
});
