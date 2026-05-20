import "server-only";

import { getSupabaseKey, getSupabaseUrl } from "@helvety/shared/env-validation";
import { createClient } from "@supabase/supabase-js";

import type { DatabaseSchema } from "@helvety/shared/types/database.types";
import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Resolve the authenticated user from a Supabase JWT sent as
 * `Authorization: Bearer <access_token>` (Chromium extension session).
 */
export async function getUserFromBearerAuthHeader(
  request: Request
): Promise<{ user: User; supabase: SupabaseClient<DatabaseSchema> } | null> {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const accessToken = header.slice("bearer ".length).trim();
  if (!accessToken) {
    return null;
  }

  const supabase = createClient<DatabaseSchema>(
    getSupabaseUrl(),
    getSupabaseKey(),
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}
