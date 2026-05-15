import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "@helvety/shared/test-utils/customer-copy-test-helpers";
import { describe, it } from "vitest";

import {
  IMAGE_UPSCALER_APP_DESCRIPTION,
  IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION,
} from "./product-copy";

describe("image-upscaler product copy", () => {
  it("keeps layout and PWA SEO copy license-free with Swiss origin", () => {
    for (const [label, text] of [
      ["IMAGE_UPSCALER_APP_DESCRIPTION", IMAGE_UPSCALER_APP_DESCRIPTION],
      [
        "IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION",
        IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION,
      ],
    ] as const) {
      assertLicenseFreeSeoCopy(label, text);
      assertSwissOriginInSeoCopy(label, text);
      assertNoEmDashInCustomerCopy(label, text);
    }
  });
});
