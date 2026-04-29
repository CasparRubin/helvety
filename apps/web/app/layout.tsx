import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
import { Footer } from "@helvety/ui/footer";
import { ScrollArea } from "@helvety/ui/scroll-area";
import { SessionRecovery } from "@helvety/ui/session-recovery";
import { SkipToContent } from "@helvety/ui/skip-to-content";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { VercelAnalyticsWithSpeedInsights } from "@helvety/ui/vercel-analytics";
import { headers } from "next/headers";

import { Navbar } from "@/components/navbar";

import type { Metadata } from "next";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.home),
  title: {
    default:
      "Helvety | Software Products | Engineered, Designed & Made in Switzerland",
    template: "%s | Helvety",
  },
  description:
    "Engineered, Designed & Made in Switzerland. Software products. Private, simple, clean.",
  keywords: [
    "Helvety",
    "Swiss software",
    "encrypted tasks",
    "encrypted contacts",
    "PDF tools",
    "image upscaler",
    "open source",
    "MIT",
    "end-to-end encryption",
    "privacy",
    "Switzerland",
  ],
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: urls.home,
    siteName: "Helvety",
    title:
      "Helvety | Software Products | Engineered, Designed & Made in Switzerland",
    description:
      "Engineered, Designed & Made in Switzerland. Software products. Private, simple, clean.",
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety",
      },
    ],
  },
  twitter: {
    card: "summary",
    title:
      "Helvety | Software Products | Engineered, Designed & Made in Switzerland",
    description:
      "Engineered, Designed & Made in Switzerland. Software products. Private, simple, clean.",
    images: [
      {
        url: brandAssets.identifierPng,
      },
    ],
  },
  manifest: "/manifest.json",
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
    canonical: urls.home,
  },
};

/**
 * Root layout: fixed header (Navbar), ScrollArea main with shared container gutters, fixed footer (contact + legal links).
 *
 * The web app is primarily public-facing (marketing/legal pages) and also
 * exposes public metadata/API endpoints such as robots, sitemap, and CSP
 * reporting routes.
 * No explicit force-dynamic export. This layout reads request headers for CSP
 * nonce propagation; navbar auth state is resolved client-side via an initial
 * Supabase user probe plus onAuthStateChange updates.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const nonce = (await headers()).get("x-nonce") ?? "";

  return (
    <html
      lang="en"
      className={publicSans.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
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
                  "@type": "WebSite",
                  name: "Helvety",
                  url: urls.home,
                  description:
                    "Engineered, Designed & Made in Switzerland. Software products. Private, simple, clean.",
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
              <ScrollArea className="min-h-0 flex-1">
                <div className="container mx-auto w-full px-4">
                  <main id="main-content">{children}</main>
                </div>
              </ScrollArea>
              <Footer className="shrink-0" external={false} />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <VercelAnalyticsWithSpeedInsights />
      </body>
    </html>
  );
}
