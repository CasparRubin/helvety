import { getLocalAppHref, urls } from "@helvety/shared/config";
import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import { HERO_MUTED_LINE_CLASS } from "@/components/hero-company-values-copy";
import { HeroCompanyValuesTagline } from "@/components/hero-company-values-tagline";

export {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
} from "@/components/hero-company-values-copy";

/** Minimum main height for the gateway hero layout. */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/** Shared size and icon treatment for hero destination buttons. */
const HERO_CTA_BUTTON_CLASS =
  "h-12 w-full gap-2 px-4 text-sm sm:w-full sm:px-5 sm:text-base";

const HEADLINE_CLASS =
  "text-foreground text-center text-lg font-semibold tracking-tight sm:text-xl md:text-2xl lg:text-[1.75rem] lg:leading-snug";

/** Store products destination blurb under the primary CTA. */
export const HERO_PRODUCTS_CTA_DESCRIPTION =
  "Inspect the source and verify our claims.";

/**
 * Server-rendered marketing hero copy for `/`.
 * Company values render via {@link HeroCompanyValuesTagline}.
 */
export function HeroMarketingShell() {
  return (
    <section
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col justify-center py-12 sm:py-16",
        HERO_MIN_MAIN,
        "bg-background"
      )}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-12 px-4 text-center sm:gap-16 md:px-6">
        <div className="hero-enter-brand space-y-4 sm:space-y-5">
          <h1 className={HERO_MUTED_LINE_CLASS}>open-source software</h1>
          <p className={HEADLINE_CLASS}>
            made in{" "}
            <span className="text-brand-swiss-red font-medium">
              {HELVETY_SWISS_ORIGIN_COUNTRY.toLowerCase()}
            </span>
          </p>
          <div className="flex justify-center">
            <HeroCompanyValuesTagline />
          </div>
        </div>

        <div className="hero-enter-ctas mx-auto flex w-full max-w-md flex-col items-stretch gap-2.5 text-center">
          <Button
            size="lg"
            className={HERO_CTA_BUTTON_CLASS}
            render={<Link href={getLocalAppHref(urls.storeProducts)} />}
            nativeButton={false}
          >
            <PackageOpen className="size-5 shrink-0" aria-hidden="true" />
            Browse products
            <ChevronRight
              className="size-4 shrink-0 transition-transform group-hover/button:translate-x-0.5"
              aria-hidden="true"
            />
          </Button>
          <p className="text-muted-foreground text-sm text-pretty sm:px-1">
            {HERO_PRODUCTS_CTA_DESCRIPTION}
          </p>
        </div>
      </div>
    </section>
  );
}
