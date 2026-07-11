import { describe, expect, it } from "vitest";

import {
  AUTH_DESCRIPTION,
  AUTH_PWA_MANIFEST_DESCRIPTION,
  CONTACTS_APP_DESCRIPTION,
  IMAGE_UPSCALER_APP_DESCRIPTION,
  IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION,
  IMAGE_EDITOR_APP_DESCRIPTION,
  IMAGE_EDITOR_PWA_MANIFEST_DESCRIPTION,
  OCR_APP_DESCRIPTION,
  OCR_PWA_MANIFEST_DESCRIPTION,
  LINKS_APP_DESCRIPTION,
  NOTES_APP_DESCRIPTION,
  PDF_APP_DESCRIPTION,
  PDF_PWA_MANIFEST_DESCRIPTION,
  STORE_DESCRIPTION,
  STORE_PRODUCTS_PAGE_DESCRIPTION,
  TASKS_APP_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "./app-product-descriptions";
import { HELVETY_SWISS_ORIGIN_SEO } from "./licensing";
import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "./test-utils/customer-copy-test-helpers";

const DESCRIPTIONS = [
  ["WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION],
  ["AUTH_DESCRIPTION", AUTH_DESCRIPTION],
  ["AUTH_PWA_MANIFEST_DESCRIPTION", AUTH_PWA_MANIFEST_DESCRIPTION],
  ["STORE_DESCRIPTION", STORE_DESCRIPTION],
  ["STORE_PRODUCTS_PAGE_DESCRIPTION", STORE_PRODUCTS_PAGE_DESCRIPTION],
  ["CONTACTS_APP_DESCRIPTION", CONTACTS_APP_DESCRIPTION],
  ["LINKS_APP_DESCRIPTION", LINKS_APP_DESCRIPTION],
  ["NOTES_APP_DESCRIPTION", NOTES_APP_DESCRIPTION],
  ["TASKS_APP_DESCRIPTION", TASKS_APP_DESCRIPTION],
  ["PDF_APP_DESCRIPTION", PDF_APP_DESCRIPTION],
  ["PDF_PWA_MANIFEST_DESCRIPTION", PDF_PWA_MANIFEST_DESCRIPTION],
  ["IMAGE_UPSCALER_APP_DESCRIPTION", IMAGE_UPSCALER_APP_DESCRIPTION],
  [
    "IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION",
    IMAGE_UPSCALER_PWA_MANIFEST_DESCRIPTION,
  ],
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

  it("signals Swiss origin in store and encrypted-app SEO copy", () => {
    for (const [label, text] of [
      ["STORE_DESCRIPTION", STORE_DESCRIPTION],
      ["STORE_PRODUCTS_PAGE_DESCRIPTION", STORE_PRODUCTS_PAGE_DESCRIPTION],
      ["TASKS_APP_DESCRIPTION", TASKS_APP_DESCRIPTION],
      ["CONTACTS_APP_DESCRIPTION", CONTACTS_APP_DESCRIPTION],
      ["LINKS_APP_DESCRIPTION", LINKS_APP_DESCRIPTION],
    ] as const) {
      assertSwissOriginInSeoCopy(label, text);
    }
  });

  it("derives products listing description from store description", () => {
    expect(STORE_PRODUCTS_PAGE_DESCRIPTION).toContain("products");
    expect(STORE_PRODUCTS_PAGE_DESCRIPTION).toContain(HELVETY_SWISS_ORIGIN_SEO);
  });

  it("Links SEO copy uses storage wording for encryption", () => {
    expect(LINKS_APP_DESCRIPTION).toMatch(/before storage/i);
    expect(LINKS_APP_DESCRIPTION).not.toMatch(/before they sync/i);
  });

  it("exported descriptions contain no em-dash", () => {
    for (const [label, text] of DESCRIPTIONS) {
      assertNoEmDashInCustomerCopy(label, text);
    }
  });
});
