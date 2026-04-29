import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

import type { Metadata } from "next";

const CONTACTS_APP_DESCRIPTION_COPY =
  "People-first address book with client-side encryption—MIT-licensed, Swiss-built.";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.contacts),
  title: {
    default: "Helvety Contacts | Contact Management",
    template: "%s | Helvety Contacts",
  },
  description: CONTACTS_APP_DESCRIPTION_COPY,
  keywords: [
    "Helvety Contacts",
    "contact management",
    "contacts",
    "address book",
    "privacy",
    "secure",
    "encrypted",
  ],
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/contacts/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: urls.contacts,
    siteName: "Helvety Contacts",
    title: "Helvety Contacts | Contact Management",
    description: CONTACTS_APP_DESCRIPTION_COPY,
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety Contacts",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Helvety Contacts | Contact Management",
    description: CONTACTS_APP_DESCRIPTION_COPY,
    images: [
      {
        url: brandAssets.identifierPng,
        alt: "Helvety Contacts",
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: urls.contacts,
  },
  category: "productivity",
};

/**
 * Root layout: fixed header (Navbar), ScrollArea main with shared container gutters, fixed footer.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <E2eeAppRootLayout
      organizationLogoUrl={brandAssets.identifierPng}
      softwareApplication={{
        name: "Helvety Contacts",
        url: urls.contacts,
        description: CONTACTS_APP_DESCRIPTION_COPY,
        applicationCategory: "BusinessApplication",
      }}
      EncryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
