/** Default timeout for browser Supabase fetch (ms). */
export const BROWSER_SUPABASE_FETCH_TIMEOUT_MS = 15_000;

/** Shorter timeout for server/proxy Supabase fetch (ms). */
export const SERVER_SUPABASE_FETCH_TIMEOUT_MS = 8_000;

/**
 * Creates a fetch wrapper that aborts after `timeoutMs`.
 *
 * On unreliable networks (VPN, Private Relay, mobile resume), requests to the
 * Supabase Auth API can hang indefinitely. This wrapper surfaces timeout errors
 * promptly so retry logic at higher layers can kick in.
 */
export function createFetchWithTimeout(timeoutMs: number): typeof fetch {
  return function fetchWithTimeout(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();

    const onCallerAbort = () => controller.abort();
    if (init?.signal) {
      init.signal.addEventListener("abort", onCallerAbort);
    }

    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(input, { ...init, signal: controller.signal }).finally(() => {
      clearTimeout(timer);
      init?.signal?.removeEventListener("abort", onCallerAbort);
    });
  };
}

/** Fetch with timeout for browser Supabase clients. */
export const browserFetchWithTimeout = createFetchWithTimeout(
  BROWSER_SUPABASE_FETCH_TIMEOUT_MS
);

/** Fetch with timeout for server and proxy Supabase clients. */
export const serverFetchWithTimeout = createFetchWithTimeout(
  SERVER_SUPABASE_FETCH_TIMEOUT_MS
);
