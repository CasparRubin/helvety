import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

import type { Metadata } from "next";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.notes),
  title: {
    default: "Helvety Notes | Note Management",
    template: "%s | Helvety Notes",
  },
  description:
    "Free and open-source note management with client-side encryption for sensitive fields; notes grouped by Personal, Work, and Other. MIT licensed and engineered in Switzerland.",
  keywords: [
    "Helvety Notes",
    "note management",
    "notes",
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
  manifest: "/notes/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: urls.notes,
    siteName: "Helvety Notes",
    title: "Helvety Notes | Note Management",
    description:
      "Free and open-source note management with client-side encryption for sensitive fields; notes grouped by Personal, Work, and Other. MIT licensed and engineered in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety Notes",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Helvety Notes | Note Management",
    description:
      "Free and open-source note management with client-side encryption for sensitive fields; notes grouped by Personal, Work, and Other. MIT licensed and engineered in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
        alt: "Helvety Notes",
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
    canonical: urls.notes,
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
        name: "Helvety Notes",
        url: urls.notes,
        description:
          "Free and open-source note management with client-side encryption for sensitive fields; notes grouped by Personal, Work, and Other. MIT licensed and engineered in Switzerland.",
        applicationCategory: "BusinessApplication",
      }}
      EncryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
