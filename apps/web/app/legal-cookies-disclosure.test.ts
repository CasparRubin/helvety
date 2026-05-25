import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS,
  HELVETY_WEB_ANALYTICS_ZONE_NAMES,
  HELVETY_WEB_ZONE_APP_SLUGS,
} from "@/lib/legal-cookies-disclosure";

const PRIVACY_PAGE_PATH = join(import.meta.dirname, "privacy", "page.tsx");

describe("privacy policy cookies disclosure", () => {
  it("§9 lists all Helvety web zones that mount Vercel Analytics", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    for (const zoneName of HELVETY_WEB_ANALYTICS_ZONE_NAMES) {
      expect(cookiesSection, `missing analytics zone: ${zoneName}`).toContain(
        zoneName
      );
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
      /described in Section 9 \(Cookies\s+and Tracking\)/g
    );
    expect(crossRefs).toHaveLength(4);
  });

  it("analytics zone list matches expected Helvety web zone count", () => {
    expect(HELVETY_WEB_ANALYTICS_ZONE_NAMES).toHaveLength(10);
    expect(HELVETY_WEB_ZONE_APP_SLUGS).toHaveLength(10);
  });

  it("§9 documents vault and PRF salt retention durations", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("helvety-prf-salt (localStorage)");
    expect(cookiesSection).toMatch(/helvety-prf-salt[\s\S]*?7 days/);
    expect(cookiesSection).toContain("helvety-crypto (IndexedDB)");
    expect(cookiesSection).toMatch(
      /helvety-crypto[\s\S]*?Helvety Docs[\s\S]*?optional vault save/
    );
    expect(cookiesSection).toMatch(
      /helvety-crypto[\s\S]*?12 hours idle[\s\S]*?30 days maximum/
    );
    expect(cookiesSection).toMatch(
      /helvety_device_trust[\s\S]*?sliding renewal on passkey sign-in when already/
    );
  });

  it("§9 does not use outdated partial analytics surface list", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("all Helvety web zones served at");
    expect(cookiesSection).not.toContain("selected Helvety web surfaces");
    expect(cookiesSection).not.toMatch(
      /Helvety Image Upscaler\)\. Vercel Speed Insights/
    );
  });
});
