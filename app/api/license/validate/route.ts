/**
 * License Validation API Route
 * Public endpoint for Helvety products to validate tenant licenses
 *
 * GET /api/license/validate?tenant={tenantId}&product={productId}
 */

import { NextResponse } from "next/server";

import { validateTenantLicense } from "@/lib/license/validation";
import { logger } from "@/lib/logger";

import type { LicenseValidationResponse } from "@/lib/types/entities";
import type { NextRequest } from "next/server";

// =============================================================================
// RATE LIMITING (Simple in-memory implementation)
// =============================================================================

/**
 * Simple in-memory rate limiter for license validation requests
 *
 * IMPORTANT LIMITATIONS (for security auditors):
 *
 * 1. Per-Instance Only: This rate limiter uses an in-memory Map, which means
 *    it only tracks requests within a single serverless function instance.
 *    On Vercel/serverless, multiple instances may run concurrently, so
 *    the effective rate limit may be higher than configured.
 *
 * 2. No Persistence: Rate limit state is lost when the function instance
 *    restarts or scales down.
 *
 * 3. Memory Growth: The Map grows with unique tenant IDs. The periodic cleanup
 *    (every 60s) prevents unbounded growth, but high cardinality could cause
 *    temporary memory pressure.
 *
 * For a more robust solution, consider:
 * - Upstash Redis for distributed rate limiting
 * - Vercel Edge Config for configuration
 * - Cloudflare Rate Limiting at the edge
 *
 * Current approach is acceptable because:
 * - License validation is low-value abuse target (returns boolean, no sensitive data)
 * - Per-instance limiting still provides protection against single-source abuse
 * - Infrastructure-level rate limiting (Vercel/Cloudflare) provides additional protection
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per tenant

/**
 * Check if a tenant has exceeded the rate limit
 *
 * @param tenantId - The tenant ID to check
 * @returns true if within limit, false if exceeded
 */
function checkRateLimit(tenantId: string): boolean {
  const now = Date.now();
  const key = tenantId.toLowerCase();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

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

/**
 *
 * @param request
 */
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

/**
 *
 * @param request
 */
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
    if (!checkRateLimit(tenantId)) {
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
