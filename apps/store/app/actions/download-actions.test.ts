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
