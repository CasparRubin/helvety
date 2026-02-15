import { describe, expect, it } from "vitest";

import {
  getFeaturesForTier,
  getMaxTenantsForTier,
  LICENSE_GRACE_PERIOD_DAYS,
  TIER_FEATURES,
} from "./validation";

// =============================================================================
// TIER_FEATURES configuration
// =============================================================================

describe("TIER_FEATURES", () => {
  it("has solo monthly tier with unlimited tenants", () => {
    const tier = TIER_FEATURES["helvety-spo-explorer-solo-monthly"];
    expect(tier).toBeDefined();
    expect(tier!.maxTenants).toBe(-1);
    expect(tier!.features).toContain("basic_navigation");
    expect(tier!.features).toContain("favorites");
    expect(tier!.features).toContain("search");
  });

  it("has supported monthly tier with additional features", () => {
    const tier = TIER_FEATURES["helvety-spo-explorer-supported-monthly"];
    expect(tier).toBeDefined();
    expect(tier!.maxTenants).toBe(-1);
    expect(tier!.features).toContain("priority_support");
    expect(tier!.features).toContain("custom_branding");
  });

  it("supported tier has all solo features plus extras", () => {
    const solo = TIER_FEATURES["helvety-spo-explorer-solo-monthly"]!;
    const supported = TIER_FEATURES["helvety-spo-explorer-supported-monthly"]!;
    for (const feature of solo.features) {
      expect(supported.features).toContain(feature);
    }
    expect(supported.features.length).toBeGreaterThan(solo.features.length);
  });
});

// =============================================================================
// LICENSE_GRACE_PERIOD_DAYS
// =============================================================================

describe("LICENSE_GRACE_PERIOD_DAYS", () => {
  it("is set to 7 days", () => {
    expect(LICENSE_GRACE_PERIOD_DAYS).toBe(7);
  });
});

// =============================================================================
// getMaxTenantsForTier
// =============================================================================

describe("getMaxTenantsForTier", () => {
  it("returns -1 (unlimited) for known tiers", () => {
    expect(getMaxTenantsForTier("helvety-spo-explorer-solo-monthly")).toBe(-1);
    expect(getMaxTenantsForTier("helvety-spo-explorer-supported-monthly")).toBe(
      -1
    );
  });

  it("returns 1 as default for unknown tiers", () => {
    expect(getMaxTenantsForTier("unknown-tier")).toBe(1);
  });
});

// =============================================================================
// getFeaturesForTier
// =============================================================================

describe("getFeaturesForTier", () => {
  it("returns correct features for known tiers", () => {
    const soloFeatures = getFeaturesForTier(
      "helvety-spo-explorer-solo-monthly"
    );
    expect(soloFeatures).toContain("basic_navigation");
    expect(soloFeatures).toContain("favorites");
    expect(soloFeatures).toContain("search");
  });

  it("returns basic_navigation as default for unknown tiers", () => {
    const features = getFeaturesForTier("unknown-tier");
    expect(features).toEqual(["basic_navigation"]);
  });

  it("returns default for empty string tier ID", () => {
    const features = getFeaturesForTier("");
    expect(features).toEqual(["basic_navigation"]);
  });

  it("returns default for tier ID with similar but incorrect name", () => {
    const features = getFeaturesForTier("helvety-spo-explorer-solo");
    expect(features).toEqual(["basic_navigation"]);
  });
});

// =============================================================================
// getMaxTenantsForTier edge cases
// =============================================================================

describe("getMaxTenantsForTier edge cases", () => {
  it("returns 1 as default for empty string tier ID", () => {
    expect(getMaxTenantsForTier("")).toBe(1);
  });

  it("returns 1 as default for tier ID with similar but incorrect name", () => {
    expect(getMaxTenantsForTier("helvety-spo-explorer-solo")).toBe(1);
  });
});

