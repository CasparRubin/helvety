/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for subscription lifecycle management.
 * Writes to subscription_events; subscription_id (FK to subscriptions.id) is set for
 * subscription.created/updated/canceled/renewed/payment_failed; checkout.completed leaves it null.
 */

import { logger } from "@helvety/shared/logger";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  stripe,
  getStripeWebhookSecret,
  getProductFromPriceId,
  isHandledWebhookEvent,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

import type { NextRequest } from "next/server";
import type Stripe from "stripe";

// =============================================================================
// Helpers
// =============================================================================

/** Period fields that may live at subscription-level (legacy) or item-level (newer Stripe API) */
interface SubscriptionPeriod {
  periodStart: number | undefined;
  periodEnd: number | undefined;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Type guard for canonical UUID strings. */
function isUuid(value: string | undefined): value is string {
  return !!value && UUID_REGEX.test(value);
}

/**
 * Extract current_period_start/end from a Stripe subscription.
 * Handles both the legacy subscription-level fields and the newer
 * per-item fields introduced in recent Stripe API versions.
 */
function extractSubscriptionPeriod(
  subscription: Stripe.Subscription,
  item?: { current_period_start?: number; current_period_end?: number }
): SubscriptionPeriod {
  const subWithPeriod = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    periodStart:
      subWithPeriod.current_period_start ?? item?.current_period_start,
    periodEnd: subWithPeriod.current_period_end ?? item?.current_period_end,
  };
}

/** Resolve internal user ID from a persisted Stripe customer mapping. */
async function getUserIdByCustomerId(
  customerId: string
): Promise<string | null> {
  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to resolve user by stripe customer ID:", error);
    return null;
  }

  return profile?.id ?? null;
}

/**
 * Resolve the user ID for webhook processing with trust ordering:
 * customer mapping > validated metadata fallback.
 */
async function resolveTrustedUserId(
  metadataUserId: string | undefined,
  customerId: string,
  context: string
): Promise<{ userId: string | null; metadataMismatch: boolean }> {
  const mappedUserId = await getUserIdByCustomerId(customerId);
  const candidateMetadataUserId = isUuid(metadataUserId)
    ? metadataUserId
    : null;

  if (
    mappedUserId &&
    candidateMetadataUserId &&
    mappedUserId !== candidateMetadataUserId
  ) {
    logger.warn(
      `Webhook user mismatch (${context}): metadata user ${candidateMetadataUserId} does not match customer mapping ${mappedUserId} for customer ${customerId}`
    );
    return { userId: mappedUserId, metadataMismatch: true };
  }

  if (mappedUserId) {
    return { userId: mappedUserId, metadataMismatch: false };
  }

  return { userId: candidateMetadataUserId, metadataMismatch: false };
}

// =============================================================================
// POST /api/webhooks/stripe - Handle Stripe webhooks
// =============================================================================

/**
 * Receives Stripe webhook events, verifies signature, deduplicates by stripe_event_id,
 * and dispatches to the appropriate handler. Returns 200 on success or when event is duplicate/ignored.
 * @param request - Request body must be raw (for signature verification)
 */
export async function POST(request: NextRequest) {
  // Reject oversized request bodies early (512KB limit for Stripe webhooks)
  const contentLength = parseInt(
    request.headers.get("content-length") ?? "0",
    10
  );
  if (contentLength > 512_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // Get validated webhook secret (throws if not configured or invalid format)
  let webhookSecret: string;
  try {
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    logger.error("STRIPE_WEBHOOK_SECRET validation failed:", error);
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the raw body for signature verification
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.error("Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify webhook signature
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Check if we handle this event type
  if (!isHandledWebhookEvent(event.type)) {
    logger.info(`Ignoring unhandled event type: ${event.type}`);
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  // Check for duplicate events (idempotency)
  const { data: existingEvent } = await supabase
    .from("subscription_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .single();

  if (existingEvent) {
    logger.info(`Duplicate event ignored: ${event.id}`);
    return NextResponse.json({ received: true });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, event.id);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object, event.id);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, event.id);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object, event.id);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object, event.id);
        break;
    }

    logger.info(`Webhook processed: ${event.type} (${event.id})`);
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error(`Error processing webhook ${event.type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle checkout.session.completed
 * Links Stripe customer to user (user_profiles), logs the event. The subscription row
 * is created/updated by customer.subscription.created / customer.subscription.updated.
 * checkout.completed does not set subscription_id (subscription row may not exist yet).
 * @param session
 * @param eventId - Stripe event ID used as stripe_event_id for idempotency
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  eventId: string
) {
  const supabase = createAdminClient();

  const metadataUserId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const { userId, metadataMismatch } = await resolveTrustedUserId(
    metadataUserId,
    customerId,
    "checkout.session.completed"
  );

  if (!userId) {
    // Guest checkout - we'll handle this when they sign up
    logger.info(`Guest checkout completed: ${session.id}`);

    // Log the event without user association for now
    // Guest checkout events can be linked to users later via customer_email in metadata
    await supabase.from("subscription_events").insert({
      event_type: "checkout.completed",
      stripe_event_id: eventId,
      metadata: {
        session_id: session.id,
        customer_id: customerId,
        customer_email: session.customer_email,
        subscription_id: subscriptionId,
        tier_id: session.metadata?.tier_id,
        product_id: session.metadata?.product_id,
        supplied_user_id: metadataUserId ?? null,
        is_guest_checkout: true,
        metadata_mismatch: metadataMismatch,
      },
      // user_id is nullable for guest checkouts - will be linked when user signs up
      user_id: null as string | null,
    });
    return;
  }

  // Update user profile with Stripe customer ID
  await supabase.from("user_profiles").upsert(
    {
      id: userId,
      email: session.customer_email ?? "",
      stripe_customer_id: customerId,
    },
    {
      onConflict: "id",
    }
  );

  // Log the checkout event
  await supabase.from("subscription_events").insert({
    user_id: userId,
    event_type: "checkout.completed",
    stripe_event_id: eventId,
    metadata: {
      session_id: session.id,
      customer_id: customerId,
      subscription_id: subscriptionId,
      supplied_user_id: metadataUserId ?? null,
      metadata_mismatch: metadataMismatch,
    },
  });

  logger.info(`Checkout completed for user ${userId}, customer ${customerId}`);
}

/**
 * Handle customer.subscription.created and customer.subscription.updated
 * @param subscription
 * @param eventId
 */
async function handleSubscriptionUpsert(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const customerId = subscription.customer as string;
  const { userId } = await resolveTrustedUserId(
    subscription.metadata?.supabase_user_id,
    customerId,
    `subscription.upsert:${subscription.id}`
  );

  if (!userId) {
    logger.warn(
      `No trusted user found for subscription ${subscription.id}, customer ${customerId}`
    );
    return;
  }

  await upsertSubscription(subscription, userId, eventId);
}

/**
 * Upsert subscription record
 * @param subscription
 * @param userId
 * @param eventId
 */
async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  eventId: string
) {
  const supabase = createAdminClient();

  // Get the first subscription item (we only support single-item subscriptions for now)
  const item = subscription.items.data[0];
  if (!item) {
    logger.error(`Subscription ${subscription.id} has no items`);
    return;
  }

  const priceId = item.price.id;
  const productInfo = getProductFromPriceId(priceId);

  // Reject unknown price IDs to prevent storing records with invalid product/tier.
  // This catches misconfigured Stripe env vars or unexpected price IDs.
  // We still return 200 to Stripe (handled by the caller) to prevent infinite retries,
  // but we skip the database upsert to avoid corrupting subscription data.
  if (!productInfo) {
    const metadataProductId = subscription.metadata?.product_id;
    const metadataTierId = subscription.metadata?.tier_id;

    // If metadata has valid product/tier from checkout, we can fall back to that
    if (metadataProductId && metadataTierId) {
      logger.warn(
        `Price ID ${priceId} not found in config for subscription ${subscription.id}. ` +
          `Falling back to metadata: product=${metadataProductId}, tier=${metadataTierId}. ` +
          `Check that STRIPE_PRICE_IDS env var is configured correctly.`
      );
    } else {
      logger.error(
        `Unknown price ID ${priceId} on subscription ${subscription.id} with no metadata fallback. ` +
          `Skipping subscription upsert to prevent storing invalid data. ` +
          `Check that STRIPE_PRICE_IDS env var is configured correctly.`
      );

      // Still log the event for audit trail, but skip the subscription upsert
      const supabaseForEvent = createAdminClient();
      await supabaseForEvent.from("subscription_events").insert({
        user_id: userId,
        event_type: "subscription.skipped_unknown_price",
        stripe_event_id: eventId,
        metadata: {
          subscription_id: subscription.id,
          price_id: priceId,
          status: subscription.status,
          reason: "Unknown price ID with no metadata fallback",
        },
      });
      return;
    }
  }

  const resolvedProductId =
    productInfo?.productId ?? subscription.metadata?.product_id ?? "unknown";
  const resolvedTierId =
    productInfo?.tierId ?? subscription.metadata?.tier_id ?? "unknown";

  // Period: subscription-level (legacy) or first item (newer Stripe API)
  const { periodStart, periodEnd } = extractSubscriptionPeriod(
    subscription,
    item as { current_period_start?: number; current_period_end?: number }
  );

  // Upsert subscription record and get our row id for the event log
  const { data: upsertedSub, error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        product_id: resolvedProductId,
        tier_id: resolvedTierId,
        status: subscription.status,
        current_period_start: periodStart
          ? new Date(periodStart * 1000).toISOString()
          : null,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
      },
      {
        onConflict: "stripe_subscription_id",
      }
    )
    .select("id")
    .single();

  if (error || !upsertedSub) {
    logger.error(`Failed to upsert subscription ${subscription.id}:`, error);
    throw error ?? new Error("Upsert returned no data");
  }

  // Log the event (subscription_id = our subscriptions.id for JOINs)
  await supabase.from("subscription_events").insert({
    user_id: userId,
    subscription_id: upsertedSub.id,
    event_type:
      subscription.status === "active"
        ? "subscription.created"
        : "subscription.updated",
    stripe_event_id: eventId,
    metadata: {
      subscription_id: subscription.id,
      status: subscription.status,
      price_id: priceId,
    },
  });

  logger.info(
    `Subscription ${subscription.id} upserted for user ${userId}, status: ${subscription.status}`
  );
}

/**
 * Handle customer.subscription.deleted
 * @param subscription
 * @param eventId
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  eventId: string
) {
  const supabase = createAdminClient();

  // Update subscription status to canceled
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (!existingSub) {
    logger.warn(`Subscription ${subscription.id} not found in database`);
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    logger.error(
      `Failed to mark subscription ${subscription.id} as canceled:`,
      error
    );
    throw error;
  }

  // Log the event (subscription_id = our subscriptions.id for JOINs)
  await supabase.from("subscription_events").insert({
    user_id: existingSub.user_id,
    subscription_id: existingSub.id,
    event_type: "subscription.canceled",
    stripe_event_id: eventId,
    metadata: {
      subscription_id: subscription.id,
    },
  });

  logger.info(`Subscription ${subscription.id} marked as canceled`);
}

/**
 * Handle invoice.paid - subscription renewal
 * @param invoice
 * @param eventId - Stripe event ID used as stripe_event_id for idempotency
 */
async function handleInvoicePaid(invoice: Stripe.Invoice, eventId: string) {
  const supabase = createAdminClient();

  // Cast invoice for API version compatibility
  const invoiceData = invoice as Stripe.Invoice & {
    subscription?: string | null;
  };
  const subscriptionId = invoiceData.subscription;
  if (!subscriptionId) {
    // One-time payment, not a subscription renewal
    return;
  }

  // Get the subscription to find user and our row id
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!sub) {
    logger.warn(
      `Subscription ${subscriptionId} not found for invoice ${invoice.id}`
    );
    return;
  }

  // Update subscription period (subscription-level or first item for newer API)
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const { periodStart, periodEnd } = extractSubscriptionPeriod(
    subscription,
    subscription.items?.data?.[0] as
      | { current_period_start?: number; current_period_end?: number }
      | undefined
  );

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: periodStart
        ? new Date(periodStart * 1000).toISOString()
        : null,
      current_period_end: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Log the renewal (subscription_id = our subscriptions.id for JOINs)
  await supabase.from("subscription_events").insert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    event_type: "subscription.renewed",
    stripe_event_id: eventId,
    metadata: {
      subscription_id: subscriptionId,
      invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
    },
  });

  logger.info(
    `Subscription ${subscriptionId} renewed via invoice ${invoice.id}`
  );
}

/**
 * Handle invoice.payment_failed
 * @param invoice
 * @param eventId - Stripe event ID used as stripe_event_id for idempotency
 */
async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventId: string
) {
  const supabase = createAdminClient();

  // Cast invoice for API version compatibility
  const invoiceData = invoice as Stripe.Invoice & {
    subscription?: string | null;
    attempt_count?: number;
  };
  const subscriptionId = invoiceData.subscription;
  if (!subscriptionId) {
    return;
  }

  // Get the subscription to find user and our row id
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!sub) {
    logger.warn(
      `Subscription ${subscriptionId} not found for failed invoice ${invoice.id}`
    );
    return;
  }

  // Update subscription status
  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Log the failure (subscription_id = our subscriptions.id for JOINs)
  await supabase.from("subscription_events").insert({
    user_id: sub.user_id,
    subscription_id: sub.id,
    event_type: "subscription.payment_failed",
    stripe_event_id: eventId,
    metadata: {
      subscription_id: subscriptionId,
      invoice_id: invoice.id,
      attempt_count: invoiceData.attempt_count,
    },
  });

  logger.info(
    `Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`
  );
}
