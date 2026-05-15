import { describe, expect, it } from "vitest";

import { pdfNavbarAbout } from "./app-navbar-about";
import {
  IMAGE_FILE_SIZE_LIMIT_COPY,
  PDF_FILE_SIZE_LIMIT_COPY,
} from "./product-file-limit-copy";
import { assertNoEmDashInCustomerCopy } from "./test-utils/customer-copy-test-helpers";

describe("product-file-limit-copy", () => {
  it("exports stable user-facing limit labels", () => {
    expect(PDF_FILE_SIZE_LIMIT_COPY).toBe("up to 100MB per file");
    expect(IMAGE_FILE_SIZE_LIMIT_COPY).toBe("up to 25MB per image");
  });

  it("navbar About helpers embed the same limit strings", () => {
    assertNoEmDashInCustomerCopy("pdf navbar", pdfNavbarAbout());
    expect(pdfNavbarAbout()).toContain(PDF_FILE_SIZE_LIMIT_COPY);
  });
});
