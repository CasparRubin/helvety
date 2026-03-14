"use server";

import "server-only";

/**
 * Server actions for package downloads
 * Generates signed download URLs for public packages
 */

import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { z } from "zod";

import { getPackageInfo, isPublicPackage } from "@/lib/packages/config";
import { resolveLatestPackageVersion } from "@/lib/packages/resolve-version";

import type { ActionResponse } from "@/lib/types";
import type { PackageDownloadInfo } from "@/lib/types/store";

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * Package ID validation schema
 * Package IDs are lowercase alphanumeric with hyphens
 */
const PackageIdSchema = z
  .string()
  .min(1, "Package ID is required")
  .max(100, "Package ID too long")
  .regex(
    /^[a-z0-9-]+$/,
    "Package ID must be lowercase alphanumeric with hyphens"
  );

export type { PackageDownloadInfo } from "@/lib/types/store";

// =============================================================================
// DOWNLOAD ACTIONS
// =============================================================================

/**
 * Get a signed download URL for a package
 * Public packages can be downloaded without login or purchase checks.
 *
 * @param packageId - The package identifier (e.g., 'spo-explorer')
 * @returns Signed download URL with metadata
 */
export async function getPackageDownloadUrl(
  packageId: string
): Promise<ActionResponse<PackageDownloadInfo>> {
  try {
    // Validate input
    const parseResult = PackageIdSchema.safeParse(packageId);
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

    // Resolve path and version (for versioned packages, from storage; else from config)
    const resolved = packageInfo.storagePathPrefix
      ? await resolveLatestPackageVersion(packageId)
      : null;
    const storagePath = resolved?.storagePath ?? packageInfo.storagePath;
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
      logger.error("Error generating signed URL:", storageError);
      return { success: false, error: "Failed to generate download link" };
    }

    logger.info(`Public download URL generated for package ${packageId}`);

    return {
      success: true,
      data: {
        downloadUrl: signedUrlData.signedUrl,
        filename: packageInfo.filename,
        version,
      },
    };
  } catch (error) {
    logger.error("Error in getPackageDownloadUrl:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
