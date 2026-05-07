import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { cn } from "@helvety/shared/utils";

import { AuthTokenHandler } from "./auth-token-handler";
import { Footer } from "./footer";
import { JsonLdScript } from "./json-ld-script";
import { ScrollArea } from "./scroll-area";
import { SessionRecovery } from "./session-recovery";
import { SkipToContent } from "./skip-to-content";
import { Toaster } from "./sonner";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "./tooltip";
import {
  VercelAnalytics,
  VercelAnalyticsWithSpeedInsights,
} from "./vercel-analytics";

import type { JsonLdScriptProps } from "./json-ld-script";
import type { ReactNode } from "react";

/** Main content region: scrollable column (web) vs overflow-hidden main (PDF-style tools). */
export type HelvetyPublicShellMainVariant = "scroll-area" | "overflow-main";

/** Vercel analytics mount: default Analytics only, or Analytics + Speed Insights (gateway). */
export type HelvetyPublicShellAnalyticsVariant =
  | "default"
  | "with-speed-insights";

/**
 * Where `ThemeProvider` wraps the tree: full app (default) or navbar only
 * (Store catalog — avoids theme flash on route content).
 */
export type HelvetyPublicShellThemeProviderScope = "full" | "navbar-only";

/** Props for {@link HelvetyPublicShellRootLayout}. */
export type HelvetyPublicShellRootLayoutProps = Readonly<{
  children: ReactNode;
  /** Organization + product logo URL (e.g. `brandAssets.identifierLogo`). */
  organizationLogoUrl: string;
  /** Objects appended after `createHelvetyOrganizationSchema` in JSON-LD `@graph`. */
  jsonLdGraphTail: ReadonlyArray<Record<string, unknown>>;
  /** Sticky header (conventionally the app `Navbar`). */
  renderNavbar: ReactNode;
  mainVariant: HelvetyPublicShellMainVariant;
  sessionRecoveryMode?: "optional" | "required";
  footerClassName?: string;
  /** Passed to {@link Footer} `external` (gateway uses `false`). */
  footerExternal?: boolean;
  analytics?: HelvetyPublicShellAnalyticsVariant;
  /** Sets `data-scroll-behavior="smooth"` on `<html>` when true. */
  htmlSmoothScroll?: boolean;
  /**
   * When {@link themeProviderScope} is `"full"` (default): wraps **column + toaster**
   * only (Auth: CSRF + encryption around that fragment; auth/session stay outside).
   *
   * When {@link themeProviderScope} is `"navbar-only"` (Store): wraps **auth handler +
   * session recovery + column + toaster** so outer wrappers (e.g. `CSRFProvider` in
   * `wrapInsideTooltipProvider`) wrap the same subtree as the store layout.
   */
  wrapInsideTooltipProvider?: (shell: ReactNode) => ReactNode;
  /**
   * `full`: `ThemeProvider` wraps auth, session recovery, tooltip shell (default).
   * `navbar-only`: `ThemeProvider` wraps only the header / navbar; outer tree is
   * `TooltipProvider` then optional {@link wrapInsideTooltipProvider}.
   */
  themeProviderScope?: HelvetyPublicShellThemeProviderScope;
  /**
   * When `mainVariant` is `scroll-area`, rendered inside the container before
   * `<main>` (e.g. Store sub-navigation).
   */
  scrollAreaMainPrefix?: ReactNode;
  /** Optional class on `<main>` when `mainVariant` is `scroll-area`. */
  scrollAreaMainClassName?: string;
}>;

/** Scroll-area vs overflow-main content for the public shell column. */
function buildMainBlock(
  mainVariant: HelvetyPublicShellMainVariant,
  children: ReactNode,
  scrollAreaMainPrefix: ReactNode | undefined,
  scrollAreaMainClassName: string | undefined
): React.JSX.Element {
  if (mainVariant === "scroll-area") {
    return (
      <ScrollArea className="min-h-0 flex-1">
        <div className="container mx-auto w-full px-4">
          {scrollAreaMainPrefix}
          <main id="main-content" className={cn(scrollAreaMainClassName)}>
            {children}
          </main>
        </div>
      </ScrollArea>
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
 * Shared root shell for **public** Helvety apps (`web`, `auth`, `store`, `pdf`,
 * `image-upscaler`): CSP nonce, JSON-LD, theme (see {@link HelvetyPublicShellThemeProviderScope}),
 * auth token handler, session recovery, `TooltipProvider`, optional
 * {@link wrapInsideTooltipProvider} (e.g. CSRF / encryption for Auth, `CSRFProvider` for Store),
 * navbar + main + footer, toaster, Vercel analytics. E2EE apps (`tasks`, `contacts`, `notes`) use
 * `E2eeAppRootLayout` (`e2ee-app-root-layout.tsx`) instead.
 */
export async function HelvetyPublicShellRootLayout({
  children,
  organizationLogoUrl,
  jsonLdGraphTail,
  renderNavbar,
  mainVariant,
  sessionRecoveryMode = "optional",
  footerClassName = "shrink-0",
  footerExternal = true,
  analytics = "default",
  htmlSmoothScroll = false,
  wrapInsideTooltipProvider,
  themeProviderScope = "full",
  scrollAreaMainPrefix,
  scrollAreaMainClassName,
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
    scrollAreaMainClassName
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
    <div className="flex h-screen flex-col overflow-hidden">
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

  const analyticsBlock =
    analytics === "with-speed-insights" ? (
      <VercelAnalyticsWithSpeedInsights />
    ) : (
      <VercelAnalytics />
    );

  if (themeProviderScope === "navbar-only") {
    const storeShell = (
      <>
        <AuthTokenHandler />
        <SessionRecovery mode={sessionRecoveryMode} />
        {shellWithToaster}
      </>
    );

    const wrappedStore = wrapInsideTooltipProvider
      ? wrapInsideTooltipProvider(storeShell)
      : storeShell;

    return (
      <html
        lang="en"
        className={publicSans.variable}
        {...(htmlSmoothScroll
          ? { "data-scroll-behavior": "smooth" as const }
          : {})}
        suppressHydrationWarning
      >
        <body className="antialiased">
          <SkipToContent />
          <JsonLdScript nonce={nonce} json={ldJson} />
          <TooltipProvider>{wrappedStore}</TooltipProvider>
          {analyticsBlock}
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
      <body className="antialiased">
        <SkipToContent />
        <JsonLdScript nonce={nonce} json={ldJson} />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          <SessionRecovery mode={sessionRecoveryMode} />
          <TooltipProvider>{tooltipBody}</TooltipProvider>
        </ThemeProvider>
        {analyticsBlock}
      </body>
    </html>
  );
}
