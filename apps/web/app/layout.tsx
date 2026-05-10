import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapPublicLayoutUser } from "@helvety/shared/layout-session-bootstrap";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { ScrollViewportMetricsBridge } from "@/components/scroll-viewport-metrics";

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
 * Root layout: fixed header (Navbar), ScrollArea main with shared container gutters, fixed footer (contact + legal links).
 *
 * The web app is primarily public-facing (marketing/legal pages) and also
 * exposes public metadata/API endpoints such as robots, sitemap, and CSP
 * reporting routes.
 * No explicit force-dynamic export. This layout reads request headers for CSP
 * nonce propagation. The navbar receives an SSR `initialUser` snapshot from
 * `getCachedUser` (with graceful fallback on failure); `useNavbarAuthState`
 * still reconciles with the client session on updates.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const initialUser = await bootstrapPublicLayoutUser();

  return HelvetyPublicShellRootLayout({
    children,
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
    scrollAreaViewportClassName: "helvety-web-scroll-snap-viewport",
    bodyTail: <ScrollViewportMetricsBridge />,
  });
}
