import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
import { sharedViewport, urls } from "@helvety/shared/config";
import { EncryptionProvider } from "@helvety/shared/crypto/encryption-context";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { Footer } from "@helvety/ui/footer";
import { ScrollArea } from "@helvety/ui/scroll-area";
import { SkipToContent } from "@helvety/ui/skip-to-content";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { Navbar } from "@/components/navbar";

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
  metadataBase: new URL(urls.auth),
  title: {
    default: "Sign In | Helvety",
    template: "%s | Helvety",
  },
  description:
    "Sign in to your Helvety account. Engineered & Designed in Switzerland.",
  keywords: ["Helvety", "sign in", "login", "authentication"],
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
    url: urls.auth,
    siteName: "Helvety Auth",
    title: "Sign In | Helvety",
    description:
      "Sign in to your Helvety account. Engineered & Designed in Switzerland.",
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
    title: "Sign In | Helvety",
    description:
      "Sign in to your Helvety account. Engineered & Designed in Switzerland.",
    images: [
      {
        url: brandAssets.identifierPng,
      },
    ],
  },
  manifest: "/auth/manifest.json",
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
    canonical: urls.auth,
  },
};

// Prevent Next.js from caching user-specific data (supabase.auth.getUser) across sessions
export const dynamic = "force-dynamic";

/**
 * Root layout: fixed header (Navbar), ScrollArea main, fixed footer (contact + legal links).
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              createHelvetyOrganizationSchema(brandAssets.identifierPng),
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Helvety Auth",
                url: urls.auth,
                description:
                  "Sign in to your Helvety account. Engineered & Designed in Switzerland.",
                applicationCategory: "SecurityApplication",
                operatingSystem: "Any",
              },
            ]),
          }}
        />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          <TooltipProvider>
            <CSRFProvider csrfToken={csrfToken}>
              <EncryptionProvider>
                <div className="flex h-screen flex-col overflow-hidden">
                  <header className="shrink-0">
                    <Navbar initialUser={initialUser} />
                  </header>
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="mx-auto w-full max-w-[2000px]">
                      <main id="main-content">{children}</main>
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
