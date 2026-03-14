import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import { getPackageDownloadUrl } from "@/app/actions/download-actions";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { NextRequest } from "next/server";

/** Resolve a package download URL and redirect the caller. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ packageId: string }> }
) {
  const clientIp = getTrustedClientIp(request.headers, {
    requireTrustedProxyInProduction: true,
  });
  if (!clientIp) {
    return NextResponse.json({ error: "Missing client IP" }, { status: 400 });
  }

  const downloadRateLimit = await checkRateLimit(
    `public-download:ip:${clientIp}`,
    RATE_LIMITS.DOWNLOADS.maxRequests,
    RATE_LIMITS.DOWNLOADS.windowMs,
    "store-downloads"
  );
  if (!downloadRateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Too many download requests. Please wait ${downloadRateLimit.retryAfter ?? 60} seconds and try again.`,
      },
      { status: 429 }
    );
  }

  const { packageId } = await context.params;
  const result = await getPackageDownloadUrl(packageId);

  if (!result.success) {
    logger.warn("Public package download failed", {
      packageId,
      error: result.error,
    });
    return NextResponse.json(
      { error: result.error ?? "Failed to generate download URL" },
      { status: 404 }
    );
  }

  if (!result.data) {
    logger.warn("Public package download failed with empty payload", {
      packageId,
    });
    return NextResponse.json(
      { error: "Failed to generate download URL" },
      { status: 404 }
    );
  }

  return NextResponse.redirect(result.data.downloadUrl, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
