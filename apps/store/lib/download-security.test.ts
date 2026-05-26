import * as envValidation from "@helvety/shared/env-validation";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPublicDownloadRateLimitKey,
  isAllowedDownloadUrl,
  packageIdSchema,
} from "./download-security";

describe("download-security", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("validates active and retired package id strings with strict lowercase format", () => {
    expect(packageIdSchema.safeParse("spo-explorer").success).toBe(true);
    expect(packageIdSchema.safeParse("UPPERCASE").success).toBe(false);
    expect(packageIdSchema.safeParse("bad_id").success).toBe(false);
  });

  it("still accepts retired power-platform-configurator id format for download routes", () => {
    expect(
      packageIdSchema.safeParse("power-platform-configurator").success
    ).toBe(true);
  });

  it("builds stable public download rate-limit keys", () => {
    expect(buildPublicDownloadRateLimitKey("203.0.113.7")).toBe(
      "public-download:ip:203.0.113.7"
    );
  });

  it("allows only trusted supabase signed package download urls", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_testkey1234567890";

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx/test.sppkg"
      )
    ).toBe(true);

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx/helvety-spo-explorer/helvety-spo-explorer-hotfix.sppkg"
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

  it("rejects redirects when getSupabaseUrl is unavailable", () => {
    vi.spyOn(envValidation, "getSupabaseUrl").mockImplementation(() => {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
    });

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx/test.sppkg"
      )
    ).toBe(false);

    vi.restoreAllMocks();
  });

  it("rejects signed URLs with only a single object segment under packages", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_testkey1234567890";

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/test.sppkg"
      )
    ).toBe(false);
  });

  it("rejects path traversal in signed package URLs", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_testkey1234567890";

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/../other-bucket/evil.sppkg"
      )
    ).toBe(false);

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx%2F..%2Fevil.sppkg"
      )
    ).toBe(false);

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx/%2e%2e/evil.sppkg"
      )
    ).toBe(false);
  });

  it("rejects http redirects and origins with non-default ports", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_testkey1234567890";

    expect(
      isAllowedDownloadUrl(
        "http://abc123.supabase.co/storage/v1/object/sign/packages/spfx/pkg.sppkg"
      )
    ).toBe(false);

    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co:444/storage/v1/object/sign/packages/spfx/pkg.sppkg"
      )
    ).toBe(false);
  });

  it("does not trust SUPABASE_URL when it differs from NEXT_PUBLIC_SUPABASE_URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc123.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_testkey1234567890";
    process.env.SUPABASE_URL = "https://evil.example";

    expect(
      isAllowedDownloadUrl(
        "https://evil.example/storage/v1/object/sign/packages/test.sppkg"
      )
    ).toBe(false);
    expect(
      isAllowedDownloadUrl(
        "https://abc123.supabase.co/storage/v1/object/sign/packages/spfx/test.sppkg"
      )
    ).toBe(true);
  });
});
