import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AUTH_PWA_MANIFEST_DESCRIPTION,
  CONTACTS_APP_DESCRIPTION,
  NOTES_APP_DESCRIPTION,
  STORE_DESCRIPTION,
  TASKS_APP_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "./app-product-descriptions";
import { CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS } from "./customer-copy-guardrails";
import {
  HELVETY_COMPANY_VALUES_TAGLINE,
  HELVETY_SWISS_ORIGIN_SEO,
  HELVETY_WEB_DEFAULT_TITLE,
} from "./licensing";
import {
  assertLicenseFreeSeoCopy,
  assertNoEmDashInCustomerCopy,
  assertSwissOriginInSeoCopy,
} from "./test-utils/customer-copy-test-helpers";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const SHARED_SEO_DESCRIPTIONS = [
  ["WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION],
  ["STORE_DESCRIPTION", STORE_DESCRIPTION],
  ["TASKS_APP_DESCRIPTION", TASKS_APP_DESCRIPTION],
  ["CONTACTS_APP_DESCRIPTION", CONTACTS_APP_DESCRIPTION],
  ["NOTES_APP_DESCRIPTION", NOTES_APP_DESCRIPTION],
  ["AUTH_PWA_MANIFEST_DESCRIPTION", AUTH_PWA_MANIFEST_DESCRIPTION],
] as const;

describe("seo customer copy guardrails", () => {
  it("gateway title uses company values without license wording", () => {
    expect(HELVETY_WEB_DEFAULT_TITLE).toBe(
      "Helvety | Private, simple, clean Swiss software"
    );
    assertLicenseFreeSeoCopy(
      "HELVETY_WEB_DEFAULT_TITLE",
      HELVETY_WEB_DEFAULT_TITLE
    );
    expect(HELVETY_WEB_DEFAULT_TITLE).toMatch(/Private, simple, clean/i);
  });

  it("company brand constants match helvety.com positioning", () => {
    expect(HELVETY_COMPANY_VALUES_TAGLINE).toBe("Private, simple, clean.");
    expect(HELVETY_SWISS_ORIGIN_SEO).toBe(
      "Engineered, designed and made in Switzerland."
    );
  });

  it("shared SEO descriptions stay license-free and signal Swiss origin", () => {
    for (const [label, text] of SHARED_SEO_DESCRIPTIONS) {
      assertLicenseFreeSeoCopy(label, text);
      assertSwissOriginInSeoCopy(label, text);
      assertNoEmDashInCustomerCopy(label, text);
    }
  });

  it("gateway blurb leads with company values", () => {
    expect(
      WEB_SITE_DESCRIPTION.startsWith(HELVETY_COMPANY_VALUES_TAGLINE)
    ).toBe(true);
  });

  it("PWA manifest descriptions avoid license marketing", () => {
    for (const rel of CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS) {
      const manifest = JSON.parse(
        readFileSync(join(repoRoot, rel), "utf8")
      ) as { description?: string };
      const description = manifest.description ?? "";
      assertLicenseFreeSeoCopy(rel, description);
      assertNoEmDashInCustomerCopy(rel, description);
    }
  });
});
