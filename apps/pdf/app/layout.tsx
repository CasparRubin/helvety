import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
import { Footer } from "@helvety/ui/footer";
import { SessionRecovery } from "@helvety/ui/session-recovery";
import { SkipToContent } from "@helvety/ui/skip-to-content";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { VercelAnalytics } from "@helvety/ui/vercel-analytics";

import { Navbar } from "@/components/navbar";
import { PDF_APP_DESCRIPTION_COPY } from "@/lib/product-copy";

import type { Metadata } from "next";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.pdf),
  title: {
    default: "Helvety PDF | PDF Tool",
    template: "%s | Helvety PDF",
  },
  description: PDF_APP_DESCRIPTION_COPY,
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
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/pdf/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: urls.pdf,
    siteName: "Helvety PDF",
    title: "Helvety PDF | PDF Tool",
    description: PDF_APP_DESCRIPTION_COPY,
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety PDF",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Helvety PDF | PDF Tool",
    description: PDF_APP_DESCRIPTION_COPY,
    images: [
      {
        url: brandAssets.identifierPng,
        alt: "Helvety PDF",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: urls.pdf,
  },
  category: "productivity",
};

/**
 * Root layout: fixed header (Navbar), overflow-hidden main with shared container gutters (PDF toolkit manages its own scroll), fixed footer.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const nonce = (await getRequestCspNonce()) ?? undefined;

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                createHelvetyOrganizationSchema(brandAssets.identifierPng),
                {
                  "@type": "WebApplication",
                  name: "Helvety PDF",
                  url: urls.pdf,
                  description:
                    "Manage PDF files with ease. Merge, reorder, delete, rotate, and extract PDF pages in one place. For supported operations, file content processing happens locally in your browser.",
                  applicationCategory: "UtilitiesApplication",
                  operatingSystem: "Any",
                  isAccessibleForFree: true,
                  browserRequirements: "Requires a modern web browser",
                },
              ],
            }),
          }}
        />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          <SessionRecovery mode="optional" />
          <TooltipProvider>
            <div className="flex h-screen flex-col overflow-hidden">
              <header className="shrink-0">
                <Navbar />
              </header>
              <main
                id="main-content"
                className="container mx-auto min-h-0 flex-1 overflow-hidden px-4"
              >
                {children}
              </main>
              <Footer className="shrink-0" />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
