import { DOCS_FILE_SIZE_LIMIT_COPY } from "@helvety/shared/product-file-limit-copy";
import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, expect, it } from "vitest";

import {
  DOCS_APP_DESCRIPTION,
  DOCS_PWA_MANIFEST_DESCRIPTION,
} from "./product-copy";

describe("docs product copy", () => {
  it("keeps layout and PWA SEO copy license-free with Swiss origin", () => {
    for (const [label, text] of [
      ["DOCS_APP_DESCRIPTION", DOCS_APP_DESCRIPTION],
      ["DOCS_PWA_MANIFEST_DESCRIPTION", DOCS_PWA_MANIFEST_DESCRIPTION],
    ] as const) {
      assertLicenseFreeSeoCopy(label, text);
      assertSwissOriginInSeoCopy(label, text);
      assertNoEmDashInCustomerCopy(label, text);
    }
  });

  it("PWA manifest copy references the shared file size limit", () => {
    expect(DOCS_PWA_MANIFEST_DESCRIPTION).toContain(DOCS_FILE_SIZE_LIMIT_COPY);
    expect(DOCS_APP_DESCRIPTION).toMatch(/vault/i);
  });

  it("does not imply full-app encryption (hybrid local edit + optional vault)", () => {
    for (const text of [DOCS_APP_DESCRIPTION, DOCS_PWA_MANIFEST_DESCRIPTION]) {
      expect(text).toMatch(
        /no account|without signing in|local editing needs no account/i
      );
      expect(text).toMatch(/optional vault/i);
      expect(text).not.toMatch(/stays encrypted/i);
    }
  });
});
