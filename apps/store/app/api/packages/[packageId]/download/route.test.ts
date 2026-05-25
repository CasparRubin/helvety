import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPackageDownload: vi.fn(),
  getTrustedClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/lib/packages/create-package-download", () => ({
  createPackageDownload: mocks.createPackageDownload,
}));

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("@/lib/rate-limit", () => ({
  RATE_LIMITS: {
    DOWNLOADS: { maxRequests: 2, windowMs: 60_000 },
  },
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    warn: mocks.loggerWarn,
  },
}));

import { GET } from "./route";

const TRUSTED_DOWNLOAD_URL =
  "https://abc123.supabase.co/storage/v1/object/sign/packages/test.sppkg";

describe("GET /api/packages/[packageId]/download", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: "https://abc123.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_testkey1234567890",
    };
    mocks.getTrustedClientIp.mockReturnValue("203.0.113.10");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 1 });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns 400 when client IP is missing", async () => {
    mocks.getTrustedClientIp.mockReturnValue(null);

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "spo-explorer" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Missing client IP",
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      retryAfter: 42,
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "spo-explorer" }),
    });

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Too many download requests. Wait 42 seconds, then try again.",
    });
    expect(mocks.createPackageDownload).not.toHaveBeenCalled();
  });

  it("returns 400 when createPackageDownload rejects package id format", async () => {
    mocks.createPackageDownload.mockResolvedValue({
      ok: false,
      error: "Invalid package ID",
      status: 400,
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "INVALID" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Invalid package ID",
    });
  });

  it("returns 500 when signed URL fails origin allowlist", async () => {
    mocks.createPackageDownload.mockResolvedValue({
      ok: true,
      downloadUrl:
        "https://evil.example/storage/v1/object/sign/packages/x.sppkg",
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "spo-explorer" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Failed to generate download link",
    });
  });

  it("redirects with no-store cache headers on success", async () => {
    mocks.createPackageDownload.mockResolvedValue({
      ok: true,
      downloadUrl: TRUSTED_DOWNLOAD_URL,
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "spo-explorer" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(TRUSTED_DOWNLOAD_URL);
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("returns 404 for retired power-platform-configurator package id", async () => {
    mocks.createPackageDownload.mockResolvedValue({
      ok: false,
      error: "Package not found",
      status: 404,
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({
        packageId: "power-platform-configurator",
      }),
    });

    expect(response.status).toBe(404);
    expect(mocks.createPackageDownload).toHaveBeenCalledWith(
      "power-platform-configurator"
    );
  });

  it("returns 404 json for download failures", async () => {
    mocks.createPackageDownload.mockResolvedValue({
      ok: false,
      error: "Package not found",
      status: 404,
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Package not found",
    });
  });
});
