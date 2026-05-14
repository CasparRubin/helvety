"use server";

import "server-only";

/**
 * Server actions for package downloads
 * Generates signed download URLs for public packages
 */

import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import { headers } from "next/headers";

import {
  buildDownloadUrlRateLimitKey,
  packageIdSchema,
} from "@/lib/download-security";
import { getPackageInfo, isPublicPackage } from "@/lib/packages/config";
import { resolveLatestPackageVersion } from "@/lib/packages/resolve-version";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { ActionResponse } from "@/lib/types";
import type { PackageDownloadInfo } from "@/lib/types/store";

// =============================================================================
// DOWNLOAD ACTIONS
// =============================================================================

/**
 * Get a signed download URL for a package
 * Public packages can be downloaded without login.
 *
 * @param packageId - Public download package id configured in `lib/packages/config.ts` (e.g. `spo-explorer`, `power-automate-editor-version-enforcer`). Legacy ids are rejected here; HTTP redirects for old paths are defined in `next.config.ts`.
 * @returns Signed download URL with metadata
 */
export async function getPackageDownloadUrl(
  packageId: string
): Promise<ActionResponse<PackageDownloadInfo>> {
  try {
    // Validate input
    const parseResult = packageIdSchema.safeParse(packageId);
    if (!parseResult.success) {
      return { success: false, error: "Invalid package ID" };
    }

    const packageInfo = getPackageInfo(packageId);
    if (!packageInfo) {
      return { success: false, error: "Package not found" };
    }

    if (!isPublicPackage(packageId)) {
      return { success: false, error: "Package is not publicly available" };
    }

    const clientIp = getTrustedClientIp(await headers(), {
      requireTrustedProxyInProduction: true,
    });
    if (!clientIp) {
      return { success: false, error: "Unable to process request" };
    }
    const rateLimit = await checkRateLimit(
      buildDownloadUrlRateLimitKey(clientIp),
      RATE_LIMITS.DOWNLOAD_URL.maxRequests,
      RATE_LIMITS.DOWNLOAD_URL.windowMs
    );
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: buildRateLimitedUserMessage(rateLimit.retryAfter),
      };
    }

    // Resolve the latest package file from storage; fallback to configured filename path.
    const resolved = await resolveLatestPackageVersion(packageId);
    const storagePath =
      resolved?.storagePath ??
      `${packageInfo.storageFolderPath}/${packageInfo.filename}`;
    const version = resolved?.version ?? packageInfo.version;

    // Generate signed URL using admin client (has storage access)
    const adminClient = createAdminClient();
    const { data: signedUrlData, error: storageError } =
      await adminClient.storage
        .from("packages")
        .createSignedUrl(storagePath, 60, {
          download: packageInfo.filename, // Sets Content-Disposition header
        });

    if (storageError || !signedUrlData?.signedUrl) {
      logger.logUnexpectedError("Error generating signed URL", storageError);
      return { success: false, error: "Failed to generate download link" };
    }

    logger.info("Public download URL generated", { packageId });

    return {
      success: true,
      data: {
        downloadUrl: signedUrlData.signedUrl,
        filename: packageInfo.filename,
        version,
      },
    };
  } catch (error) {
    return unexpectedActionError("Error in getPackageDownloadUrl", error);
  }
}
