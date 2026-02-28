import type Stripe from "stripe";

/** Normalized checkout verification status used by UI and API layers. */
export type CheckoutVerificationStatus = "complete" | "open";

/** Normalized checkout verification payload. */
export interface CheckoutVerificationResult {
  status: CheckoutVerificationStatus;
  paymentStatus:
    | Stripe.Checkout.Session.PaymentStatus
    | Stripe.Checkout.Session.Status
    | null;
  productId: string | null;
  tierId: string | null;
}

/** Normalizes Stripe Checkout session state into a stable app-facing shape. */
export function normalizeCheckoutVerification(
  session: Pick<
    Stripe.Checkout.Session,
    "status" | "payment_status" | "metadata"
  >
): CheckoutVerificationResult {
  const isComplete =
    session.status === "complete" || session.payment_status === "paid";

  return {
    status: isComplete ? "complete" : "open",
    paymentStatus: session.payment_status ?? session.status ?? null,
    productId: session.metadata?.product_id ?? null,
    tierId: session.metadata?.tier_id ?? null,
  };
}
