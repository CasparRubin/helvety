"use server";

import "server-only";

import { authenticateAndRateLimit } from "@helvety/shared/action-helpers";
import { ACTION_LIMITS } from "@helvety/shared/constants";
import {
  CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR,
  isDashboardPrefetchOverCap,
} from "@helvety/shared/dashboard-prefetch";
import { fetchContactsPrefetchRows } from "@helvety/shared/encrypted-prefetch-queries";
import { logger } from "@helvety/shared/logger";
import { unexpectedActionError } from "@helvety/shared/server-action-primitives";

import type { ActionResponse, ContactRow } from "@/lib/types";

/** Data returned by the Contacts dashboard batch fetch */
interface ContactsDashboardData {
  contacts: ContactRow[];
}

/**
 * Prefetch encrypted contacts for the dashboard's initial server render.
 * Performs one auth + rate-limit check, then loads the contacts list payload
 * used to hydrate the client.
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

    const contactsResult = await fetchContactsPrefetchRows<ContactRow>(
      supabase,
      user.id,
      ACTION_LIMITS.MAX_DASHBOARD_ROWS
    );

    if (contactsResult.error) {
      logger.logUnexpectedError(
        "Error in getContactsDashboardData",
        contactsResult.error
      );
      return { success: false, error: "Failed to load dashboard data" };
    }

    if (
      isDashboardPrefetchOverCap(
        contactsResult.data?.length ?? 0,
        ACTION_LIMITS.MAX_DASHBOARD_ROWS
      )
    ) {
      return {
        success: false,
        error: CONTACTS_PREFETCH_TOO_MANY_ROWS_ERROR,
      };
    }

    return {
      success: true,
      data: {
        contacts: contactsResult.data ?? [],
      },
    };
  } catch (error) {
    return unexpectedActionError(
      "Unexpected error in getContactsDashboardData",
      error
    );
  }
}
