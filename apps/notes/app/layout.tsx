import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

/** Shared notes SEO / social copy (single source for metadata + JSON-LD). */
export const NOTES_APP_DESCRIPTION =
  "Encrypted notes with titles and rich text in Personal, Work, and Other groups. MIT-licensed, Swiss-built.";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.notes,
  title: {
    default: "Helvety Notes | End-to-end encrypted notes",
    template: "%s | Helvety Notes",
  },
  description: NOTES_APP_DESCRIPTION,
  keywords: [
    "Helvety Notes",
    "note management",
    "notes",
    "privacy",
    "secure",
    "encrypted",
  ],
  siteName: "Helvety Notes",
  canonicalUrl: urls.notes,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Notes",
    twitterAlt: "Helvety Notes",
  },
  manifest: "/notes/manifest.json",
  category: "productivity",
  indexing: "none",
});

/**
 * Root layout: fixed header (Navbar), overflow-hidden main (pages own scroll via CommandBarPageLayout), fixed footer.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <E2eeAppRootLayout
      organizationLogoUrl={brandAssets.identifierLogo}
      softwareApplication={{
        name: "Helvety Notes",
        url: urls.notes,
        description: NOTES_APP_DESCRIPTION,
        applicationCategory: "BusinessApplication",
      }}
      encryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
