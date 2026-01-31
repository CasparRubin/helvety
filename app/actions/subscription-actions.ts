'use server'

/**
 * Server actions for subscription management
 * Query and manage user subscriptions
 */

import { logger } from '@/lib/logger'
import { createServerComponentClient } from '@/lib/supabase/client-factory'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

import type { 
  ActionResponse, 
  Subscription, 
  Purchase,
  UserSubscriptionSummary,
  SubscriptionStatus 
} from '@/lib/types/entities'

// =============================================================================
// SUBSCRIPTION QUERIES
// =============================================================================

/**
 * Get all subscriptions for the current user
 */
export async function getUserSubscriptions(): Promise<ActionResponse<Subscription[]>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching subscriptions:', error)
      return { success: false, error: 'Failed to fetch subscriptions' }
    }

    return { success: true, data: data as Subscription[] }
  } catch (error) {
    logger.error('Error in getUserSubscriptions:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get all purchases for the current user
 */
export async function getUserPurchases(): Promise<ActionResponse<Purchase[]>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching purchases:', error)
      return { success: false, error: 'Failed to fetch purchases' }
    }

    return { success: true, data: data as Purchase[] }
  } catch (error) {
    logger.error('Error in getUserPurchases:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Check if user has an active subscription for a specific product
 */
export async function hasActiveSubscription(
  productId: string
): Promise<ActionResponse<boolean>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: true, data: false }
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking subscription:', error)
      return { success: false, error: 'Failed to check subscription' }
    }

    // Check if subscription exists and is not expired
    const isActive = data !== null && (
      !data.current_period_end || 
      new Date(data.current_period_end) > new Date()
    )

    return { success: true, data: isActive }
  } catch (error) {
    logger.error('Error in hasActiveSubscription:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's subscription summary (all active subscriptions and purchases)
 */
export async function getUserSubscriptionSummary(): Promise<ActionResponse<UserSubscriptionSummary>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('product_id, tier_id, status, current_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])

    if (subError) {
      logger.error('Error fetching subscriptions:', subError)
      return { success: false, error: 'Failed to fetch subscriptions' }
    }

    // Get purchases
    const { data: purchases, error: purchaseError } = await supabase
      .from('purchases')
      .select('product_id, tier_id, created_at')
      .eq('user_id', user.id)

    if (purchaseError) {
      logger.error('Error fetching purchases:', purchaseError)
      return { success: false, error: 'Failed to fetch purchases' }
    }

    const summary: UserSubscriptionSummary = {
      userId: user.id,
      activeSubscriptions: (subscriptions || []).map(sub => ({
        productId: sub.product_id,
        tierId: sub.tier_id,
        status: sub.status as SubscriptionStatus,
        currentPeriodEnd: sub.current_period_end,
      })),
      purchases: (purchases || []).map(p => ({
        productId: p.product_id,
        tierId: p.tier_id,
        purchasedAt: p.created_at,
      })),
    }

    return { success: true, data: summary }
  } catch (error) {
    logger.error('Error in getUserSubscriptionSummary:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// =============================================================================
// SUBSCRIPTION MANAGEMENT
// =============================================================================

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(
  subscriptionId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user owns this subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }

    if (!subscription.stripe_subscription_id) {
      return { success: false, error: 'Invalid subscription' }
    }

    // Cancel in Stripe (at period end)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    // Update local record
    const adminClient = createAdminClient()
    await adminClient
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('id', subscriptionId)

    logger.info(`Subscription ${subscriptionId} scheduled for cancellation`)

    return { success: true }
  } catch (error) {
    logger.error('Error canceling subscription:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

/**
 * Reactivate a subscription that was scheduled for cancellation
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify user owns this subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id, cancel_at_period_end')
      .eq('id', subscriptionId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !subscription) {
      return { success: false, error: 'Subscription not found' }
    }

    if (!subscription.stripe_subscription_id) {
      return { success: false, error: 'Invalid subscription' }
    }

    if (!subscription.cancel_at_period_end) {
      return { success: false, error: 'Subscription is not scheduled for cancellation' }
    }

    // Reactivate in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: false,
    })

    // Update local record
    const adminClient = createAdminClient()
    await adminClient
      .from('subscriptions')
      .update({ cancel_at_period_end: false })
      .eq('id', subscriptionId)

    logger.info(`Subscription ${subscriptionId} reactivated`)

    return { success: true }
  } catch (error) {
    logger.error('Error reactivating subscription:', error)
    return { success: false, error: 'Failed to reactivate subscription' }
  }
}

/**
 * Get Stripe Customer Portal URL for managing subscription
 */
export async function getCustomerPortalUrl(
  returnUrl?: string
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.stripe_customer_id) {
      return { success: false, error: 'No billing account found' }
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account`,
    })

    return { success: true, data: portalSession.url }
  } catch (error) {
    logger.error('Error creating portal session:', error)
    return { success: false, error: 'Failed to create billing portal session' }
  }
}
