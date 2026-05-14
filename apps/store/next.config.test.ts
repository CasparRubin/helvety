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

  it("permanently redirects legacy Power Automate product slug to the current slug", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(Array.isArray(redirects)).toBe(true);
    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/products/helvety-power-automate-force-v3-false",
          destination: "/products/helvety-power-automate-editor-preference",
          permanent: true,
        },
      ])
    );
  });
});
