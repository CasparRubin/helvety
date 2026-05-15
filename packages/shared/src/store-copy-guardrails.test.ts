import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  CUSTOMER_COPY_BANNED_SUBSTRINGS,
  CUSTOMER_COPY_EM_DASH,
  CUSTOMER_COPY_LLMS_RELATIVE_PATHS,
  CUSTOMER_COPY_README_RELATIVE_PATHS,
  findBannedCustomerCopySubstring,
} from "./customer-copy-guardrails";
import { HELVETY_LLMS_LICENSING_NOTE } from "./licensing";
import {
  POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY,
  POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX,
  POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION,
} from "./power-automate-editor-enforcer-copy";
import { STORE_PRODUCT_CARDS } from "./store-catalog";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** Vitest helper: fails when `text` contains an em-dash. */
function assertNoEmDash(label: string, text: string): void {
  expect(text, `${label} must not contain an em-dash`).not.toContain(
    CUSTOMER_COPY_EM_DASH
  );
}

/** Vitest helper: fails when `text` contains a retired shopper-facing phrase. */
function assertNoBannedPhrases(label: string, text: string): void {
  const hit = findBannedCustomerCopySubstring(text);
  expect(hit, `${label} must not contain banned phrase "${hit ?? ""}"`).toBe(
    undefined
  );
}

describe("store copy guardrails", () => {
  it("catalog card blurbs contain no em-dashes or banned legacy phrases", () => {
    for (const card of STORE_PRODUCT_CARDS) {
      assertNoEmDash(`store-catalog ${card.id}`, card.shortDescription);
      assertNoBannedPhrases(`store-catalog ${card.id}`, card.shortDescription);
    }
  });

  it("Power Automate shared copy contains no em-dashes or banned legacy phrases", () => {
    for (const [label, text] of [
      ["PUBLIC_SUMMARY", POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY],
      ["STORE_CARD_SUFFIX", POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX],
      [
        "STORE_SHORT_DESCRIPTION",
        POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION,
      ],
    ] as const) {
      assertNoEmDash(label, text);
      assertNoBannedPhrases(label, text);
    }
  });

  it("llms.txt crawler summaries contain no em-dashes or banned legacy phrases", () => {
    for (const rel of CUSTOMER_COPY_LLMS_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      assertNoEmDash(rel, text);
      assertNoBannedPhrases(rel, text);
    }
  });

  it("app README intros avoid retired shopper-facing phrases", () => {
    for (const rel of CUSTOMER_COPY_README_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      assertNoEmDash(rel, text);
      assertNoBannedPhrases(rel, text);
    }
  });

  it("documents banned phrases so reviewers know what guardrails enforce", () => {
    expect(CUSTOMER_COPY_BANNED_SUBSTRINGS.length).toBeGreaterThan(0);
    expect(CUSTOMER_COPY_BANNED_SUBSTRINGS).toContain("MIT License");
    expect(CUSTOMER_COPY_BANNED_SUBSTRINGS).toContain("Free and open source");
  });

  it("every llms.txt documents AGPL licensing for products with published source", () => {
    for (const rel of CUSTOMER_COPY_LLMS_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      expect(text, rel).toContain("## Licensing");
      expect(text, rel).toContain(HELVETY_LLMS_LICENSING_NOTE);
      expect(text, rel).toMatch(/AGPL-3\.0/);
    }
  });

  it("app README license sections reference AGPL, not MIT", () => {
    for (const rel of CUSTOMER_COPY_README_RELATIVE_PATHS) {
      const text = readFileSync(join(repoRoot, rel), "utf8");
      if (!text.includes("## License")) {
        continue;
      }
      expect(text, rel).toContain("GNU Affero General Public License");
      expect(text, rel).not.toContain("MIT License");
    }
  });
});
