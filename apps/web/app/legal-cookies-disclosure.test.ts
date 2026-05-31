import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES } from "@helvety/shared/analytics-guardrails";
import { describe, expect, it } from "vitest";

import {
  HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS,
  HELVETY_PRIVACY_EXTENSION_PASSKEY_DISCLOSURE_SNIPPETS,
  HELVETY_WEB_ZONE_APP_SLUGS,
} from "@/lib/legal-cookies-disclosure";

const PRIVACY_PAGE_PATH = join(import.meta.dirname, "privacy", "page.tsx");

describe("privacy policy cookies disclosure", () => {
  it("§9 states we do not operate third-party analytics", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("We do not operate third-party analytics");
    for (const phrase of HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES) {
      expect(
        cookiesSection,
        `§9 must not contain stale tracking phrase: ${phrase}`
      ).not.toContain(phrase);
    }
  });

  it("§2.8 main website bullet denies third-party tracking and uses no stale analytics copy", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const serviceSection = source.slice(
      source.indexOf("2.8 Data Processing by Service"),
      source.indexOf('id="cookies"')
    );
    const mainSiteBullet = serviceSection.slice(
      serviceSection.indexOf("helvety.com (Main Website)")
    );

    expect(mainSiteBullet).toContain("We do not use third-party");
    for (const phrase of HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES) {
      expect(
        mainSiteBullet,
        `§2.8 main website bullet must not contain stale phrase: ${phrase}`
      ).not.toContain(phrase);
    }
  });

  it("§9 documents extension passkey server-side challenges (not browser cookies)", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    for (const snippet of HELVETY_PRIVACY_EXTENSION_PASSKEY_DISCLOSURE_SNIPPETS) {
      expect(
        cookiesSection,
        `missing extension passkey disclosure: ${snippet}`
      ).toContain(snippet);
    }
  });

  it("§9 cookie table documents first-party cookies and localStorage keys", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    for (const identifier of HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS) {
      expect(
        cookiesSection,
        `missing cookie/storage row: ${identifier}`
      ).toContain(identifier);
    }
  });

  it("§9 uses preference storage wording (not preference cookies)", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("Preference storage:");
    expect(cookiesSection).not.toContain("Preference cookies:");
  });

  it("§2.8 E2EE service bullets cross-reference Section 9", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const serviceSection = source.slice(
      source.indexOf("2.8 Data Processing by Service"),
      source.indexOf('id="cookies"')
    );

    const crossRefs = serviceSection.match(
      /described in Section 9[\s\n]*\(Cookies\s+and Tracking\)/g
    );
    expect(crossRefs).toHaveLength(4);
  });

  it("web zone slug list matches expected Helvety web zone count", () => {
    expect(HELVETY_WEB_ZONE_APP_SLUGS).toHaveLength(10);
  });

  it("§9 documents vault and PRF salt retention durations", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("helvety-prf-salt (localStorage)");
    expect(cookiesSection).toMatch(/helvety-prf-salt[\s\S]*?7 days/);
    expect(cookiesSection).toContain("helvety-crypto (IndexedDB)");
    expect(cookiesSection).toMatch(
      /helvety-crypto[\s\S]*?Helvety Docs[\s\S]*?optional[\s\S]*?vault save/
    );
    expect(cookiesSection).toMatch(
      /helvety-crypto[\s\S]*?24 hours idle[\s\S]*?7 days maximum/
    );
    expect(cookiesSection).toMatch(
      /helvety_device_trust[\s\S]*?7 days[\s\S]*?sliding renewal on passkey sign-in when already/
    );
    expect(cookiesSection).toMatch(
      /helvety_device_trust[\s\S]*?E2EE API access/
    );
    expect(cookiesSection).toContain(
      "helvety_extension_last_email_verified (chrome.storage.local)"
    );
    expect(cookiesSection).toMatch(
      /helvety_extension_last_email_verified[\s\S]*?7 days/
    );
    expect(cookiesSection).toMatch(/helvety-crypto[\s\S]*?Chromium extension/);
  });
});
