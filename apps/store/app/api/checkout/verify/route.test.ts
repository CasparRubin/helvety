import { describe, expect, it } from "vitest";

import { normalizeCheckoutVerification } from "@/lib/stripe/checkout-verification";

describe("normalizeCheckoutVerification", () => {
  it("returns complete for paid checkout sessions", () => {
    const result = normalizeCheckoutVerification({
      status: "complete",
      payment_status: "paid",
      metadata: {
        product_id: "helvety-spo-explorer",
        tier_id: "helvety-spo-explorer-supported-monthly",
      },
    });

    expect(result.status).toBe("complete");
    expect(result.productId).toBe("helvety-spo-explorer");
    expect(result.tierId).toBe("helvety-spo-explorer-supported-monthly");
  });

  it("returns open for unpaid sessions", () => {
    const result = normalizeCheckoutVerification({
      status: "open",
      payment_status: "unpaid",
      metadata: {},
    });

    expect(result.status).toBe("open");
    expect(result.productId).toBeNull();
    expect(result.tierId).toBeNull();
  });
});
