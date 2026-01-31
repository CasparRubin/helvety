/**
 * License validation logic for SPFx extension
 * Validates tenant licenses against subscriptions
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
 * Validates a tenant's license status
 * This is called from the public API endpoint (no auth required)
 *
 * @param tenantId - The SharePoint tenant identifier (e.g., "contoso")
 * @returns License validation response
 */
export async function validateTenantLicense(
  tenantId: string
): Promise<LicenseValidationResponse> {
  try {
    const supabase = createAdminClient();

    // Normalize tenant ID (lowercase, trim)
    const normalizedTenantId = tenantId.toLowerCase().trim();

    // Look up the tenant and its subscription in one query
    const { data: tenant, error: tenantError } = await supabase
      .from("licensed_tenants")
      .select(
        `
        id,
        tenant_id,
        subscription:subscriptions (
          id,
          tier_id,
          status,
          current_period_end,
          cancel_at_period_end
        )
      `
      )
      .eq("tenant_id", normalizedTenantId)
      .single();

    if (tenantError || !tenant) {
      logger.debug(`Tenant not found: ${normalizedTenantId}`);
      return {
        valid: false,
        reason: "tenant_not_registered",
      };
    }

    // TypeScript: subscription comes back as an array from the join, but we use .single()
    // so it should be a single object. Handle both cases.
    const subscription = Array.isArray(tenant.subscription)
      ? tenant.subscription[0]
      : tenant.subscription;

    if (!subscription) {
      logger.warn(
        `Tenant ${normalizedTenantId} has no associated subscription`
      );
      return {
        valid: false,
        reason: "subscription_inactive",
      };
    }

    const status = subscription.status as SubscriptionStatus;
    const tierConfig = TIER_FEATURES[subscription.tier_id];

    // Check if subscription is active
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
          `Tenant ${normalizedTenantId} in grace period until ${gracePeriodEnd.toISOString()}`
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
 */
export function getMaxTenantsForTier(tierId: string): number {
  return TIER_FEATURES[tierId]?.maxTenants ?? 1;
}

/**
 * Get features for a tier
 */
export function getFeaturesForTier(tierId: string): string[] {
  return TIER_FEATURES[tierId]?.features ?? ["basic_navigation"];
}
