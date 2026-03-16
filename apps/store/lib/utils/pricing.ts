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
 * Format a base price string for display.
 * Note: interval is currently ignored and no interval suffix is appended.
 * @param priceInCents
 * @param currency
 * @param interval
 */
export function formatPriceWithInterval(
  priceInCents: number,
  currency: string,
  interval: BillingInterval
): string {
  if (priceInCents === 0) {
    return "Free";
  }
  void interval;
  return formatPrice(priceInCents, currency);
}

// =============================================================================
// PRICING CALCULATIONS
// =============================================================================

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
  void interval;
  return priceInCents;
}

// =============================================================================
// TIER HELPERS
// =============================================================================

/**
 * Return all tiers for the product.
 * Note: interval filtering is not currently applied in this implementation.
 * @param pricing
 * @param interval
 */
export function getTiersByInterval(
  pricing: ProductPricing,
  interval: "monthly" | "yearly"
): PricingTier[] {
  void interval;
  return pricing.tiers;
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

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Return the current default interval label ("One-time").
 * Note: interval-specific labels are not currently implemented.
 * @param interval
 */
export function getIntervalLabel(interval: BillingInterval): string {
  void interval;
  return "One-time";
}

/**
 * Return the current default short interval label (empty string).
 * Note: interval-specific short labels are not currently implemented.
 * @param interval
 */
export function getIntervalShortLabel(interval: BillingInterval): string {
  void interval;
  return "";
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
  if (pricing.hasFreeTier || pricing.tiers.every((tier) => tier.price === 0)) {
    return "Free";
  }

  const startingTier = getStartingPrice(pricing);
  if (!startingTier) {
    return "Free";
  }

  return `From ${formatPrice(startingTier.price, currency)}`;
}
