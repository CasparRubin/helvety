import { cn } from "@helvety/shared/utils";

import {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_OPEN_SOURCE_ASSURANCE,
} from "@/components/hero-company-values-copy";

/**
 * Company-values tagline for the gateway hero: middle-dot copy plus a
 * subtle open-source assurance line.
 */
export function HeroCompanyValuesTagline() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <p
        className={cn(
          "text-muted-foreground text-base font-medium tracking-[0.08em] md:text-lg"
        )}
      >
        {HERO_COMPANY_VALUES_TAGLINE_DISPLAY}
      </p>
      <p className="text-muted-foreground/50 max-w-sm text-xs text-pretty">
        {HERO_OPEN_SOURCE_ASSURANCE}
      </p>
    </div>
  );
}
