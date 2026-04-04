"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { logger } from "@helvety/shared/logger";

import type { ActionResponse, ContactRow } from "@/lib/types";

const MAX_DASHBOARD_ROWS = 3000;

// =============================================================================
// Batch Response Types
// =============================================================================

/** Data returned by the Contacts dashboard batch fetch */
export interface ContactsDashboardData {
  contacts: ContactRow[];
}

// =============================================================================
// BATCH READ ACTIONS
// =============================================================================

/**
 * Batch fetch all data needed for the Contacts dashboard.
 * Performs a single auth + rate-limit check, then loads the contacts list.
 */
export async function getContactsDashboardData(): Promise<
  ActionResponse<ContactsDashboardData>
> {
  try {
    const auth = await authenticateAndRateLimit({
      rateLimitPrefix: "contacts",
    });
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth.ctx;

    const contactsResult = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .limit(MAX_DASHBOARD_ROWS + 1)
      .returns<ContactRow[]>();

    if (contactsResult.error) {
      logger.logUnexpectedError(
        "Error in getContactsDashboardData",
        contactsResult.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }

    if ((contactsResult.data?.length ?? 0) > MAX_DASHBOARD_ROWS) {
      return {
        success: false,
        error: "Too many contacts to load in one request",
      };
    }

    return {
      success: true,
      data: {
        contacts: contactsResult.data ?? [],
      },
    };
  } catch (error) {
    logger.logUnexpectedError(
      "Unexpected error in getContactsDashboardData",
      error
    );
    return { success: false, error: "An unexpected error occurred" };
  }
}
