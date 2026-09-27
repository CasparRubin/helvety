import { describe, expect, it } from "vitest";

import {
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE,
  POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL,
  POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS,
  POWER_PLATFORM_CONFIGURATOR_MANIFEST_DESCRIPTION_MAX_LENGTH,
  POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY,
  POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION,
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

  it("keeps SEO metadata concise and current", () => {
    expect(
      POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION.length
    ).toBeLessThanOrEqual(160);
    expect(POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION).toContain("Power Apps");
    expect(POWER_PLATFORM_CONFIGURATOR_SEO_DESCRIPTION).not.toMatch(
      /\b(Editor|Survey) tab\b/i
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

  it("composes the store card from the manifest summary and an install line", () => {
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION).toBe(
      `${POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY} Install from the Chrome Web Store.`
    );
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_SHORT_DESCRIPTION).not.toContain(
      "v3survey"
    );
  });

  it("legal page markers appear in the summary or the About suffix", () => {
    const longForm = `${POWER_PLATFORM_CONFIGURATOR_PUBLIC_SUMMARY} ${POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX}`;
    for (const marker of POWER_PLATFORM_CONFIGURATOR_LEGAL_PAGE_MARKERS) {
      expect(longForm).toContain(marker);
    }
  });

  it("keeps the install line separate from descriptive copy", () => {
    expect(POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_INSTALL_LINE).toBe(
      `Install from the Chrome Web Store: ${POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL}`
    );
    expect(POWER_PLATFORM_CONFIGURATOR_STORE_CARD_SUFFIX).not.toContain(
      "Install from the Chrome Web Store"
    );
  });
});
