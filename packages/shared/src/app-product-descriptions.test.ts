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
});
