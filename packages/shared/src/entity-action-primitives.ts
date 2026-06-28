import "server-only";

import { ACTION_LIMITS } from "./constants";
import { logger } from "./logger";

import type { SupabaseClient } from "@supabase/supabase-js";

/** Minimal shape required for chunked reorder update helpers. */
interface ReorderUpdateLike {
  id: string;
  sort_order: number;
}

/** Result type for combined reorder scope validation + updates. */
export type ReorderOperationResult =
  { success: true } | { success: false; error: string; cause?: unknown };

/** User-facing message when an export exceeds {@link ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE}. */
export const EXPORT_TOO_LARGE_MESSAGE =
  "Export too large for a single request. Please reduce dataset size and retry.";

/** Result of fetching encrypted rows for export. */
export type OwnedEncryptedExportResult<T> =
  { success: true; rows: T[] } | { success: false; error: string };

/**
 * Ensures every provided ID belongs to the authenticated user.
 */
export async function validateOwnedReorderScope({
  supabase,
  userId,
  tableName,
  ids,
  scope,
  failureMessage,
  invalidScopeMessage,
}: {
  supabase: SupabaseClient;
  userId: string;
  tableName: string;
  ids: string[];
  scope: string;
  failureMessage: string;
  invalidScopeMessage: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .eq("user_id", userId)
    .in("id", ids);

  if (error) {
    logger.logUnexpectedError(scope, error);
    return { success: false, error: failureMessage };
  }

  if ((data ?? []).length !== ids.length) {
    return { success: false, error: invalidScopeMessage };
  }

  return { success: true };
}

/**
 * Executes reorder updates in bounded chunks to protect DB connections.
 */
export async function runChunkedReorderUpdates<T extends ReorderUpdateLike>({
  updates,
  updateChunk,
}: {
  updates: T[];
  updateChunk: (
    chunk: T[],
    nowIso: string
  ) => Promise<Array<{ error: unknown }>>;
}): Promise<{ success: true } | { success: false; error: unknown }> {
  const now = new Date().toISOString();
  const results: Array<{ error: unknown }> = [];

  for (let i = 0; i < updates.length; i += ACTION_LIMITS.REORDER_CHUNK_SIZE) {
    const chunk = updates.slice(i, i + ACTION_LIMITS.REORDER_CHUNK_SIZE);
    const chunkResults = await updateChunk(chunk, now);
    results.push(...chunkResults);
  }

  const failedResult = results.find((result) => result.error);
  if (failedResult?.error) {
    return { success: false, error: failedResult.error };
  }

  return { success: true };
}

/**
 * Enforces export cap after fetching `cap + 1` rows.
 */
export function isExportWithinCap(rowCount: number): boolean {
  return rowCount <= ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE;
}

/** True when every table row count is within the export cap. */
export function areExportTablesWithinCap(rowCounts: number[]): boolean {
  return rowCounts.every(isExportWithinCap);
}

/**
 * Maps {@link reorderOwnedEntities} failures to action responses.
 * Returns `null` when the reorder succeeded.
 */
export function mapReorderOwnedEntitiesFailure(
  entityType: string,
  reorderResult: ReorderOperationResult,
  logScope: string
): { success: false; error: string } | null {
  if (reorderResult.success) {
    return null;
  }
  if (reorderResult.cause === undefined) {
    return { success: false, error: reorderResult.error };
  }
  logger.logUnexpectedError(logScope, reorderResult.cause);
  return { success: false, error: `Failed to reorder ${entityType}s` };
}

/**
 * Fetches user-owned encrypted rows for export with cap enforcement.
 */
export async function fetchOwnedEncryptedExport<T>({
  supabase,
  userId,
  tableName,
  selectColumns,
  orderColumn = "sort_order",
  logScope,
  loadErrorMessage,
}: {
  supabase: SupabaseClient;
  userId: string;
  tableName: string;
  selectColumns: string;
  orderColumn?: string;
  logScope: string;
  loadErrorMessage: string;
}): Promise<OwnedEncryptedExportResult<T>> {
  const { data, error } = await supabase
    .from(tableName)
    .select(selectColumns)
    .eq("user_id", userId)
    .order(orderColumn)
    .limit(ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE + 1);

  if (error) {
    logger.logUnexpectedError(logScope, error);
    return { success: false, error: loadErrorMessage };
  }

  const rows = (data ?? []) as T[];
  if (!isExportWithinCap(rows.length)) {
    logger.warn("Export exceeds maximum row cap", {
      userId,
      table: tableName,
      rows: rows.length,
      cap: ACTION_LIMITS.MAX_EXPORT_ROWS_PER_TABLE,
    });
    return { success: false, error: EXPORT_TOO_LARGE_MESSAGE };
  }

  return { success: true, rows };
}

/** Structured log when a user requests an encrypted data export. */
export function logEncryptedExportRequested(
  source: string,
  userId: string
): void {
  logger.info("Data export requested", { source, userId });
}

/**
 * Assign a field when value is defined.
 */
export function assignDefinedField(
  target: Record<string, unknown>,
  key: string,
  value: unknown
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

/**
 * Validates ownership and applies chunked reorder updates for an entity table.
 */
export async function reorderOwnedEntities<T extends ReorderUpdateLike>({
  supabase,
  userId,
  tableName,
  updates,
  scope,
  failureMessage,
  invalidScopeMessage,
  buildUpdateObject,
}: {
  supabase: SupabaseClient;
  userId: string;
  tableName: string;
  updates: T[];
  scope: string;
  failureMessage: string;
  invalidScopeMessage: string;
  buildUpdateObject: (update: T, nowIso: string) => Record<string, unknown>;
}): Promise<ReorderOperationResult> {
  const updateIds = updates.map((update) => update.id);
  const scopeResult = await validateOwnedReorderScope({
    supabase,
    userId,
    tableName,
    ids: updateIds,
    scope,
    failureMessage,
    invalidScopeMessage,
  });
  if (!scopeResult.success) {
    return scopeResult;
  }

  const reorderResult = await runChunkedReorderUpdates({
    updates,
    updateChunk: async (chunk, nowIso) =>
      Promise.all(
        chunk.map((update) =>
          supabase
            .from(tableName)
            .update(buildUpdateObject(update, nowIso))
            .eq("id", update.id)
            .eq("user_id", userId)
        )
      ),
  });

  if (!reorderResult.success) {
    return {
      success: false,
      error: failureMessage,
      cause: reorderResult.error,
    };
  }

  return { success: true };
}
