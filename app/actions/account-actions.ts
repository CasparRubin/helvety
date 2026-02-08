"use server";

/**
 * Server actions for account management
 * Handle user profile updates, account deletion, and data export
 */

import { z } from "zod";

import { requireCSRFToken } from "@/lib/csrf";
import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerComponentClient } from "@/lib/supabase/client-factory";

import type { ActionResponse } from "@/lib/types/entities";

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
    const supabase = await createServerComponentClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: "Not authenticated" };
    }

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
    // Validate CSRF token (required)
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    // Validate email format
    const parseResult = EmailSchema.safeParse(newEmail);
    if (!parseResult.success) {
      const errorMessage =
        parseResult.error.issues[0]?.message ?? "Invalid email";
      return { success: false, error: errorMessage };
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

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

      return { success: false, error: error.message };
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
 * Request account deletion with a 30-day grace period.
 *
 * This action:
 * 1. Cancels all active Stripe subscriptions immediately
 * 2. Deletes the user via Supabase Admin API (cascade deletes handle
 *    user_auth_credentials, user_passkey_params, subscriptions,
 *    licensed_tenants, and all task data including encrypted attachments)
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
    // Validate CSRF token
    try {
      await requireCSRFToken(csrfToken);
    } catch {
      return {
        success: false,
        error: "Security validation failed. Please refresh and try again.",
      };
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // 1. Cancel all active Stripe subscriptions
    const { data: subscriptions } = await adminClient
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"]);

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        if (sub.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(sub.stripe_subscription_id);
          } catch (stripeError) {
            logger.warn(
              `Could not cancel Stripe subscription ${sub.stripe_subscription_id}:`,
              stripeError
            );
          }
        }
      }
    }

    // 2. Delete user files from Supabase Storage (encrypted attachments)
    try {
      const { data: files } = await adminClient.storage
        .from("item_attachments")
        .list(user.id);

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await adminClient.storage.from("item_attachments").remove(filePaths);
      }
    } catch (storageError) {
      logger.warn("Could not clean up storage files:", storageError);
      // Continue with deletion — storage cleanup failure is not critical
    }

    // 3. Delete the user via Supabase Admin API
    // CASCADE deletes handle: user_auth_credentials, user_passkey_params,
    // subscriptions, licensed_tenants, units, spaces, items, item_attachments,
    // label_configs, stage_configs, user_passkey_params, user_profiles
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

    logger.info(`Account deleted for user ${user.id}`);
    return { success: true };
  } catch (error) {
    logger.error("Error in requestAccountDeletion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// =============================================================================
// DATA EXPORT (nDSG Art. 28 — Right to Data Portability)
// =============================================================================

/** Exported user data structure */
export interface UserDataExport {
  exportedAt: string;
  profile: {
    email: string;
    displayName: string | null;
    createdAt: string;
  };
  subscriptions: Array<{
    productId: string;
    tierId: string;
    status: string;
    createdAt: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }>;
  purchases: Array<{
    productId: string;
    tierId: string;
    amountPaid: number;
    currency: string;
    createdAt: string;
  }>;
  tenants: Array<{
    tenantId: string;
    tenantDomain: string;
    displayName: string | null;
    createdAt: string;
  }>;
}

/**
 * Export all user data in a structured JSON format.
 *
 * Returns profile info, subscription history, purchase history, and tenant
 * registrations. Encrypted task data (helvety-tasks) is NOT included here —
 * that must be exported client-side from within Helvety Tasks while the user
 * is authenticated with their passkey.
 *
 * Legal basis: nDSG Art. 28 (right to data portability — data must be
 * provided in a structured, commonly used format).
 */
export async function exportUserData(): Promise<
  ActionResponse<UserDataExport>
> {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const adminClient = createAdminClient();

    // Fetch profile
    const { data: profile } = await adminClient
      .from("user_profiles")
      .select("email, display_name, created_at")
      .eq("id", user.id)
      .single();

    // Fetch subscriptions
    const { data: subscriptions } = await adminClient
      .from("subscriptions")
      .select(
        "product_id, tier_id, status, created_at, current_period_end, cancel_at_period_end"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch purchases
    const { data: purchases } = await adminClient
      .from("purchases")
      .select("product_id, tier_id, amount_paid, currency, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Fetch tenants
    const { data: tenants } = await adminClient
      .from("licensed_tenants")
      .select("tenant_id, tenant_domain, display_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const exportData: UserDataExport = {
      exportedAt: new Date().toISOString(),
      profile: {
        email: profile?.email ?? user.email ?? "",
        displayName: profile?.display_name ?? null,
        createdAt: profile?.created_at ?? user.created_at,
      },
      subscriptions: (subscriptions ?? []).map((s) => ({
        productId: s.product_id,
        tierId: s.tier_id,
        status: s.status,
        createdAt: s.created_at,
        currentPeriodEnd: s.current_period_end,
        cancelAtPeriodEnd: s.cancel_at_period_end,
      })),
      purchases: (purchases ?? []).map((p) => ({
        productId: p.product_id,
        tierId: p.tier_id,
        amountPaid: p.amount_paid,
        currency: p.currency,
        createdAt: p.created_at,
      })),
      tenants: (tenants ?? []).map((t) => ({
        tenantId: t.tenant_id,
        tenantDomain: t.tenant_domain,
        displayName: t.display_name,
        createdAt: t.created_at,
      })),
    };

    logger.info(`Data export requested for user ${user.id}`);
    return { success: true, data: exportData };
  } catch (error) {
    logger.error("Error in exportUserData:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
