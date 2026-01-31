/**
 * Stripe Checkout API Route
 * Creates checkout sessions for subscription purchases
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

import { logger } from '@/lib/logger'
import { stripe, getStripePriceId, CHECKOUT_CONFIG, getProductFromPriceId } from '@/lib/stripe'
import { createServerComponentClient } from '@/lib/supabase/client-factory'
import { createAdminClient } from '@/lib/supabase/admin'

import type { CreateCheckoutRequest, CreateCheckoutResponse } from '@/lib/types/entities'

// =============================================================================
// POST /api/checkout - Create a Stripe Checkout Session
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = (await request.json()) as CreateCheckoutRequest
    const { tierId, successUrl, cancelUrl } = body

    if (!tierId) {
      return NextResponse.json(
        { error: 'Missing required field: tierId' },
        { status: 400 }
      )
    }

    // Get Stripe Price ID for the tier
    const stripePriceId = getStripePriceId(tierId)
    if (!stripePriceId) {
      logger.error(`No Stripe Price ID configured for tier: ${tierId}`)
      return NextResponse.json(
        { error: 'Invalid tier ID or tier not configured for payments' },
        { status: 400 }
      )
    }

    // Get product info from price ID
    const productInfo = getProductFromPriceId(stripePriceId)
    if (!productInfo) {
      logger.error(`No product info found for price ID: ${stripePriceId}`)
      return NextResponse.json(
        { error: 'Product configuration error' },
        { status: 500 }
      )
    }

    // Get current user (optional - can checkout as guest)
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()

    let stripeCustomerId: string | undefined

    // If user is logged in, get or create their Stripe customer
    if (user) {
      const adminClient = createAdminClient()
      
      // Check if user has a profile with Stripe customer ID
      const { data: profile } = await adminClient
        .from('user_profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (profile?.stripe_customer_id) {
        stripeCustomerId = profile.stripe_customer_id
      } else {
        // Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            supabase_user_id: user.id,
          },
        })
        stripeCustomerId = customer.id

        // Save customer ID to profile (upsert in case profile doesn't exist)
        await adminClient
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email!,
            stripe_customer_id: customer.id,
          }, {
            onConflict: 'id',
          })
      }
    }

    // Build success and cancel URLs
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const productSlug = productInfo.productId // e.g., 'helvety-pdf'
    
    const resolvedSuccessUrl = successUrl 
      ? `${baseUrl}${successUrl}`
      : `${baseUrl}${CHECKOUT_CONFIG.successUrl.replace('{slug}', productSlug)}`
    
    const resolvedCancelUrl = cancelUrl
      ? `${baseUrl}${cancelUrl}`
      : `${baseUrl}${CHECKOUT_CONFIG.cancelUrl.replace('{slug}', productSlug)}`

    // Create checkout session based on product type
    const isSubscription = productInfo.type === 'subscription'
    
    const metadata: Stripe.MetadataParam = {
      tier_id: tierId,
      product_id: productInfo.productId,
    }
    
    if (user) {
      metadata.supabase_user_id = user.id
    }

    let session: Stripe.Checkout.Session

    if (isSubscription) {
      // Subscription checkout
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'subscription',
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${resolvedSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: resolvedCancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        subscription_data: { metadata },
      }

      if (stripeCustomerId) {
        params.customer = stripeCustomerId
        // Required for tax_id_collection with existing customers
        params.customer_update = {
          name: 'auto',
          address: 'auto',
        }
      } else if (user?.email) {
        params.customer_email = user.email
      }

      session = await stripe.checkout.sessions.create(params)
    } else {
      // One-time payment checkout
      const params: Stripe.Checkout.SessionCreateParams = {
        mode: 'payment',
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${resolvedSuccessUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: resolvedCancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        payment_intent_data: { metadata },
      }

      if (stripeCustomerId) {
        params.customer = stripeCustomerId
        // Required for tax_id_collection with existing customers
        params.customer_update = {
          name: 'auto',
          address: 'auto',
        }
      } else if (user?.email) {
        params.customer_email = user.email
      }

      session = await stripe.checkout.sessions.create(params)
    }

    if (!session.url) {
      logger.error('Stripe session created without URL')
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    logger.info(`Checkout session created: ${session.id} for tier: ${tierId}`)

    const response: CreateCheckoutResponse = {
      checkoutUrl: session.url,
      sessionId: session.id,
    }

    return NextResponse.json(response)
  } catch (error) {
    logger.error('Error creating checkout session:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
