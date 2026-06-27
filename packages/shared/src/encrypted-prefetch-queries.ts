import "server-only";

import { ACTION_LIMITS } from "./constants";
import { ENCRYPTED_PREFETCH_COLUMNS } from "./encrypted-prefetch-api";

import type { DatabaseSchema } from "./types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** User-scoped Supabase client typed against the Helvety database schema. */
type UserScopedSupabase = SupabaseClient<DatabaseSchema>;

/** Shared API-route row cap for encrypted list prefetch handlers. */
export const ENCRYPTED_PREFETCH_API_MAX_ROWS = ACTION_LIMITS.MAX_DASHBOARD_ROWS;

/** Result shape for encrypted list prefetch queries. */
export interface PrefetchQueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

/** Fetches encrypted tasks for dashboard prefetch or API list routes. */
export async function fetchTasksPrefetchRows<T>(
  supabase: UserScopedSupabase,
  userId: string,
  limit: number
): Promise<PrefetchQueryResult<T>> {
  const result = await supabase
    .from("items")
    .select(ENCRYPTED_PREFETCH_COLUMNS.items)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit + 1)
    .overrideTypes<T[], { merge: false }>();

  return { data: result.data, error: result.error };
}

/** Fetches encrypted contacts for dashboard prefetch or API list routes. */
export async function fetchContactsPrefetchRows<T>(
  supabase: UserScopedSupabase,
  userId: string,
  limit: number
): Promise<PrefetchQueryResult<T>> {
  const result = await supabase
    .from("contacts")
    .select(ENCRYPTED_PREFETCH_COLUMNS.contacts)
    .eq("user_id", userId)
    .order("category_id", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit + 1)
    .overrideTypes<T[], { merge: false }>();

  return { data: result.data, error: result.error };
}

/** Fetches encrypted notes for dashboard prefetch or API list routes. */
export async function fetchNotesPrefetchRows<T>(
  supabase: UserScopedSupabase,
  userId: string,
  limit: number
): Promise<PrefetchQueryResult<T>> {
  const result = await supabase
    .from("notes")
    .select(ENCRYPTED_PREFETCH_COLUMNS.notes)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit + 1)
    .overrideTypes<T[], { merge: false }>();

  return { data: result.data, error: result.error };
}

/** Fetches encrypted link folders and links for dashboard prefetch or API routes. */
export async function fetchLinksLibraryPrefetchRows<TFolder, TLink>(
  supabase: UserScopedSupabase,
  userId: string,
  limit: number
): Promise<{
  folders: PrefetchQueryResult<TFolder>;
  links: PrefetchQueryResult<TLink>;
}> {
  const [foldersResult, linksResult] = await Promise.all([
    supabase
      .from("link_folders")
      .select(ENCRYPTED_PREFETCH_COLUMNS.link_folders)
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit + 1)
      .overrideTypes<TFolder[], { merge: false }>(),
    supabase
      .from("links")
      .select(ENCRYPTED_PREFETCH_COLUMNS.links)
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(limit + 1)
      .overrideTypes<TLink[], { merge: false }>(),
  ]);

  return {
    folders: { data: foldersResult.data, error: foldersResult.error },
    links: { data: linksResult.data, error: linksResult.error },
  };
}
