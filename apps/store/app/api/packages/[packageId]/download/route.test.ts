import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getPackageDownloadUrl: vi.fn(),
  getTrustedClientIp: vi.fn(),
  checkRateLimit: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/app/actions/download-actions", () => ({
  getPackageDownloadUrl: mocks.getPackageDownloadUrl,
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

describe("GET /api/packages/[packageId]/download", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTrustedClientIp.mockReturnValue("203.0.113.10");
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 1 });
  });

  it("returns 400 when client IP is missing", async () => {
    mocks.getTrustedClientIp.mockReturnValue(null);

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "spo-explorer" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
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
      error:
        "Too many download requests. Please wait 42 seconds and try again.",
    });
  });

  it("redirects with no-store cache headers on success", async () => {
    mocks.getPackageDownloadUrl.mockResolvedValue({
      success: true,
      data: { downloadUrl: "https://download.example/file.sppkg" },
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "spo-explorer" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://download.example/file.sppkg"
    );
    expect(response.headers.get("cache-control")).toBe("no-store, max-age=0");
  });

  it("redirects for power-automate-force-v3-false package id", async () => {
    mocks.getPackageDownloadUrl.mockResolvedValue({
      success: true,
      data: { downloadUrl: "https://download.example/extension.zip" },
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "power-automate-force-v3-false" }),
    });

    expect(response.status).toBe(307);
    expect(mocks.getPackageDownloadUrl).toHaveBeenCalledWith(
      "power-automate-force-v3-false"
    );
    expect(response.headers.get("location")).toBe(
      "https://download.example/extension.zip"
    );
  });

  it("returns 404 json for action failures", async () => {
    mocks.getPackageDownloadUrl.mockResolvedValue({
      success: false,
      error: "Package not found",
    });

    const response = await GET(new Request("https://helvety.com") as never, {
      params: Promise.resolve({ packageId: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Package not found",
    });
  });
});
