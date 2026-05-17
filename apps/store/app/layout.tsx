import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { HelvetyShellWithLightPillarBackdrop } from "@helvety/light-pillar";
import { STORE_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapE2eeLayoutSession } from "@helvety/shared/layout-session-bootstrap";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
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
    "pdf",
    "image upscaler",
    "tasks",
    "contacts",
    "notes",
    "links",
    "encrypted bookmarks",
    "privacy",
    "Swiss",
    "catalog",
    "browser extension",
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
 * Root layout: ThemeProvider wraps only the Navbar (next-themes injects a script; keep route content outside).
 * Pinned StoreNav (`scrollAreaMainPrefix`), scrollable main (`ScrollArea`), and footer follow.
 * Navbar-only ThemeProvider is intentional to avoid theme flash on catalog pages.
 * {@link HelvetyShellWithLightPillarBackdrop} wraps all routes (Light Pillar WebGL on md+ light or dark;
 * static `bg-background` below md or with reduced motion; see `@helvety/light-pillar`).
 * Does not use shell overflow overrides (unlike gateway Hyperspeed).
 * Session bootstrap: `bootstrapE2eeLayoutSession()` (CSRF + user for `CSRFProvider` and nav).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const { csrfToken, initialUser } = await bootstrapE2eeLayoutSession();

  return HelvetyPublicShellRootLayout({
    children,
    organizationLogoUrl: brandAssets.identifierLogo,
    jsonLdGraphTail: [
      {
        "@type": "WebApplication",
        name: "Helvety Store",
        url: urls.store,
        description: STORE_DESCRIPTION,
        applicationCategory: "ShoppingApplication",
        operatingSystem: "Any",
      },
    ],
    renderNavbar: <Navbar initialUser={initialUser} />,
    mainVariant: "scroll-area",
    themeProviderScope: "navbar-only",
    scrollAreaMainPrefix: <StoreNav initialUser={initialUser} />,
    scrollAreaMainClassName: "min-w-0",
    wrapInsideTooltipProvider: (shell) => (
      <CSRFProvider csrfToken={csrfToken}>
        <HelvetyShellWithLightPillarBackdrop>
          {shell}
        </HelvetyShellWithLightPillarBackdrop>
      </CSRFProvider>
    ),
  });
}
