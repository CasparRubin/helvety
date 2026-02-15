/**
 * License Validation API Route
 * Public endpoint for Helvety products to validate tenant licenses
 *
 * GET /api/license/validate?tenant={tenantId}&product={productId}
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { logger } from "@helvety/shared/logger";
import { NextResponse } from "next/server";

import { validateTenantLicense } from "@/lib/license/validation";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { LicenseValidationResponse } from "@/lib/types/entities";
import type { NextRequest } from "next/server";

/** Narrowed union of API failure reasons used by this route. */
type LicenseFailureReason = NonNullable<LicenseValidationResponse["reason"]>;
/** Reasons specific to signature validation failures. */
type SignatureFailureReason = Extract<
  LicenseFailureReason,
  | "missing_signature"
  | "invalid_signature"
  | "invalid_signature_timestamp"
  | "expired_signature"
>;

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

/**
 * CORS headers for the license validation endpoint
 *
 * SECURITY RATIONALE (for auditors):
 *
 * This endpoint allows CORS from SharePoint Online tenants and localhost:
 *
 * 1. Purpose: This API is called by the Helvety SPO Explorer extension running
 *    inside SharePoint Online and (optionally) local development clients.
 *
 * 2. All SharePoint Online tenants use *.sharepoint.com hostnames, so we
 *    allow any origin matching that pattern (no per-tenant configuration).
 *
 * 3. Security controls in place:
 *    - Endpoint only returns license validity (boolean) - no sensitive data
 *    - Tenant ID is validated against registered licenses in the database
 *    - IP-based and tenant-based rate limiting prevents abuse
 *    - No authentication cookies are sent (simple CORS request)
 *    - Optional HMAC signature verification for machine-to-machine callers
 *
 * @param origin - The request origin header
 * @returns CORS headers to include in the response
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, X-License-Timestamp, X-License-Signature",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  if (!origin) return headers;

  const normalizedHost = (() => {
    try {
      return new URL(origin).hostname.toLowerCase();
    } catch {
      return null;
    }
  })();

  if (!normalizedHost) return headers;

  const isSharePoint = normalizedHost.endsWith(".sharepoint.com");
  const isLocalhost =
    normalizedHost === "localhost" || normalizedHost === "127.0.0.1";
  const isDevelopment = process.env.NODE_ENV !== "production";

  if (isSharePoint || (isDevelopment && isLocalhost)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/** Maximum age allowed for signed validation requests. */
const SIGNATURE_TTL_SECONDS = 300;

/**
 * Validate HMAC request signature for machine-to-machine callers.
 *
 * Signature verification is optional: if LICENSE_VALIDATION_SHARED_SECRET is
 * set in the environment, requests carrying signature headers are verified.
 * If the secret is not configured, signature verification is skipped entirely.
 */
function verifyRequestSignature(
  request: NextRequest,
  tenantId: string,
  productId: string
): { ok: boolean; reason?: SignatureFailureReason } {
  const signatureSecret = process.env.LICENSE_VALIDATION_SHARED_SECRET?.trim();

  // No secret configured — skip signature verification entirely.
  if (!signatureSecret) return { ok: true };

  const timestampHeader = request.headers.get("x-license-timestamp");
  const signatureHeader = request.headers.get("x-license-signature");

  // Secret is configured but headers are absent — reject.
  if (!timestampHeader || !signatureHeader) {
    return { ok: false, reason: "missing_signature" };
  }

  const timestampMs = Number(timestampHeader);
  if (!Number.isFinite(timestampMs)) {
    return { ok: false, reason: "invalid_signature_timestamp" };
  }

  const now = Date.now();
  const ageSeconds = Math.abs(now - timestampMs) / 1000;
  if (ageSeconds > SIGNATURE_TTL_SECONDS) {
    return { ok: false, reason: "expired_signature" };
  }

  const payload = `${tenantId.toLowerCase()}:${productId.toLowerCase()}:${timestampHeader}`;
  const expectedHex = createHmac("sha256", signatureSecret)
    .update(payload)
    .digest("hex");

  const received = signatureHeader.trim().toLowerCase();
  if (
    expectedHex.length !== received.length ||
    !timingSafeEqual(Buffer.from(expectedHex), Buffer.from(received))
  ) {
    return { ok: false, reason: "invalid_signature" };
  }

  return { ok: true };
}

// =============================================================================
// OPTIONS - CORS Preflight
// =============================================================================

/** Handles CORS preflight requests. */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

// =============================================================================
// GET /api/license/validate - Validate tenant license
// =============================================================================

/** Validates a tenant license for a given product. */
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Get tenant ID and product ID from query params
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant");
    const productId = searchParams.get("product");

    if (!tenantId) {
      return NextResponse.json(
        {
          valid: false,
          reason: "missing_tenant_id",
        } satisfies LicenseValidationResponse,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!productId) {
      return NextResponse.json(
        {
          valid: false,
          reason: "missing_product_id",
        } satisfies LicenseValidationResponse,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate tenant ID format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(tenantId)) {
      return NextResponse.json(
        {
          valid: false,
          reason: "invalid_tenant_id",
        } satisfies LicenseValidationResponse,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Validate product ID format (alphanumeric, hyphens, and underscores)
    if (!/^[a-zA-Z0-9-_]+$/.test(productId)) {
      return NextResponse.json(
        {
          valid: false,
          reason: "invalid_product_id",
        } satisfies LicenseValidationResponse,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const signatureCheck = verifyRequestSignature(request, tenantId, productId);
    if (!signatureCheck.ok) {
      logger.warn(
        `License signature validation failed (${signatureCheck.reason ?? "unknown"})`
      );
      return NextResponse.json(
        {
          valid: false,
          reason: signatureCheck.reason ?? "invalid_signature",
        } satisfies LicenseValidationResponse,
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Check IP-based rate limit (prevents abuse from a single source)
    // Prefer x-real-ip (Vercel-trusted, not spoofable) over x-forwarded-for
    const trustedIp = request.headers.get("x-real-ip");
    if (process.env.NODE_ENV === "production" && !trustedIp) {
      logger.warn("License validation request missing x-real-ip in production");
      return NextResponse.json(
        {
          valid: false,
          reason: "missing_client_ip",
        } satisfies LicenseValidationResponse,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }
    const clientIP =
      trustedIp ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const ipRateLimit = await checkRateLimit(
      `license:ip:${clientIP}`,
      30,
      60_000
    );
    if (!ipRateLimit.allowed) {
      logger.warn(`IP rate limit exceeded for license validation: ${clientIP}`);
      return NextResponse.json(
        {
          valid: false,
          reason: "rate_limit_exceeded",
        } satisfies LicenseValidationResponse,
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": "60",
          },
        }
      );
    }

    // Check tenant-based rate limit
    const rateLimit = await checkRateLimit(
      `license:tenant:${tenantId.toLowerCase()}`,
      RATE_LIMITS.API.maxRequests,
      RATE_LIMITS.API.windowMs
    );
    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for tenant: ${tenantId}`);
      return NextResponse.json(
        {
          valid: false,
          reason: "rate_limit_exceeded",
        } satisfies LicenseValidationResponse,
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": "60",
          },
        }
      );
    }

    // Constant-time floor: ensure all responses take at least 200-300ms
    // to prevent timing-based enumeration of valid vs invalid tenants
    const startTime = Date.now();

    // Validate the license for the specific product
    const result = await validateTenantLicense(tenantId, productId);

    // Enforce constant-time floor with jitter (200-300ms minimum)
    const elapsed = Date.now() - startTime;
    const minDuration = 200 + Math.floor(Math.random() * 100);
    if (elapsed < minDuration) {
      await new Promise((resolve) =>
        setTimeout(resolve, minDuration - elapsed)
      );
    }

    // Uniform cache headers for all responses (prevents enumeration via cache behavior)
    const cacheHeaders = {
      "Cache-Control": "private, no-store, max-age=0",
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        ...corsHeaders,
        ...cacheHeaders,
      },
    });
  } catch (error) {
    logger.error("Error in license validation API:", error);

    return NextResponse.json(
      {
        valid: false,
        reason: "server_error",
      } satisfies LicenseValidationResponse,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

