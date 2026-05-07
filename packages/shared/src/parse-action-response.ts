import type { ActionResponse } from "./types/entities";

/** Checks whether an unknown payload matches ActionResponse shape. */
export function isActionResponsePayload<T>(
  value: unknown
): value is ActionResponse<T> {
  if (typeof value !== "object" || value === null || !("success" in value)) {
    return false;
  }

  const success = Reflect.get(value, "success");
  return typeof success === "boolean";
}

/** Extracts an ActionResponse-style error string when present. */
function getActionError(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("error" in value)) {
    return null;
  }

  const error = Reflect.get(value, "error");
  return typeof error === "string" && error.length > 0 ? error : null;
}

/**
 * Parses route handler `Response` bodies into an {@link ActionResponse} payload.
 */
export async function parseActionResponse<T>(
  response: Response,
  defaultErrorMessage: string
): Promise<ActionResponse<T>> {
  const raw = await response.text();
  let parsed: unknown = null;

  if (raw.length > 0) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
  }

  if (response.ok) {
    if (isActionResponsePayload<T>(parsed)) {
      return parsed;
    }

    return { success: false, error: defaultErrorMessage };
  }

  const parsedError = getActionError(parsed);
  return {
    success: false,
    error: parsedError ?? `${defaultErrorMessage} (status ${response.status})`,
  };
}
