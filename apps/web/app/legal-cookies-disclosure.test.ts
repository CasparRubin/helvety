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

  it("§2.3 describes security and infrastructure logging, not product analytics", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const technicalSection = source
      .slice(
        source.indexOf("2.3 Technical and Usage Data"),
        source.indexOf("2.4 Communication Data")
      )
      .replace(/\s+/g, " ");

    expect(technicalSection).toContain("IP address and request timestamps");
    expect(technicalSection).toContain("passkey credential metadata");
    expect(technicalSection).toContain("Standard web server and hosting logs");
    expect(technicalSection).toContain(
      "We do not use third-party analytics on our web Services"
    );
    expect(technicalSection).toContain(
      "not build navigation or usage profiles of visitors"
    );
    expect(technicalSection).not.toContain(
      "Pages visited and navigation patterns"
    );
    expect(technicalSection).not.toContain("Referring website");
    expect(technicalSection).not.toContain("Browser type and version");
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
    const normalized = serviceSection.replace(/\s+/g, " ");

    const crossRefs = normalized.match(
      /described in Section 9 \(Cookies and Tracking\)/g
    );
    expect(crossRefs).toHaveLength(4);
  });

  it("web zone slug list matches expected Helvety web zone count", () => {
    expect(HELVETY_WEB_ZONE_APP_SLUGS).toHaveLength(11);
  });

  it("§9 documents vault and PRF salt retention durations", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("helvety-prf-salt (localStorage)");
    expect(cookiesSection).toMatch(/helvety-prf-salt[\s\S]*?7 days/);
    expect(cookiesSection).toContain("helvety-crypto (IndexedDB)");
    expect(cookiesSection).toMatch(
      /helvety-crypto[\s\S]*?Helvety Tasks, Contacts, Notes, Links/
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
      "helvety_extension_weekly_proof (chrome.storage.local)"
    );
    expect(cookiesSection).toMatch(
      /helvety_extension_weekly_proof[\s\S]*?7 days/
    );
    expect(cookiesSection).toMatch(/weekly proof|weekly email re-proof/i);
    expect(cookiesSection).not.toMatch(/email-proof anchor/i);
    expect(cookiesSection).toContain(
      "Supabase access token (chrome.storage.session)"
    );
    expect(cookiesSection).toMatch(/helvety-crypto[\s\S]*?Chromium extension/);
  });

  it("§2.5 Helvety Chromium extension bullet documents weekly proof and split storage", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const extensionSection = source.slice(
      source.indexOf("2.5 Extension and packaged software usage"),
      source.indexOf("2.6 Data Provision Requirements")
    );
    const extensionBullet = extensionSection.slice(
      extensionSection.indexOf("Helvety Chromium extension (E2EE side panel)")
    );

    expect(extensionBullet).toContain("helvety_extension_weekly_proof");
    expect(extensionBullet).toMatch(/weekly proof|server-HMAC/i);
    expect(extensionBullet).toContain("chrome.storage.local");
    expect(extensionBullet).toContain("chrome.storage.session");
    expect(extensionBullet).toContain("JWT expiry");
    expect(extensionBullet).toContain("3600s");
    expect(extensionBullet).not.toMatch(/email-proof anchor/i);
    expect(extensionBullet).not.toMatch(
      /receive[s]?\s+(the\s+web\s+)?helvety_device_trust/i
    );
  });

  it("§9 does not assign helvety_device_trust to Chromium extension storage", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));
    const extensionRows = cookiesSection.slice(
      cookiesSection.indexOf("Supabase auth session (chrome.storage.local)")
    );

    expect(extensionRows).toContain(
      "helvety_extension_weekly_proof (chrome.storage.local)"
    );
    expect(extensionRows).not.toMatch(
      /Chromium extension[\s\S]{0,400}helvety_device_trust/
    );
  });
});
