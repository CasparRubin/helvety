"use client";

import { cn } from "@helvety/shared/utils";

import { HERO_COMPANY_VALUES_TAGLINE_DISPLAY } from "@/components/hero-company-values-copy";
import ElectricBorder from "@/components/vendor/ElectricBorder";

/** Brand Swiss red from `@helvety/ui/globals.css` (`--brand-swiss-red`). */
const HERO_TAGLINE_ELECTRIC_COLOR = "#ff0000";

/**
 * Company-values tagline for the gateway hero: simple middle-dot copy inside
 * React Bits {@link ElectricBorder} (compact, not a full card).
 */
export function HeroCompanyValuesTagline() {
  return (
    <ElectricBorder
      color={HERO_TAGLINE_ELECTRIC_COLOR}
      speed={0.3}
      chaos={0.02}
      borderRadius={16}
      className="inline-block w-fit"
      style={{ borderRadius: 16 }}
    >
      <p
        className={cn(
          "text-muted-foreground px-4 py-2 text-base font-medium tracking-[0.08em] md:text-lg"
        )}
      >
        {HERO_COMPANY_VALUES_TAGLINE_DISPLAY}
      </p>
    </ElectricBorder>
  );
}
