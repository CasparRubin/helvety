import { DOCS_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";
import { describe, expect, it } from "vitest";

import { MAX_DOCX_BYTES } from "./constants";

describe("docs file limits", () => {
  it("MAX_DOCX_BYTES matches shared customer-facing copy (20 MB)", () => {
    expect(MAX_DOCX_BYTES).toBe(20 * 1024 * 1024);
    expect(DOCS_FILE_SIZE_LIMIT_COPY).toBe("up to 20MB per file");
  });
});
