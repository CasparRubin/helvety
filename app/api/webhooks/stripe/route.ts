/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for subscription lifecycle management
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import {
  stripe,
  getProductFromPriceId,
  isHandledWebhookEvent,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

import type { NextRequest } from "next/server";
import type Stripe from "stripe";

// =============================================================================
// WEBHOOK SECRET
// =============================================================================

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// =============================================================================
// POST /api/webhooks/stripe - Handle Stripe webhooks
// =============================================================================

/**
 *
 * @param request
 */
export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is not configured");
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
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
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
 * Links Stripe customer to user and creates initial subscription record
 * @param session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient();

  const userId = session.metadata?.supabase_user_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;

  if (!userId) {
    // Guest checkout - we'll handle this when they sign up
    logger.info(`Guest checkout completed: ${session.id}`);

    // Log the event without user association for now
    // Guest checkout events can be linked to users later via customer_email in metadata
    await supabase.from("subscription_events").insert({
      event_type: "checkout.completed",
      stripe_event_id: `checkout_${session.id}`,
      metadata: {
        session_id: session.id,
        customer_id: customerId,
        customer_email: session.customer_email,
        subscription_id: subscriptionId,
        tier_id: session.metadata?.tier_id,
        product_id: session.metadata?.product_id,
        is_guest_checkout: true,
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
    stripe_event_id: `checkout_${session.id}`,
    metadata: {
      session_id: session.id,
      customer_id: customerId,
      subscription_id: subscriptionId,
    },
  });

  logger.info(`Checkout completed for user ${userId}, customer ${customerId}`);
}

/**
 * Handle customer.subscription.created and customer.subscription.updated
 * @param subscription
 */
async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  // Get user ID from subscription metadata or customer
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile) {
      logger.warn(
        `No user found for subscription ${subscription.id}, customer ${customerId}`
      );
      return;
    }

    await upsertSubscription(subscription, profile.id);
  } else {
    await upsertSubscription(subscription, userId);
  }
}

/**
 * Upsert subscription record
 * @param subscription
 * @param userId
 */
async function upsertSubscription(
  subscription: Stripe.Subscription,
  userId: string
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

  // Access subscription period dates (using type assertion for API version compatibility)
  const subData = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  // Upsert subscription record
  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      product_id:
        productInfo?.productId ??
        subscription.metadata?.product_id ??
        "unknown",
      tier_id:
        productInfo?.tierId ?? subscription.metadata?.tier_id ?? "unknown",
      status: subscription.status,
      current_period_start: subData.current_period_start
        ? new Date(subData.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subData.current_period_end
        ? new Date(subData.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );

  if (error) {
    logger.error(`Failed to upsert subscription ${subscription.id}:`, error);
    throw error;
  }

  // Log the event
  await supabase.from("subscription_events").insert({
    user_id: userId,
    event_type:
      subscription.status === "active"
        ? "subscription.created"
        : "subscription.updated",
    stripe_event_id: `sub_${subscription.id}_${Date.now()}`,
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
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient();

  // Update subscription status to canceled
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("user_id")
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

  // Log the event
  await supabase.from("subscription_events").insert({
    user_id: existingSub.user_id,
    event_type: "subscription.canceled",
    stripe_event_id: `sub_deleted_${subscription.id}_${Date.now()}`,
    metadata: {
      subscription_id: subscription.id,
    },
  });

  logger.info(`Subscription ${subscription.id} marked as canceled`);
}

/**
 * Handle invoice.paid - subscription renewal
 * @param invoice
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
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

  // Get the subscription to find user
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!sub) {
    logger.warn(
      `Subscription ${subscriptionId} not found for invoice ${invoice.id}`
    );
    return;
  }

  // Update subscription period
  const subscription = (await stripe.subscriptions.retrieve(
    subscriptionId
  )) as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toISOString()
        : null,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Log the renewal
  await supabase.from("subscription_events").insert({
    user_id: sub.user_id,
    event_type: "subscription.renewed",
    stripe_event_id: `invoice_${invoice.id}`,
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
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
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

  // Get the subscription to find user
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
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

  // Log the failure
  await supabase.from("subscription_events").insert({
    user_id: sub.user_id,
    event_type: "subscription.payment_failed",
    stripe_event_id: `invoice_failed_${invoice.id}`,
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
