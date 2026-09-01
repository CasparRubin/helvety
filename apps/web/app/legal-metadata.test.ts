import { readFileSync } from "node:fs";
import { join } from "node:path";

import { urls } from "@helvety/shared/config";
import { describe, expect, it } from "vitest";

import { metadata as impressumMetadata } from "./impressum/page";
import { metadata as privacyMetadata } from "./privacy/page";
import { metadata as termsMetadata } from "./terms/page";

const LEGAL_PAGE_PATHS = [
  "impressum/page.tsx",
  "privacy/page.tsx",
  "terms/page.tsx",
] as const;

/** Reads a legal page source file relative to `apps/web/app/`. */
function readLegalPageSource(relativePath: string): string {
  return readFileSync(join(import.meta.dirname, relativePath), "utf8");
}

describe("web legal page metadata", () => {
  it("uses the same lastReviewed date on all legal pages", () => {
    const reviewedDates = LEGAL_PAGE_PATHS.map((path) => {
      const match = readLegalPageSource(path).match(/lastReviewed="([^"]+)"/);
      expect(match, `${path} must define lastReviewed`).not.toBeNull();
      return match![1];
    });
    expect(new Set(reviewedDates).size).toBe(1);
  });

  it("uses canonical URLs for legal pages", () => {
    expect(impressumMetadata.alternates?.canonical).toBe(
      `${urls.home}/impressum`
    );
    expect(privacyMetadata.alternates?.canonical).toBe(`${urls.home}/privacy`);
    expect(termsMetadata.alternates?.canonical).toBe(`${urls.home}/terms`);
  });

  it("uses bare titles so the root template does not double the brand", () => {
    // Root layout template is `%s | Helvety`; including `| Helvety` here
    // would render as "… | Helvety | Helvety" in the document title.
    expect(impressumMetadata.title).toBe("Impressum");
    expect(privacyMetadata.title).toBe("Privacy Policy");
    expect(termsMetadata.title).toBe("Terms of Service");
    for (const title of [
      impressumMetadata.title,
      privacyMetadata.title,
      termsMetadata.title,
    ]) {
      expect(typeof title).toBe("string");
      expect(String(title)).not.toMatch(/\|\s*Helvety\s*$/i);
    }
  });
});
