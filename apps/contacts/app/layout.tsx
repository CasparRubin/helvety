import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
import { sharedViewport } from "@helvety/shared/config";
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
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { Navbar } from "@/components/navbar";
import { EncryptionProvider } from "@/lib/crypto";

import type { Metadata } from "next";

// Local Public Sans variable font - no network fetch during build
const publicSans = localFont({
  src: [
    {
      path: "../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL("https://helvety.com/contacts"),
  title: {
    default: "Helvety Contacts | Contact Management",
    template: "%s | Helvety Contacts",
  },
  description:
    "Manage your contacts with ease. Privacy-focused contact management with client-side encryption for sensitive fields. Engineered & Designed in Switzerland.",
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
    url: "https://helvety.com/contacts",
    siteName: "Helvety Contacts",
    title: "Helvety Contacts | Contact Management",
    description:
      "Manage your contacts with ease. Privacy-focused contact management with client-side encryption for sensitive fields. Engineered & Designed in Switzerland.",
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
    description:
      "Manage your contacts with ease. Privacy-focused contact management with client-side encryption for sensitive fields. Engineered & Designed in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
        alt: "Helvety Contacts",
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
    canonical: "https://helvety.com/contacts",
  },
  category: "productivity",
};

// Prevent Next.js from caching user-specific data (supabase.auth.getUser) across sessions
export const dynamic = "force-dynamic";

/**
 * Root layout: fixed header (Navbar), ScrollArea main, fixed footer.
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
                name: "Helvety Contacts",
                url: "https://helvety.com/contacts",
                description:
                  "Privacy-focused contact management with client-side encryption for sensitive fields. Engineered & Designed in Switzerland.",
                applicationCategory: "BusinessApplication",
                operatingSystem: "Any",
                offers: {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "CHF",
                },
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
                    <div className="mx-auto w-full max-w-[2000px]">
                      <main id="main-content">
                        {initialUser ? (
                          <EncryptionGateApp
                            userId={initialUser.id}
                            userEmail={initialUser.email ?? ""}
                          >
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
