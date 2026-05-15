import { describe, expect, it } from "vitest";

import {
  AUTH_DESCRIPTION,
  AUTH_PWA_MANIFEST_DESCRIPTION,
  CONTACTS_APP_DESCRIPTION,
  NOTES_APP_DESCRIPTION,
  STORE_DESCRIPTION,
  STORE_PRODUCTS_PAGE_DESCRIPTION,
  TASKS_APP_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "./app-product-descriptions";
import { HELVETY_SOURCE_LICENSE_MARKETING } from "./licensing";
import {
  assertCustomerCopyStyle,
  assertNonE2eeMarketingCopy,
} from "./test-utils/customer-copy-test-helpers";

const DESCRIPTIONS = [
  ["WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION],
  ["AUTH_DESCRIPTION", AUTH_DESCRIPTION],
  ["AUTH_PWA_MANIFEST_DESCRIPTION", AUTH_PWA_MANIFEST_DESCRIPTION],
  ["STORE_DESCRIPTION", STORE_DESCRIPTION],
  ["STORE_PRODUCTS_PAGE_DESCRIPTION", STORE_PRODUCTS_PAGE_DESCRIPTION],
  ["CONTACTS_APP_DESCRIPTION", CONTACTS_APP_DESCRIPTION],
  ["NOTES_APP_DESCRIPTION", NOTES_APP_DESCRIPTION],
  ["TASKS_APP_DESCRIPTION", TASKS_APP_DESCRIPTION],
] as const;

describe("app-product-descriptions", () => {
  it("uses shared AGPL marketing copy in every exported description", () => {
    for (const [label, text] of DESCRIPTIONS) {
      expect(text, label).toContain(HELVETY_SOURCE_LICENSE_MARKETING);
    }
  });

  it("does not scope AGPL to this monorepo only", () => {
    expect(WEB_SITE_DESCRIPTION).not.toMatch(/where the repo ships/i);
    expect(WEB_SITE_DESCRIPTION).toMatch(/All published Helvety source/i);
    expect(STORE_DESCRIPTION).toMatch(/Every product with published source/i);
  });

  it("SEO descriptions contain no em-dashes or banned legacy phrases", () => {
    for (const [label, text] of DESCRIPTIONS) {
      assertCustomerCopyStyle(label, text);
    }
  });

  it("gateway and store descriptions do not claim end-to-end encryption", () => {
    assertNonE2eeMarketingCopy("WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION);
    assertNonE2eeMarketingCopy("STORE_DESCRIPTION", STORE_DESCRIPTION);
    assertNonE2eeMarketingCopy(
      "STORE_PRODUCTS_PAGE_DESCRIPTION",
      STORE_PRODUCTS_PAGE_DESCRIPTION
    );
    assertNonE2eeMarketingCopy("AUTH_DESCRIPTION", AUTH_DESCRIPTION);
    assertNonE2eeMarketingCopy(
      "AUTH_PWA_MANIFEST_DESCRIPTION",
      AUTH_PWA_MANIFEST_DESCRIPTION
    );
  });
});
