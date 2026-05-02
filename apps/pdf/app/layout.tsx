import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { getCachedUser } from "@helvety/shared/cached-server";
import { sharedViewport, urls } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { PDF_APP_DESCRIPTION } from "@/lib/product-copy";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.pdf,
  title: {
    default: "Helvety PDF | Edit PDFs in your browser",
    template: "%s | Helvety PDF",
  },
  description: PDF_APP_DESCRIPTION,
  keywords: [
    "Helvety PDF",
    "PDF merge",
    "PDF reorder",
    "PDF delete",
    "PDF rotate",
    "PDF extract",
    "client-side PDF",
    "privacy PDF tool",
    "privacy-focused PDF",
    "browser PDF",
    "PDF editor",
    "free PDF tool",
  ],
  siteName: "Helvety PDF",
  canonicalUrl: urls.pdf,
  brandImage: {
    url: brandAssets.identifierPng,
    ogAlt: "Helvety PDF",
    twitterAlt: "Helvety PDF",
  },
  manifest: "/pdf/manifest.json",
  category: "productivity",
  indexing: "all",
});

/**
 * Root layout: fixed header (Navbar), overflow-hidden main with shared container gutters (PDF toolkit manages its own scroll), fixed footer.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  let initialUser: Awaited<ReturnType<typeof getCachedUser>> = null;

  try {
    initialUser = await getCachedUser();
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
  }

  return HelvetyPublicShellRootLayout({
    children,
    organizationLogoUrl: brandAssets.identifierPng,
    jsonLdGraphTail: [
      {
        "@type": "WebApplication",
        name: "Helvety PDF",
        url: urls.pdf,
        description: PDF_APP_DESCRIPTION,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        browserRequirements: "Requires a modern web browser",
      },
    ],
    renderNavbar: <Navbar initialUser={initialUser} />,
    mainVariant: "overflow-main",
  });
}
