import { describe, expect, it } from "vitest";

import {
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
});
