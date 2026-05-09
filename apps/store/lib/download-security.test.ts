import { afterEach, describe, expect, it } from "vitest";

import {
  buildDownloadUrlRateLimitKey,
  buildPublicDownloadRateLimitKey,
  isAllowedDownloadUrl,
  packageIdSchema,
} from "./download-security";

describe("download-security", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("validates package ids with strict lowercase format", () => {
    expect(packageIdSchema.safeParse("spo-explorer").success).toBe(true);
    expect(
      packageIdSchema.safeParse("power-automate-force-v3-false").success
    ).toBe(true);
    expect(packageIdSchema.safeParse("UPPERCASE").success).toBe(false);
    expect(packageIdSchema.safeParse("bad_id").success).toBe(false);
  });

  it("builds stable rate-limit keys", () => {
    expect(buildDownloadUrlRateLimitKey("203.0.113.7")).toBe(
      "download_url:ip:203.0.113.7"
    );
    expect(buildPublicDownloadRateLimitKey("203.0.113.7")).toBe(
      "public-download:ip:203.0.113.7"
    );
  });

  it("allows only trusted supabase signed package download urls", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.SUPABASE_URL = "https://abc123.supabase.co";

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/test.sppkg"
      )
    ).toBe(true);

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/other-bucket/test.sppkg"
      )
    ).toBe(false);

    expect(
      isAllowedDownloadUrl(
        "https://malicious.example/storage/v1/object/sign/packages/test.sppkg"
      )
    ).toBe(false);
  });
});
