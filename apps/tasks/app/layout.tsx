import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { E2eeAppRootLayout } from "@helvety/ui/e2ee-app-root-layout";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

import type { Metadata } from "next";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.tasks),
  title: {
    default: "Helvety Tasks | Task Management",
    template: "%s | Helvety Tasks",
  },
  description:
    "Free and open-source task management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
  keywords: [
    "Helvety Tasks",
    "task management",
    "todo",
    "tasks",
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
  manifest: "/tasks/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: urls.tasks,
    siteName: "Helvety Tasks",
    title: "Helvety Tasks | Task Management",
    description:
      "Free and open-source task management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety Tasks",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Helvety Tasks | Task Management",
    description:
      "Free and open-source task management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
        alt: "Helvety Tasks",
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
    canonical: urls.tasks,
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
        name: "Helvety Tasks",
        url: urls.tasks,
        description:
          "Free and open-source task management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
        applicationCategory: "BusinessApplication",
      }}
      EncryptionProvider={EncryptionProvider}
      renderNavbar={(initialUser) => <Navbar initialUser={initialUser} />}
    >
      {children}
    </E2eeAppRootLayout>
  );
}
