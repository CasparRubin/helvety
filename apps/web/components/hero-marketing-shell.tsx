import { getLocalAppHref, urls } from "@helvety/shared/config";
import { HELVETY_SWISS_ORIGIN_COUNTRY } from "@helvety/shared/licensing";
import { POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL } from "@helvety/shared/power-platform-configurator-copy";
import { cn } from "@helvety/shared/utils";
import { Button } from "@helvety/ui/button";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  FileText,
  ImagePlus,
  Monitor,
  PackageOpen,
  Puzzle,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { HERO_MUTED_LINE_CLASS } from "@/components/hero-company-values-copy";
import { HeroCompanyValuesTagline } from "@/components/hero-company-values-tagline";

export {
  HERO_COMPANY_VALUES_TAGLINE_DISPLAY,
  HERO_COMPANY_VALUES_TAGLINE_TEXT,
} from "@/components/hero-company-values-copy";

/** Minimum main height for the gateway hero layout. */
const HERO_MIN_MAIN = "min-h-[max(100%,calc(100svh-4rem-12.5rem))]";

/** Shared size and icon treatment for the primary hero CTA. */
const HERO_CTA_BUTTON_CLASS =
  "h-12 w-full gap-2 px-4 text-sm sm:w-full sm:px-5 sm:text-base";

const HEADLINE_CLASS =
  "text-foreground text-center text-lg font-semibold tracking-tight sm:text-xl md:text-2xl lg:text-[1.75rem] lg:leading-snug";

/** One destination in a hero link group. */
type HeroLink = {
  label: string;
  /** One-line summary shown under the label. */
  description: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

const HERO_TOOL_LINKS: readonly HeroLink[] = [
  {
    label: "Helvety PDF",
    description: "Merge, rotate, and edit PDF pages.",
    href: getLocalAppHref(urls.pdf),
    icon: FileText,
  },
  {
    label: "Helvety Image Editor",
    description: "Annotate, crop, and resize images.",
    href: getLocalAppHref(urls.imageEditor),
    icon: ImagePlus,
  },
  {
    label: "Power Platform Configurator",
    description: "Tune Power Automate and Power Apps.",
    href: POWER_PLATFORM_CONFIGURATOR_CHROME_WEB_STORE_URL,
    icon: Puzzle,
    external: true,
  },
];

const HERO_IN_PROGRESS_LINKS: readonly HeroLink[] = [
  {
    label: "Helvety Screen Tools",
    description: "Screenshots and Live Draw on Windows.",
    href: getLocalAppHref(`${urls.store}/products/helvety-screen-tools`),
    icon: Monitor,
  },
  {
    label: "Helvety Power Platform Tools",
    description: "Dataverse modules for Windows 11.",
    href: getLocalAppHref(
      `${urls.store}/products/helvety-power-platform-tools`
    ),
    icon: Workflow,
  },
];

/** Shared row treatment for destinations in the hero link lists. */
const HERO_LINK_ROW_CLASS =
  "group flex items-center gap-3 px-3 py-2.5 text-left transition-colors outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

/**
 * One destination row. Same-origin targets use `next/link`; external targets
 * open in a new tab and carry the off-site arrow.
 */
function HeroLinkRow({ link }: { link: HeroLink }) {
  const Icon = link.icon;
  const Arrow = link.external ? ArrowUpRight : ArrowRight;

  const content = (
    <>
      <Icon
        className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors"
        aria-hidden="true"
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-foreground truncate text-sm font-medium">
          {link.label}
        </span>
        <span className="text-muted-foreground text-xs">
          {link.description}
        </span>
      </span>
      <Arrow
        className={cn(
          "text-muted-foreground/70 group-hover:text-foreground size-4 shrink-0 transition-[color,transform] duration-150",
          link.external
            ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            : "group-hover:translate-x-0.5"
        )}
        aria-hidden="true"
      />
    </>
  );

  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={HERO_LINK_ROW_CLASS}
      >
        {content}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={link.href} className={HERO_LINK_ROW_CLASS}>
      {content}
    </Link>
  );
}

/** Hairline-ruled heading plus a compact list of destinations. */
function HeroLinkGroup({
  title,
  links,
}: {
  title: string;
  links: readonly HeroLink[];
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 px-3">
        <h2 className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.14em] uppercase">
          {title}
        </h2>
        <span className="bg-border h-px flex-1" aria-hidden="true" />
      </div>
      <ul className="border-border divide-border divide-y border-y">
        {links.map((link) => (
          <li key={link.href}>
            <HeroLinkRow link={link} />
          </li>
        ))}
      </ul>
    </section>
  );
}

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
            Made in{" "}
            <span className="text-brand-swiss-red font-medium">
              {HELVETY_SWISS_ORIGIN_COUNTRY}
            </span>
          </p>
          <div className="flex justify-center">
            <HeroCompanyValuesTagline />
          </div>
        </div>

        <div className="hero-enter-ctas mx-auto flex w-full max-w-md flex-col items-stretch gap-10 text-center sm:gap-12">
          <HeroLinkGroup title="Released Tools" links={HERO_TOOL_LINKS} />
          <HeroLinkGroup
            title="What we're working on"
            links={HERO_IN_PROGRESS_LINKS}
          />
          <Button
            size="lg"
            className={HERO_CTA_BUTTON_CLASS}
            render={<Link href={getLocalAppHref(urls.storeProducts)} />}
            nativeButton={false}
          >
            <PackageOpen className="size-5 shrink-0" aria-hidden="true" />
            View all products
            <ChevronRight
              className="size-4 shrink-0 transition-transform group-hover/button:translate-x-0.5"
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>
    </section>
  );
}
