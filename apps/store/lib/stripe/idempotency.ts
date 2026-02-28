import { createHash } from "crypto";

/**
 * Builds a Stripe idempotency key with a bounded length.
 * Stripe accepts up to 255 chars; we keep keys short and deterministic.
 */
export function createStripeIdempotencyKey(
  operation: string,
  parts: Array<string | number | boolean | null | undefined>
): string {
  const serialized = parts
    .map((part) => (part == null ? "null" : String(part)))
    .join("|");
  const digest = createHash("sha256").update(serialized).digest("hex");
  const normalizedOperation = operation.replace(/[^a-z0-9._-]/gi, "_");
  return `${normalizedOperation}:${digest.slice(0, 48)}`;
}
