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

import { createPackageDownload } from "./create-package-download";

describe("createPackageDownload", () => {
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
    const result = await createPackageDownload("NOT_VALID");
    expect(result).toEqual({
      ok: false,
      error: "Invalid package ID",
      status: 400,
    });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("returns not found for unknown package IDs", async () => {
    const result = await createPackageDownload("unknown-package");
    expect(result).toEqual({
      ok: false,
      error: "Package not found",
      status: 404,
    });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("returns not found for legacy and retired package ids removed from config", async () => {
    const retiredPackageIds = [
      "power-automate-editor-preference",
      "power-automate-force-v3-false",
      "power-automate-editor-version-enforcer",
      "power-platform-configurator",
    ] as const;

    for (const packageId of retiredPackageIds) {
      expect(await createPackageDownload(packageId)).toEqual({
        ok: false,
        error: "Package not found",
        status: 404,
      });
    }
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("creates a signed URL for public packages", async () => {
    const result = await createPackageDownload("spo-explorer");

    expect(result).toEqual({
      ok: true,
      downloadUrl: "https://download.example/signed",
    });
    expect(mocks.from).toHaveBeenCalledWith("packages");
    expect(mocks.createSignedUrl).toHaveBeenCalledWith(
      "spfx/helvety-spo-explorer/helvety-spo-explorer.sppkg",
      60,
      { download: "helvety-spo-explorer.sppkg" }
    );
  });

  it("returns not found when resolver returns null", async () => {
    mocks.resolveLatestPackageVersion.mockResolvedValue(null);

    const result = await createPackageDownload("spo-explorer");

    expect(result).toEqual({
      ok: false,
      error: "Package not found",
      status: 404,
    });
    expect(mocks.adminClientFactory).not.toHaveBeenCalled();
  });

  it("handles storage signing failures safely", async () => {
    mocks.createSignedUrl.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const result = await createPackageDownload("spo-explorer");

    expect(result).toEqual({
      ok: false,
      error: "Failed to generate download link",
      status: 500,
    });
    expect(mocks.logUnexpectedError).toHaveBeenCalledWith(
      "Error generating signed URL",
      { message: "boom" }
    );
  });
});
