"use server";

import "server-only";

import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Minimal user payload returned from the indexed email lookup RPC. */
type EmailLookupUser = {
  id: string;
  email: string;
};

/**
 * Find a user by email using the indexed `get_auth_user_by_email` RPC.
 */
export async function findUserByEmail(
  email: string,
  adminClient?: SupabaseClient
): Promise<EmailLookupUser | null> {
  const client = adminClient ?? createAdminClient();
  const { data, error } = await client.rpc("get_auth_user_by_email", {
    lookup_email: email,
  });

  if (error || !data) {
    logger.error("Error looking up user by email via RPC:", error);
    return null;
  }

  if (Array.isArray(data) && data.length === 0) {
    return null;
  }

  const user = Array.isArray(data) ? data[0] : data;
  if (!user?.id || !user?.email) {
    return null;
  }

  return { id: user.id, email: user.email };
}
