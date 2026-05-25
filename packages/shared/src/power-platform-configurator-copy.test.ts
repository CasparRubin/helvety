import { describe, expect, it } from "vitest";

import {
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE,
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL,
  POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS,
  POWER_PLATFORM_CONFIGURATOR_MANIFEST_DESCRIPTION_MAX_LENGTH,
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX,
  POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION,
} from "./power-platform-configurator-copy";

describe("power-platform-configurator-copy", () => {
  it("keeps manifest public summary within store description length limit", () => {
    expect(
      POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY.length
    ).toBeLessThanOrEqual(
      POWER_PLATFORM_CONFIGURATOR_MANIFEST_DESCRIPTION_MAX_LENGTH
    );
  });

  it("exposes the official Chrome Web Store listing URL", () => {
    expect(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL).toMatch(
      /^https:\/\/chromewebstore\.google\.com\//
    );
    expect(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL).toContain(
      "mdneakhceachnimmejciaehnfjfabang"
    );
    expect(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE).toContain(
      POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL
    );
  });

  it("composes store short description from summary and suffix", () => {
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION).toBe(
      `${POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY} ${POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX}`
    );
  });

  it("legal page markers appear in store short description", () => {
    for (const marker of POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS) {
      expect(POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION).toContain(
        marker
      );
    }
  });

  it("install line matches llms.txt Chrome Web Store bullet format", () => {
    expect(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE).toBe(
      `Install from the Chrome Web Store: ${POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL}`
    );
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX).toContain(
      "Install from the Chrome Web Store."
    );
  });
});
