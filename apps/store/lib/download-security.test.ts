import { describe, expect, it } from "vitest";

import {
  buildPublicDownloadRateLimitKey,
  isAllowedDownloadUrl,
  packageIdSchema,
} from "./download-security";

describe("download-security", () => {
  it("validates package id strings with strict lowercase format", () => {
    expect(packageIdSchema.safeParse("spo-explorer").success).toBe(true);
    expect(packageIdSchema.safeParse("UPPERCASE").success).toBe(false);
    expect(packageIdSchema.safeParse("bad_id").success).toBe(false);
  });

  it("builds stable public download rate-limit keys", () => {
    expect(buildPublicDownloadRateLimitKey("203.0.113.7")).toBe(
      "public-download:ip:203.0.113.7"
    );
  });

  it("allows GitHub Releases download URLs and rejects others", () => {
    expect(
      isAllowedDownloadUrl(
        "https://github.com/CasparRubin/helvety-spo-explorer/releases/latest/download/helvety-spo-explorer.sppkg"
      )
    ).toBe(true);
    expect(
      isAllowedDownloadUrl(
        "https://objects.githubusercontent.com/github-production-release-asset/1/helvety-spo-explorer.sppkg"
      )
    ).toBe(true);
    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx/test.sppkg"
      )
    ).toBe(false);
    expect(isAllowedDownloadUrl("https://example.com/file.sppkg")).toBe(false);
    expect(
      isAllowedDownloadUrl(
        "https://github.com/CasparRubin/helvety-spo-explorer/blob/main/pkg.sppkg"
      )
    ).toBe(false);
  });
});
