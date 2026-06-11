import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import nextConfig from "./next.config";

describe("docs next.config", () => {
  beforeEach(() => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("raises serverActions bodySizeLimit for large vault docx payloads", () => {
    expect(nextConfig.experimental?.serverActions).toEqual(
      expect.objectContaining({ bodySizeLimit: "40mb" })
    );
  });
});
