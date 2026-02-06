/**
 * Tenants API Route
 * Authenticated endpoints for users to manage their licensed tenants
 *
 * GET /api/tenants - List user's registered tenants
 * POST /api/tenants - Register a new tenant
 */

import { NextResponse } from "next/server";

import { validateCSRFToken } from "@/lib/csrf";
import { getMaxTenantsForTier } from "@/lib/license/validation";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type {
  LicensedTenant,
  RegisterTenantRequest,
} from "@/lib/types/entities";
import type { NextRequest } from "next/server";

// =============================================================================
// CONSTANTS
// =============================================================================

const SPO_EXPLORER_PRODUCT_ID = "helvety-spo-explorer";

// =============================================================================
// GET /api/tenants - List user's registered tenants
// =============================================================================

/**
 *
 */
export async function GET() {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit by user ID
    const rateLimit = await checkRateLimit(
      `tenants:user:${user.id}`,
      RATE_LIMITS.TENANTS.maxRequests,
      RATE_LIMITS.TENANTS.windowMs
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter ?? 60) },
        }
      );
    }

    // Get user's tenants with subscription info
    const { data: tenants, error } = await supabase
      .from("licensed_tenants")
      .select(
        `
        id,
        tenant_id,
        tenant_domain,
        display_name,
        subscription_id,
        created_at,
        updated_at,
        subscription:subscriptions (
          id,
          tier_id,
          status,
          current_period_end
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching tenants:", error);
      return NextResponse.json(
        { error: "Failed to fetch tenants" },
        { status: 500 }
      );
    }

    return NextResponse.json({ tenants: tenants || [] });
  } catch (error) {
    logger.error("Error in tenants API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/tenants - Register a new tenant
// =============================================================================

/**
 *
 * @param request
 */
export async function POST(request: NextRequest) {
  try {
    // Validate CSRF token from header
    const csrfToken = request.headers.get("X-CSRF-Token");
    const isValidCsrf = await validateCSRFToken(csrfToken);

    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token for tenant registration");
      return NextResponse.json(
        { error: "Security validation failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit by user ID
    const rateLimit = await checkRateLimit(
      `tenants:user:${user.id}`,
      RATE_LIMITS.TENANTS.maxRequests,
      RATE_LIMITS.TENANTS.windowMs
    );
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfter ?? 60) },
        }
      );
    }

    // Parse request body
    const body: RegisterTenantRequest = await request.json();
    const { tenantId, displayName, subscriptionId } = body;

    // Validate tenant ID
    if (!tenantId || typeof tenantId !== "string") {
      return NextResponse.json(
        { error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    // Validate tenant ID format (alphanumeric and hyphens only)
    const normalizedTenantId = tenantId.toLowerCase().trim();
    if (!/^[a-zA-Z0-9-]+$/.test(normalizedTenantId)) {
      return NextResponse.json(
        {
          error:
            "Invalid tenant ID format. Only letters, numbers, and hyphens are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate subscription ID
    if (!subscriptionId || typeof subscriptionId !== "string") {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    // Verify the subscription belongs to this user and is for SPO Explorer
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, tier_id, status, product_id")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .eq("product_id", SPO_EXPLORER_PRODUCT_ID)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "Invalid subscription or not authorized" },
        { status: 403 }
      );
    }

    // Check subscription status
    if (!["active", "trialing"].includes(subscription.status)) {
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 403 }
      );
    }

    // Check tenant limit for the tier
    const maxTenants = getMaxTenantsForTier(subscription.tier_id);
    const { count, error: countError } = await supabase
      .from("licensed_tenants")
      .select("*", { count: "exact", head: true })
      .eq("subscription_id", subscriptionId);

    if (countError) {
      logger.error("Error counting tenants:", countError);
      return NextResponse.json(
        { error: "Failed to check tenant limit" },
        { status: 500 }
      );
    }

    // Skip limit check if maxTenants is -1 (unlimited)
    if (maxTenants !== -1 && (count ?? 0) >= maxTenants) {
      return NextResponse.json(
        {
          error: `Tenant limit reached. Your plan allows ${maxTenants} tenant(s).`,
          maxTenants,
          currentCount: count ?? 0,
        },
        { status: 403 }
      );
    }

    // Check if tenant is already registered (by anyone)
    const { data: existingTenant } = await supabase
      .from("licensed_tenants")
      .select("id")
      .eq("tenant_id", normalizedTenantId)
      .single();

    if (existingTenant) {
      return NextResponse.json(
        { error: "This tenant is already registered" },
        { status: 409 }
      );
    }

    // Create the tenant
    const tenantDomain = `${normalizedTenantId}.sharepoint.com`;
    const { data: newTenant, error: insertError } = await supabase
      .from("licensed_tenants")
      .insert({
        subscription_id: subscriptionId,
        user_id: user.id,
        tenant_id: normalizedTenantId,
        tenant_domain: tenantDomain,
        display_name: displayName?.trim() ?? null,
      })
      .select()
      .single();

    if (insertError) {
      logger.error("Error creating tenant:", insertError);

      // Handle unique constraint violation
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "This tenant is already registered" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to register tenant" },
        { status: 500 }
      );
    }

    logger.info(`Tenant registered: ${normalizedTenantId} for user ${user.id}`);

    return NextResponse.json(
      { tenant: newTenant as LicensedTenant },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error in tenants API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
