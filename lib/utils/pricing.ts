/**
 * Pricing utilities for formatting and calculating prices
 */

import type {
  BillingInterval,
  PricingTier,
  ProductPricing,
} from "@/lib/types/products";

// =============================================================================
// CURRENCY FORMATTING
// =============================================================================

/**
 * Currency configuration
 */
interface CurrencyConfig {
  locale: string;
  symbol: string;
  position: "prefix" | "suffix";
}

/**
 * Supported currencies
 */
const currencies: Record<string, CurrencyConfig> = {
  EUR: { locale: "de-DE", symbol: "€", position: "suffix" },
  USD: { locale: "en-US", symbol: "$", position: "prefix" },
  GBP: { locale: "en-GB", symbol: "£", position: "prefix" },
  CHF: { locale: "de-CH", symbol: "CHF", position: "suffix" },
};

/**
 * Format a price for display
 * @param priceInCents - Price in smallest currency unit (cents)
 * @param currency - ISO 4217 currency code
 * @param options - Formatting options
 * @param options.showCents
 * @param options.compact
 */
export function formatPrice(
  priceInCents: number,
  currency: string = "CHF",
  options: {
    showCents?: boolean;
    compact?: boolean;
  } = {}
): string {
  const { showCents = true, compact = false } = options;

  // Handle free
  if (priceInCents === 0) {
    return "Free";
  }

  // Default to CHF configuration
  const defaultConfig: CurrencyConfig = {
    locale: "de-CH",
    symbol: "CHF",
    position: "suffix",
  };
  const config: CurrencyConfig = currencies[currency] ?? defaultConfig;
  const priceInUnits = priceInCents / 100;

  // Compact formatting for large numbers
  if (compact && priceInUnits >= 1000) {
    const formatted = new Intl.NumberFormat(config.locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(priceInUnits);
    return config.position === "prefix"
      ? `${config.symbol}${formatted}`
      : `${formatted} ${config.symbol}`;
  }

  // Standard formatting
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(priceInUnits);

  return config.position === "prefix"
    ? `${config.symbol}${formatted}`
    : `${formatted} ${config.symbol}`;
}

/**
 * Format price with interval (e.g., "€4.99/month")
 * @param priceInCents
 * @param currency
 * @param interval
 */
export function formatPriceWithInterval(
  priceInCents: number,
  currency: string,
  interval: BillingInterval
): string {
  const price = formatPrice(priceInCents, currency);

  if (priceInCents === 0) {
    return "Free";
  }

  const intervalLabels: Record<BillingInterval, string> = {
    monthly: "/month",
    yearly: "/year",
    lifetime: " one-time",
    "one-time": " one-time",
  };

  return `${price}${intervalLabels[interval]}`;
}

// =============================================================================
// PRICING CALCULATIONS
// =============================================================================

/**
 * Calculate monthly equivalent price for yearly subscriptions
 * @param yearlyPriceInCents
 */
export function getMonthlyEquivalent(yearlyPriceInCents: number): number {
  return Math.round(yearlyPriceInCents / 12);
}

/**
 * Calculate savings percentage between monthly and yearly
 * @param monthlyPriceInCents
 * @param yearlyPriceInCents
 */
export function calculateYearlySavings(
  monthlyPriceInCents: number,
  yearlyPriceInCents: number
): number {
  const monthlyTotal = monthlyPriceInCents * 12;
  const savings = ((monthlyTotal - yearlyPriceInCents) / monthlyTotal) * 100;
  return Math.round(savings);
}

/**
 * Get the starting price for a product (lowest non-free tier)
 * @param pricing
 */
export function getStartingPrice(pricing: ProductPricing): PricingTier | null {
  const nonFreeTiers = pricing.tiers.filter(
    (tier) => !tier.isFree && tier.price > 0
  );

  if (nonFreeTiers.length === 0) {
    return null;
  }

  return nonFreeTiers.reduce((lowest, tier) => {
    // Compare prices normalized to monthly
    const lowestMonthly = normalizeToMonthly(lowest.price, lowest.interval);
    const tierMonthly = normalizeToMonthly(tier.price, tier.interval);
    return tierMonthly < lowestMonthly ? tier : lowest;
  });
}

/**
 * Normalize price to monthly equivalent
 * @param priceInCents
 * @param interval
 */
function normalizeToMonthly(
  priceInCents: number,
  interval: BillingInterval
): number {
  switch (interval) {
    case "monthly":
      return priceInCents;
    case "yearly":
      return Math.round(priceInCents / 12);
    case "lifetime":
    case "one-time":
      // For one-time, assume 24 month value for comparison
      return Math.round(priceInCents / 24);
    default:
      return priceInCents;
  }
}

// =============================================================================
// TIER HELPERS
// =============================================================================

/**
 * Get tiers filtered by billing interval
 * @param pricing
 * @param interval
 */
export function getTiersByInterval(
  pricing: ProductPricing,
  interval: "monthly" | "yearly"
): PricingTier[] {
  return pricing.tiers.filter((tier) => {
    // Always include free tiers
    if (tier.isFree) return true;
    // Filter by interval
    return tier.interval === interval;
  });
}

/**
 * Get the free tier if available
 * @param pricing
 */
export function getFreeTier(pricing: ProductPricing): PricingTier | undefined {
  return pricing.tiers.find((tier) => tier.isFree === true || tier.price === 0);
}

/**
 * Get the highlighted/recommended tier
 * @param tiers
 */
export function getHighlightedTier(
  tiers: PricingTier[]
): PricingTier | undefined {
  return tiers.find((tier) => tier.highlighted);
}

/**
 * Check if a tier is a subscription (recurring)
 * @param tier
 */
export function isSubscriptionTier(tier: PricingTier): boolean {
  return tier.interval === "monthly" || tier.interval === "yearly";
}

/**
 * Check if a tier is a one-time purchase
 * @param tier
 */
export function isOneTimeTier(tier: PricingTier): boolean {
  return tier.interval === "one-time" || tier.interval === "lifetime";
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get human-readable interval label
 * @param interval
 */
export function getIntervalLabel(interval: BillingInterval): string {
  const labels: Record<BillingInterval, string> = {
    monthly: "Monthly",
    yearly: "Yearly",
    lifetime: "Lifetime",
    "one-time": "One-time",
  };
  return labels[interval];
}

/**
 * Get billing interval short label
 * @param interval
 */
export function getIntervalShortLabel(interval: BillingInterval): string {
  const labels: Record<BillingInterval, string> = {
    monthly: "mo",
    yearly: "yr",
    lifetime: "",
    "one-time": "",
  };
  return labels[interval];
}

/**
 * Format price as "starting from" display
 * @param pricing
 * @param currency
 */
export function formatStartingFrom(
  pricing: ProductPricing,
  currency: string = "CHF"
): string {
  if (pricing.hasFreeTier) {
    return "Free";
  }

  const startingTier = getStartingPrice(pricing);
  if (!startingTier) {
    return "Contact us";
  }

  return `From ${formatPrice(startingTier.price, currency)}`;
}
