import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { STORE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { StoreNav } from "@/components/store-nav";

export { STORE_DESCRIPTION };

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.store,
  title: {
    default: "Helvety Store | Apps and downloads",
    template: "%s | Helvety Store",
  },
  description: STORE_DESCRIPTION,
  keywords: [
    "Helvety Store",
    "software",
    "web apps",
    "free tools",
    "helvety cloud",
    "encryption",
    "pdf",
    "image editor",
    "ocr",
    "text extraction",
    "privacy",
    "Swiss",
    "catalog",
    "SharePoint",
    "power automate",
    "screen tools",
    "windows screenshot",
  ],
  siteName: "Helvety Store",
  canonicalUrl: urls.store,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Store",
  },
  manifest: "/store/manifest.json",
  category: "software",
  indexing: "all",
});

/**
 * Root layout: blocking `HelvetyThemeInitScript` in `<head>`; ThemeProvider wraps only the Navbar.
 * Pinned StoreNav (`scrollAreaMainPrefix`), scrollable main (`ScrollArea`), and footer follow.
 * Navbar-only ThemeProvider keeps next-themes off catalog routes; head script sets `html.dark` before body paint.
 * Does not use shell overflow overrides.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <HelvetyPublicShellRootLayout
      organizationLogoUrl={brandAssets.identifierLogo}
      jsonLdGraphTail={[
        {
          "@type": "WebApplication",
          name: "Helvety Store",
          url: urls.store,
          description: STORE_DESCRIPTION,
          applicationCategory: "ShoppingApplication",
          operatingSystem: "Any",
        },
      ]}
      renderNavbar={<Navbar />}
      mainVariant="scroll-area"
      themeProviderScope="navbar-only"
      scrollAreaMainPrefix={<StoreNav />}
      scrollAreaMainClassName="min-w-0"
    >
      {children}
    </HelvetyPublicShellRootLayout>
  );
}
