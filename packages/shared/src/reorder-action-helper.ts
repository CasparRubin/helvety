import "server-only";

import { authenticateAndRateLimit } from "./action-helpers";
import {
  mapReorderOwnedEntitiesFailure,
  reorderOwnedEntities,
} from "./entity-action-primitives";
import { parseActionInput } from "./server-action-primitives";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodType } from "zod";

/** Success/failure response shape for shared reorder server actions. */
type ReorderActionResponse =
  { success: true } | { success: false; error: string };

/** Minimal reorder payload required by shared validation/update helpers. */
interface ReorderUpdateLike {
  id: string;
  sort_order: number;
}

/** Additional context passed to custom reorder-scope validators. */
interface ReorderScopeContext<TUpdate extends ReorderUpdateLike> {
  supabase: SupabaseClient;
  userId: string;
  updates: TUpdate[];
}

/**
 * Runs the common auth + validation + reorder flow used by E2EE server actions.
 */
export async function runOwnedReorderAction<TUpdate extends ReorderUpdateLike>({
  csrfToken,
  rateLimitPrefix,
  schema,
  updates,
  warnMessage,
  invalidDataMessage,
  tableName,
  entityType,
  scope,
  failureMessage,
  invalidScopeMessage,
  buildUpdateObject,
  validateScope,
  onSuccess,
}: {
  csrfToken: string;
  rateLimitPrefix: string;
  schema: ZodType<TUpdate[]>;
  updates: TUpdate[];
  warnMessage: string;
  invalidDataMessage: string;
  tableName: string;
  entityType: string;
  scope: string;
  failureMessage: string;
  invalidScopeMessage: string;
  buildUpdateObject: (
    update: TUpdate,
    nowIso: string
  ) => Record<string, unknown>;
  validateScope?: (
    context: ReorderScopeContext<TUpdate>
  ) => Promise<ReorderActionResponse>;
  onSuccess?: () => void;
}): Promise<ReorderActionResponse> {
  const auth = await authenticateAndRateLimit({
    csrfToken,
    rateLimitPrefix,
  });
  if (!auth.ok) {
    return auth.response;
  }

  const validationResult = parseActionInput({
    schema,
    data: updates,
    warnMessage,
    invalidDataMessage,
  });
  if (!validationResult.success) {
    return validationResult;
  }
  const validatedUpdates = validationResult.data;

  if (validatedUpdates.length === 0) {
    return { success: true };
  }

  const { user, supabase } = auth.ctx;
  if (validateScope) {
    const scopeValidation = await validateScope({
      supabase,
      userId: user.id,
      updates: validatedUpdates,
    });
    if (!scopeValidation.success) {
      return scopeValidation;
    }
  }

  const reorderResult = await reorderOwnedEntities({
    supabase,
    userId: user.id,
    tableName,
    updates: validatedUpdates,
    scope,
    failureMessage,
    invalidScopeMessage,
    buildUpdateObject,
  });

  const reorderFailure = mapReorderOwnedEntitiesFailure(
    entityType,
    reorderResult,
    `Error reordering ${entityType}`
  );
  if (reorderFailure) {
    return reorderFailure;
  }

  onSuccess?.();
  return { success: true };
}
