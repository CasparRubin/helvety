import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { OCR_APP_DESCRIPTION } from "@/lib/product-copy";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.ocr,
  title: {
    default: "Helvety OCR | Extract text from PDFs and images in your browser",
    template: "%s | Helvety OCR",
  },
  description: OCR_APP_DESCRIPTION,
  keywords: [
    "Helvety OCR",
    "OCR",
    "optical character recognition",
    "extract text from PDF",
    "extract text from image",
    "PDF to text",
    "image to text",
    "scanned document to text",
    "browser OCR",
    "client-side OCR",
    "privacy OCR tool",
    "free OCR",
  ],
  siteName: "Helvety OCR",
  canonicalUrl: urls.ocr,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety OCR",
    twitterAlt: "Helvety OCR",
  },
  manifest: "/ocr/manifest.json",
  category: "productivity",
  indexing: "all",
});

/**
 * Root layout: fixed header (Navbar), overflow-hidden main with shared container gutters, fixed footer.
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
          name: "Helvety OCR",
          url: urls.ocr,
          description: OCR_APP_DESCRIPTION,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          browserRequirements: "Requires a modern web browser",
        },
      ]}
      renderNavbar={<Navbar />}
      mainVariant="overflow-main"
    >
      {children}
    </HelvetyPublicShellRootLayout>
  );
}
