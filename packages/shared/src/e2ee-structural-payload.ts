/**
 * Merge plaintext structural metadata into encrypted E2EE write payloads.
 * Used by web list hooks for symmetric create/update server action payloads.
 */

/** Picks only defined structural fields from plaintext input for write payloads. */
export function pickDefinedStructuralFields<
  TInput extends object,
  TKey extends keyof TInput,
>(input: Partial<TInput>, keys: readonly TKey[]): Partial<Pick<TInput, TKey>> {
  const result: Partial<Pick<TInput, TKey>> = {};

  for (const key of keys) {
    if (input[key] !== undefined) {
      result[key] = input[key];
    }
  }

  return result;
}
