import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import { NextResponse } from "next/server";

import {
  buildPublicDownloadRateLimitKey,
  isAllowedDownloadUrl,
} from "@/lib/download-security";
import { createPackageDownload } from "@/lib/packages/create-package-download";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Public GET handler for `/store/api/packages/{packageId}/download`.
 * `packageId` must match a key in `lib/packages/config.ts`. Legacy package ids are rejected with not-found.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ packageId: string }> }
) {
  const clientIp = getTrustedClientIp(request.headers, {
    requireTrustedProxyInProduction: true,
  });
  if (!clientIp) {
    return NextResponse.json(
      { success: false, error: "Missing client IP" },
      { status: 400 }
    );
  }

  const downloadRateLimit = await checkRateLimit(
    buildPublicDownloadRateLimitKey(clientIp),
    RATE_LIMITS.DOWNLOADS.maxRequests,
    RATE_LIMITS.DOWNLOADS.windowMs,
    "store-downloads"
  );
  if (!downloadRateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: buildRateLimitedUserMessage(
          downloadRateLimit.retryAfter,
          "download"
        ),
      },
      { status: 429 }
    );
  }

  const { packageId } = await context.params;
  const result = await createPackageDownload(packageId);

  if (!result.ok) {
    logger.warn("Public package download failed", {
      packageId,
      error: result.error,
    });
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status }
    );
  }

  if (!isAllowedDownloadUrl(result.downloadUrl)) {
    logger.warn("Public package download produced disallowed redirect target", {
      packageId,
    });
    return NextResponse.json(
      { success: false, error: "Failed to generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(result.downloadUrl, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
