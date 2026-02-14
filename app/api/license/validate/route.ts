/**
 * License Validation API Route
 * Public endpoint for Helvety products to validate tenant licenses
 *
 * GET /api/license/validate?tenant={tenantId}&product={productId}
 */

import { NextResponse } from "next/server";

import { validateTenantLicense } from "@/lib/license/validation";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { LicenseValidationResponse } from "@/lib/types/entities";
import type { NextRequest } from "next/server";

// =============================================================================
// CORS CONFIGURATION
// =============================================================================

/**
 * CORS headers for SharePoint domains
 *
 * SECURITY RATIONALE (for auditors):
 *
 * This endpoint allows CORS from any *.sharepoint.com subdomain because:
 *
 * 1. Purpose: This API is called by the Helvety SPO Explorer extension running
 *    inside SharePoint Online. Each customer has their own tenant subdomain
 *    (e.g., contoso.sharepoint.com, fabrikam.sharepoint.com).
 *
 * 2. Why not allowlist specific domains: We cannot predict all customer tenant
 *    domains in advance. New customers can purchase and use the extension
 *    without us knowing their SharePoint domain.
 *
 * 3. Security controls in place:
 *    - Endpoint only returns license validity (boolean) - no sensitive data
 *    - Tenant ID is validated against registered licenses in the database
 *    - IP-based and tenant-based rate limiting prevents abuse
 *    - No authentication cookies are sent (simple CORS request)
 *
 * 4. Accepted risk: Any SharePoint site can call this API. The worst case is
 *    an attacker learns whether a specific tenant has a valid license, which
 *    is low-value information.
 *
 * @param origin - The request origin header
 * @returns CORS headers to include in the response
 */
function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400", // 24 hours
  };

  // Allow SharePoint domains and localhost for development
  if (origin) {
    const isSharePoint =
      origin.endsWith(".sharepoint.com") ||
      origin.endsWith(".sharepoint-df.com");
    const isLocalhost =
      origin.includes("localhost") || origin.includes("127.0.0.1");

    if (isSharePoint || isLocalhost) {
      headers["Access-Control-Allow-Origin"] = origin;
    }
  }

  return headers;
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

    // Check IP-based rate limit (prevents abuse from a single source)
    // Prefer x-real-ip (Vercel-trusted, not spoofable) over x-forwarded-for
    const clientIP =
      request.headers.get("x-real-ip") ??
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
