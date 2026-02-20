/**
 * Tenant API Route (Single Tenant)
 * Authenticated endpoints for managing a specific tenant
 *
 * GET /api/tenants/[id] - Get a specific tenant
 * PATCH /api/tenants/[id] - Update tenant display name
 * DELETE /api/tenants/[id] - Remove a tenant
 */

import { validateCSRFToken } from "@helvety/shared/csrf";
import { logger } from "@helvety/shared/logger";
import { createServerClient } from "@helvety/shared/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

import type { NextRequest } from "next/server";

const UUIDSchema = z.string().uuid("Invalid ID format");
const DisplayNameSchema = z.string().max(200, "Display name too long");

// =============================================================================
// GET /api/tenants/[id] - Get a specific tenant
// =============================================================================

/** Retrieves a specific tenant by ID. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!UUIDSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    const supabase = await createServerClient();
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

    const { data: tenant, error } = await supabase
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
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    logger.error("Error in tenant API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PATCH /api/tenants/[id] - Update tenant display name
// =============================================================================

/** Updates the display name of a tenant. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject oversized request bodies early (10KB limit for tenant update)
  const contentLength = parseInt(
    request.headers.get("content-length") ?? "0",
    10
  );
  if (contentLength > 10_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    // Validate CSRF token from header
    const csrfToken = request.headers.get("X-CSRF-Token");
    const isValidCsrf = await validateCSRFToken(csrfToken);

    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token for tenant update");
      return NextResponse.json(
        { error: "Security validation failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!UUIDSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit by user ID
    const patchRateLimit = await checkRateLimit(
      `tenants:user:${user.id}`,
      RATE_LIMITS.TENANTS.maxRequests,
      RATE_LIMITS.TENANTS.windowMs
    );
    if (!patchRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(patchRateLimit.retryAfter ?? 60) },
        }
      );
    }

    const body = await request.json();
    const { displayName } = body;

    if (typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Display name must be a string" },
        { status: 400 }
      );
    }

    if (!DisplayNameSchema.safeParse(displayName).success) {
      return NextResponse.json(
        { error: "Display name too long (max 200 characters)" },
        { status: 400 }
      );
    }

    const { data: tenant, error } = await supabase
      .from("licensed_tenants")
      .update({
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    logger.error("Error in tenant API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE /api/tenants/[id] - Remove a tenant
// =============================================================================

/** Removes a registered tenant. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Validate CSRF token from header
    const csrfToken = request.headers.get("X-CSRF-Token");
    const isValidCsrf = await validateCSRFToken(csrfToken);

    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token for tenant deletion");
      return NextResponse.json(
        { error: "Security validation failed. Please refresh and try again." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!UUIDSchema.safeParse(id).success) {
      return NextResponse.json({ error: "Invalid tenant ID" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Rate limit by user ID
    const deleteRateLimit = await checkRateLimit(
      `tenants:user:${user.id}`,
      RATE_LIMITS.TENANTS.maxRequests,
      RATE_LIMITS.TENANTS.windowMs
    );
    if (!deleteRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(deleteRateLimit.retryAfter ?? 60) },
        }
      );
    }

    // First, verify the tenant belongs to this user
    const { data: tenant, error: fetchError } = await supabase
      .from("licensed_tenants")
      .select("id, tenant_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Delete the tenant
    const { error: deleteError } = await supabase
      .from("licensed_tenants")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("Error deleting tenant:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete tenant" },
        { status: 500 }
      );
    }

    logger.info(`Tenant deleted: ${tenant.tenant_id} for user ${user.id}`);

    return NextResponse.json(
      { success: true, deletedTenantId: tenant.tenant_id },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error in tenant API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
