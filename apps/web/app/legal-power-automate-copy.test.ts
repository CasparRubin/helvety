import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CUSTOMER_COPY_EM_DASH,
  findBannedCustomerCopySubstring,
} from "@helvety/shared/customer-copy-guardrails";
import { POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX } from "@helvety/shared/power-automate-editor-enforcer-copy";
import { describe, expect, it } from "vitest";

/** `apps/web/app/` */
const appDir = dirname(fileURLToPath(import.meta.url));

const CANONICAL_COPY_IMPORT =
  "@helvety/shared/power-automate-editor-enforcer-copy";

/** Asserts legal TSX sources the shared Power Automate copy constants. */
function expectLegalPageUsesCanonicalPowerAutomateCopy(source: string) {
  expect(source).toContain(CANONICAL_COPY_IMPORT);
  expect(source).toContain("POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY");
  expect(source).toContain("POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX");
  expect(source).not.toContain("Feedback tab");
  expect(source).not.toContain("v3=false");
  expect(source).not.toContain("v3=true");
  expect(source).not.toContain(CUSTOMER_COPY_EM_DASH);
  expect(findBannedCustomerCopySubstring(source)).toBeUndefined();
}

describe("Power Automate legal copy (extension Survey tab parity)", () => {
  const officialTitle = "Power Automate Editor Version Enforcer";

  it("privacy page renders canonical public summary and store card suffix", () => {
    const privacy = readFileSync(join(appDir, "privacy", "page.tsx"), "utf8");
    expect(privacy).toContain(officialTitle);
    expectLegalPageUsesCanonicalPowerAutomateCopy(privacy);
    expect(POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX).toContain(
      "Survey tab"
    );
    expect(POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX).toContain(
      "v3survey"
    );
  });

  it("impressum renders canonical public summary and store card suffix", () => {
    const impressum = readFileSync(
      join(appDir, "impressum", "page.tsx"),
      "utf8"
    );
    expect(impressum).toContain(officialTitle);
    expectLegalPageUsesCanonicalPowerAutomateCopy(impressum);
    expect(impressum).toContain("Edge/Chrome");
  });
});
