import { describe, expect, it } from "vitest";

import {
  AUTH_DESCRIPTION,
  AUTH_PWA_MANIFEST_DESCRIPTION,
  CONTACTS_APP_DESCRIPTION,
  LINKS_APP_DESCRIPTION,
  NOTES_APP_DESCRIPTION,
  STORE_DESCRIPTION,
  STORE_PRODUCTS_PAGE_DESCRIPTION,
  TASKS_APP_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "./app-product-descriptions";
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
