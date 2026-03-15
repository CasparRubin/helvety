import { describe, expect, it } from "vitest";

import {
  formatPrice,
  formatPriceWithInterval,
  formatStartingFrom,
  getFreeTier,
  getHighlightedTier,
  getIntervalLabel,
  getIntervalShortLabel,
  getStartingPrice,
} from "./pricing";

import type { ProductPricing } from "@/lib/types/products";

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

describe("formatPriceWithInterval", () => {
  it("returns 'Free' for zero price", () => {
    expect(formatPriceWithInterval(0, "CHF", "one-time")).toBe("Free");
  });

  it("formats non-zero as currency-only display", () => {
    const result = formatPriceWithInterval(9900, "CHF", "one-time");
    expect(result).toContain("CHF");
  });
});

describe("getStartingPrice", () => {
  const mockPricing: ProductPricing = {
    tiers: [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        features: [],
        isFree: true,
      },
      {
        id: "one-time-access",
        name: "Pro",
        price: 990,
        currency: "CHF",
        interval: "one-time",
        features: [],
      },
    ],
    hasFreeTier: true,
    hasYearlyPricing: false,
  };

  it("returns the lowest non-free tier", () => {
    const result = getStartingPrice(mockPricing);
    expect(result).not.toBeNull();
    expect(result!.id).toBe("one-time-access");
  });

  it("returns null when all tiers are free", () => {
    const freePricing: ProductPricing = {
      tiers: [
        {
          id: "free",
          name: "Free",
          price: 0,
          currency: "CHF",
          interval: "one-time",
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

describe("getFreeTier", () => {
  it("finds tier with isFree flag", () => {
    const pricing: ProductPricing = {
      tiers: [
        {
          id: "free",
          name: "Free",
          price: 0,
          currency: "CHF",
          interval: "one-time",
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
          interval: "one-time",
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
          interval: "one-time",
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
    const tiers: ProductPricing["tiers"] = [
      {
        id: "basic",
        name: "Basic",
        price: 0,
        currency: "CHF",
        interval: "one-time",
        features: [],
      },
      {
        id: "pro",
        name: "Pro",
        price: 990,
        currency: "CHF",
        interval: "one-time",
        features: [],
        highlighted: true,
      },
    ];
    expect(getHighlightedTier(tiers)?.id).toBe("pro");
  });
});

describe("getIntervalLabel", () => {
  it("returns one-time label", () => {
    expect(getIntervalLabel("one-time")).toBe("One-time");
  });
});

describe("getIntervalShortLabel", () => {
  it("returns empty short label for one-time", () => {
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

  it("returns 'Free' when no tiers available", () => {
    const pricing: ProductPricing = {
      tiers: [],
      hasFreeTier: false,
      hasYearlyPricing: false,
    };
    expect(formatStartingFrom(pricing)).toBe("Free");
  });

  it("returns formatted starting price", () => {
    const pricing: ProductPricing = {
      tiers: [
        {
          id: "pro",
          name: "Pro",
          price: 990,
          currency: "CHF",
          interval: "one-time",
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
