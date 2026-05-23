import { describe, expect, it } from "vitest";

import { zoneAnalyticsReferer } from "./zone-analytics-referer";

const PROXIED_ZONES = [
  "auth",
  "tasks",
  "contacts",
  "notes",
  "links",
  "store",
  "pdf",
  "docs",
  "image-upscaler",
] as const;

describe("zoneAnalyticsReferer", () => {
  it.each(PROXIED_ZONES)(
    "matches %s zone with query strings (deep links)",
    (zone) => {
      const pattern = new RegExp(zoneAnalyticsReferer(zone));
      const otherZone = zone === "links" ? "notes" : "links";

      expect(pattern.test(`https://helvety.com/${zone}?id=abc`)).toBe(true);
      expect(pattern.test(`https://helvety.com/${otherZone}?id=abc`)).toBe(
        false
      );
    }
  );

  it.each(PROXIED_ZONES)("matches %s zone with hash fragments", (zone) => {
    const pattern = new RegExp(zoneAnalyticsReferer(zone));
    expect(pattern.test(`https://helvety.com/${zone}#section`)).toBe(true);
  });

  it.each(PROXIED_ZONES)(
    "matches bare %s paths and subpaths without query",
    (zone) => {
      const pattern = new RegExp(zoneAnalyticsReferer(zone));
      expect(pattern.test(`https://helvety.com/${zone}`)).toBe(true);
      expect(pattern.test(`https://helvety.com/${zone}/settings`)).toBe(true);
    }
  );

  it.each(PROXIED_ZONES)(
    "matches %s zone with trailing slash on path",
    (zone) => {
      const pattern = new RegExp(zoneAnalyticsReferer(zone));
      expect(pattern.test(`https://helvety.com/${zone}/`)).toBe(true);
    }
  );

  it("matches referer with explicit port (local dev)", () => {
    const pattern = new RegExp(zoneAnalyticsReferer("links"));
    expect(pattern.test("http://localhost:3005/links?link=abc")).toBe(true);
  });

  it("does not match unrelated paths", () => {
    const pattern = new RegExp(zoneAnalyticsReferer("links"));
    expect(pattern.test("https://helvety.com/notes?link=abc")).toBe(false);
  });
});
