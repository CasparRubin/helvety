import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES } from "@helvety/shared/analytics-guardrails";
import { describe, expect, it } from "vitest";

import {
  HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS,
  HELVETY_WEB_ZONE_APP_SLUGS,
} from "@/lib/legal-cookies-disclosure";

const PRIVACY_PAGE_PATH = join(import.meta.dirname, "privacy", "page.tsx");

describe("privacy policy cookies disclosure", () => {
  it("cookies section states we do not operate third-party analytics", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("We do not operate third-party analytics");
    for (const phrase of HELVETY_STALE_TRACKING_DISCLOSURE_PHRASES) {
      expect(
        cookiesSection,
        `cookies section must not contain stale tracking phrase: ${phrase}`
      ).not.toContain(phrase);
    }
  });

  it("services section denies third-party analytics for technical metadata", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const collected = source
      .slice(
        source.indexOf("3. What We Collect"),
        source.indexOf("4. How We Use Information")
      )
      .replace(/\s+/g, " ");

    expect(collected).toContain("IP address and request timestamps");
    expect(collected).toContain("standard web server and hosting logs");
    expect(collected).toContain(
      "We do not use third-party analytics on our web Services"
    );
    expect(collected).toContain(
      "not build navigation or usage profiles of visitors"
    );
    expect(collected).not.toContain("passkey");
  });

  it("cookie table documents remaining first-party storage keys", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    for (const identifier of HELVETY_PRIVACY_COOKIE_TABLE_IDENTIFIERS) {
      expect(
        cookiesSection,
        `missing cookie/storage row: ${identifier}`
      ).toContain(identifier);
    }
  });

  it("uses preference storage wording (not preference cookies)", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).toContain("Preference storage");
    expect(cookiesSection).not.toContain("Preference cookies:");
  });

  it("does not document removed auth or vault storage", async () => {
    const source = await readFile(PRIVACY_PAGE_PATH, "utf8");
    const cookiesSection = source.slice(source.indexOf('id="cookies"'));

    expect(cookiesSection).not.toContain("helvety_device_trust");
    expect(cookiesSection).not.toContain("helvety-prf-salt");
    expect(cookiesSection).not.toContain("helvety-crypto");
    expect(cookiesSection).not.toContain("webauthn_challenge");
    expect(cookiesSection).not.toContain("helvety_extension_weekly_proof");
    expect(cookiesSection).not.toContain("chrome.storage");
    expect(cookiesSection).not.toContain("Authentication cookies:");
    expect(cookiesSection).not.toContain("E2EE vault");
  });

  it("web zone slug list matches remaining Helvety web zones", () => {
    expect(HELVETY_WEB_ZONE_APP_SLUGS).toEqual([
      "web",
      "store",
      "pdf",
      "image-editor",
      "ocr",
    ]);
  });
});
