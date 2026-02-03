/**
 * License validation logic for Helvety products
 * Validates tenant licenses against product-specific subscriptions
 */

import { logger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/admin";

import type {
  LicenseValidationResponse,
  SubscriptionStatus,
} from "@/lib/types/entities";

// =============================================================================
// TIER CONFIGURATION
// =============================================================================

/**
 * Features available for each tier
 */
export const TIER_FEATURES: Record<
  string,
  {
    maxTenants: number;
    features: string[];
  }
> = {
  "helvety-spo-explorer-basic-monthly": {
    maxTenants: -1, // -1 = unlimited tenants
    features: ["basic_navigation", "favorites", "search"],
  },
  "helvety-spo-explorer-enterprise-monthly": {
    maxTenants: -1, // -1 = unlimited tenants
    features: [
      "basic_navigation",
      "favorites",
      "search",
      "priority_support",
      "custom_branding",
    ],
  },
};

/**
 * Grace period in days after subscription expires
 */
export const LICENSE_GRACE_PERIOD_DAYS = 7;

/**
 * Active subscription statuses that grant access
 */
const ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

/**
 * Statuses that are still valid within grace period
 */
const GRACE_PERIOD_STATUSES: SubscriptionStatus[] = ["past_due", "canceled"];

// =============================================================================
// LICENSE VALIDATION
// =============================================================================

/**
 * Validates a tenant's license status for a specific product
 * This is called from the public API endpoint (no auth required)
 *
 * Uses createAdminClient() which bypasses RLS (service role). RLS on
 * licensed_tenants and subscriptions only allows user_id = auth.uid(); the
 * license API has no authenticated user, so it must use the admin client.
 *
 * @param tenantId - The SharePoint tenant identifier (e.g., "contoso")
 * @param productId - The product identifier (e.g., "helvety-spo-explorer")
 * @returns License validation response
 */
export async function validateTenantLicense(
  tenantId: string,
  productId: string
): Promise<LicenseValidationResponse> {
  try {
    const supabase = createAdminClient();

    // Normalize tenant ID (lowercase, trim)
    const normalizedTenantId = tenantId.toLowerCase().trim();

    // Step 1: Get licensed_tenants rows for this tenant (subscription_id only – no embed).
    // This guarantees we get subscription_id; PostgREST often omits it when embedding.
    // A tenant can have multiple rows (one per product); we filter by product in step 2.
    const { data: licensedRows, error: licensedError } = await supabase
      .from("licensed_tenants")
      .select("id, tenant_id, subscription_id")
      .eq("tenant_id", normalizedTenantId);

    if (licensedError || !licensedRows?.length) {
      logger.debug(
        `Tenant not found for product: ${normalizedTenantId} / ${productId}`
      );
      return {
        valid: false,
        reason: "tenant_not_registered",
      };
    }

    const subscriptionIds = licensedRows
      .map((r) => (r as { subscription_id?: string }).subscription_id)
      .filter(Boolean) as string[];
    if (subscriptionIds.length === 0) {
      logger.warn(
        `licensed_tenants rows for ${normalizedTenantId} have no subscription_id`
      );
      return {
        valid: false,
        reason: "subscription_inactive",
      };
    }

    // Step 2: Get subscription for this product (must be one of the tenant's subscriptions)
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(
        "id, tier_id, status, current_period_end, cancel_at_period_end, product_id"
      )
      .in("id", subscriptionIds)
      .eq("product_id", productId)
      .maybeSingle();

    if (subError || !subscription) {
      logger.warn(
        `Tenant ${normalizedTenantId} subscription not found or wrong product: ${productId}`
      );
      return {
        valid: false,
        reason: "subscription_inactive",
      };
    }

    const status = subscription.status as SubscriptionStatus;
    const tierConfig = TIER_FEATURES[subscription.tier_id];

    if (ACTIVE_STATUSES.includes(status)) {
      return {
        valid: true,
        tier: subscription.tier_id,
        features: tierConfig?.features ?? ["basic_navigation"],
        expiresAt: subscription.current_period_end ?? undefined,
        gracePeriodDays: LICENSE_GRACE_PERIOD_DAYS,
      };
    }

    // Check if within grace period
    if (
      GRACE_PERIOD_STATUSES.includes(status) &&
      subscription.current_period_end
    ) {
      const periodEnd = new Date(subscription.current_period_end);
      const gracePeriodEnd = new Date(periodEnd);
      gracePeriodEnd.setDate(
        gracePeriodEnd.getDate() + LICENSE_GRACE_PERIOD_DAYS
      );

      if (new Date() <= gracePeriodEnd) {
        logger.info(
          `Tenant ${normalizedTenantId} (${productId}) in grace period until ${gracePeriodEnd.toISOString()}`
        );
        return {
          valid: true,
          tier: subscription.tier_id,
          features: tierConfig?.features ?? ["basic_navigation"],
          expiresAt: gracePeriodEnd.toISOString(),
          gracePeriodDays: LICENSE_GRACE_PERIOD_DAYS,
        };
      }
    }

    // Subscription expired or canceled
    if (status === "canceled") {
      return {
        valid: false,
        reason: "subscription_canceled",
      };
    }

    return {
      valid: false,
      reason: "subscription_expired",
    };
  } catch (error) {
    logger.error("Error validating tenant license:", error);
    throw error;
  }
}

/**
 * Get the maximum number of tenants allowed for a tier
 * @param tierId
 */
export function getMaxTenantsForTier(tierId: string): number {
  return TIER_FEATURES[tierId]?.maxTenants ?? 1;
}

/**
 * Get features for a tier
 * @param tierId
 */
export function getFeaturesForTier(tierId: string): string[] {
  return TIER_FEATURES[tierId]?.features ?? ["basic_navigation"];
}
