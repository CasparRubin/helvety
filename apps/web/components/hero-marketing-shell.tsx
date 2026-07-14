import { getLocalAppHref, urls } from "@helvety/shared/config";
import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import { HeroCompanyValuesTagline } from "@/components/hero-company-values-tagline";

export {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
} from "@/components/hero-company-values-copy";

/** Minimum main height for the gateway hero layout. */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/**
 * Server-rendered marketing hero copy for `/`.
 * Company values render via {@link HeroCompanyValuesTagline}.
 */
export function HeroMarketingShell() {
  return (
    <section
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col justify-center",
        HERO_MIN_MAIN,
        "bg-background"
      )}
    >
      <div className="pointer-events-none mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 text-center md:px-6">
        <div className="space-y-5">
          <p className="text-muted-foreground text-base font-medium tracking-[0.12em] uppercase">
            Software products
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[2.75rem] lg:leading-[1.1] lg:text-wrap lg:whitespace-nowrap">
            Engineered, designed &amp; made in{" "}
            <span className="text-brand-swiss-red font-medium">
              {HELVETY_SWISS_ORIGIN_COUNTRY}
            </span>
          </h1>
          <div className="flex justify-center">
            <HeroCompanyValuesTagline />
          </div>
        </div>

        <Button
          size="lg"
          className="pointer-events-auto"
          render={<Link href={getLocalAppHref(urls.storeProducts)} />}
          nativeButton={false}
        >
          <PackageOpen className="size-5" aria-hidden="true" />
          Browse Helvety products
          <ChevronRight
            className="size-4 transition-transform group-hover/button:translate-x-0.5"
            aria-hidden="true"
          />
        </Button>
      </div>
    </section>
  );
}
