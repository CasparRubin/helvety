/**
 * Timeout utilities for wrapping promises with timeout functionality.
 * Prevents operations from hanging indefinitely and provides better error messages.
 */

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within the timeout,
 * it rejects with a timeout error.
 *
 * The timeout is automatically cleaned up if the promise resolves or rejects before
 * the timeout expires.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message for timeout (default: "Operation timed out")
 * @returns A promise that either resolves with the original value or rejects on timeout
 * @template T - The type of value the promise resolves to
 * @throws {Error} When the operation times out
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   "Data fetch timed out"
 * )
 * ```
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isCleanedUp = false;

  const cleanup = (): void => {
    if (!isCleanedUp && timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      isCleanedUp = true;
    }
  };

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race<T>([
    promise.then(
      (value) => {
        cleanup();
        return value;
      },
      (error) => {
        cleanup();
        throw error;
      }
    ),
    timeoutPromise,
  ]);
}
