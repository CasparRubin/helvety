import { getTrustedClientIp } from "@helvety/shared/client-ip";
import { logger } from "@helvety/shared/logger";
import { buildRateLimitedUserMessage } from "@helvety/shared/user-facing-errors";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getPackageDownloadUrl } from "@/app/actions/download-actions";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const PackageIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9-]+$/);

/** Ensures public download redirects only target trusted storage origins. */
function isAllowedDownloadUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;

    const allowedOrigins = new Set<string>();
    const envCandidates = [
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_URL,
    ];
    for (const candidate of envCandidates) {
      if (!candidate) continue;
      try {
        allowedOrigins.add(new URL(candidate).origin);
      } catch {
        // Ignore malformed env values; runtime validation handles these separately.
      }
    }

    if (allowedOrigins.size === 0) {
      return process.env.NODE_ENV !== "production";
    }

    return allowedOrigins.has(parsed.origin);
  } catch {
    return false;
  }
}

/** Resolve a package download URL and redirect the caller. */
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
    `public-download:ip:${clientIp}`,
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
  if (!PackageIdSchema.safeParse(packageId).success) {
    return NextResponse.json(
      { success: false, error: "Invalid package ID" },
      { status: 400 }
    );
  }
  const result = await getPackageDownloadUrl(packageId);

  if (!result.success) {
    logger.warn("Public package download failed", {
      packageId,
      error: result.error,
    });
    return NextResponse.json(
      {
        success: false,
        error: result.error ?? "Failed to generate download URL",
      },
      { status: 404 }
    );
  }

  if (!result.data) {
    logger.warn("Public package download failed with empty payload", {
      packageId,
    });
    return NextResponse.json(
      { success: false, error: "Failed to generate download URL" },
      { status: 404 }
    );
  }

  if (!isAllowedDownloadUrl(result.data.downloadUrl)) {
    logger.warn("Public package download produced disallowed redirect target", {
      packageId,
    });
    return NextResponse.json(
      { success: false, error: "Failed to generate download URL" },
      { status: 500 }
    );
  }

  return NextResponse.redirect(result.data.downloadUrl, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
