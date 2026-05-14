import { describe, expect, it } from "vitest";

import {
  POWER_AUTOMATE_EDITOR_ENFORCER_LEGAL_PAGE_MARKERS,
  POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY,
  POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX,
  POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION,
} from "./power-automate-editor-enforcer-copy";

describe("power-automate-editor-enforcer-copy", () => {
  it("composes store short description from summary and suffix", () => {
    expect(POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION).toBe(
      `${POWER_AUTOMATE_EDITOR_ENFORCER_PUBLIC_SUMMARY} ${POWER_AUTOMATE_EDITOR_ENFORCER_STORE_CARD_SUFFIX}`
    );
  });

  it("legal page markers are substrings of the full store blurb (catch stale test snippets)", () => {
    for (const marker of POWER_AUTOMATE_EDITOR_ENFORCER_LEGAL_PAGE_MARKERS) {
      expect(POWER_AUTOMATE_EDITOR_ENFORCER_STORE_SHORT_DESCRIPTION).toContain(
        marker
      );
    }
  });
});
