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

  it("returns a public Supabase Storage URL for Power Platform Tools", async () => {
    const core = await createPackageDownload("power-platform-tools");
    expect(core.ok).toBe(true);
    if (core.ok) {
      expect(core.downloadUrl).toContain(
        "/storage/v1/object/public/packages/power-platform-tools/"
      );
    }
  });

  it("rejects retired Power Platform Tools module package ids", async () => {
    for (const packageId of [
      "flow-explorer",
      "web-resource-explorer",
      "data-model-explorer",
    ]) {
      expect(await createPackageDownload(packageId)).toEqual({
        ok: false,
        error: "Package not found",
        status: 404,
      });
    }
  });
});
