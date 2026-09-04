import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPackageDownload } from "./create-package-download";

describe("createPackageDownload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid package ids", async () => {
    const result = await createPackageDownload("NOT_VALID");
    expect(result).toEqual({
      ok: false,
      error: "Invalid package ID",
      status: 400,
    });
  });

  it("rejects unknown package ids", async () => {
    const result = await createPackageDownload("unknown-package");
    expect(result).toEqual({
      ok: false,
      error: "Package not found",
      status: 404,
    });
  });

  it("returns the configured GitHub Releases download URL", async () => {
    const result = await createPackageDownload("spo-explorer");
    expect(result).toEqual({
      ok: true,
      downloadUrl:
        "https://github.com/CasparRubin/helvety-spo-explorer/releases/latest/download/helvety-spo-explorer.sppkg",
    });
  });

  it("returns public Supabase Storage URLs for Power Platform Tools packages", async () => {
    const core = await createPackageDownload("power-platform-tools");
    expect(core.ok).toBe(true);
    if (core.ok) {
      expect(core.downloadUrl).toContain(
        "/storage/v1/object/public/packages/power-platform-tools/"
      );
    }

    const moduleZip = await createPackageDownload("flow-explorer");
    expect(moduleZip.ok).toBe(true);
    if (moduleZip.ok) {
      expect(moduleZip.downloadUrl).toContain(
        "/storage/v1/object/public/packages/flow-explorer/"
      );
    }

    const webResourceZip = await createPackageDownload("web-resource-explorer");
    expect(webResourceZip.ok).toBe(true);
    if (webResourceZip.ok) {
      expect(webResourceZip.downloadUrl).toContain(
        "/storage/v1/object/public/packages/web-resource-explorer/"
      );
    }
  });
});
