import { getLocalAppHref, urls } from "@helvety/shared/config";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import { ChevronRight, Cloud, PackageOpen } from "lucide-react";
import Link from "next/link";

import { HeroCompanyValuesTagline } from "@/components/hero-company-values-tagline";
import { HeroSwitzerlandHeadline } from "@/components/hero-switzerland-headline";

export {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
  HERO_OPEN_SOURCE_ASSURANCE,
} from "@/components/hero-company-values-copy";

export { HERO_SWITZERLAND_ROTATING_TEXTS } from "@/components/hero-switzerland-headline";

/** Minimum main height for the gateway hero layout. */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/** Shared size and icon treatment for hero destination buttons. */
const HERO_CTA_BUTTON_CLASS =
  "h-12 w-full gap-2 px-4 text-sm sm:w-full sm:px-5 sm:text-base";

/** Helvety Cloud destination blurb under the primary CTA. */
export const HERO_CLOUD_CTA_DESCRIPTION =
  "End-to-end encrypted workspace for projects, tasks, notes, contacts, boards, databases, comments, and files. Helvety cannot read or recover your content.";

/** Store products destination blurb under the secondary CTA. */
export const HERO_PRODUCTS_CTA_DESCRIPTION =
  "Open-source browser tools, extensions, and other apps.";

/**
 * Server-rendered marketing hero copy for `/`.
 * Company values render via {@link HeroCompanyValuesTagline}.
 * Switzerland line is a client island ({@link HeroSwitzerlandHeadline}).
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
          <h1 className="text-muted-foreground text-base font-medium tracking-[0.12em] uppercase">
            Software
          </h1>
          <div className="flex justify-center">
            <HeroSwitzerlandHeadline />
          </div>
          <div className="flex justify-center">
            <HeroCompanyValuesTagline />
          </div>
        </div>

        <div className="hero-enter-ctas mx-auto grid w-full max-w-md grid-cols-1 gap-5 sm:max-w-2xl sm:grid-cols-2 sm:items-start sm:gap-6">
          <div className="flex flex-col items-stretch gap-2.5 text-center">
            <Button
              size="lg"
              className={HERO_CTA_BUTTON_CLASS}
              render={<a href={urls.cloud} />}
              nativeButton={false}
            >
              <Cloud className="size-5 shrink-0" aria-hidden="true" />
              Helvety Cloud
              <ChevronRight
                className="size-4 shrink-0 transition-transform group-hover/button:translate-x-0.5"
                aria-hidden="true"
              />
            </Button>
            <p className="text-muted-foreground text-sm text-pretty sm:px-1">
              {HERO_CLOUD_CTA_DESCRIPTION}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-2.5 text-center">
            <Button
              size="lg"
              variant="outline"
              className={HERO_CTA_BUTTON_CLASS}
              render={<Link href={getLocalAppHref(urls.storeProducts)} />}
              nativeButton={false}
            >
              <PackageOpen className="size-5 shrink-0" aria-hidden="true" />
              Browse other products
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
      </div>
    </section>
  );
}
