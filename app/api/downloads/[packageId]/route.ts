/**
 * Package Download API Route
 * Authenticated endpoint for downloading packages with subscription verification
 *
 * GET /api/downloads/[packageId]
 *
 * Returns a redirect to a short-lived signed URL for the package download
 */

import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { getPackageInfo, isTierAllowedForPackage } from "@/lib/packages/config";
import { resolveLatestPackageVersion } from "@/lib/packages/resolve-version";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { NextRequest } from "next/server";

// =============================================================================
// GET /api/downloads/[packageId] - Download package
// =============================================================================

/**
 *
 * @param _request
 * @param root0
 * @param root0.params
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ packageId: string }> }
) {
  try {
    const { packageId } = await params;

    // Get package info
    const packageInfo = getPackageInfo(packageId);
    if (!packageInfo) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check for active subscription with allowed tier
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id, tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("product_id", packageInfo.productId)
      .in("status", ["active", "trialing"]);

    if (subError) {
      logger.error("Error fetching subscriptions for download API:", subError);
      return NextResponse.json(
        { error: "Failed to verify subscription" },
        { status: 500 }
      );
    }

    // Check if any subscription has an allowed tier and is not expired
    const validSubscription = subscriptions?.find(
      (sub) =>
        isTierAllowedForPackage(packageId, sub.tier_id) &&
        (!sub.current_period_end ||
          new Date(sub.current_period_end) > new Date())
    );

    if (!validSubscription) {
      return NextResponse.json(
        { error: "Active subscription required to download this package" },
        { status: 403 }
      );
    }

    // Resolve path (and version for logging) for versioned packages
    const resolved = packageInfo.storagePathPrefix
      ? await resolveLatestPackageVersion(packageId)
      : null;
    const storagePath = resolved?.storagePath ?? packageInfo.storagePath;
    const version = resolved?.version ?? packageInfo.version;

    // Generate signed URL using admin client
    const adminClient = createAdminClient();
    const { data: signedUrlData, error: storageError } =
      await adminClient.storage
        .from("packages")
        .createSignedUrl(storagePath, 60, {
          download: packageInfo.filename,
        });

    if (storageError || !signedUrlData?.signedUrl) {
      logger.error("Error generating signed URL in API:", storageError);
      return NextResponse.json(
        { error: "Failed to generate download link" },
        { status: 500 }
      );
    }

    logger.info(
      `Download initiated: user=${user.id}, package=${packageId}, version=${version}`
    );

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    logger.error("Error in download API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
