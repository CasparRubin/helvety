import "server-only";

import { logger } from "./logger";

import type { ZodType } from "zod";

/** Standardized validation failure response for server actions. */
type ValidationFailure = { success: false; error: string };

/**
 * Parse action input with consistent warning metadata on validation errors.
 */
export function parseActionInput<T>({
  schema,
  data,
  invalidDataMessage,
  warnMessage,
}: {
  schema: ZodType<T>;
  data: unknown;
  invalidDataMessage: string;
  warnMessage: string;
}): { success: true; data: T } | ValidationFailure {
  const validationResult = schema.safeParse(data);
  if (!validationResult.success) {
    logger.warn(warnMessage, {
      fields: validationResult.error.issues.map((issue) =>
        issue.path.join(".")
      ),
      issueCount: validationResult.error.issues.length,
    });
    return { success: false, error: invalidDataMessage };
  }

  return { success: true, data: validationResult.data };
}

/**
 * Shared fallback for unexpected errors in server actions.
 */
export function unexpectedActionError(
  scope: string,
  error: unknown
): ValidationFailure {
  logger.logUnexpectedError(scope, error);
  return { success: false, error: "An unexpected error occurred" };
}
