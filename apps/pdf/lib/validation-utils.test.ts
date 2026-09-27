import { describe, expect, it } from "vitest";

import {
  generateUniqueFileName,
  validateArray,
  validateFiles,
  validateFiniteNumber,
  validateNonNegativeInteger,
} from "./validation-utils";

import type { PdfFile } from "./types";

/** Builds a minimal File for validation tests. */
function mockFile(name: string, size = 1024, type = "application/pdf"): File {
  return new File([new Uint8Array(size)], name, { type });
}

// =============================================================================
// validateNonNegativeInteger
// =============================================================================

describe("validateNonNegativeInteger", () => {
  it("accepts zero", () => {
    expect(() => validateNonNegativeInteger(0, "index")).not.toThrow();
  });

  it("accepts positive integers", () => {
    expect(() => validateNonNegativeInteger(1, "index")).not.toThrow();
    expect(() => validateNonNegativeInteger(100, "index")).not.toThrow();
  });

  it("rejects negative numbers", () => {
    expect(() => validateNonNegativeInteger(-1, "index")).toThrow(
      "Invalid index"
    );
  });

  it("rejects floats", () => {
    expect(() => validateNonNegativeInteger(1.5, "index")).toThrow(
      "Invalid index"
    );
  });

  it("rejects non-numbers", () => {
    expect(() => validateNonNegativeInteger("3", "index")).toThrow(
      "Invalid index"
    );
    expect(() => validateNonNegativeInteger(null, "index")).toThrow(
      "Invalid index"
    );
  });

  it("rejects undefined", () => {
    expect(() => validateNonNegativeInteger(undefined, "index")).toThrow(
      "Invalid index"
    );
  });

  it("accepts Number.MAX_SAFE_INTEGER", () => {
    expect(() =>
      validateNonNegativeInteger(Number.MAX_SAFE_INTEGER, "index")
    ).not.toThrow();
  });
});

// =============================================================================
// validateArray
// =============================================================================

describe("validateArray", () => {
  it("accepts arrays", () => {
    expect(() => validateArray([], "items")).not.toThrow();
    expect(() => validateArray([1, 2, 3], "items")).not.toThrow();
  });

  it("rejects non-arrays", () => {
    expect(() => validateArray("string", "items")).toThrow("Expected an array");
    expect(() => validateArray(123, "items")).toThrow("Expected an array");
    expect(() => validateArray(null, "items")).toThrow("Expected an array");
    expect(() => validateArray({}, "items")).toThrow("Expected an array");
  });
});

// =============================================================================
// validateFiniteNumber
// =============================================================================

describe("validateFiniteNumber", () => {
  it("accepts finite numbers", () => {
    expect(() => validateFiniteNumber(0, "value")).not.toThrow();
    expect(() => validateFiniteNumber(42, "value")).not.toThrow();
    expect(() => validateFiniteNumber(-3.14, "value")).not.toThrow();
  });

  it("rejects Infinity", () => {
    expect(() => validateFiniteNumber(Infinity, "value")).toThrow(
      "Must be a finite number"
    );
    expect(() => validateFiniteNumber(-Infinity, "value")).toThrow(
      "Must be a finite number"
    );
  });

  it("rejects NaN", () => {
    expect(() => validateFiniteNumber(NaN, "value")).toThrow(
      "Must be a finite number"
    );
  });

  it("rejects non-numbers", () => {
    expect(() => validateFiniteNumber("42", "value")).toThrow(
      "Must be a finite number"
    );
  });
});

// =============================================================================
// generateUniqueFileName
// =============================================================================

describe("generateUniqueFileName", () => {
  const mockPdfFile = (name: string): PdfFile =>
    ({
      file: { name, size: 1024 } as File,
    }) as PdfFile;

  it("returns original name when no conflict", () => {
    expect(generateUniqueFileName("report.pdf", [])).toBe("report.pdf");
  });

  it("appends _2 when name already exists", () => {
    const existing = [mockPdfFile("report.pdf")];
    expect(generateUniqueFileName("report.pdf", existing)).toBe("report_2.pdf");
  });

  it("increments suffix when _2 also exists", () => {
    const existing = [mockPdfFile("report.pdf"), mockPdfFile("report_2.pdf")];
    expect(generateUniqueFileName("report.pdf", existing)).toBe("report_3.pdf");
  });

  it("respects usedNames set", () => {
    const usedNames = new Set(["report.pdf"]);
    expect(generateUniqueFileName("report.pdf", [], usedNames)).toBe(
      "report_2.pdf"
    );
  });

  it("handles files without extension", () => {
    const existing = [mockPdfFile("README")];
    expect(generateUniqueFileName("README", existing)).toBe("README_2");
  });

  it("handles filenames with spaces", () => {
    const existing = [mockPdfFile("my report.pdf")];
    expect(generateUniqueFileName("my report.pdf", existing)).toBe(
      "my report_2.pdf"
    );
  });

  it("handles filenames with multiple dots", () => {
    const existing = [mockPdfFile("report.v2.pdf")];
    expect(generateUniqueFileName("report.v2.pdf", existing)).toBe(
      "report.v2_2.pdf"
    );
  });

  it("handles filenames with unicode characters", () => {
    const existing = [mockPdfFile("bericht_über.pdf")];
    expect(generateUniqueFileName("bericht_über.pdf", existing)).toBe(
      "bericht_über_2.pdf"
    );
  });
});

// =============================================================================
// validateFiles (open-file budget)
// =============================================================================

describe("validateFiles", () => {
  it("accepts uploads within the open-file budget", () => {
    const result = validateFiles([mockFile("a.pdf")], 0);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects when the open-file budget would be exceeded", () => {
    const result = validateFiles([mockFile("a.pdf"), mockFile("b.pdf")], 19);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("20 files");
  });

  it("rejects when the workspace is already full", () => {
    const result = validateFiles([mockFile("a.pdf")], 20);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("already have 20 files open");
  });
});
