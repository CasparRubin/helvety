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
 *    - Rate limiting prevents abuse
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
        } as LicenseValidationResponse,
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
        } as LicenseValidationResponse,
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
        } as LicenseValidationResponse,
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
        } as LicenseValidationResponse,
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Check rate limit
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
        } as LicenseValidationResponse,
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": "60",
          },
        }
      );
    }

    // Validate the license for the specific product
    const result = await validateTenantLicense(tenantId, productId);

    // Set cache headers (cache valid responses for 1 hour)
    const cacheHeaders = result.valid
      ? {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        }
      : { "Cache-Control": "no-cache" };

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
      { valid: false, reason: "server_error" } as LicenseValidationResponse,
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
