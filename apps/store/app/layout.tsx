import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
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
import { VercelAnalytics } from "@helvety/ui/vercel-analytics";
import { headers } from "next/headers";

import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { StoreNav } from "@/components/store-nav";

import type { Metadata } from "next";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.store),
  title: {
    default: "Helvety Store | Products & Apps",
    template: "%s | Helvety Store",
  },
  description:
    "Official Helvety Store for free and open-source Helvety apps and extensions. MIT licensed software engineered, designed, and made in Switzerland.",
  keywords: [
    "Helvety Store",
    "software",
    "web apps",
    "free tools",
    "pdf",
    "tasks",
    "contacts",
    "privacy",
    "open source",
    "MIT",
    "Swiss",
    "catalog",
    "browser extension",
    "SharePoint",
    "power automate",
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
    url: urls.store,
    siteName: "Helvety Store",
    title: "Helvety Store | Products & Apps",
    description:
      "Official Helvety Store for free and open-source Helvety apps and extensions. MIT licensed software engineered, designed, and made in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety Store",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Helvety Store | Products & Apps",
    description:
      "Official Helvety Store for free and open-source Helvety apps and extensions. MIT licensed software engineered, designed, and made in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
      },
    ],
  },
  manifest: "/store/manifest.json",
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
    canonical: urls.store,
  },
  category: "software",
};

/**
 * Root layout: ThemeProvider wraps only the Navbar (next-themes injects a script; keep route content outside).
 * ScrollArea main, StoreNav, and footer follow.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const [nonce, csrfToken, initialUser] = await Promise.all([
    headers().then((h) => h.get("x-nonce") ?? ""),
    getCachedCSRFToken().then((t) => t ?? ""),
    getCachedUser(),
  ]);

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              createHelvetyOrganizationSchema(brandAssets.identifierPng),
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Helvety Store",
                url: urls.store,
                description:
                  "Official Helvety Store for free and open-source Helvety apps and extensions. MIT licensed software engineered, designed, and made in Switzerland.",
                applicationCategory: "ShoppingApplication",
                operatingSystem: "Any",
              },
            ]),
          }}
        />
        <TooltipProvider>
          <Providers csrfToken={csrfToken}>
            <AuthTokenHandler />
            <SessionRecovery mode="optional" />
            <div className="flex h-screen flex-col overflow-hidden">
              <header className="shrink-0">
                <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
                  <Navbar initialUser={initialUser} />
                </ThemeProvider>
              </header>
              <ScrollArea className="min-h-0 flex-1">
                <div className="container mx-auto w-full px-4">
                  <StoreNav initialUser={initialUser} />
                  <main id="main-content" className="min-w-0">
                    {children}
                  </main>
                </div>
              </ScrollArea>
              <Footer className="shrink-0" />
            </div>
            <Toaster />
          </Providers>
        </TooltipProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
