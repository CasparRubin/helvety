import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

describe("store next.config", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("permanently redirects legacy Power Automate URLs to the canonical slug and package id", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(Array.isArray(redirects)).toBe(true);
    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/products/helvety-power-automate-force-v3-false",
          destination: "/products/helvety-power-platform-configurator",
          permanent: true,
        },
        {
          source: "/products/helvety-power-automate-editor-preference",
          destination: "/products/helvety-power-platform-configurator",
          permanent: true,
        },
        {
          source: "/products/helvety-power-automate-editor-version-enforcer",
          destination: "/products/helvety-power-platform-configurator",
          permanent: true,
        },
        {
          source: "/api/packages/power-automate-editor-preference/download",
          destination: "/api/packages/power-platform-configurator/download",
          permanent: true,
        },
        {
          source: "/api/packages/power-automate-force-v3-false/download",
          destination: "/api/packages/power-platform-configurator/download",
          permanent: true,
        },
        {
          source: "/api/packages/power-automate-editor-version-enforcer/download",
          destination: "/api/packages/power-platform-configurator/download",
          permanent: true,
        },
      ])
    );
  });
});
