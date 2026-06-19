import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

describe("image-upscaler next.config", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the image-upscaler zone basePath", () => {
    expect(nextConfig.basePath).toBe("/image-upscaler");
  });
});
