/** Minimum wall-clock duration for passkey options generation (timing oracle mitigation). */
export const PASSKEY_OPTIONS_MIN_DURATION_MS = 250;

/**
 * Ensures passkey options endpoints take at least {@link PASSKEY_OPTIONS_MIN_DURATION_MS}.
 * Call in `finally` blocks so success and failure paths have similar latency.
 */
export async function ensurePasskeyOptionsMinDuration(
  startedAtMs: number
): Promise<void> {
  const elapsed = Date.now() - startedAtMs;
  const remaining = PASSKEY_OPTIONS_MIN_DURATION_MS - elapsed;
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, remaining);
    });
  }
}
