/**
 * Stripe Checkout verification route
 * Verifies a checkout session server-side before success UI is shown.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

import { stripe } from "@/lib/stripe";
import { normalizeCheckoutVerification } from "@/lib/stripe/checkout-verification";

const VerifyCheckoutQuerySchema = z.object({
  session_id: z
    .string()
    .min(1, "Session ID is required")
    .max(255, "Session ID is too long")
    .regex(/^cs_(test|live)_[A-Za-z0-9_]+$/, "Invalid session ID format"),
});

/** GET /api/checkout/verify?session_id=... */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parseResult = VerifyCheckoutQuerySchema.safeParse({
    session_id: url.searchParams.get("session_id"),
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid or missing checkout session ID." },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(
      parseResult.data.session_id
    );

    return NextResponse.json(normalizeCheckoutVerification(session));
  } catch {
    return NextResponse.json(
      { error: "Could not verify checkout session." },
      { status: 400 }
    );
  }
}
