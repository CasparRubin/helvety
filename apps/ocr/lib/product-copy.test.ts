import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, it } from "vitest";

import {
  OCR_APP_DESCRIPTION,
  OCR_PWA_MANIFEST_DESCRIPTION,
} from "./product-copy";

describe("ocr product copy", () => {
  it("keeps layout and PWA SEO copy license-free with Swiss origin", () => {
    for (const [label, text] of [
      ["OCR_APP_DESCRIPTION", OCR_APP_DESCRIPTION],
      ["OCR_PWA_MANIFEST_DESCRIPTION", OCR_PWA_MANIFEST_DESCRIPTION],
    ] as const) {
      assertLicenseFreeSeoCopy(label, text);
      assertSwissOriginInSeoCopy(label, text);
      assertNoEmDashInCustomerCopy(label, text);
    }
  });
});
