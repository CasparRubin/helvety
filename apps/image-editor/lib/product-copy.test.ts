import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, it } from "vitest";

import {
  IMAGE_EDITOR_APP_DESCRIPTION,
  IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION,
} from "./product-copy";

describe("image-editor product copy", () => {
  it("keeps layout and PWA SEO copy license-free with Swiss origin", () => {
    for (const [label, text] of [
      ["IMAGE_EDITOR_APP_DESCRIPTION", IMAGE_EDITOR_APP_DESCRIPTION],
      [
        "IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION",
        IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION,
      ],
    ] as const) {
      assertLicenseFreeSeoCopy(label, text);
      assertSwissOriginInSeoCopy(label, text);
      assertNoEmDashInCustomerCopy(label, text);
    }
  });
});
