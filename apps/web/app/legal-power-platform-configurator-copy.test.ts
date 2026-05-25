import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CUSTOMER_COPY_EM_DASH } from "@helvety/shared/customer-copy-guardrails";
import {
  POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS,
  POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX,
  POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
} from "@helvety/shared/power-platform-configurator-copy";
import { RETIRED_HELVETY_EXTENSION_NAME_PATTERNS } from "@helvety/shared/retired-power-platform-extension-naming";
import { describe, expect, it } from "vitest";

/** `apps/web/app/` */
const appDir = dirname(fileURLToPath(import.meta.url));

const CANONICAL_COPY_IMPORT =
  "@helvety/shared/power-platform-configurator-copy";

/** Asserts legal TSX sources the shared Power Platform Configurator copy constants. */
function expectLegalPageUsesCanonicalPowerPlatformConfiguratorCopy(
  source: string
) {
  expect(source).toContain(CANONICAL_COPY_IMPORT);
  expect(source).toContain("POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY");
  expect(source).toContain("POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX");
  expect(source).not.toContain(CUSTOMER_COPY_EM_DASH);
}

/** Asserts impressum sources Chrome Web Store install constants. */
function expectImpressumUsesChromeWebStoreCopy(source: string) {
  expect(source).toContain(
    "POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE"
  );
  expect(source).toContain("Chrome Web Store");
}

describe("Power Platform Configurator legal copy (extension Survey tab parity)", () => {
  const officialTitle = "Power Platform Configurator";

  it("privacy page renders canonical public summary and store card suffix", () => {
    const privacy = readFileSync(join(appDir, "privacy", "page.tsx"), "utf8");
    expect(privacy).toContain(officialTitle);
    expectLegalPageUsesCanonicalPowerPlatformConfiguratorCopy(privacy);
    for (const marker of POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS) {
      expect(
        POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
        `marker "${marker}"`
      ).toContain(marker);
    }
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX).toContain(
      "Survey tab"
    );
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX).toContain("v3survey");
  });

  it("impressum renders canonical public summary and store card suffix", () => {
    const impressum = readFileSync(
      join(appDir, "impressum", "page.tsx"),
      "utf8"
    );
    expect(impressum).toContain(officialTitle);
    expectLegalPageUsesCanonicalPowerPlatformConfiguratorCopy(impressum);
    expectImpressumUsesChromeWebStoreCopy(impressum);
    expect(impressum).toContain("Edge/Chrome");
  });

  it("terms page uses the canonical product title and Chrome Web Store distribution", () => {
    const terms = readFileSync(join(appDir, "terms", "page.tsx"), "utf8");
    expect(terms).toContain(officialTitle);
    expect(terms).toContain("Chrome Web Store");
    expect(terms).not.toMatch(/browser-extension ZIP/i);
    for (const { label, re } of RETIRED_HELVETY_EXTENSION_NAME_PATTERNS) {
      expect(re.test(terms), `terms must not contain ${label}`).toBe(false);
    }
  });
});
