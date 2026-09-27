import { describe, expect, it } from "vitest";

import { pdfNavbarAbout } from "./app-navbar-about";
import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_BYTES,
  PDF_FILE_SIZE_LIMIT_COPY,
  PDF_MAX_OPEN_FILES,
  PDF_MAX_PAGES_PER_FILE,
  PDF_WORKSPACE_LIMITS_COPY,
} from "./product-file-limit-copy";
import { assertNoEmDashInCustomerCopy } from "./test-utils/customer-copy-test-helpers";

describe("product-file-limit-copy", () => {
  it("exports stable user-facing limit labels", () => {
    expect(PDF_FILE_SIZE_LIMIT_COPY).toBe("up to 100MB per file");
    expect(PDF_FILE_SIZE_LIMIT_BYTES).toBe(100 * 1024 * 1024);
    expect(PDF_MAX_OPEN_FILES).toBe(20);
    expect(PDF_MAX_PAGES_PER_FILE).toBe(200);
    expect(PDF_WORKSPACE_LIMITS_COPY).toBe(
      "up to 100MB per file, 20 open files, 200 pages per file"
    );
    expect(IMAGE_FILE_SIZE_LIMIT_COPY).toBe("up to 25MB per image");
  });

  it("navbar About helpers embed the same limit strings", () => {
    assertNoEmDashInCustomerCopy("pdf navbar", pdfNavbarAbout());
    expect(pdfNavbarAbout()).toContain(PDF_WORKSPACE_LIMITS_COPY);
  });
});
