import { describe, expect, it } from "vitest";

import { zoneAnalyticsReferer } from "./zone-analytics-referer";

describe("zoneAnalyticsReferer", () => {
  it("matches zone paths with query strings (deep links)", () => {
    const pattern = new RegExp(zoneAnalyticsReferer("links"));
    expect(pattern.test("https://helvety.com/links?link=abc")).toBe(true);
    expect(pattern.test("https://helvety.com/notes?note=abc")).toBe(false);
  });

  it("matches zone paths with hash fragments", () => {
    const pattern = new RegExp(zoneAnalyticsReferer("notes"));
    expect(pattern.test("https://helvety.com/notes#section")).toBe(true);
  });

  it("matches bare zone paths without query or subpaths", () => {
    const pattern = new RegExp(zoneAnalyticsReferer("tasks"));
    expect(pattern.test("https://helvety.com/tasks")).toBe(true);
    expect(pattern.test("https://helvety.com/tasks/settings")).toBe(true);
  });

  it("does not match unrelated paths", () => {
    const pattern = new RegExp(zoneAnalyticsReferer("links"));
    expect(pattern.test("https://helvety.com/notes?link=abc")).toBe(false);
  });
});
