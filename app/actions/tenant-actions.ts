"use server";

/**
 * Server actions for tenant management
 * Manage licensed tenants for SPFx extension
 */

import { getMaxTenantsForTier } from "@/lib/license/validation";
import { logger } from "@/lib/logger";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type {
  ActionResponse,
  LicensedTenant,
  LicensedTenantWithSubscription,
  RegisterTenantRequest,
} from "@/lib/types/entities";

const SPO_EXPLORER_PRODUCT_ID = "helvety-spo-explorer";

// =============================================================================
// TENANT QUERIES
// =============================================================================

/**
 * Get all licensed tenants for the current user
 */
export async function getUserTenants(): Promise<
  ActionResponse<LicensedTenantWithSubscription[]>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("licensed_tenants")
      .select(
        `
        *,
        subscription:subscriptions (
          id,
          tier_id,
          status,
          current_period_end,
          product_id
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching tenants:", error);
      return { success: false, error: "Failed to fetch tenants" };
    }

    // Transform the data to match our types
    const tenants: LicensedTenantWithSubscription[] = (data || []).map(
      (item) => ({
        ...item,
        subscription: Array.isArray(item.subscription)
          ? item.subscription[0]
          : item.subscription,
      })
    );

    return { success: true, data: tenants };
  } catch (error) {
    logger.error("Error in getUserTenants:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get SPO Explorer subscriptions for the current user
 * Returns subscriptions that can have tenants attached
 */
export async function getSpoExplorerSubscriptions(): Promise<
  ActionResponse<
    {
      id: string;
      tier_id: string;
      status: string;
      current_period_end: string | null;
      tenantCount: number;
      maxTenants: number;
    }[]
  >
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get SPO Explorer subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("subscriptions")
      .select("id, tier_id, status, current_period_end")
      .eq("user_id", user.id)
      .eq("product_id", SPO_EXPLORER_PRODUCT_ID)
      .in("status", ["active", "trialing"]);

    if (subError) {
      logger.error("Error fetching subscriptions:", subError);
      return { success: false, error: "Failed to fetch subscriptions" };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, data: [] };
    }

    // Get tenant counts for each subscription
    const { data: tenantCounts, error: countError } = await supabase
      .from("licensed_tenants")
      .select("subscription_id")
      .eq("user_id", user.id)
      .in(
        "subscription_id",
        subscriptions.map((s) => s.id)
      );

    if (countError) {
      logger.error("Error fetching tenant counts:", countError);
      return { success: false, error: "Failed to fetch tenant counts" };
    }

    // Count tenants per subscription
    const countMap = new Map<string, number>();
    for (const t of tenantCounts ?? []) {
      countMap.set(
        t.subscription_id,
        (countMap.get(t.subscription_id) ?? 0) + 1
      );
    }

    // Build result with tenant counts and limits
    const result = subscriptions.map((sub) => ({
      id: sub.id,
      tier_id: sub.tier_id,
      status: sub.status,
      current_period_end: sub.current_period_end,
      tenantCount: countMap.get(sub.id) ?? 0,
      maxTenants: getMaxTenantsForTier(sub.tier_id),
    }));

    return { success: true, data: result };
  } catch (error) {
    logger.error("Error in getSpoExplorerSubscriptions:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// TENANT MANAGEMENT
// =============================================================================

/**
 * Register a new tenant
 */
export async function registerTenant(
  request: RegisterTenantRequest
): Promise<ActionResponse<LicensedTenant>> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { tenantId, displayName, subscriptionId } = request;

    // Validate tenant ID
    if (!tenantId || typeof tenantId !== "string") {
      return { success: false, error: "Tenant ID is required" };
    }

    // Validate tenant ID format
    const normalizedTenantId = tenantId.toLowerCase().trim();
    if (!/^[a-zA-Z0-9-]+$/.test(normalizedTenantId)) {
      return {
        success: false,
        error:
          "Invalid tenant ID format. Only letters, numbers, and hyphens are allowed.",
      };
    }

    // Validate subscription ID
    if (!subscriptionId) {
      return { success: false, error: "Subscription ID is required" };
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
      return {
        success: false,
        error: "Invalid subscription or not authorized",
      };
    }

    // Check subscription status
    if (!["active", "trialing"].includes(subscription.status)) {
      return { success: false, error: "Subscription is not active" };
    }

    // Check tenant limit for the tier
    const maxTenants = getMaxTenantsForTier(subscription.tier_id);
    const { count, error: countError } = await supabase
      .from("licensed_tenants")
      .select("*", { count: "exact", head: true })
      .eq("subscription_id", subscriptionId);

    if (countError) {
      logger.error("Error counting tenants:", countError);
      return { success: false, error: "Failed to check tenant limit" };
    }

    // Skip limit check if maxTenants is -1 (unlimited)
    if (maxTenants !== -1 && (count ?? 0) >= maxTenants) {
      return {
        success: false,
        error: `Tenant limit reached. Your plan allows ${maxTenants} tenant(s).`,
      };
    }

    // Check if tenant is already registered
    const { data: existingTenant } = await supabase
      .from("licensed_tenants")
      .select("id")
      .eq("tenant_id", normalizedTenantId)
      .single();

    if (existingTenant) {
      return { success: false, error: "This tenant is already registered" };
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

      if (insertError.code === "23505") {
        return { success: false, error: "This tenant is already registered" };
      }

      return { success: false, error: "Failed to register tenant" };
    }

    logger.info(`Tenant registered: ${normalizedTenantId} for user ${user.id}`);

    return { success: true, data: newTenant as LicensedTenant };
  } catch (error) {
    logger.error("Error in registerTenant:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update a tenant's display name
 */
export async function updateTenant(
  tenantId: string,
  displayName: string
): Promise<ActionResponse<LicensedTenant>> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: tenant, error } = await supabase
      .from("licensed_tenants")
      .update({
        display_name: displayName.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenantId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !tenant) {
      return { success: false, error: "Tenant not found or update failed" };
    }

    return { success: true, data: tenant as LicensedTenant };
  } catch (error) {
    logger.error("Error in updateTenant:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Remove a tenant
 */
export async function removeTenant(
  tenantId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify tenant exists and belongs to user
    const { data: tenant, error: fetchError } = await supabase
      .from("licensed_tenants")
      .select("id, tenant_id")
      .eq("id", tenantId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !tenant) {
      return { success: false, error: "Tenant not found" };
    }

    // Delete the tenant
    const { error: deleteError } = await supabase
      .from("licensed_tenants")
      .delete()
      .eq("id", tenantId)
      .eq("user_id", user.id);

    if (deleteError) {
      logger.error("Error deleting tenant:", deleteError);
      return { success: false, error: "Failed to delete tenant" };
    }

    logger.info(`Tenant deleted: ${tenant.tenant_id} for user ${user.id}`);

    return { success: true };
  } catch (error) {
    logger.error("Error in removeTenant:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
