"use server";

import "server-only";

/**
 * Server actions for account management
 * Handle user profile updates, account deletion, and data export
 */

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { CONTACT_EMAIL } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { createScopedAdminQuery } from "@helvety/shared/supabase/admin";
import { z } from "zod";

import { hasAccountDeletionVerificationFailures } from "@/lib/account-deletion-compliance";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { stripe } from "@/lib/stripe";
import { createStripeIdempotencyKey } from "@/lib/stripe/idempotency";

import type { ActionResponse } from "@/lib/types";
import type { UserDataExport } from "@/lib/types/store";

// =============================================================================
// INPUT VALIDATION SCHEMAS
// =============================================================================

/**
 * Email validation schema
 */
const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .max(254, "Email too long")
  .email("Invalid email format");

const ACCOUNT_DELETION_VERIFICATION_CHECKS = [
  { table: "user_auth_credentials", column: "user_id" },
  { table: "user_passkey_params", column: "user_id" },
  { table: "subscriptions", column: "user_id" },
  { table: "licensed_tenants", column: "user_id" },
  { table: "units", column: "user_id" },
  { table: "spaces", column: "user_id" },
  { table: "items", column: "user_id" },
  { table: "contacts", column: "user_id" },
  { table: "entity_contact_links", column: "user_id" },
  { table: "user_profiles", column: "id" },
  // Legal-evidence tables keep rows but user reference must be detached (NULL).
  { table: "consent_events", column: "user_id" },
  { table: "purchases", column: "user_id" },
  { table: "subscription_events", column: "user_id" },
] as const;

/** Verification check tuple describing which table/column must be fully detached. */
type AccountDeletionVerificationCheck =
  (typeof ACCOUNT_DELETION_VERIFICATION_CHECKS)[number];

/** Counts any residual rows still linked to the deleted user id. */
async function verifyDeletionResidualCounts(
  scopedAdmin: ReturnType<typeof createScopedAdminQuery>,
  userId: string
): Promise<
  Array<
    AccountDeletionVerificationCheck & {
      count: number;
      error: string | null;
    }
  >
> {
  const checks = ACCOUNT_DELETION_VERIFICATION_CHECKS.map(async (check) => {
    try {
      const baseQuery = scopedAdmin.client
        .from(check.table)
        .select("id", { count: "exact", head: true });
      const { count, error } = await baseQuery.eq(check.column, userId);
      return {
        ...check,
        count: count ?? 0,
        error: error?.message ?? null,
      };
    } catch (error) {
      return {
        ...check,
        count: -1,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  return Promise.all(checks);
}

/**
 * Get current user profile information
 */
export async function getCurrentUser(): Promise<
  ActionResponse<{
    id: string;
    email: string;
    createdAt: string;
  }>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "acct",
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email ?? "",
        createdAt: user.created_at,
      },
    };
  } catch (error) {
    logger.error("Error in getCurrentUser:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update user email address
 * Supabase will send a confirmation email to the new address
 * The user must confirm both the old and new email addresses
 *
 * @param newEmail - The new email address
 * @param csrfToken - CSRF token for security validation
 */
export async function updateUserEmail(
  newEmail: string,
  csrfToken: string
): Promise<ActionResponse<void>> {
  try {
    const parseResult = EmailSchema.safeParse(newEmail);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message ?? "Invalid email";
      return { success: false, error: errorMessage };
    }

    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "acct",
      rateLimitConfig: RATE_LIMITS.ACCOUNT_MUTATE,
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    // Check if new email is same as current
    if (user.email?.toLowerCase() === newEmail.toLowerCase()) {
      return {
        success: false,
        error: "New email must be different from current email",
      };
    }

    // Update email - Supabase will send confirmation email
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      logger.error("Error updating email:", error);

      // Handle common errors
      if (error.message.includes("already registered")) {
        return { success: false, error: "This email is already in use" };
      }

      return {
        success: false,
        error: `We couldn't update your email. Please try again, or contact us at ${CONTACT_EMAIL}.`,
      };
    }

    logger.info(`Email change requested for user ${user.id}`);
    return { success: true };
  } catch (error) {
    logger.error("Error in updateUserEmail:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// ACCOUNT DELETION
// =============================================================================

/**
 * Permanently delete the user's account.
 *
 * This action:
 * 1. Cancels all active Stripe subscriptions immediately
 * 2. Deletes the user via Supabase Admin API (cascade deletes handle
 *    user_auth_credentials, user_passkey_params, subscriptions,
 *    licensed_tenants, units, spaces, items,
 *    label_configs, stage_configs, user_profiles)
 *
 * Legal basis: nDSG Art. 32(2) (right to request deletion) + Art. 6(4)
 * (purpose limitation). Transaction records are retained in anonymized form
 * for 10 years per Art. 958f Swiss Code of Obligations.
 *
 * @param csrfToken - CSRF token for security validation
 */
export async function requestAccountDeletion(
  csrfToken: string
): Promise<ActionResponse<void>> {
  try {
    const auth = await authenticateAndRateLimit({
      csrfToken,
      rateLimitPrefix: "acct",
      rateLimitConfig: RATE_LIMITS.ACCOUNT_MUTATE,
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    const scopedAdmin = createScopedAdminQuery(user.id);
    const adminClient = scopedAdmin.client;

    // 1. Cancel all active Stripe subscriptions
    const { data: subscriptions } = await scopedAdmin
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .in("status", ["active", "trialing", "past_due"]);

    if (subscriptions && subscriptions.length > 0) {
      const cancellableSubscriptions = subscriptions.filter(
        (sub: {
          stripe_subscription_id: string | null;
        }): sub is { stripe_subscription_id: string } =>
          typeof sub.stripe_subscription_id === "string" &&
          sub.stripe_subscription_id.length > 0
      );

      if (cancellableSubscriptions.length > 0) {
        const idempotencyWindow = Math.floor(Date.now() / (10 * 60 * 1000));
        const results = await Promise.allSettled(
          cancellableSubscriptions.map(
            (sub: { stripe_subscription_id: string }) =>
              stripe.subscriptions.cancel(
                sub.stripe_subscription_id,
                undefined,
                {
                  idempotencyKey: createStripeIdempotencyKey(
                    "account_delete_subscription_cancel",
                    [user.id, sub.stripe_subscription_id, idempotencyWindow]
                  ),
                }
              )
          )
        );

        // Log any failures (individual failures don't block the overall deletion)
        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (result?.status === "rejected") {
            logger.warn(
              `Could not cancel Stripe subscription ${cancellableSubscriptions[i]?.stripe_subscription_id}:`,
              result.reason
            );
          }
        }
      }
    }

    // 2. Delete the user via Supabase Admin API
    // CASCADE deletes handle: user_auth_credentials, user_passkey_params,
    // subscriptions, licensed_tenants, units, spaces, items,
    // label_configs, stage_configs, user_profiles
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      logger.error("Error deleting user:", deleteError);
      return {
        success: false,
        error: "Failed to delete account. Please try again or contact support.",
      };
    }

    // 3. Post-delete verification to prove data cleanup completeness.
    const [residualCounts, authLookup] = await Promise.all([
      verifyDeletionResidualCounts(scopedAdmin, user.id),
      adminClient.auth.admin.getUserById(user.id),
    ]);

    const residualRows = residualCounts.filter((row) => row.count > 0);
    const residualErrors = residualCounts.filter((row) => row.error !== null);
    const authStillExists = Boolean(authLookup.data?.user) && !authLookup.error;

    const verificationReport = {
      userId: user.id,
      authStillExists,
      residualRows: residualRows.map((row) => ({
        table: row.table,
        column: row.column,
        count: row.count,
      })),
      residualErrors: residualErrors.map((row) => ({
        table: row.table,
        column: row.column,
        error: row.error ?? "unknown_error",
      })),
    };

    if (hasAccountDeletionVerificationFailures(verificationReport)) {
      logger.error("Account deletion verification failed:", verificationReport);
      return {
        success: false,
        error:
          "Account deletion was processed but verification found cleanup issues. Please contact support immediately.",
      };
    }

    logger.info(`Account deleted for user ${user.id}`, verificationReport);
    return { success: true };
  } catch (error) {
    logger.error("Error in requestAccountDeletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// DATA EXPORT (nDSG Art. 28, Right to Data Portability)
// =============================================================================

export type { UserDataExport } from "@/lib/types/store";

/**
 * Export all user data in a structured JSON format.
 *
 * Returns profile info, subscription history, purchase history, and tenant
 * registrations. Encrypted task data (Helvety Tasks) is NOT included; that data
 * must be exported client-side from within Helvety Tasks while the user is
 * authenticated with their passkey.
 *
 * Legal basis: nDSG Art. 28 (right to data portability; data should be
 * provided in a structured, commonly used format).
 */
export async function exportUserData(): Promise<
  ActionResponse<UserDataExport>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "data-export",
      readRateLimitConfig: RATE_LIMITS.DATA_EXPORT,
    });
    if (!auth.ok) return auth.response;
    const { user } = auth.ctx;

    const scopedAdmin = createScopedAdminQuery(user.id);

    // Fetch all user data in parallel (independent queries)
    const [profileResult, subscriptionsResult, purchasesResult, tenantsResult] =
      await Promise.all([
        scopedAdmin
          .from("user_profiles")
          .select("email, display_name, created_at")
          .single(),
        scopedAdmin
          .from("subscriptions")
          .select(
            "product_id, tier_id, status, created_at, current_period_end, cancel_at_period_end"
          )
          .order("created_at", { ascending: false }),
        scopedAdmin
          .from("purchases")
          .select("product_id, tier_id, amount_paid, currency, created_at")
          .order("created_at", { ascending: false }),
        scopedAdmin
          .from("licensed_tenants")
          .select("tenant_id, tenant_domain, display_name, created_at")
          .order("created_at", { ascending: false }),
      ]);

    const { data: profile } = profileResult;
    const { data: subscriptions } = subscriptionsResult;
    const { data: purchases } = purchasesResult;
    const { data: tenants } = tenantsResult;

    const exportData: UserDataExport = {
      exportedAt: new Date().toISOString(),
      profile: {
        email: profile?.email ?? user.email ?? "",
        displayName: profile?.display_name ?? null,
        createdAt: profile?.created_at ?? user.created_at,
      },
      subscriptions: (subscriptions ?? []).map(
        (s: {
          product_id: string;
          tier_id: string;
          status: string;
          created_at: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
        }) => ({
          productId: s.product_id,
          tierId: s.tier_id,
          status: s.status,
          createdAt: s.created_at,
          currentPeriodEnd: s.current_period_end,
          cancelAtPeriodEnd: s.cancel_at_period_end,
        })
      ),
      purchases: (purchases ?? []).map(
        (p: {
          product_id: string;
          tier_id: string;
          amount_paid: number | null;
          currency: string | null;
          created_at: string;
        }) => ({
          productId: p.product_id,
          tierId: p.tier_id,
          amountPaid: p.amount_paid,
          currency: p.currency,
          createdAt: p.created_at,
        })
      ),
      tenants: (tenants ?? []).map(
        (t: {
          tenant_id: string;
          tenant_domain: string | null;
          display_name: string | null;
          created_at: string;
        }) => ({
          tenantId: t.tenant_id,
          tenantDomain: t.tenant_domain,
          displayName: t.display_name,
          createdAt: t.created_at,
        })
      ),
    };

    logger.info(`Data export requested for user ${user.id}`);
    return { success: true, data: exportData };
  } catch (error) {
    logger.error("Error in exportUserData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
