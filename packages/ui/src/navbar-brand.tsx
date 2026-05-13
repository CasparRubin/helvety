"use client";

import { HelvetyIdentifier, HelvetyLogo } from "@helvety/brand";
import Link from "next/link";

import { AppSwitcher } from "./app-switcher";

/** Shared left-side navbar brand shell used across apps. */
interface NavbarBrandProps {
  currentApp: string;
  homeHref: string;
  homeAriaLabel: string;
  titleText?: string;
  titleHref?: string;
}

/**
 * Renders app switcher + brand link + optional app title.
 * The brand link always navigates in the current tab so users move between
 * Helvety surfaces without accumulating tabs.
 *
 * {@link AppSwitcher} loads canonical link data from **`app-switcher-sections`** (absolute **`urls.*`**
 * hrefs) so navigation stays correct under each zone’s Next **`basePath`**.
 */
export function NavbarBrand({
  currentApp,
  homeHref,
  homeAriaLabel,
  titleText,
  titleHref,
}: NavbarBrandProps): React.JSX.Element {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <AppSwitcher currentApp={currentApp} />
      <Link
        href={homeHref}
        className="flex shrink-0 items-center gap-3 transition-opacity hover:opacity-80"
        aria-label={homeAriaLabel}
      >
        <HelvetyLogo
          aria-label="Helvety"
          className="hidden h-8 w-auto sm:block"
        />
        <HelvetyIdentifier
          aria-label="Helvety"
          className="h-8 w-auto sm:hidden"
        />
      </Link>
      {titleText &&
        (titleHref ? (
          <Link
            href={titleHref}
            className="shrink-0 text-xl font-black tracking-tight transition-opacity hover:opacity-80"
          >
            {titleText}
          </Link>
        ) : (
          <span className="shrink-0 text-xl font-black tracking-tight transition-opacity hover:opacity-80">
            {titleText}
          </span>
        ))}
    </div>
  );
}
