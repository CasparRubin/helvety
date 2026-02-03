import { describe, it, expect } from "vitest";

import {
  formatPrice,
  formatPriceWithInterval,
  getMonthlyEquivalent,
  calculateYearlySavings,
  getTiersByInterval,
  getFreeTier,
  getHighlightedTier,
  isSubscriptionTier,
  isOneTimeTier,
  getIntervalLabel,
  formatStartingFrom,
} from "@/lib/utils/pricing";

import type { PricingTier, ProductPricing } from "@/lib/types/products";

describe("pricing utilities", () => {
  describe("formatPrice", () => {
    it("should format CHF prices correctly", () => {
      expect(formatPrice(999, "CHF")).toBe("9.99 CHF");
      expect(formatPrice(4999, "CHF")).toBe("49.99 CHF");
    });

    it("should format EUR prices with suffix", () => {
      expect(formatPrice(999, "EUR")).toBe("9,99 €");
    });

    it("should format USD prices with prefix", () => {
      expect(formatPrice(999, "USD")).toBe("$9.99");
    });

    it("should format GBP prices with prefix", () => {
      expect(formatPrice(999, "GBP")).toBe("£9.99");
    });

    it("should return Free for zero price", () => {
      expect(formatPrice(0, "CHF")).toBe("Free");
      expect(formatPrice(0, "EUR")).toBe("Free");
    });

    it("should handle showCents option", () => {
      expect(formatPrice(4900, "CHF", { showCents: false })).toBe("49 CHF");
    });

    it("should handle compact option for large numbers", () => {
      const result = formatPrice(100000, "CHF", { compact: true });
      expect(result).toMatch(/1.*CHF/);
    });

    it("should default to CHF for unknown currency", () => {
      expect(formatPrice(999, "XYZ")).toBe("9.99 CHF");
    });
  });

  describe("formatPriceWithInterval", () => {
    it("should format monthly subscription", () => {
      expect(formatPriceWithInterval(495, "CHF", "monthly")).toBe(
        "4.95 CHF/month"
      );
    });

    it("should format yearly subscription", () => {
      expect(formatPriceWithInterval(4999, "CHF", "yearly")).toBe(
        "49.99 CHF/year"
      );
    });

    it("should format lifetime/one-time purchase", () => {
      expect(formatPriceWithInterval(9999, "CHF", "lifetime")).toBe(
        "99.99 CHF one-time"
      );
      expect(formatPriceWithInterval(9999, "CHF", "one-time")).toBe(
        "99.99 CHF one-time"
      );
    });

    it("should return Free for zero price", () => {
      expect(formatPriceWithInterval(0, "CHF", "monthly")).toBe("Free");
    });
  });

  describe("getMonthlyEquivalent", () => {
    it("should calculate monthly equivalent from yearly price", () => {
      expect(getMonthlyEquivalent(12000)).toBe(1000); // 120/12 = 10
      expect(getMonthlyEquivalent(5940)).toBe(495); // 59.40/12 = 4.95
    });

    it("should round to nearest integer", () => {
      expect(getMonthlyEquivalent(1000)).toBe(83); // 10/12 = 0.83
    });
  });

  describe("calculateYearlySavings", () => {
    it("should calculate savings percentage", () => {
      // 10/month = 120/year, 100/year = 17% savings
      expect(calculateYearlySavings(1000, 10000)).toBe(17);
    });

    it("should return 0 when yearly equals monthly*12", () => {
      expect(calculateYearlySavings(1000, 12000)).toBe(0);
    });

    it("should handle 50% savings", () => {
      // 100/month = 1200/year, 600/year = 50% savings
      expect(calculateYearlySavings(10000, 60000)).toBe(50);
    });
  });

  describe("tier helpers", () => {
    const mockPricing: ProductPricing = {
      hasFreeTier: true,
      hasYearlyPricing: true,
      tiers: [
        {
          id: "free",
          name: "Free",
          price: 0,
          currency: "CHF",
          interval: "monthly",
          isFree: true,
          features: [],
        },
        {
          id: "pro-monthly",
          name: "Pro",
          price: 999,
          currency: "CHF",
          interval: "monthly",
          features: [],
          highlighted: true,
        },
        {
          id: "pro-yearly",
          name: "Pro",
          price: 9990,
          currency: "CHF",
          interval: "yearly",
          features: [],
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 49900,
          currency: "CHF",
          interval: "lifetime",
          features: [],
        },
      ] as PricingTier[],
    };

    describe("getTiersByInterval", () => {
      it("should return monthly tiers including free", () => {
        const tiers = getTiersByInterval(mockPricing, "monthly");
        expect(tiers).toHaveLength(2);
        expect(tiers.map((t) => t.id)).toContain("free");
        expect(tiers.map((t) => t.id)).toContain("pro-monthly");
      });

      it("should return yearly tiers including free", () => {
        const tiers = getTiersByInterval(mockPricing, "yearly");
        expect(tiers).toHaveLength(2);
        expect(tiers.map((t) => t.id)).toContain("free");
        expect(tiers.map((t) => t.id)).toContain("pro-yearly");
      });
    });

    describe("getFreeTier", () => {
      it("should return the free tier", () => {
        const freeTier = getFreeTier(mockPricing);
        expect(freeTier?.id).toBe("free");
        expect(freeTier?.isFree).toBe(true);
      });

      it("should return undefined if no free tier", () => {
        const noFreePricing: ProductPricing = {
          hasFreeTier: false,
          hasYearlyPricing: false,
          tiers: [
            {
              id: "pro",
              name: "Pro",
              price: 999,
              currency: "CHF",
              interval: "monthly",
              features: [],
            } as PricingTier,
          ],
        };
        expect(getFreeTier(noFreePricing)).toBeUndefined();
      });
    });

    describe("getHighlightedTier", () => {
      it("should return the highlighted tier", () => {
        const highlighted = getHighlightedTier(mockPricing.tiers);
        expect(highlighted?.id).toBe("pro-monthly");
      });

      it("should return undefined if no highlighted tier", () => {
        const noHighlighted = mockPricing.tiers.map((t) => ({
          ...t,
          highlighted: false,
        }));
        expect(getHighlightedTier(noHighlighted)).toBeUndefined();
      });
    });

    describe("isSubscriptionTier", () => {
      it("should return true for monthly tiers", () => {
        expect(isSubscriptionTier({ interval: "monthly" } as PricingTier)).toBe(
          true
        );
      });

      it("should return true for yearly tiers", () => {
        expect(isSubscriptionTier({ interval: "yearly" } as PricingTier)).toBe(
          true
        );
      });

      it("should return false for lifetime tiers", () => {
        expect(
          isSubscriptionTier({ interval: "lifetime" } as PricingTier)
        ).toBe(false);
      });

      it("should return false for one-time tiers", () => {
        expect(
          isSubscriptionTier({ interval: "one-time" } as PricingTier)
        ).toBe(false);
      });
    });

    describe("isOneTimeTier", () => {
      it("should return true for lifetime tiers", () => {
        expect(isOneTimeTier({ interval: "lifetime" } as PricingTier)).toBe(
          true
        );
      });

      it("should return true for one-time tiers", () => {
        expect(isOneTimeTier({ interval: "one-time" } as PricingTier)).toBe(
          true
        );
      });

      it("should return false for subscription tiers", () => {
        expect(isOneTimeTier({ interval: "monthly" } as PricingTier)).toBe(
          false
        );
        expect(isOneTimeTier({ interval: "yearly" } as PricingTier)).toBe(
          false
        );
      });
    });
  });

  describe("getIntervalLabel", () => {
    it("should return correct labels", () => {
      expect(getIntervalLabel("monthly")).toBe("Monthly");
      expect(getIntervalLabel("yearly")).toBe("Yearly");
      expect(getIntervalLabel("lifetime")).toBe("Lifetime");
      expect(getIntervalLabel("one-time")).toBe("One-time");
    });
  });

  describe("formatStartingFrom", () => {
    it("should return Free for products with free tier", () => {
      const pricing: ProductPricing = {
        hasFreeTier: true,
        hasYearlyPricing: false,
        tiers: [
          {
            id: "free",
            name: "Free",
            price: 0,
            currency: "CHF",
            interval: "monthly",
            isFree: true,
            features: [],
          } as PricingTier,
        ],
      };
      expect(formatStartingFrom(pricing)).toBe("Free");
    });

    it("should return lowest price for paid products", () => {
      const pricing: ProductPricing = {
        hasFreeTier: false,
        hasYearlyPricing: false,
        tiers: [
          {
            id: "pro",
            name: "Pro",
            price: 999,
            currency: "CHF",
            interval: "monthly",
            features: [],
          } as PricingTier,
          {
            id: "enterprise",
            name: "Enterprise",
            price: 4999,
            currency: "CHF",
            interval: "monthly",
            features: [],
          } as PricingTier,
        ],
      };
      expect(formatStartingFrom(pricing)).toBe("From 9.99 CHF");
    });

    it("should return Contact us for products with no valid tiers", () => {
      const pricing: ProductPricing = {
        hasFreeTier: false,
        hasYearlyPricing: false,
        tiers: [],
      };
      expect(formatStartingFrom(pricing)).toBe("Contact us");
    });
  });
});
