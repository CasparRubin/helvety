import "server-only";

import { packageIdSchema } from "@/lib/download-security";
import { getPackageInfo } from "@/lib/packages/config";

/** Outcome of resolving a public package download URL. */
export type PackageDownloadResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; error: string; status: 400 | 404 | 500 };

/**
 * Resolves a public package download URL from package config.
 * Caller must enforce IP rate limits and trusted-proxy client IP before calling.
 */
export async function createPackageDownload(
  packageId: string
): Promise<PackageDownloadResult> {
  const parseResult = packageIdSchema.safeParse(packageId);
  if (!parseResult.success) {
    return { ok: false, error: "Invalid package ID", status: 400 };
  }

  const packageInfo = getPackageInfo(packageId);
  if (!packageInfo) {
    return { ok: false, error: "Package not found", status: 404 };
  }

  if (!packageInfo.isPublic) {
    return {
      ok: false,
      error: "Package is not publicly available",
      status: 404,
    };
  }

  return { ok: true, downloadUrl: packageInfo.downloadUrl };
}
