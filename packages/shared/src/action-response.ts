import { toast } from "sonner";

import { TOAST_DURATIONS } from "./constants";

import type { ActionResponse } from "./types/entities";

/**
 * Handles a server action response: shows a toast on error and returns
 * the data on success. Reduces boilerplate in client components.
 *
 * @param response - ActionResponse from a server action
 * @param options.successMessage - Optional toast message on success
 * @param options.errorPrefix - Optional prefix before the error message
 * @returns The data on success, or `null` on failure
 *
 * @example
 * const data = handleActionResponse(await createItem(csrfToken, payload), {
 *   successMessage: "Item created",
 * });
 * if (!data) return; // error toast already shown
 */
export function handleActionResponse<T>(
  response: ActionResponse<T>,
  options?: {
    successMessage?: string;
    errorPrefix?: string;
  }
): T | null {
  if (response.success) {
    if (options?.successMessage) {
      toast.success(options.successMessage, {
        duration: TOAST_DURATIONS.SUCCESS,
      });
    }
    return "data" in response ? response.data : (null as T & null);
  }

  const message = options?.errorPrefix
    ? `${options.errorPrefix}: ${response.error}`
    : response.error;

  toast.error(message, { duration: TOAST_DURATIONS.ERROR });
  return null;
}

/**
 * Variant that only checks success/failure without extracting data.
 * Useful for void actions (delete, update) where there's no return value.
 *
 * @returns `true` on success, `false` on failure (error toast shown)
 */
export function handleActionResult(
  response: ActionResponse<void>,
  options?: {
    successMessage?: string;
    errorPrefix?: string;
  }
): boolean {
  if (response.success) {
    if (options?.successMessage) {
      toast.success(options.successMessage, {
        duration: TOAST_DURATIONS.SUCCESS,
      });
    }
    return true;
  }

  const message = options?.errorPrefix
    ? `${options.errorPrefix}: ${response.error}`
    : response.error;

  toast.error(message, { duration: TOAST_DURATIONS.ERROR });
  return false;
}
