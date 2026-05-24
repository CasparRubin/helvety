import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { LINKS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

export { LINKS_APP_DESCRIPTION };

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.links,
  title: {
    default: "Helvety Links | End-to-end encrypted bookmarks",
    template: "%s | Helvety Links",
  },
  description: LINKS_APP_DESCRIPTION,
  keywords: [
    "Helvety Links",
    "bookmarks",
    "links",
    "privacy",
    "secure",
    "encrypted",
  ],
  siteName: "Helvety Links",
  canonicalUrl: urls.links,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Links",
    twitterAlt: "Helvety Links",
  },
  manifest: "/links/manifest.json",
  category: "productivity",
  indexing: "none",
});

/**
 *
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  return (
    <E2eeAppRootLayout
      organizationLogoUrl={brandAssets.identifierLogo}
      softwareApplication={{
        name: "Helvety Links",
        url: urls.links,
        description: LINKS_APP_DESCRIPTION,
        applicationCategory: "BusinessApplication",
      }}
      encryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
