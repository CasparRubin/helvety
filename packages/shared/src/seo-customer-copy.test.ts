import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  STORE_DESCRIPTION,
  WEB_SITE_DESCRIPTION,
} from "./app-product-descriptions";
import {
  CUSTOMER_COPY_LLMS_RELATIVE_PATHS,
  CUSTOMER_COPY_MANIFEST_RELATIVE_PATHS,
} from "./customer-copy-guardrails";
import { createHelvetyOrganizationSchema } from "./layout-primitives";
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
] as const;

describe("seo customer copy guardrails", () => {
  it("gateway title uses company values without license wording", () => {
    expect(HELVETY_WEB_DEFAULT_TITLE).toBe(
      "Helvety | Software Products - Engineered, Designed and Made in Switzerland - Private, Simple, Clean"
    );
    assertLicenseFreeSeoCopy(
      "HELVETY_WEB_DEFAULT_TITLE",
      HELVETY_WEB_DEFAULT_TITLE
    );
    expect(HELVETY_WEB_DEFAULT_TITLE).toMatch(/Software Products/i);
    expect(HELVETY_WEB_DEFAULT_TITLE).toMatch(/Private, Simple, Clean/i);
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

  it("gateway blurb states software products and company values", () => {
    expect(WEB_SITE_DESCRIPTION).toMatch(/Software products/i);
    assertSwissOriginInSeoCopy("WEB_SITE_DESCRIPTION", WEB_SITE_DESCRIPTION);
    expect(WEB_SITE_DESCRIPTION).toMatch(/Private, simple, clean/i);
  });

  it("Organization JSON-LD uses the gateway SEO description", () => {
    const org = createHelvetyOrganizationSchema("https://helvety.com/icon.png");
    expect(org.description).toBe(WEB_SITE_DESCRIPTION);
    expect(org.inLanguage).toBe("en");
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

  it("app llms Related Helvety Apps sections link to Helvety Store", () => {
    for (const rel of CUSTOMER_COPY_LLMS_RELATIVE_PATHS) {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      if (!source.includes("## Related Helvety Apps")) {
        continue;
      }
      expect(source, rel).toContain("Helvety Store");
      expect(source, rel).toContain("helvety.com/store");
    }
  });

  it("zone llms Related Helvety Apps sections link to Helvety Image Editor", () => {
    const zoneLlmsWithRelated = CUSTOMER_COPY_LLMS_RELATIVE_PATHS.filter(
      (rel) =>
        rel !== "apps/web/public/llms.txt" &&
        rel !== "apps/store/public/llms.txt"
    );
    for (const rel of zoneLlmsWithRelated) {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      if (!source.includes("## Related Helvety Apps")) {
        continue;
      }
      expect(source, rel).toContain("Helvety Image Editor");
      expect(source, rel).toContain("helvety.com/image-editor");
    }
  });

  it("store llms.txt lists the Helvety OCR product page", () => {
    const source = readFileSync(
      join(repoRoot, "apps/store/public/llms.txt"),
      "utf8"
    );
    expect(source).toContain("helvety-ocr");
    expect(source).toContain("helvety.com/store/products/helvety-ocr");
  });

  it("store llms.txt lists the Helvety Cloud product page", () => {
    const source = readFileSync(
      join(repoRoot, "apps/store/public/llms.txt"),
      "utf8"
    );
    expect(source).toContain("helvety-cloud");
    expect(source).toContain("helvety.com/store/products/helvety-cloud");
    expect(source).toContain("helvety.cloud");
  });

  it("zone llms Related Helvety Apps sections link to Helvety OCR", () => {
    const zoneLlmsWithRelated = CUSTOMER_COPY_LLMS_RELATIVE_PATHS.filter(
      (rel) =>
        rel !== "apps/web/public/llms.txt" &&
        rel !== "apps/store/public/llms.txt" &&
        rel !== "apps/ocr/public/llms.txt"
    );
    for (const rel of zoneLlmsWithRelated) {
      const source = readFileSync(join(repoRoot, rel), "utf8");
      if (!source.includes("## Related Helvety Apps")) {
        continue;
      }
      expect(source, rel).toContain("Helvety OCR");
      expect(source, rel).toContain("helvety.com/ocr");
    }
  });
});
