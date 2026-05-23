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

  it("does not define legacy product or package redirects", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toBeUndefined();
  });
});
