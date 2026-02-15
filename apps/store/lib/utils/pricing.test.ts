import { describe, expect, it } from "vitest";

import {
  calculateYearlySavings,
  formatPrice,
  formatPriceWithInterval,
  formatStartingFrom,
  getFreeTier,
  getHighlightedTier,
  getIntervalLabel,
  getIntervalShortLabel,
  getMonthlyEquivalent,
  getStartingPrice,
  getTiersByInterval,
} from "./pricing";

import type { BillingInterval, ProductPricing } from "@/lib/types/products";

// =============================================================================
// formatPrice
// =============================================================================

describe("formatPrice", () => {
  it("returns 'Free' for zero price", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("formats CHF prices with cents by default", () => {
    const result = formatPrice(495, "CHF");
    expect(result).toContain("4.95");
    expect(result).toContain("CHF");
  });

  it("formats CHF prices without cents when option set", () => {
    const result = formatPrice(500, "CHF", { showCents: false });
    expect(result).toContain("5");
    expect(result).toContain("CHF");
    expect(result).not.toContain(".");
  });

  it("uses CHF as default currency", () => {
    const result = formatPrice(1000);
    expect(result).toContain("CHF");
  });

  it("handles unknown currencies gracefully with CHF default", () => {
    const result = formatPrice(1000, "USD");
    expect(result).toContain("CHF");
  });

  it("formats negative prices (credit/refund scenario)", () => {
    const result = formatPrice(-100, "CHF");
    // Should format the number even if negative
    expect(result).toContain("CHF");
  });

  it("formats very large prices", () => {
    const result = formatPrice(9999999, "CHF");
    expect(result).toContain("CHF");
    expect(result).toContain("99");
  });

  it("formats compact large prices when compact option set", () => {
    const result = formatPrice(10000000, "CHF", { compact: true });
    expect(result).toContain("CHF");
  });
});

// =============================================================================
// formatPriceWithInterval
// =============================================================================

describe("formatPriceWithInterval", () => {
  it("returns 'Free' for zero price", () => {
    expect(formatPriceWithInterval(0, "CHF", "monthly")).toBe("Free");
  });

  it("appends /month for monthly interval", () => {
    const result = formatPriceWithInterval(495, "CHF", "monthly");
    expect(result).toContain("/month");
  });

  it("appends /year for yearly interval", () => {
    const result = formatPriceWithInterval(4950, "CHF", "yearly");
    expect(result).toContain("/year");
  });

  it("appends one-time for lifetime interval", () => {
    const result = formatPriceWithInterval(9900, "CHF", "lifetime");
    expect(result).toContain("one-time");
  });

  it("appends one-time for one-time interval", () => {
    const result = formatPriceWithInterval(9900, "CHF", "one-time");
    expect(result).toContain("one-time");
  });
});

// =============================================================================
// getMonthlyEquivalent
// =============================================================================

describe("getMonthlyEquivalent", () => {
  it("divides yearly price by 12 and rounds", () => {
    expect(getMonthlyEquivalent(12000)).toBe(1000);
    expect(getMonthlyEquivalent(5940)).toBe(495);
  });

  it("rounds to nearest integer", () => {
    expect(getMonthlyEquivalent(1000)).toBe(83); // 1000/12 = 83.33...
  });
});

// =============================================================================
// calculateYearlySavings
// =============================================================================

describe("calculateYearlySavings", () => {
  it("calculates correct savings percentage", () => {
    // Monthly: 10 CHF * 12 = 120 CHF/year
    // Yearly: 96 CHF/year
    // Savings: (120 - 96) / 120 = 20%
    expect(calculateYearlySavings(1000, 9600)).toBe(20);
  });

  it("returns 0 when no savings", () => {
    expect(calculateYearlySavings(1000, 12000)).toBe(0);
  });

  it("rounds to nearest integer", () => {
    // Monthly: 5 * 12 = 60, Yearly: 50, Savings: 10/60 = 16.67% -> 17%
    expect(calculateYearlySavings(500, 5000)).toBe(17);
  });
});

// =============================================================================
// getStartingPrice
// =============================================================================

describe("getStartingPrice", () => {
  const mockPricing: ProductPricing = {
    tiers: [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "monthly" as BillingInterval,
        features: [],
        isFree: true,
      },
      {
        id: "pro-monthly",
        name: "Pro",
        price: 990,
        currency: "CHF",
        interval: "monthly" as BillingInterval,
        features: [],
      },
      {
        id: "pro-yearly",
        name: "Pro",
        price: 9900,
        currency: "CHF",
        interval: "yearly" as BillingInterval,
        features: [],
      },
    ],
    hasFreeTier: true,
    hasYearlyPricing: true,
  };

  it("returns the lowest non-free tier (normalized to monthly)", () => {
    const result = getStartingPrice(mockPricing);
    expect(result).not.toBeNull();
    // yearly: 9900/12 = 825, monthly: 990 -> yearly is cheaper
    expect(result!.id).toBe("pro-yearly");
  });

  it("returns null when all tiers are free", () => {
    const freePricing: ProductPricing = {
      tiers: [
        {
          id: "free",
          name: "Free",
          price: 0,
          currency: "CHF",
          interval: "monthly",
          features: [],
          isFree: true,
        },
      ],
      hasFreeTier: true,
      hasYearlyPricing: false,
    };
    expect(getStartingPrice(freePricing)).toBeNull();
  });
});

// =============================================================================
// getTiersByInterval
// =============================================================================

describe("getTiersByInterval", () => {
  const mockPricing: ProductPricing = {
    tiers: [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "monthly",
        features: [],
        isFree: true,
      },
      {
        id: "pro-monthly",
        name: "Pro",
        price: 990,
        currency: "CHF",
        interval: "monthly",
        features: [],
      },
      {
        id: "pro-yearly",
        name: "Pro",
        price: 9900,
        currency: "CHF",
        interval: "yearly",
        features: [],
      },
    ],
    hasFreeTier: true,
    hasYearlyPricing: true,
  };

  it("includes free tier in both intervals", () => {
    const monthly = getTiersByInterval(mockPricing, "monthly");
    const yearly = getTiersByInterval(mockPricing, "yearly");
    expect(monthly.some((t) => t.isFree)).toBe(true);
    expect(yearly.some((t) => t.isFree)).toBe(true);
  });

  it("filters paid tiers by interval", () => {
    const monthly = getTiersByInterval(mockPricing, "monthly");
    const yearly = getTiersByInterval(mockPricing, "yearly");
    expect(monthly.find((t) => t.id === "pro-monthly")).toBeDefined();
    expect(monthly.find((t) => t.id === "pro-yearly")).toBeUndefined();
    expect(yearly.find((t) => t.id === "pro-yearly")).toBeDefined();
    expect(yearly.find((t) => t.id === "pro-monthly")).toBeUndefined();
  });
});

// =============================================================================
// getFreeTier / getHighlightedTier
// =============================================================================

describe("getFreeTier", () => {
  it("finds tier with isFree flag", () => {
    const pricing: ProductPricing = {
      tiers: [
        {
          id: "free",
          name: "Free",
          price: 0,
          currency: "CHF",
          interval: "monthly",
          features: [],
          isFree: true,
        },
      ],
      hasFreeTier: true,
      hasYearlyPricing: false,
    };
    expect(getFreeTier(pricing)?.id).toBe("free");
  });

  it("finds tier with zero price", () => {
    const pricing: ProductPricing = {
      tiers: [
        {
          id: "basic",
          name: "Basic",
          price: 0,
          currency: "CHF",
          interval: "monthly",
          features: [],
        },
      ],
      hasFreeTier: true,
      hasYearlyPricing: false,
    };
    expect(getFreeTier(pricing)?.id).toBe("basic");
  });

  it("returns undefined when no free tier", () => {
    const pricing: ProductPricing = {
      tiers: [
        {
          id: "pro",
          name: "Pro",
          price: 990,
          currency: "CHF",
          interval: "monthly",
          features: [],
        },
      ],
      hasFreeTier: false,
      hasYearlyPricing: false,
    };
    expect(getFreeTier(pricing)).toBeUndefined();
  });
});

describe("getHighlightedTier", () => {
  it("returns highlighted tier", () => {
    const tiers = [
      {
        id: "basic",
        name: "Basic",
        price: 0,
        currency: "CHF",
        interval: "monthly" as BillingInterval,
        features: [],
      },
      {
        id: "pro",
        name: "Pro",
        price: 990,
        currency: "CHF",
        interval: "monthly" as BillingInterval,
        features: [],
        highlighted: true,
      },
    ];
    expect(getHighlightedTier(tiers)?.id).toBe("pro");
  });
});

// =============================================================================
// getIntervalLabel / getIntervalShortLabel
// =============================================================================

describe("getIntervalLabel", () => {
  it("returns human-readable labels", () => {
    expect(getIntervalLabel("monthly")).toBe("Monthly");
    expect(getIntervalLabel("yearly")).toBe("Yearly");
    expect(getIntervalLabel("lifetime")).toBe("Lifetime");
    expect(getIntervalLabel("one-time")).toBe("One-time");
  });
});

describe("getIntervalShortLabel", () => {
  it("returns short labels", () => {
    expect(getIntervalShortLabel("monthly")).toBe("mo");
    expect(getIntervalShortLabel("yearly")).toBe("yr");
    expect(getIntervalShortLabel("lifetime")).toBe("");
    expect(getIntervalShortLabel("one-time")).toBe("");
  });
});

// =============================================================================
// formatStartingFrom
// =============================================================================

describe("formatStartingFrom", () => {
  it("returns 'Free' when product has free tier", () => {
    const pricing: ProductPricing = {
      tiers: [],
      hasFreeTier: true,
      hasYearlyPricing: false,
    };
    expect(formatStartingFrom(pricing)).toBe("Free");
  });

  it("returns 'Contact us' when no tiers available", () => {
    const pricing: ProductPricing = {
      tiers: [],
      hasFreeTier: false,
      hasYearlyPricing: false,
    };
    expect(formatStartingFrom(pricing)).toBe("Contact us");
  });

  it("returns formatted starting price", () => {
    const pricing: ProductPricing = {
      tiers: [
        {
          id: "pro",
          name: "Pro",
          price: 990,
          currency: "CHF",
          interval: "monthly",
          features: [],
        },
      ],
      hasFreeTier: false,
      hasYearlyPricing: false,
    };
    const result = formatStartingFrom(pricing);
    expect(result).toContain("From");
    expect(result).toContain("CHF");
  });
});
