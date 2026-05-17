import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

describe("pdf next.config", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("aliases canvas to a stub under turbopack for PDF.js SSR", () => {
    expect(nextConfig.turbopack?.resolveAlias).toEqual(
      expect.objectContaining({ canvas: "./lib/empty-canvas-stub.mjs" })
    );
  });
});
