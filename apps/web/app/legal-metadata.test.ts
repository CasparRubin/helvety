import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import { metadata as impressumMetadata } from "./impressum/page";
import { metadata as privacyMetadata } from "./privacy/page";
import { metadata as termsMetadata } from "./terms/page";

describe("web legal page metadata", () => {
  it("uses canonical URLs for legal pages", () => {
    expect(impressumMetadata.alternates?.canonical).toBe(
      `${urls.home}/impressum`
    );
    expect(privacyMetadata.alternates?.canonical).toBe(`${urls.home}/privacy`);
    expect(termsMetadata.alternates?.canonical).toBe(`${urls.home}/terms`);
  });
});
