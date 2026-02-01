/**
 * Subscription types and tier limits for Helvety PDF
 */

/**
 * Available subscription tiers
 */
export type SubscriptionTier = "free" | "pro";

/**
 * Feature limits for each tier
 */
export interface TierLimits {
  /** Maximum number of files that can be uploaded */
  maxFiles: number;
  /** Maximum total number of pages across all files */
  maxPages: number;
  /** Whether page rotation is allowed */
  canRotate: boolean;
  /** Tier display name */
  name: string;
  /** Tier description */
  description: string;
}

/**
 * Tier limits configuration
 * Based on helvety-store product definitions
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxFiles: 2,
    maxPages: 5,
    canRotate: false,
    name: "Basic",
    description: "Free tier with limited features",
  },
  pro: {
    maxFiles: Infinity,
    maxPages: Infinity,
    canRotate: true,
    name: "Pro",
    description: "Full access to all features",
  },
};

/**
 * Product ID for Helvety PDF in the store
 */
export const HELVETY_PDF_PRODUCT_ID = "helvety-pdf";

/**
 * Tier IDs matching the store product definitions
 */
export const TIER_IDS = {
  FREE: "helvety-pdf-free",
  PRO: "helvety-pdf-pro-monthly",
} as const;

/**
 * Subscription context value provided to components
 */
export interface SubscriptionContextValue {
  /** Whether authentication/subscription check is in progress */
  isLoading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Current tier limits */
  limits: TierLimits;
  /** Whether user has an active pro subscription */
  isPro: boolean;
  /** Refresh subscription status */
  refresh: () => Promise<void>;
}

/**
 * Get tier from tier ID
 */
export function getTierFromId(
  tierId: string | null | undefined
): SubscriptionTier {
  if (tierId === TIER_IDS.PRO) {
    return "pro";
  }
  return "free";
}

/**
 * Check if a file count is within limits
 */
export function isWithinFileLimit(
  currentFiles: number,
  newFiles: number,
  limits: TierLimits
): boolean {
  return currentFiles + newFiles <= limits.maxFiles;
}

/**
 * Check if a page count is within limits
 */
export function isWithinPageLimit(
  totalPages: number,
  limits: TierLimits
): boolean {
  return totalPages <= limits.maxPages;
}

/**
 * Get remaining file slots
 */
export function getRemainingFiles(
  currentFiles: number,
  limits: TierLimits
): number {
  if (limits.maxFiles === Infinity) return Infinity;
  return Math.max(0, limits.maxFiles - currentFiles);
}

/**
 * Get remaining page slots
 */
export function getRemainingPages(
  currentPages: number,
  limits: TierLimits
): number {
  if (limits.maxPages === Infinity) return Infinity;
  return Math.max(0, limits.maxPages - currentPages);
}
