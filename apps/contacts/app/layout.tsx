import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { CONTACTS_APP_DESCRIPTION } from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

export { CONTACTS_APP_DESCRIPTION };

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.contacts,
  title: {
    default: "Helvety Contacts | Encrypted address book",
    template: "%s | Helvety Contacts",
  },
  description: CONTACTS_APP_DESCRIPTION,
  keywords: [
    "Helvety Contacts",
    "contact management",
    "contacts",
    "address book",
    "privacy",
    "secure",
    "encrypted",
  ],
  siteName: "Helvety Contacts",
  canonicalUrl: urls.contacts,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Contacts",
    twitterAlt: "Helvety Contacts",
  },
  manifest: "/contacts/manifest.json",
  category: "productivity",
  indexing: "none",
});

/**
 * Root layout: fixed header (Navbar), overflow-hidden main (pages own scroll via CommandBarPageLayout), fixed footer.
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
        name: "Helvety Contacts",
        url: urls.contacts,
        description: CONTACTS_APP_DESCRIPTION,
        applicationCategory: "BusinessApplication",
      }}
      encryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
