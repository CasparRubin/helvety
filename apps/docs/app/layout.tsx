import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { DOCS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapE2eeLayoutSession } from "@helvety/shared/layout-session-bootstrap";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.docs,
  title: {
    default: "Helvety Docs | Edit Word documents in your browser",
    template: "%s | Helvety Docs",
  },
  description: DOCS_APP_DESCRIPTION,
  keywords: [
    "Helvety Docs",
    "docx editor",
    "Word editor",
    "browser docx",
    "optional vault save",
    "privacy",
    "client-side",
    "free docx tool",
  ],
  siteName: "Helvety Docs",
  canonicalUrl: urls.docs,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Docs",
    twitterAlt: "Helvety Docs",
  },
  manifest: "/docs/manifest.json",
  category: "productivity",
  indexing: "all",
});

/**
 * Root layout: public editor shell with CSRF + encryption providers for optional vault save.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const { csrfToken, initialUser } = await bootstrapE2eeLayoutSession();

  return (
    <HelvetyPublicShellRootLayout
      organizationLogoUrl={brandAssets.identifierLogo}
      jsonLdGraphTail={[
        {
          "@type": "WebApplication",
          name: "Helvety Docs",
          url: urls.docs,
          description: DOCS_APP_DESCRIPTION,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          browserRequirements: "Requires a modern web browser",
        },
      ]}
      renderNavbar={<Navbar initialUser={initialUser} />}
      mainVariant="overflow-main"
      wrapInsideTooltipProvider={(shell) => (
        <CSRFProvider csrfToken={csrfToken}>
          <EncryptionProvider>{shell}</EncryptionProvider>
        </CSRFProvider>
      )}
    >
      {children}
    </HelvetyPublicShellRootLayout>
  );
}
