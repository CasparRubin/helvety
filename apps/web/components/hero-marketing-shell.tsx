import { getLocalAppHref, urls } from "@helvety/shared/config";
import {
  HELVETY_COMPANY_VALUES_TAGLINE,
  HELVETY_SWISS_ORIGIN_COUNTRY,
} from "@helvety/shared/licensing";
import { cn } from "@helvety/shared/utils";
import { Badge } from "@helvety/ui/badge";
import { Button } from "@helvety/ui/button";
import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";

import { HeroHyperspeedLayer } from "@/components/hero-hyperspeed-layer";

/** Minimum main height for the gateway hero layout. */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/** Frosted outline Badge surface (same tokens as Store catalog artist badges). */
const HERO_TAGLINE_BADGE_CLASS =
  "border-border/60 bg-card/90 text-card-foreground shadow-sm backdrop-blur-sm";

/** Gateway hero pill copy: lowercase company values, no trailing period, ASCII separators only. */
export const HERO_COMPANY_VALUES_TAGLINE_TEXT =
  HELVETY_COMPANY_VALUES_TAGLINE.replace(/\.$/, "").toLowerCase();

/**
 * Server-rendered marketing hero copy for `/`.
 * Company values render in a shadcn outline `Badge`; WebGL backdrop hydrates via {@link HeroHyperspeedLayer}.
 */
export function HeroMarketingShell() {
  return (
    <section
      className={cn(
        "relative isolate flex w-full min-w-0 flex-1 flex-col justify-center overflow-visible",
        HERO_MIN_MAIN,
        "bg-background"
      )}
    >
      <HeroHyperspeedLayer />

      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 text-center md:px-6">
        <div className="space-y-5">
          <p className="text-muted-foreground text-sm font-medium tracking-[0.12em] uppercase">
            Software products
          </p>
          <h1 className="text-foreground text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-[2.75rem] lg:leading-[1.1] lg:text-wrap lg:whitespace-nowrap">
            Engineered, designed &amp; made in{" "}
            <span className="text-brand-swiss-red font-medium">
              {HELVETY_SWISS_ORIGIN_COUNTRY}
            </span>
          </h1>
          <Badge
            variant="outline"
            className={cn(
              HERO_TAGLINE_BADGE_CLASS,
              "h-auto px-4 py-1.5 text-sm font-medium tracking-[0.08em] md:text-base"
            )}
          >
            {HERO_COMPANY_VALUES_TAGLINE_TEXT}
          </Badge>
        </div>

        <Button
          size="lg"
          className="pointer-events-auto"
          render={<Link href={getLocalAppHref(urls.store)} />}
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
