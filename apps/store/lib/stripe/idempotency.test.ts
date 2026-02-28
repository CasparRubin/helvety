import { describe, expect, it } from "vitest";

import { createStripeIdempotencyKey } from "./idempotency";

describe("createStripeIdempotencyKey", () => {
  it("is deterministic for the same operation and parts", () => {
    const a = createStripeIdempotencyKey("checkout_session_subscription", [
      "user-123",
      "tier-pro",
      42,
    ]);
    const b = createStripeIdempotencyKey("checkout_session_subscription", [
      "user-123",
      "tier-pro",
      42,
    ]);

    expect(a).toBe(b);
  });

  it("changes when operation or parts change", () => {
    const a = createStripeIdempotencyKey("op-a", ["user-123", "tier-pro", 42]);
    const b = createStripeIdempotencyKey("op-b", ["user-123", "tier-pro", 42]);
    const c = createStripeIdempotencyKey("op-a", [
      "user-123",
      "tier-basic",
      42,
    ]);

    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});
