import "server-only";

import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";

import { packageIdSchema } from "@/lib/download-security";
import { getPackageInfo } from "@/lib/packages/config";
import { resolveLatestPackageVersion } from "@/lib/packages/resolve-version";

/** Outcome of signing a public package download URL. */
export type PackageDownloadResult =
  | { ok: true; downloadUrl: string }
  | { ok: false; error: string; status: 400 | 404 | 500 };

/**
 * Resolves and signs a public package download URL.
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

  const resolved = await resolveLatestPackageVersion(packageId);
  if (!resolved) {
    return { ok: false, error: "Package not found", status: 404 };
  }

  const adminClient = createAdminClient();
  const { data: signedUrlData, error: storageError } = await adminClient.storage
    .from("packages")
    .createSignedUrl(resolved.storagePath, 60, {
      download: packageInfo.filename,
    });

  if (storageError || !signedUrlData?.signedUrl) {
    logger.logUnexpectedError("Error generating signed URL", storageError);
    return {
      ok: false,
      error: "Failed to generate download link",
      status: 500,
    };
  }

  logger.info("Public download URL generated", {
    packageId,
    version: resolved.version,
  });

  return { ok: true, downloadUrl: signedUrlData.signedUrl };
}
