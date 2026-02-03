"use server";

/**
 * Server actions for package downloads
 * Validates subscription status and generates signed download URLs
 */

import { logger } from "@/lib/logger";
import { getPackageInfo, isTierAllowedForPackage } from "@/lib/packages/config";
import { resolveLatestPackageVersion } from "@/lib/packages/resolve-version";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type { ActionResponse } from "@/lib/types/entities";

// =============================================================================
// TYPES
// =============================================================================

/**
 *
 */
export interface PackageDownloadInfo {
  /** Signed URL for downloading the package (expires in 60 seconds) */
  downloadUrl: string;
  /** Filename for the download */
  filename: string;
  /** Package version */
  version: string;
}

// =============================================================================
// DOWNLOAD ACTIONS
// =============================================================================

/**
 * Get a signed download URL for a package
 * Validates that the user has an active subscription for the product
 *
 * @param packageId - The package identifier (e.g., 'spo-explorer')
 * @returns Signed download URL with metadata
 */
export async function getPackageDownloadUrl(
  packageId: string
): Promise<ActionResponse<PackageDownloadInfo>> {
  try {
    // Get package info
    const packageInfo = getPackageInfo(packageId);
    if (!packageInfo) {
      return { success: false, error: "Package not found" };
    }

    // Verify user is authenticated
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check for active subscription with allowed tier
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id, tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("product_id", packageInfo.productId)
      .in("status", ["active", "trialing"]);

    if (subError) {
      logger.error("Error fetching subscriptions for download:", subError);
      return { success: false, error: "Failed to verify subscription" };
    }

    // Check if any subscription has an allowed tier
    const validSubscription = subscriptions?.find(
      (sub) =>
        isTierAllowedForPackage(packageId, sub.tier_id) &&
        (!sub.current_period_end ||
          new Date(sub.current_period_end) > new Date())
    );

    if (!validSubscription) {
      return {
        success: false,
        error: "Active subscription required to download this package",
      };
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

    logger.info(
      `Download URL generated for user ${user.id}, package ${packageId}`
    );

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

/**
 * Get package info without generating a download URL
 * Useful for displaying version info without triggering a download
 *
 * @param packageId - The package identifier
 * @returns Package metadata if user has access
 */
export async function getPackageMetadata(
  packageId: string
): Promise<
  ActionResponse<{ version: string; filename: string; productName: string }>
> {
  try {
    const packageInfo = getPackageInfo(packageId);
    if (!packageInfo) {
      return { success: false, error: "Package not found" };
    }

    // Verify user is authenticated
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check for active subscription
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("product_id", packageInfo.productId)
      .in("status", ["active", "trialing"]);

    if (subError) {
      logger.error("Error fetching subscriptions for metadata:", subError);
      return { success: false, error: "Failed to verify subscription" };
    }

    const hasAccess = subscriptions?.some(
      (sub) =>
        isTierAllowedForPackage(packageId, sub.tier_id) &&
        (!sub.current_period_end ||
          new Date(sub.current_period_end) > new Date())
    );

    if (!hasAccess) {
      return {
        success: false,
        error: "Active subscription required",
      };
    }

    // Resolve version from storage for versioned packages
    const resolved = packageInfo.storagePathPrefix
      ? await resolveLatestPackageVersion(packageId)
      : null;
    const version = resolved?.version ?? packageInfo.version;

    return {
      success: true,
      data: {
        version,
        filename: packageInfo.filename,
        productName: packageInfo.productName,
      },
    };
  } catch (error) {
    logger.error("Error in getPackageMetadata:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
