import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { WEB_SITE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
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
    "PDF tools",
    "image editor",
    "image annotation",
    "ocr",
    "text extraction",
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
 * `app/loading.tsx` re-exports `HelvetyShellRouteLoading` (`@helvety/ui/helvety-shell-route-loading`)
 * so pending navigations keep a full-viewport `bg-background` shell. The public shell injects
 * blocking `HelvetyThemeInitScript` in `<head>` so theme tokens are correct before body paint.
 * `HelvetyPublicShellRootLayout` merges `bg-background text-foreground` on `<body>` with
 * `bodyClassName` below.
 *
 * Public marketing/legal pages plus metadata routes (robots, sitemap, CSP
 * reporting). CSP nonce flows from request headers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <HelvetyPublicShellRootLayout
      bodyClassName="overflow-x-clip"
      organizationLogoUrl={brandAssets.identifierLogo}
      jsonLdGraphTail={[
        {
          "@type": "WebSite",
          name: "Helvety",
          url: urls.home,
          description: WEB_SITE_DESCRIPTION,
        },
      ]}
      renderNavbar={<Navbar />}
      mainVariant="scroll-area"
      footerExternal={false}
    >
      {children}
    </HelvetyPublicShellRootLayout>
  );
}
