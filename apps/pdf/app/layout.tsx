import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapPublicLayoutUser } from "@helvety/shared/layout-session-bootstrap";
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
    url: brandAssets.identifierLogo,
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
  const initialUser = await bootstrapPublicLayoutUser();

  return HelvetyPublicShellRootLayout({
    children,
    organizationLogoUrl: brandAssets.identifierLogo,
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
