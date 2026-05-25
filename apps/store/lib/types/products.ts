/**
 * Product type definitions for the Store app (@helvety/store)
 * Flexible system supporting SaaS, software, and physical products
 */

import type { StaticImageData } from "next/image";

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Type of product being sold
 * - saas: Web-delivered application
 * - software: Downloadable software package (public or access-controlled)
 * - physical: Physical goods that require shipping
 */
export type ProductType = "saas" | "software" | "physical";

/**
 * Billing interval for pricing
 * - one-time: Single free-access descriptor for current model
 */
type BillingInterval = "one-time";

/**
 * Product category for filtering and organization
 */
type ProductCategory =
  | "productivity"
  | "developer-tools"
  | "utilities"
  | "integrations"
  | "other";

/**
 * Product availability status
 */
export type ProductStatus = "available" | "coming-soon" | "discontinued";

// =============================================================================
// PRICING TYPES
// =============================================================================

/**
 * A single pricing tier for a product
 */
interface PricingTier {
  /** Unique identifier for this tier */
  id: string;
  /** Display name (e.g., "Free", "Pro", "Enterprise") */
  name: string;
  /** Price in smallest currency unit (Rappen for CHF) */
  price: number;
  /** ISO 4217 currency code */
  currency: string;
  /** Billing interval */
  interval: BillingInterval;
  /** Features included in this tier */
  features: string[];
  /** Whether this tier should be visually highlighted as recommended */
  highlighted?: boolean;
  /** Maximum usage limits if applicable */
  limits?: Record<string, number | string>;
  /** Whether this is a free tier */
  isFree?: boolean;
}

/**
 * Pricing configuration for a product (catalog metadata; Store UI does not
 * format or display tier prices—use tiers for free-tier flags and copy only).
 */
interface ProductPricing {
  /** Available pricing tiers */
  tiers: PricingTier[];
  /** Whether the product has a free tier */
  hasFreeTier: boolean;
}

// =============================================================================
// MEDIA TYPES
// =============================================================================

/**
 * A single media item (image, gif, or video)
 */
interface MediaItem {
  /** URL to the media file */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Type of media */
  type: "image" | "gif" | "video";
}

/**
 * Product media configuration
 */
interface ProductMedia {
  /** Screenshot images */
  screenshots?: MediaItem[];
  /** Screen recordings (GIFs or videos) */
  screencaptures?: MediaItem[];
}

// =============================================================================
// PRODUCT LONG-FORM COPY (About section)
// =============================================================================

/** One block inside the product detail "About" section. */
export type ProductDescriptionSection =
  | { heading: string; kind: "paragraph"; body: string }
  | { heading: string; kind: "bullets"; items: string[] };

/** Structured long-form copy for the product detail About panel. */
interface ProductDescription {
  intro: string;
  sections?: ProductDescriptionSection[];
}

/**
 * Flatten {@link ProductDescription} for search and plain-text consumers.
 * @param description
 */
export function productDescriptionToPlainText(
  description: ProductDescription
): string {
  const parts: string[] = [description.intro];
  for (const section of description.sections ?? []) {
    parts.push(section.heading);
    if (section.kind === "paragraph") {
      parts.push(section.body);
    } else {
      parts.push(...section.items);
    }
  }
  return parts.join(" ");
}

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * Base product information
 */
export interface Product {
  /** Unique identifier */
  id: string;
  /** URL-friendly slug */
  slug: string;
  /** Display name */
  name: string;
  /** Short description for cards/listings */
  shortDescription: string;
  /** Full structured copy for the product detail About section */
  description: ProductDescription;
  /** Product type */
  type: ProductType;
  /** Category for filtering */
  category: ProductCategory;
  /** Current availability status */
  status: ProductStatus;
  /** Product image URL */
  image?: string | StaticImageData;
  /** Artwork credit; rendered as a frosted “Art by …” badge on cards and detail heroes */
  artist?: string;
  /** Hero/banner image URL */
  heroImage?: string | StaticImageData;
  /** Key features list */
  features: string[];
  /** Pricing configuration */
  pricing: ProductPricing;
  /** External links */
  links?: ProductLinks;
  /** Media assets (screenshots, screencaptures) */
  media?: ProductMedia;
  /** Additional metadata */
  metadata?: ProductMetadata;
  /** Creation timestamp */
  createdAt?: string;
  /** Last update timestamp */
  updatedAt?: string;
}

/**
 * External links for a product
 */
interface ProductLinks {
  /** Link to product website/landing page */
  website?: string;
  /** Link to documentation */
  docs?: string;
  /** Link to demo/trial */
  demo?: string;
  /** Link to GitHub/source code */
  github?: string;
  /** Link to Chrome Web Store listing (browser extensions) */
  chromeWebStore?: string;
  /** Link to support/help */
  support?: string;
}

/**
 * Additional product metadata
 */
interface ProductMetadata {
  /** Target audience/use case */
  targetAudience?: string[];
  /** Supported platforms */
  platforms?: string[];
  /** Version number */
  version?: string;
  /**
   * Release date for catalog sort (newest first). Use calendar ISO `YYYY-MM-DD`
   * (UTC semantics when formatting for display).
   */
  releaseDate?: string;
  /** SEO keywords */
  keywords?: string[];
  /** Whether the product is featured */
  featured?: boolean;
  /** Sort order for display */
  sortOrder?: number;
}

// =============================================================================
// SOFTWARE PRODUCT EXTENSIONS
// =============================================================================

/** One step in the product installation guide (software products). */
interface SoftwareInstallationStep {
  title: string;
  description: string;
}

/**
 * Additional fields for downloadable software
 */
interface SoftwareProductDetails {
  /** Download URL (resolved when download is available for this product) */
  downloadUrl?: string;
  /** File size in bytes */
  fileSize?: number;
  /** File format/type */
  fileFormat?: string;
  /** System requirements */
  requirements?: string[];
  /** License type */
  licenseType?: "free" | "perpetual";
  /**
   * When set, the store serves downloads at
   * `/store/api/packages/{publicPackageId}/download` (must match a key in `apps/store/lib/packages/config.ts`).
   */
  publicPackageId?: string;
  /** Step-by-step installation copy for the product detail page */
  installationSteps?: SoftwareInstallationStep[];
}

/**
 * Software product type extending base product
 */
export interface SoftwareProduct extends Product {
  type: "software";
  software: SoftwareProductDetails;
}

// =============================================================================
// SAAS PRODUCT EXTENSIONS
// =============================================================================

/**
 * Additional fields for SaaS products
 */
interface SaaSProductDetails {
  /** URL to access the application */
  appUrl?: string;
  /** API access included */
  hasApiAccess?: boolean;
}

/**
 * SaaS product type extending base product
 */
export interface SaaSProduct extends Product {
  type: "saas";
  saas: SaaSProductDetails;
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

/**
 * Filter options for product listings
 */
export interface ProductFilters {
  /** Filter by product type */
  type?: ProductType | "all";
  /** Filter by category */
  category?: ProductCategory | "all";
  /** Filter by status */
  status?: ProductStatus;
  /** Search query */
  search?: string;
  /** Only show featured products */
  featured?: boolean;
  /** Sort field */
  sortBy?: "name" | "price" | "releaseDate";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if product is a software product
 * @param product
 */
export function isSoftwareProduct(
  product: Product
): product is SoftwareProduct {
  return product.type === "software" && "software" in product;
}

/**
 * Type guard to check if product is a SaaS product
 * @param product
 */
export function isSaaSProduct(product: Product): product is SaaSProduct {
  return product.type === "saas" && "saas" in product;
}
