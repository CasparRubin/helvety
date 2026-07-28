import { describe, expect, it } from "vitest";

import {
  IMAGE_EDITOR_APP_DESCRIPTION,
  IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION,
  OCR_APP_DESCRIPTION,
  OCR_PWA_MANIFEST_DESCRIPTION,
  PDF_APP_DESCRIPTION,
  PDF_PWA_MANIFEST_DESCRIPTION,
  STORE_DESCRIPTION,
  STORE_PRODUCTS_PAGE_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "./app-product-descriptions";
import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "./test-utils/customer-copy-test-helpers";

const DESCRIPTIONS = [
  ["WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION],
  ["STORE_DESCRIPTION", STORE_DESCRIPTION],
  ["STORE_PRODUCTS_PAGE_DESCRIPTION", STORE_PRODUCTS_PAGE_DESCRIPTION],
  ["PDF_APP_DESCRIPTION", PDF_APP_DESCRIPTION],
  ["PDF_PWA_MANIFEST_DESCRIPTION", PDF_PWA_MANIFEST_DESCRIPTION],
  ["IMAGE_EDITOR_APP_DESCRIPTION", IMAGE_EDITOR_APP_DESCRIPTION],
  [
    "IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION",
    IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION,
  ],
  ["OCR_APP_DESCRIPTION", OCR_APP_DESCRIPTION],
  ["OCR_PWA_MANIFEST_DESCRIPTION", OCR_PWA_MANIFEST_DESCRIPTION],
] as const;

describe("app-product-descriptions", () => {
  it("keeps exported SEO descriptions license-free", () => {
    for (const [label, text] of DESCRIPTIONS) {
      assertLicenseFreeSeoCopy(label, text);
    }
  });

  it("uses company values and Swiss origin on the gateway blurb", () => {
    expect(WEB_SITE_DESCRIPTION).toMatch(/Software products/i);
    assertSwissOriginInSeoCopy("WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION);
    expect(WEB_SITE_DESCRIPTION).toMatch(/Private, simple, clean/i);
    expect(WEB_SITE_DESCRIPTION).toMatch(/OCR/i);
  });

  it("signals Swiss origin in store SEO copy", () => {
    for (const [label, text] of [
      ["STORE_DESCRIPTION", STORE_DESCRIPTION],
      ["STORE_PRODUCTS_PAGE_DESCRIPTION", STORE_PRODUCTS_PAGE_DESCRIPTION],
    ] as const) {
      assertSwissOriginInSeoCopy(label, text);
    }
  });

  it.each(DESCRIPTIONS)("%s contains no em-dash", (label, text) => {
    assertNoEmDashInCustomerCopy(label, text);
  });
});
