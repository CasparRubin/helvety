import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { WEB_SITE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapPublicLayoutUser } from "@helvety/shared/layout-session-bootstrap";
import { HELVETY_WEB_DEFAULT_TITLE } from "@helvety/shared/licensing";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";

export { WEB_SITE_DESCRIPTION };

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.home,
  title: {
    default: HELVETY_WEB_DEFAULT_TITLE,
    template: "%s | Helvety",
  },
  description: WEB_SITE_DESCRIPTION,
  keywords: [
    "Helvety",
    "Swiss software",
    "encrypted tasks",
    "encrypted contacts",
    "encrypted notes",
    "encrypted bookmarks",
    "links",
    "PDF tools",
    "image upscaler",
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
 * centered on the hero; WebGL mounts client-side only). The shell passes `shellColumnClassName`,
 * `scrollAreaRootClassName`, `scrollAreaViewportClassName`, and `bodyClassName`
 * so Radix scroll clipping and the `h-svh` column do not crop the full-bleed backdrop; see
 * `@helvety/ui` README for these optional `HelvetyPublicShellRootLayout` props.
 *
 * `app/loading.tsx` re-exports `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`)
 * so pending navigations keep a full-viewport `bg-background` shell. `HelvetyPublicShellRootLayout`
 * merges `bg-background text-foreground` on `<body>`
 * with `bodyClassName` below.
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
    scrollAreaViewportClassName: "!overflow-visible bg-background",
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
