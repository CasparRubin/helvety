import { describe, expect, it } from "vitest";

import { config } from "./proxy";

describe("web gateway proxy matcher", () => {
  it("uses a single-string matcher array", () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher).toHaveLength(1);
    expect(typeof config.matcher[0]).toBe("string");
  });

  it("excludes other zones from the marketing proxy", () => {
    const pattern = config.matcher[0]!;
    expect(pattern).toContain(
      "auth|store|pdf|docs|image-upscaler|tasks|contacts|notes|links"
    );
  });

  it("excludes static file extensions aligned with SECURITY_PROXY_MATCHER", () => {
    const pattern = config.matcher[0]!;
    for (const ext of ["json", "mjs", "wasm"]) {
      expect(pattern).toContain(ext);
    }
    expect(pattern).toContain("webmanifest");
    expect(pattern).toContain("woff2?");
  });
});
