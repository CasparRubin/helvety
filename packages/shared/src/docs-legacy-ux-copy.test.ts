import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DOCS_APP_DESCRIPTION } from "./app-product-descriptions";
import {
  CUSTOMER_COPY_DOCS_LEGACY_UX_RELATIVE_PATHS,
  CUSTOMER_COPY_FORBIDDEN_DOCS_LEGACY_UX_TERMS,
} from "./customer-copy-guardrails";
import { STORE_PRODUCT_CARDS } from "./store-catalog";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Reads a repo-root-relative file for copy guardrail assertions. */
function readRepoFile(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("Helvety Docs legacy UX copy guardrails", () => {
  it("scanned customer-facing paths avoid forbidden Docs chrome phrases", () => {
    for (const rel of CUSTOMER_COPY_DOCS_LEGACY_UX_RELATIVE_PATHS) {
      const text = readRepoFile(rel);
      for (const term of CUSTOMER_COPY_FORBIDDEN_DOCS_LEGACY_UX_TERMS) {
        expect(text, `${rel} must not contain "${term}"`).not.toContain(term);
      }
    }
  });

  it("store catalog and SEO descriptions align on hybrid access (local edit, optional vault)", () => {
    const card = STORE_PRODUCT_CARDS.find(
      (entry) => entry.id === "helvety-docs"
    );
    expect(card).toBeDefined();
    expect(card?.shortDescription).toMatch(/optional vault/i);
    expect(card?.shortDescription).toMatch(/no account|without signing in/i);
    expect(card?.shortDescription).not.toMatch(/\?doc=/);
    expect(DOCS_APP_DESCRIPTION).toMatch(/optional vault/i);
    expect(DOCS_APP_DESCRIPTION).toMatch(/Local editing needs no account/i);
    expect(DOCS_APP_DESCRIPTION).toMatch(/encrypts titles and \.docx files/i);
  });
});
