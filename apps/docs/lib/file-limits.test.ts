import { DOCS_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";
import { describe, expect, it } from "vitest";

import { MAX_DOCX_BYTES, MAX_ENCRYPTED_DOCX_CHARS } from "./constants";

describe("docs file limits", () => {
  it("MAX_DOCX_BYTES matches shared customer-facing copy (20 MB)", () => {
    expect(MAX_DOCX_BYTES).toBe(20 * 1024 * 1024);
    expect(DOCS_FILE_SIZE_LIMIT_COPY).toBe("up to 20MB per file");
  });

  it("MAX_ENCRYPTED_DOCX_CHARS covers double base64 expansion plus GCM tag envelope", () => {
    const base64Length = (bytes: number) => Math.ceil(bytes / 3) * 4;
    const expected = base64Length(base64Length(MAX_DOCX_BYTES) + 16) + 256;

    expect(MAX_ENCRYPTED_DOCX_CHARS).toBe(expected);
    expect(MAX_ENCRYPTED_DOCX_CHARS).toBeGreaterThan(100_000);
  });
});
