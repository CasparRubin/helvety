/**
 * Product type definitions for helvety-store
 * Flexible system supporting SaaS, software, and physical products
 */

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Type of product being sold
 * - saas: Subscription-based software as a service
 * - software: One-time purchase downloadable software
 * - physical: Physical goods that require shipping
 */
export type ProductType = 'saas' | 'software' | 'physical'

/**
 * Billing interval for pricing
 * - monthly: Recurring monthly charge
 * - yearly: Recurring yearly charge (often discounted)
 * - lifetime: One-time purchase with perpetual access
 * - one-time: Single purchase (for software/physical)
 */
export type BillingInterval = 'monthly' | 'yearly' | 'lifetime' | 'one-time'

/**
 * Product category for filtering and organization
 */
export type ProductCategory =
  | 'productivity'
  | 'developer-tools'
  | 'utilities'
  | 'integrations'
  | 'other'

/**
 * Product availability status
 */
export type ProductStatus = 'available' | 'coming-soon' | 'discontinued'

// =============================================================================
// PRICING TYPES
// =============================================================================

/**
 * A single pricing tier for a product
 */
export interface PricingTier {
  /** Unique identifier for this tier */
  id: string
  /** Display name (e.g., "Free", "Pro", "Enterprise") */
  name: string
  /** Price in smallest currency unit (cents for USD/EUR) */
  price: number
  /** ISO 4217 currency code */
  currency: string
  /** Billing interval */
  interval: BillingInterval
  /** Features included in this tier */
  features: string[]
  /** Whether this tier should be visually highlighted as recommended */
  highlighted?: boolean
  /** Stripe Price ID for checkout (populated when Stripe is integrated) */
  stripePriceId?: string
  /** Maximum usage limits if applicable */
  limits?: Record<string, number | string>
  /** Whether this is a free tier */
  isFree?: boolean
}

/**
 * Pricing configuration for a product
 */
export interface ProductPricing {
  /** Available pricing tiers */
  tiers: PricingTier[]
  /** Whether the product has a free tier */
  hasFreeTier: boolean
  /** Whether yearly pricing is available (typically with discount) */
  hasYearlyPricing: boolean
  /** Discount percentage for yearly vs monthly (e.g., 20 for 20% off) */
  yearlyDiscountPercent?: number
}

// =============================================================================
// MEDIA TYPES
// =============================================================================

/**
 * A single media item (image, gif, or video)
 */
export interface MediaItem {
  /** URL to the media file */
  src: string
  /** Alt text for accessibility */
  alt: string
  /** Type of media */
  type: 'image' | 'gif' | 'video'
}

/**
 * Product media configuration
 */
export interface ProductMedia {
  /** Screenshot images */
  screenshots?: MediaItem[]
  /** Screen recordings (GIFs or videos) */
  screencaptures?: MediaItem[]
}

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Base product information
 */
export interface Product {
  /** Unique identifier */
  id: string
  /** URL-friendly slug */
  slug: string
  /** Display name */
  name: string
  /** Short description for cards/listings */
  shortDescription: string
  /** Full description with details */
  description: string
  /** Product type */
  type: ProductType
  /** Category for filtering */
  category: ProductCategory
  /** Current availability status */
  status: ProductStatus
  /** Icon identifier (lucide icon name or custom) */
  icon?: string
  /** Product image URL */
  image?: string
  /** Hero/banner image URL */
  heroImage?: string
  /** Key features list */
  features: string[]
  /** Pricing configuration */
  pricing: ProductPricing
  /** External links */
  links?: ProductLinks
  /** Media assets (screenshots, screencaptures) */
  media?: ProductMedia
  /** Additional metadata */
  metadata?: ProductMetadata
  /** Creation timestamp */
  createdAt?: string
  /** Last update timestamp */
  updatedAt?: string
}

/**
 * External links for a product
 */
export interface ProductLinks {
  /** Link to product website/landing page */
  website?: string
  /** Link to documentation */
  docs?: string
  /** Link to demo/trial */
  demo?: string
  /** Link to GitHub/source code */
  github?: string
  /** Link to support/help */
  support?: string
}

/**
 * Additional product metadata
 */
export interface ProductMetadata {
  /** Target audience/use case */
  targetAudience?: string[]
  /** Supported platforms */
  platforms?: string[]
  /** Version number */
  version?: string
  /** Release date */
  releaseDate?: string
  /** SEO keywords */
  keywords?: string[]
  /** Whether the product is featured */
  featured?: boolean
  /** Sort order for display */
  sortOrder?: number
}

// =============================================================================
// PHYSICAL PRODUCT EXTENSIONS
// =============================================================================

/**
 * Additional fields for physical products
 */
export interface PhysicalProductDetails {
  /** Weight in grams */
  weight?: number
  /** Dimensions in cm */
  dimensions?: {
    length: number
    width: number
    height: number
  }
  /** Available stock quantity */
  stockQuantity?: number
  /** Whether product is in stock */
  inStock: boolean
  /** Shipping information */
  shipping?: {
    freeShipping: boolean
    estimatedDays: number
    restrictions?: string[]
  }
}

/**
 * Physical product type extending base product
 */
export interface PhysicalProduct extends Product {
  type: 'physical'
  physical: PhysicalProductDetails
}

// =============================================================================
// SOFTWARE PRODUCT EXTENSIONS
// =============================================================================

/**
 * Additional fields for downloadable software
 */
export interface SoftwareProductDetails {
  /** Download URL (populated after purchase) */
  downloadUrl?: string
  /** File size in bytes */
  fileSize?: number
  /** File format/type */
  fileFormat?: string
  /** System requirements */
  requirements?: string[]
  /** License type */
  licenseType?: 'perpetual' | 'subscription' | 'per-seat'
}

/**
 * Software product type extending base product
 */
export interface SoftwareProduct extends Product {
  type: 'software'
  software: SoftwareProductDetails
}

// =============================================================================
// SAAS PRODUCT EXTENSIONS
// =============================================================================

/**
 * Additional fields for SaaS products
 */
export interface SaaSProductDetails {
  /** URL to access the application */
  appUrl?: string
  /** Trial period in days (0 = no trial) */
  trialDays?: number
  /** Whether credit card is required for trial */
  trialRequiresCard?: boolean
  /** API access included */
  hasApiAccess?: boolean
}

/**
 * SaaS product type extending base product
 */
export interface SaaSProduct extends Product {
  type: 'saas'
  saas: SaaSProductDetails
}

// =============================================================================
// UNION TYPES
// =============================================================================

/**
 * Union type for all product variants
 */
export type AnyProduct = Product | PhysicalProduct | SoftwareProduct | SaaSProduct

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

/**
 * Filter options for product listings
 */
export interface ProductFilters {
  /** Filter by product type */
  type?: ProductType | 'all'
  /** Filter by category */
  category?: ProductCategory | 'all'
  /** Filter by status */
  status?: ProductStatus
  /** Search query */
  search?: string
  /** Only show featured products */
  featured?: boolean
  /** Sort field */
  sortBy?: 'name' | 'price' | 'createdAt' | 'sortOrder'
  /** Sort direction */
  sortOrder?: 'asc' | 'desc'
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if product is a physical product
 */
export function isPhysicalProduct(product: Product): product is PhysicalProduct {
  return product.type === 'physical' && 'physical' in product
}

/**
 * Type guard to check if product is a software product
 */
export function isSoftwareProduct(product: Product): product is SoftwareProduct {
  return product.type === 'software' && 'software' in product
}

/**
 * Type guard to check if product is a SaaS product
 */
export function isSaaSProduct(product: Product): product is SaaSProduct {
  return product.type === 'saas' && 'saas' in product
}
