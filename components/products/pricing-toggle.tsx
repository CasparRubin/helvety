"use client";

/**
 * Pricing toggle component
 * Allows switching between monthly and yearly billing
 */

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 *
 */
export type BillingPeriod = "monthly" | "yearly";

/**
 *
 */
interface PricingToggleProps {
  value: BillingPeriod;
  onChange: (value: BillingPeriod) => void;
  yearlyDiscountPercent?: number;
  className?: string;
}

/** Renders a monthly/yearly pricing toggle switch. */
export function PricingToggle({
  value,
  onChange,
  yearlyDiscountPercent,
  className,
}: PricingToggleProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="bg-muted inline-flex items-center rounded-lg p-1">
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            value === "monthly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("yearly")}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
            value === "yearly"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Yearly
        </button>
      </div>
      {yearlyDiscountPercent && yearlyDiscountPercent > 0 && (
        <Badge
          variant="secondary"
          className="border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400"
        >
          Save {yearlyDiscountPercent}%
        </Badge>
      )}
    </div>
  );
}
