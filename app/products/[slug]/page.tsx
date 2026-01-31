'use client'

/**
 * Product detail page
 * Displays full product information with pricing tiers
 * Integrates with Stripe Checkout for subscription purchases
 */

import {
  FileText,
  LayoutGrid,
  Cloud,
  Download,
  Package,
  Check,
  ChevronDown,
  Info,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { useParams, notFound, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { CommandBar } from '@/components/command-bar'
import {
  ProductBadge,
  StatusBadge,
  FeatureList,
  MediaGallery,
} from '@/components/products'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getProductBySlug } from '@/lib/data/products'
import { isSoftwareProduct } from '@/lib/types/products'
import { cn } from '@/lib/utils'

import type { PricingTier } from '@/lib/types/products'
import type { CreateCheckoutResponse } from '@/lib/types/entities'


// Icon mapping for products
const iconMap: Record<string, LucideIcon> = {
  FileText,
  LayoutGrid,
  Cloud,
  Download,
  Package,
}

export default function ProductDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const product = getProductBySlug(slug)

  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)

  // Handle checkout success/cancelled state from URL params
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    
    if (checkoutStatus === 'success') {
      toast.success('Payment successful! Thank you for your purchase.', {
        description: 'Your subscription is now active.',
        duration: 5000,
      })
      // Clean up URL
      window.history.replaceState({}, '', `/products/${slug}`)
    } else if (checkoutStatus === 'cancelled') {
      toast.info('Checkout cancelled', {
        description: 'No payment was made. You can try again anytime.',
        duration: 4000,
      })
      // Clean up URL
      window.history.replaceState({}, '', `/products/${slug}`)
    }
  }, [searchParams, slug])

  if (!product) {
    notFound()
  }

  const Icon = product.icon ? iconMap[product.icon] ?? FileText : FileText

  // Get monthly tiers only (filter out yearly tiers)
  const monthlyTiers = product.pricing.tiers.filter(
    (tier) => tier.interval !== 'yearly'
  )

  const handleTierSelect = (tier: PricingTier) => {
    setSelectedTier(tier)
  }

  return (
    <>
      <CommandBar
        variant="product-detail"
        productName={product.name}
        links={product.links}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Product Header */}
        <div className="mb-12">
          <div className="flex items-start gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-8" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {product.name}
                </h1>
                <ProductBadge type={product.type} />
                {product.status !== 'available' && (
                  <StatusBadge status={product.status} />
                )}
              </div>
              <p className="max-w-2xl text-lg text-muted-foreground">
                {product.shortDescription}
              </p>
            </div>
          </div>
        </div>

        {/* Two-column layout: Main Content + Features Sidebar */}
        <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Description */}
            <section>
              <h2 className="mb-4 text-xl font-semibold">About</h2>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                {product.description.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>

            {/* Pricing Section */}
            <Separator />
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Pricing</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the plan that works best for you
                </p>
              </div>
              <div className="flex flex-wrap gap-6">
                {monthlyTiers.map((tier) => (
                  <PricingCard
                    key={tier.id}
                    tier={tier}
                    selected={selectedTier?.id === tier.id}
                    onSelect={() => handleTierSelect(tier)}
                    productSlug={slug}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar - Features & Requirements */}
          <div className="space-y-6">
            <div className="sticky top-32 z-10 space-y-6 rounded-xl border bg-card p-6 shadow-sm">
              {/* Features */}
              <section>
                <h2 className="mb-4 text-lg font-semibold">Features</h2>
                <FeatureList features={product.features} />
              </section>

              {/* System Requirements */}
              {isSoftwareProduct(product) && product.software?.requirements && (
                <>
                  <Separator />
                  <section>
                    <h2 className="mb-4 text-lg font-semibold">System Requirements</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {product.software.requirements.map((req: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>

            {/* Media (Screencaptures & Screenshots) - Collapsible */}
            {product.media && (product.media.screencaptures?.length || product.media.screenshots?.length) && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between hover:opacity-80 transition-opacity">
                    <h2 className="text-lg font-semibold">Media</h2>
                    <ChevronDown className="size-5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-4 space-y-6">
                      {/* Screencaptures */}
                      {product.media.screencaptures && product.media.screencaptures.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Screencaptures</h3>
                          <MediaGallery items={product.media.screencaptures} />
                        </div>
                      )}
                      {/* Screenshots */}
                      {product.media.screenshots && product.media.screenshots.length > 0 && (
                        <div>
                          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Screenshots</h3>
                          <MediaGallery items={product.media.screenshots} />
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

interface PricingCardProps {
  tier: PricingTier
  selected: boolean
  onSelect: () => void
  productSlug: string
}

// Tier IDs that have Stripe checkout enabled
const CHECKOUT_ENABLED_TIERS = [
  'helvety-pdf-pro-monthly',
  // Add more tier IDs here as they are configured in Stripe
]

function PricingCard({ tier, selected, onSelect, productSlug }: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isRecurring = tier.interval === 'monthly' || tier.interval === 'yearly'
  const intervalLabel = isRecurring ? '/month' : tier.interval === 'one-time' ? 'one-time' : ''
  // Check checkout eligibility based on tier ID (stable between server/client)
  const hasPaidCheckout = !tier.isFree && CHECKOUT_ENABLED_TIERS.includes(tier.id)

  const formatPrice = (cents: number) => {
    if (cents === 0) return 'Free'
    return `CHF ${(cents / 100).toFixed(2).replace('.00', '')}`
  }

  /**
   * Handle checkout for paid tiers via Stripe
   */
  const handleCheckout = async () => {
    if (tier.isFree || !hasPaidCheckout) {
      onSelect()
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tierId: tier.id,
          successUrl: `/products/${productSlug}?checkout=success`,
          cancelUrl: `/products/${productSlug}?checkout=cancelled`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data: CreateCheckoutResponse = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to start checkout. Please try again.'
      )
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "relative flex w-80 flex-col rounded-2xl border bg-card px-6 py-8 text-center transition-all duration-200",
        selected && "border-primary ring-2 ring-primary",
        tier.highlighted && !selected && "border-primary shadow-xl",
        !tier.highlighted && !selected && "hover:border-primary/50 hover:shadow-lg"
      )}
    >
      {/* Popular badge */}
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md">
            Popular
          </span>
        </div>
      )}

      {/* Tier name */}
      <h3 className="text-xl font-bold">{tier.name}</h3>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold tracking-tight">
            {formatPrice(tier.price)}
          </span>
        </div>
        {intervalLabel && tier.price > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">{intervalLabel}</p>
        )}
      </div>

      {/* Divider */}
      <Separator className="my-5" />

      {/* Features */}
      <ul className="flex-1 space-y-3 text-left">
        {tier.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-green-500" />
            <span className="text-sm">{feature}</span>
            {feature === 'Only limited by your device' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="mt-0.5 size-4 shrink-0 cursor-help text-muted-foreground hover:text-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-left">
                    <p className="text-sm">
                      Helvety PDF processes everything directly in your browser. 
                      This means performance depends on your device&apos;s RAM and CPU. 
                      The Pro plan has no artificial limits. Your device&apos;s hardware 
                      capabilities will naturally determine what&apos;s possible.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </li>
        ))}
      </ul>

      {/* Limits info */}
      {tier.limits && Object.keys(tier.limits).length > 0 && (
        <div className="mt-5 rounded-lg bg-muted/50 p-3 text-left">
          <ul className="space-y-1 text-xs text-muted-foreground">
            {tier.limits.maxFiles !== undefined && (
              <li>
                {tier.limits.maxFiles === -1
                  ? '✓ Unlimited files'
                  : `Up to ${tier.limits.maxFiles} files`}
              </li>
            )}
            {tier.limits.maxFileSize && (
              <li>Max file size: {tier.limits.maxFileSize}</li>
            )}
          </ul>
        </div>
      )}

      {/* CTA - Only show for paid tiers */}
      {!tier.isFree && (
        <Button
          className="mt-6 w-full"
          variant={tier.highlighted ? 'default' : 'outline'}
          onClick={handleCheckout}
          disabled={isLoading || !hasPaidCheckout}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Processing...
            </>
          ) : hasPaidCheckout ? (
            'Subscribe Now'
          ) : (
            'Coming Soon'
          )}
        </Button>
      )}
    </div>
  )
}
