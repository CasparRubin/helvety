import { describe, expect, it } from "vitest";

import { SESSION_CONFIG } from "./session-config";

describe("SESSION_CONFIG", () => {
  it("has maxAge of 24 hours in milliseconds", () => {
    expect(SESSION_CONFIG.maxAge).toBe(24 * 60 * 60 * 1000);
  });

  it("has idleTimeout of 30 minutes in milliseconds", () => {
    expect(SESSION_CONFIG.idleTimeout).toBe(30 * 60 * 1000);
  });

  it("has refreshThreshold of 5 minutes in milliseconds", () => {
    expect(SESSION_CONFIG.refreshThreshold).toBe(5 * 60 * 1000);
  });

  it("has activityCheckInterval of 1 minute in milliseconds", () => {
    expect(SESSION_CONFIG.activityCheckInterval).toBe(60 * 1000);
  });

  it("has keyCacheDuration of 24 hours in milliseconds", () => {
    expect(SESSION_CONFIG.keyCacheDuration).toBe(24 * 60 * 60 * 1000);
  });

  it("refreshThreshold is less than idleTimeout", () => {
    expect(SESSION_CONFIG.refreshThreshold).toBeLessThan(
      SESSION_CONFIG.idleTimeout
    );
  });

  it("activityCheckInterval is less than idleTimeout", () => {
    expect(SESSION_CONFIG.activityCheckInterval).toBeLessThan(
      SESSION_CONFIG.idleTimeout
    );
  });
});
