import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, it } from "vitest";

import {
  PDF_APP_DESCRIPTION,
  PDF_PWA_MANIFEST_DESCRIPTION,
} from "./product-copy";

describe("pdf product copy", () => {
  it("keeps layout and PWA SEO copy license-free with Swiss origin", () => {
    for (const [label, text] of [
      ["PDF_APP_DESCRIPTION", PDF_APP_DESCRIPTION],
      ["PDF_PWA_MANIFEST_DESCRIPTION", PDF_PWA_MANIFEST_DESCRIPTION],
    ] as const) {
      assertLicenseFreeSeoCopy(label, text);
      assertSwissOriginInSeoCopy(label, text);
      assertNoEmDashInCustomerCopy(label, text);
    }
  });
});
