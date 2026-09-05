import { HERO_COMPANY_VALUES_TAGLINE_DISPLAY } from "@/components/hero-company-values-copy";

/** Company-values tagline for the gateway hero. */
export function HeroCompanyValuesTagline() {
  return (
    <p className="text-muted-foreground text-base font-medium tracking-[0.08em] md:text-lg">
      {HERO_COMPANY_VALUES_TAGLINE_DISPLAY}
    </p>
  );
}
