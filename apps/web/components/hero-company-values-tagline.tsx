import { cn } from "@helvety/shared/utils";

import { HERO_COMPANY_VALUES_TAGLINE_DISPLAY } from "@/components/hero-company-values-copy";

/**
 * Company-values tagline for the gateway hero: simple middle-dot copy.
 */
export function HeroCompanyValuesTagline() {
  return (
    <p
      className={cn(
        "text-muted-foreground text-base font-medium tracking-[0.08em] md:text-lg"
      )}
    >
      {HERO_COMPANY_VALUES_TAGLINE_DISPLAY}
    </p>
  );
}
