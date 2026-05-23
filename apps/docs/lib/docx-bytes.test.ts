import { describe, expect, it } from "vitest";

import { normalizeDocxSaveResult } from "./docx-bytes";

describe("normalizeDocxSaveResult", () => {
  it("returns null for empty input", () => {
    expect(normalizeDocxSaveResult(null)).toBeNull();
    expect(normalizeDocxSaveResult(undefined)).toBeNull();
  });

  it("returns ArrayBuffer input unchanged", () => {
    const buffer = new ArrayBuffer(4);
    new Uint8Array(buffer).set([0x50, 0x4b, 0x03, 0x04]);
    expect(normalizeDocxSaveResult(buffer)).toBe(buffer);
  });

  it("copies Uint8Array views into a standalone ArrayBuffer", () => {
    const source = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const view = source.subarray(1, 3);
    const normalized = normalizeDocxSaveResult(view);

    expect(normalized).not.toBeNull();
    if (!normalized) {
      return;
    }
    expect(normalized).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(normalized)).toEqual(new Uint8Array([0x4b, 0x03]));
  });
});
