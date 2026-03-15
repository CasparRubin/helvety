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
import { logger } from "@helvety/shared/logger";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { EncryptionGateApp } from "@helvety/ui/encryption-gate-app";
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
    "Free and open-source note management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
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
      "Free and open-source note management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
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
      "Free and open-source note management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
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
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  let nonce = "";
  let csrfToken = "";
  let initialUser: Awaited<ReturnType<typeof getCachedUser>> = null;

  try {
    [nonce, csrfToken, initialUser] = await Promise.all([
      headers().then((h) => h.get("x-nonce") ?? ""),
      getCachedCSRFToken().then((t) => t ?? ""),
      getCachedUser(),
    ]);
  } catch (error) {
    logger.error("Layout initialization failed:", error);
  }

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              createHelvetyOrganizationSchema(brandAssets.identifierPng),
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Helvety Notes",
                url: urls.notes,
                description:
                  "Free and open-source note management with client-side encryption for sensitive fields. MIT licensed and engineered in Switzerland.",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Any",
                isAccessibleForFree: true,
              },
            ]),
          }}
        />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          <SessionRecovery />
          <TooltipProvider>
            <CSRFProvider csrfToken={csrfToken}>
              <EncryptionProvider>
                <div className="flex h-screen flex-col overflow-hidden">
                  <header className="shrink-0">
                    <Navbar initialUser={initialUser} />
                  </header>
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="container mx-auto w-full px-4">
                      <main id="main-content">
                        {initialUser ? (
                          <EncryptionGateApp userId={initialUser.id}>
                            {children}
                          </EncryptionGateApp>
                        ) : (
                          children
                        )}
                      </main>
                    </div>
                  </ScrollArea>
                  <Footer className="shrink-0" />
                </div>
                <Toaster />
              </EncryptionProvider>
            </CSRFProvider>
          </TooltipProvider>
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
