import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { cn } from "@helvety/shared/utils";

import { Footer } from "./footer";
import { HelvetyThemeInitScript } from "./helvety-theme-init-script";
import { JsonLdScript } from "./json-ld-script";
import { ScrollArea } from "./scroll-area";
import { SkipToContent } from "./skip-to-content";
import { Toaster } from "./sonner";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "./tooltip";

import type { JsonLdScriptProps } from "./json-ld-script";
import type { ReactNode } from "react";

/** Main content region: scrollable column (web) vs overflow-hidden main (PDF-style tools). */
export type HelvetyPublicShellMainVariant = "scroll-area" | "overflow-main";

/**
 * Where `ThemeProvider` wraps the tree: full app (default) or navbar only
 * (Store catalog; head script still sets `html.dark` before body paint).
 */
export type HelvetyPublicShellThemeProviderScope = "full" | "navbar-only";

/** Props for {@link HelvetyPublicShellRootLayout}. */
export type HelvetyPublicShellRootLayoutProps = Readonly<{
  children: ReactNode;
  /** Organization + product logo URL (e.g. `brandAssets.identifierLogo`). */
  organizationLogoUrl: string;
  /** Objects appended after `createHelvetyOrganizationSchema` in JSON-LD `@graph`. */
  jsonLdGraphTail: ReadonlyArray<Record<string, unknown>>;
  /** Fixed header slot (conventionally the app `Navbar`; non-scrolling). */
  renderNavbar: ReactNode;
  mainVariant: HelvetyPublicShellMainVariant;
  footerClassName?: string;
  /** Passed to {@link Footer} `external` (gateway uses `false`). */
  footerExternal?: boolean;
  /** Sets `data-scroll-behavior="smooth"` on `<html>` when true. */
  htmlSmoothScroll?: boolean;
  /**
   * When {@link themeProviderScope} is `"full"` (default): wraps **column + toaster**
   * only.
   *
   * When {@link themeProviderScope} is `"navbar-only"` (Store): wraps **column + toaster**
   * so callers can nest additional providers around the same subtree.
   */
  wrapInsideTooltipProvider?: (shell: ReactNode) => ReactNode;
  /**
   * `full`: `ThemeProvider` wraps the tooltip shell (default).
   * `navbar-only`: `ThemeProvider` wraps only the header / navbar; outer tree is
   * `TooltipProvider` then optional {@link wrapInsideTooltipProvider}.
   */
  themeProviderScope?: HelvetyPublicShellThemeProviderScope;
  /**
   * When `mainVariant` is `scroll-area`, rendered **above** the main `ScrollArea`
   * (pinned like the navbar; e.g. Store sub-navigation).
   */
  scrollAreaMainPrefix?: ReactNode;
  /** Optional class on `<main>` when `mainVariant` is `scroll-area`. */
  scrollAreaMainClassName?: string;
  /**
   * Optional extra classes on the ScrollArea **root** (`ScrollAreaPrimitive.Root`).
   * Passed last in `cn(...)` so callers can override defaults when a route needs custom overflow.
   */
  scrollAreaRootClassName?: string;
  /** Optional classes on the ScrollArea **viewport**; see {@link ScrollArea} `viewportClassName`. */
  scrollAreaViewportClassName?: string;
  /**
   * Optional classes on the outer **`h-svh`** shell column (navbar + main + footer).
   * Defaults to `overflow-hidden`. Use a custom override only when the route's layout
   * needs content to paint past the shell column.
   */
  shellColumnClassName?: string;
  /** Extra classes on `<body>` (both theme branches). */
  bodyClassName?: string;
}>;

/** Scroll-area vs overflow-main content for the public shell column. */
function buildMainBlock(
  mainVariant: HelvetyPublicShellMainVariant,
  children: ReactNode,
  scrollAreaMainPrefix: ReactNode | undefined,
  scrollAreaMainClassName: string | undefined,
  scrollAreaRootClassName: string | undefined,
  scrollAreaViewportClassName: string | undefined
): React.JSX.Element {
  if (mainVariant === "scroll-area") {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {scrollAreaMainPrefix ? (
          <div className="container mx-auto w-full shrink-0 px-4">
            {scrollAreaMainPrefix}
          </div>
        ) : null}
        <ScrollArea
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col [&>[data-slot=scroll-area-viewport]]:max-h-full [&>[data-slot=scroll-area-viewport]]:min-h-0 [&>[data-slot=scroll-area-viewport]]:flex-1",
            scrollAreaRootClassName ?? "overflow-hidden"
          )}
          viewportClassName={scrollAreaViewportClassName}
        >
          <div className="container mx-auto flex min-h-0 min-w-0 flex-1 flex-col px-4">
            <main
              id="main-content"
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col",
                scrollAreaMainClassName
              )}
            >
              {children}
            </main>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <main
      id="main-content"
      className="container mx-auto min-h-0 flex-1 overflow-hidden px-4"
    >
      {children}
    </main>
  );
}

/**
 * Shared root shell for **public** Helvety apps (`web`, `store`, `pdf`,
 * `image-editor`, `ocr`): CSP nonce, JSON-LD, blocking {@link HelvetyThemeInitScript} in
 * `<head>`, theme via `ThemeProvider`, `TooltipProvider`, optional
 * {@link wrapInsideTooltipProvider}, navbar + main + {@link Footer}, toaster.
 *
 * With `mainVariant: "scroll-area"`, optional **`scrollAreaMainPrefix`** (for example Store
 * section nav) renders **above** the main `ScrollArea` so it stays visible while catalog
 * content scrolls.
 */
export async function HelvetyPublicShellRootLayout({
  children,
  organizationLogoUrl,
  jsonLdGraphTail,
  renderNavbar,
  mainVariant,
  footerClassName = "shrink-0",
  footerExternal = true,
  htmlSmoothScroll = false,
  wrapInsideTooltipProvider,
  themeProviderScope = "full",
  scrollAreaMainPrefix,
  scrollAreaMainClassName,
  scrollAreaRootClassName,
  scrollAreaViewportClassName,
  shellColumnClassName,
  bodyClassName,
}: HelvetyPublicShellRootLayoutProps): Promise<React.JSX.Element> {
  const nonce = (await getRequestCspNonce()) ?? undefined;

  const ldJson = {
    "@context": "https://schema.org",
    "@graph": [
      createHelvetyOrganizationSchema(organizationLogoUrl),
      ...jsonLdGraphTail,
    ],
  } as JsonLdScriptProps["json"];

  const mainBlock = buildMainBlock(
    mainVariant,
    children,
    scrollAreaMainPrefix,
    scrollAreaMainClassName,
    scrollAreaRootClassName,
    scrollAreaViewportClassName
  );

  const header =
    themeProviderScope === "navbar-only" ? (
      <header className="shrink-0">
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          {renderNavbar}
        </ThemeProvider>
      </header>
    ) : (
      <header className="shrink-0">{renderNavbar}</header>
    );

  const column = (
    <div
      className={cn(
        "flex h-svh max-h-svh min-h-0 flex-col",
        shellColumnClassName ?? "overflow-hidden"
      )}
    >
      {header}
      {mainBlock}
      <Footer className={footerClassName} external={footerExternal} />
    </div>
  );

  const shellWithToaster = (
    <>
      {column}
      <Toaster />
    </>
  );

  if (themeProviderScope === "navbar-only") {
    const wrappedStore = wrapInsideTooltipProvider
      ? wrapInsideTooltipProvider(shellWithToaster)
      : shellWithToaster;

    return (
      <html
        lang="en"
        className={publicSans.variable}
        {...(htmlSmoothScroll
          ? { "data-scroll-behavior": "smooth" as const }
          : {})}
        suppressHydrationWarning
      >
        <head>
          <HelvetyThemeInitScript nonce={nonce} />
        </head>
        <body
          className={cn(
            "bg-background text-foreground font-sans antialiased",
            bodyClassName
          )}
        >
          <SkipToContent />
          <JsonLdScript nonce={nonce} json={ldJson} />
          <TooltipProvider>{wrappedStore}</TooltipProvider>
        </body>
      </html>
    );
  }

  const tooltipBody = wrapInsideTooltipProvider
    ? wrapInsideTooltipProvider(shellWithToaster)
    : shellWithToaster;

  return (
    <html
      lang="en"
      className={publicSans.variable}
      {...(htmlSmoothScroll
        ? { "data-scroll-behavior": "smooth" as const }
        : {})}
      suppressHydrationWarning
    >
      <head>
        <HelvetyThemeInitScript nonce={nonce} />
      </head>
      <body
        className={cn(
          "bg-background text-foreground font-sans antialiased",
          bodyClassName
        )}
      >
        <SkipToContent />
        <JsonLdScript nonce={nonce} json={ldJson} />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <TooltipProvider>{tooltipBody}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
