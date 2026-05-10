import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapPublicLayoutUser } from "@helvety/shared/layout-session-bootstrap";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";

/** Default helvety.com marketing blurb (metadata, OG, Twitter, JSON-LD). */
export const WEB_SITE_DESCRIPTION =
  "Swiss-built software with a calm UX: encrypted productivity, lightweight browser utilities, and clear legal pages. MIT-licensed where the repo ships code.";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.home,
  title: {
    default: "Helvety | Swiss-built open source software",
    template: "%s | Helvety",
  },
  description: WEB_SITE_DESCRIPTION,
  keywords: [
    "Helvety",
    "Swiss software",
    "encrypted tasks",
    "encrypted contacts",
    "PDF tools",
    "image upscaler",
    "open source",
    "MIT",
    "end-to-end encryption",
    "privacy",
    "Switzerland",
  ],
  siteName: "Helvety",
  canonicalUrl: urls.home,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety",
  },
  manifest: "/manifest.json",
  indexing: "all",
});

/**
 * Root layout: fixed header (`Navbar`), `ScrollArea` main with shared container
 * gutters, fixed footer (contact + legal links).
 *
 * Full-bleed Hyperspeed on `/` paints wider than the content column (`100svw`,
 * centered on the hero). The shell passes `shellColumnClassName`,
 * `scrollAreaRootClassName`, `scrollAreaViewportClassName`, and `bodyClassName`
 * so Radix scroll clipping and the `h-svh` column do not crop the canvas; see
 * `@helvety/ui` README for these optional `HelvetyPublicShellRootLayout` props.
 *
 * Public marketing/legal pages plus metadata routes (robots, sitemap, CSP
 * reporting). CSP nonce flows from request headers. The navbar gets an SSR
 * `initialUser` snapshot via `bootstrapPublicLayoutUser()` from
 * `@helvety/shared/layout-session-bootstrap` (logs and falls
 * back to null on failure); `useNavbarAuthState` reconciles with the client
 * session afterward.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const initialUser = await bootstrapPublicLayoutUser();

  return HelvetyPublicShellRootLayout({
    children,
    /* Full-bleed Hyperspeed: `100svw` breakout + lateral CSS mask; defeats shell + Radix overflow clipping. */
    shellColumnClassName: "!overflow-visible",
    bodyClassName: "overflow-x-clip",
    scrollAreaRootClassName: "!overflow-visible",
    scrollAreaViewportClassName: "!overflow-visible",
    organizationLogoUrl: brandAssets.identifierLogo,
    jsonLdGraphTail: [
      {
        "@type": "WebSite",
        name: "Helvety",
        url: urls.home,
        description: WEB_SITE_DESCRIPTION,
      },
    ],
    renderNavbar: <Navbar initialUser={initialUser} />,
    mainVariant: "scroll-area",
    footerExternal: false,
    analytics: "with-speed-insights",
  });
}
