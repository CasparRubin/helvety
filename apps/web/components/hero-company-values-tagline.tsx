import {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_MUTED_LINE_CLASS,
} from "@/components/hero-company-values-copy";

/** Company-values tagline for the gateway hero. */
export function HeroCompanyValuesTagline() {
  return <p className={HERO_MUTED_LINE_CLASS}>{HERO_COMPANY_VALUES_TAGLINE_DISPLAY}</p>;
}
