import { describe, expect, it } from "vitest";

import { isGatewayCrossZoneHref } from "./hero-hyperspeed-navigation";

describe("isGatewayCrossZoneHref", () => {
  it("matches relative zone paths with optional query or hash", () => {
    expect(isGatewayCrossZoneHref("/store")).toBe(true);
    expect(isGatewayCrossZoneHref("/store/products")).toBe(true);
    expect(isGatewayCrossZoneHref("/store/products?tab=apps")).toBe(true);
    expect(isGatewayCrossZoneHref("/pdf#viewer")).toBe(true);
    expect(isGatewayCrossZoneHref("/tasks/items")).toBe(true);
    expect(isGatewayCrossZoneHref("/contacts")).toBe(true);
    expect(isGatewayCrossZoneHref("/notes/new")).toBe(true);
    expect(isGatewayCrossZoneHref("/links")).toBe(true);
    expect(isGatewayCrossZoneHref("/auth")).toBe(true);
    expect(isGatewayCrossZoneHref("/image-upscaler")).toBe(true);
  });

  it("matches absolute helvety zone URLs", () => {
    expect(isGatewayCrossZoneHref("https://helvety.com/store")).toBe(true);
    expect(
      isGatewayCrossZoneHref("https://helvety.com/store/products/foo")
    ).toBe(true);
    expect(isGatewayCrossZoneHref("https://helvety.com/pdf/tools")).toBe(true);
  });

  it("ignores in-page, gateway, and external non-zone links", () => {
    expect(isGatewayCrossZoneHref("#main-content")).toBe(false);
    expect(isGatewayCrossZoneHref("/privacy")).toBe(false);
    expect(isGatewayCrossZoneHref("/")).toBe(false);
    expect(isGatewayCrossZoneHref("https://example.com/store")).toBe(false);
    expect(isGatewayCrossZoneHref("")).toBe(false);
  });
});
