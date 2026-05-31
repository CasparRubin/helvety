import { describe, expect, it } from "vitest";

import {
  HELVETY_FORBIDDEN_ANALYTICS_CODE_MARKERS,
  HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS,
  HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS,
  HELVETY_STALE_ANALYTICS_CODE_MARKERS_IN_DOCS,
  HELVETY_STALE_COOKIE_DOC_PHRASES,
  HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
  HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS,
} from "./analytics-guardrails";

describe("analytics guardrails constants", () => {
  it("lists forbidden analytics env keys", () => {
    expect(HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS.length).toBeGreaterThan(0);
    expect(HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS).toContain(
      "NEXT_PUBLIC_HELVETY_VERCEL_ANALYTICS"
    );
  });

  it("lists legacy gateway rewrite markers", () => {
    expect(HELVETY_LEGACY_GATEWAY_ANALYTICS_REWRITE_MARKERS).toEqual([
      "analyticsId",
      "script.js",
    ]);
  });

  it("keeps code markers aligned with env keys and stale disclosure names", () => {
    for (const envKey of HELVETY_FORBIDDEN_ANALYTICS_ENV_KEYS) {
      expect(
        HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES,
        `add ${envKey} to stale disclosure phrases if it must not appear in legal copy`
      ).toContain(envKey);
    }
    expect(HELVETY_FORBIDDEN_ANALYTICS_CODE_MARKERS).toContain(
      "HelvetyVercelAnalytics"
    );
  });

  it("lists stale session-policy cookie doc phrases", () => {
    expect(HELVETY_STALE_COOKIE_DOC_PHRASES).toContain("Up to 12 hours idle");
    expect(HELVETY_STALE_COOKIE_DOC_PHRASES).toContain(
      "30 days maximum per unlock"
    );
    expect(HELVETY_STALE_COOKIE_DOC_PHRASES).toContain(
      "30 days (sliding renewal"
    );
  });

  it("scopes operator doc exclusions and code-only stale doc markers", () => {
    expect(HELVETY_STALE_TRACKING_PHRASE_DOC_EXCLUSIONS).toContain(
      "docs/env-vercel-audit-checklist.md"
    );
    const stalePhrases = new Set<string>(
      HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES
    );
    for (const marker of HELVETY_STALE_ANALYTICS_CODE_MARKERS_IN_DOCS) {
      expect(stalePhrases.has(marker)).toBe(true);
    }
  });
});
