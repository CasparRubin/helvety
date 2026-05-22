import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const createSignedUrl = vi.fn();
  const from = vi.fn(() => ({ createSignedUrl }));
  const adminClientFactory = vi.fn(() => ({
    storage: { from },
  }));
  const resolveLatestPackageVersion = vi.fn();

  return {
    createSignedUrl,
    from,
    adminClientFactory,
    resolveLatestPackageVersion,
    loggerInfo: vi.fn(),
    logUnexpectedError: vi.fn(),
    getTrustedClientIp: vi.fn(() => "203.0.113.1"),
    checkRateLimit: vi.fn(() => ({ allowed: true })),
  };
});

vi.mock("@helvety/shared/supabase/admin", () => ({
  ["create" + "AdminClient"]: mocks.adminClientFactory,
}));

vi.mock("@helvety/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    info: mocks.loggerInfo,
    logUnexpectedError: mocks.logUnexpectedError,
  },
}));

vi.mock("@helvety/shared/client-ip", () => ({
  getTrustedClientIp: mocks.getTrustedClientIp,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  RATE_LIMITS: {
    DOWNLOAD_URL: { maxRequests: 10, windowMs: 60_000 },
  },
}));

vi.mock("@/lib/packages/resolve-version", () => ({
  resolveLatestPackageVersion: mocks.resolveLatestPackageVersion,
}));

import { getPackageDownloadUrl } from "./download-actions";

describe("store download-actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.resolveLatestPackageVersion.mockResolvedValue({
      version: "1.0.2.0",
      storagePath: "spfx/helvety-spo-explorer/helvety-spo-explorer.sppkg",
    });
    mocks.createSignedUrl.mockResolvedValue({
      data: { signedUrl: "https://download.example/signed" },
      error: null,
    });
  });

  it("rejects invalid package IDs", async () => {
    const result = await getPackageDownloadUrl("NOT_VALID");
    expect(result).toEqual({ success: false, error: "Invalid package ID" });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("returns not found for unknown package IDs", async () => {
    const result = await getPackageDownloadUrl("unknown-package");
    expect(result).toEqual({ success: false, error: "Package not found" });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("returns not found for legacy package ids removed from config (redirects handle HTTP)", async () => {
    expect(
      await getPackageDownloadUrl("power-automate-editor-preference")
    ).toEqual({ success: false, error: "Package not found" });
    expect(
      await getPackageDownloadUrl("power-automate-force-v3-false")
    ).toEqual({ success: false, error: "Package not found" });
    expect(
      await getPackageDownloadUrl("power-automate-editor-version-enforcer")
    ).toEqual({ success: false, error: "Package not found" });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("creates a signed URL for public packages", async () => {
    const result = await getPackageDownloadUrl("spo-explorer");

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected successful download URL response");
    }
    expect(result.data).toEqual({
      downloadUrl: "https://download.example/signed",
      filename: "helvety-spo-explorer.sppkg",
      version: "1.0.2.0",
    });
    expect(mocks.from).toHaveBeenCalledWith("packages");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "spfx/helvety-spo-explorer/helvety-spo-explorer.sppkg",
      60,
      { download: "helvety-spo-explorer.sppkg" }
    );
  });

  it("creates a signed URL for the Power Platform Configurator zip package", async () => {
    mocks.resolveLatestPackageVersion.mockResolvedValue({
      version: "2.8.0",
      storagePath:
        "browserExtensions/power-platform-configurator/power-platform-configurator.zip",
    });

    const result = await getPackageDownloadUrl(
      "power-platform-configurator"
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected successful download URL response");
    }
    expect(result.data).toEqual({
      downloadUrl: "https://download.example/signed",
      filename: "power-platform-configurator.zip",
      version: "2.8.0",
    });
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "browserExtensions/power-platform-configurator/power-platform-configurator.zip",
      60,
      { download: "power-platform-configurator.zip" }
    );
  });

  it("falls back to configured filename path when resolver returns null", async () => {
    mocks.resolveLatestPackageVersion.mockResolvedValue(null);

    const result = await getPackageDownloadUrl("spo-explorer");

    expect(result.success).toBe(true);
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "spfx/helvety-spo-explorer/helvety-spo-explorer.sppkg",
      60,
      { download: "helvety-spo-explorer.sppkg" }
    );
  });

  it("falls back to configured zip path when resolver returns null for Power Platform Configurator package", async () => {
    mocks.resolveLatestPackageVersion.mockResolvedValue(null);

    const result = await getPackageDownloadUrl(
      "power-platform-configurator"
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected successful download URL response");
    }
    expect(result.data).toEqual({
      downloadUrl: "https://download.example/signed",
      filename: "power-platform-configurator.zip",
      version: "2.8.0",
    });
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "browserExtensions/power-platform-configurator/power-platform-configurator.zip",
      60,
      { download: "power-platform-configurator.zip" }
    );
  });

  it("rejects when client IP is unresolvable", async () => {
    mocks.getTrustedClientIp.mockReturnValueOnce(null as unknown as string);

    const result = await getPackageDownloadUrl("spo-explorer");

    expect(result).toEqual({
      success: false,
      error: "Unable to process request",
    });
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("rejects when rate limit is exceeded", async () => {
    mocks.checkRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfter: 42,
    } as unknown as { allowed: boolean });

    const result = await getPackageDownloadUrl("spo-explorer");

    expect(result).toEqual({
      success: false,
      error: "Too many requests. Wait 42 seconds, then try again.",
    });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("handles storage signing failures safely", async () => {
    mocks.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const result = await getPackageDownloadUrl("spo-explorer");

    expect(result).toEqual({
      success: false,
      error: "Failed to generate download link",
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error generating signed URL",
      { message: "boom" }
    );
  });
});
