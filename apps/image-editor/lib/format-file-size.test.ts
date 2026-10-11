import { describe, expect, it } from "vitest";

import { formatFileSize } from "./format-file-size";

describe("formatFileSize", () => {
  it("formats bytes, kilobytes, and megabytes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(980 * 1024)).toBe("980 KB");
    expect(formatFileSize(5.2 * 1024 * 1024)).toBe("5.20 MB");
  });

  it("returns a dash for invalid values", () => {
    expect(formatFileSize(Number.NaN)).toBe("-");
    expect(formatFileSize(-1)).toBe("-");
  });
});
