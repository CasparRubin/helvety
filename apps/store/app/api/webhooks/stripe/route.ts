/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for subscription lifecycle management.
 * Writes to subscription_events; subscription_id (FK to subscriptions.id) is set for
 * subscription.created/updated/canceled/renewed/payment_failed; checkout.completed leaves it null.
 */

import { logger } from "@helvety/shared/logger";
import { createAdminClient } from "@helvety/shared/supabase/admin";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import {
  stripe,
  getStripeWebhookSecret,
  getProductFromPriceId,
  isHandledWebhookEvent,
} from "@/lib/stripe";

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

/** Internal normalized event types persisted in subscription_events. */
type SubscriptionEventType =
  | "checkout.completed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.renewed"
  | "subscription.payment_failed"
  | "subscription.skipped_unknown_price";

/** Processing lifecycle state stored in subscription_events metadata. */
type ProcessingStatus = "claimed" | "claimed_retry" | "processed" | "failed";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Type guard for canonical UUID strings. */
function isUuid(value: string | undefined): value is string {
  return !!value && UUID_REGEX.test(value);
}

/** Throw on Supabase write errors so webhook retries happen correctly. */
function ensureWriteSucceeded(
  context: string,
  error: { message?: string } | null
): void {
  if (!error) {
    return;
  }
  logger.error(`Supabase write failed (${context}):`, error);
  throw new Error(
    error.message ? `Supabase write failed: ${error.message}` : context
  );
}

/** Internal event type used in subscription_events for a Stripe event. */
function mapStripeEventTypeToInternalType(
  stripeEventType: Stripe.Event["type"]
): SubscriptionEventType {
  switch (stripeEventType) {
    case "checkout.session.completed":
      return "checkout.completed";
    case "customer.subscription.created":
      return "subscription.created";
    case "customer.subscription.updated":
      return "subscription.updated";
    case "customer.subscription.deleted":
      return "subscription.canceled";
    case "invoice.paid":
      return "subscription.renewed";
    case "invoice.payment_failed":
      return "subscription.payment_failed";
    default:
      throw new Error(`Unhandled Stripe event type: ${stripeEventType}`);
  }
}

/** Returns true when the Postgres error represents a unique key violation. */
function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

/** Extract processing status from metadata payload defensively. */
function getProcessingStatus(metadata: unknown): ProcessingStatus | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }
  const value = (metadata as Record<string, unknown>).processing_status;
  if (
    value === "claimed" ||
    value === "claimed_retry" ||
    value === "processed" ||
    value === "failed"
  ) {
    return value;
  }
  return undefined;
}

/**
 * Reclaim a previously failed webhook event so Stripe retries can be processed.
 * Returns true when the event was transitioned back to a claimed state.
 */
async function reclaimFailedWebhookEvent(eventId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("subscription_events")
    .select("metadata")
    .eq("stripe_event_id", eventId)
    .maybeSingle();

  if (error || !data) {
    if (error) {
      logger.error("Failed to load existing webhook event for reclaim:", error);
    }
    return false;
  }

  const existingMetadata =
    data.metadata &&
    typeof data.metadata === "object" &&
    !Array.isArray(data.metadata)
      ? (data.metadata as Record<string, unknown>)
      : {};
  const processingStatus = getProcessingStatus(existingMetadata);

  if (processingStatus !== "failed") {
    return false;
  }

  const { error: updateError } = await supabase
    .from("subscription_events")
    .update({
      metadata: {
        ...existingMetadata,
        processing_status: "claimed_retry",
      },
    } as never)
    .eq("stripe_event_id", eventId);
  ensureWriteSucceeded("webhook event reclaim update", updateError);
  return true;
}

/**
 * Atomically claims an event by inserting subscription_events row keyed by stripe_event_id.
 * Duplicate inserts fail fast and are treated as already-processed events.
 */
async function claimWebhookEvent(
  eventId: string,
  internalType: SubscriptionEventType,
  stripeEventType: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("subscription_events").insert({
    event_type: internalType,
    stripe_event_id: eventId,
    user_id: null as string | null,
    subscription_id: null as string | null,
    metadata: {
      stripe_event_type: stripeEventType,
      processing_status: "claimed",
    },
  } as never);

  if (!error) {
    return true;
  }
  if (isUniqueViolation(error)) {
    return await reclaimFailedWebhookEvent(eventId);
  }
  ensureWriteSucceeded("webhook event claim insert", error);
  return false;
}

/** Finalize/update a claimed webhook event row after processing. */
async function finalizeWebhookEvent(
  eventId: string,
  payload: {
    eventType: SubscriptionEventType;
    userId?: string | null;
    subscriptionId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("subscription_events")
    .update({
      event_type: payload.eventType,
      user_id: payload.userId ?? null,
      subscription_id: payload.subscriptionId ?? null,
      metadata: payload.metadata ?? {},
    } as never)
    .eq("stripe_event_id", eventId);
  ensureWriteSucceeded("webhook event finalize update", error);
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
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Check if we handle this event type
  if (!isHandledWebhookEvent(event.type)) {
    logger.info(`Ignoring unhandled event type: ${event.type}`, {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    });
    return NextResponse.json({ received: true });
  }

  const claimed = await claimWebhookEvent(
    event.id,
    mapStripeEventTypeToInternalType(event.type),
    event.type
  );
  if (!claimed) {
    logger.info(`Duplicate event ignored: ${event.id}`, {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    });
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

    logger.info(`Webhook processed: ${event.type} (${event.id})`, {
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error(`Error processing webhook ${event.type}:`, {
      error,
      stripe_event_id: event.id,
      stripe_event_type: event.type,
    });
    try {
      await finalizeWebhookEvent(event.id, {
        eventType: mapStripeEventTypeToInternalType(event.type),
        metadata: {
          stripe_event_type: event.type,
          processing_status: "failed",
        },
      });
    } catch (finalizeError) {
      logger.error("Failed to persist webhook failure status:", finalizeError);
    }
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

    // Guest checkout events can be linked to users later via metadata fields.
    await finalizeWebhookEvent(eventId, {
      eventType: "checkout.completed",
      userId: null,
      subscriptionId: null,
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
        processing_status: "processed",
      },
    });
    return;
  }

  // Update user profile with Stripe customer ID
  const profileUpsertPayload: {
    id: string;
    stripe_customer_id: string;
    email?: string;
  } = {
    id: userId,
    stripe_customer_id: customerId,
  };
  if (session.customer_email) {
    profileUpsertPayload.email = session.customer_email;
  }
  const { error: profileUpsertError } = await supabase
    .from("user_profiles")
    .upsert(profileUpsertPayload, {
      onConflict: "id",
    });
  ensureWriteSucceeded("checkout profile upsert", profileUpsertError);

  await finalizeWebhookEvent(eventId, {
    eventType: "checkout.completed",
    userId,
    subscriptionId: null,
    metadata: {
      session_id: session.id,
      customer_id: customerId,
      subscription_id: subscriptionId,
      supplied_user_id: metadataUserId ?? null,
      metadata_mismatch: metadataMismatch,
      processing_status: "processed",
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
  // Stripe event ordering is not guaranteed, so reconcile using the latest
  // canonical subscription state from Stripe before writing.
  let latestSubscription: Stripe.Subscription = subscription;
  try {
    latestSubscription = await stripe.subscriptions.retrieve(subscription.id);
  } catch (error) {
    logger.warn(
      `Could not retrieve latest Stripe subscription ${subscription.id}; falling back to event payload:`,
      error
    );
  }

  const customerId = latestSubscription.customer as string;
  const { userId } = await resolveTrustedUserId(
    latestSubscription.metadata?.supabase_user_id,
    customerId,
    `subscription.upsert:${latestSubscription.id}`
  );

  if (!userId) {
    logger.warn(
      `No trusted user found for subscription ${latestSubscription.id}, customer ${customerId}`
    );
    return;
  }

  await upsertSubscription(latestSubscription, userId, eventId);
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

      await finalizeWebhookEvent(eventId, {
        eventType: "subscription.skipped_unknown_price",
        userId,
        subscriptionId: null,
        metadata: {
          subscription_id: subscription.id,
          price_id: priceId,
          status: subscription.status,
          reason: "Unknown price ID with no metadata fallback",
          processing_status: "processed",
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

  await finalizeWebhookEvent(eventId, {
    eventType:
      subscription.status === "active"
        ? "subscription.created"
        : "subscription.updated",
    userId,
    subscriptionId: upsertedSub.id,
    metadata: {
      subscription_id: subscription.id,
      status: subscription.status,
      price_id: priceId,
      processing_status: "processed",
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

  try {
    const latestSubscription = await stripe.subscriptions.retrieve(
      subscription.id
    );
    if (latestSubscription.status !== "canceled") {
      await finalizeWebhookEvent(eventId, {
        eventType: "subscription.updated",
        metadata: {
          subscription_id: subscription.id,
          reason: "stale_deleted_event_ignored",
          latest_status: latestSubscription.status,
          processing_status: "processed",
        },
      });
      logger.warn(
        `Ignored stale deleted event for subscription ${subscription.id}; latest status is ${latestSubscription.status}`
      );
      return;
    }
  } catch (error) {
    logger.warn(
      `Could not verify latest status for deleted event ${subscription.id}:`,
      error
    );
  }

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

  await finalizeWebhookEvent(eventId, {
    eventType: "subscription.canceled",
    userId: existingSub.user_id,
    subscriptionId: existingSub.id,
    metadata: {
      subscription_id: subscription.id,
      processing_status: "processed",
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

  const { error: invoicePaidUpdateError } = await supabase
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
  ensureWriteSucceeded(
    "invoice paid subscription update",
    invoicePaidUpdateError
  );

  await finalizeWebhookEvent(eventId, {
    eventType: "subscription.renewed",
    userId: sub.user_id,
    subscriptionId: sub.id,
    metadata: {
      subscription_id: subscriptionId,
      invoice_id: invoice.id,
      amount_paid: invoice.amount_paid,
      processing_status: "processed",
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
  const { error: paymentFailedUpdateError } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
    })
    .eq("stripe_subscription_id", subscriptionId);
  ensureWriteSucceeded(
    "invoice payment_failed subscription update",
    paymentFailedUpdateError
  );

  await finalizeWebhookEvent(eventId, {
    eventType: "subscription.payment_failed",
    userId: sub.user_id,
    subscriptionId: sub.id,
    metadata: {
      subscription_id: subscriptionId,
      invoice_id: invoice.id,
      attempt_count: invoiceData.attempt_count,
      processing_status: "processed",
    },
  });

  logger.info(
    `Payment failed for subscription ${subscriptionId}, invoice ${invoice.id}`
  );
}
