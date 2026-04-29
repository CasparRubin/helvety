import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
import { sharedViewport, urls } from "@helvety/shared/config";
import { EncryptionProvider } from "@helvety/shared/crypto/encryption-context";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { logger } from "@helvety/shared/logger";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { Footer } from "@helvety/ui/footer";
import { JsonLdScript } from "@helvety/ui/json-ld-script";
import { ScrollArea } from "@helvety/ui/scroll-area";
import { SessionRecovery } from "@helvety/ui/session-recovery";
import { SkipToContent } from "@helvety/ui/skip-to-content";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { VercelAnalytics } from "@helvety/ui/vercel-analytics";

import { Navbar } from "@/components/navbar";

import type { Metadata } from "next";

const AUTH_DESCRIPTION_COPY =
  "Passwordless entry for Helvety apps—OTP, passkeys, and session recovery where your platform allows. Open source, Swiss-built.";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.auth),
  title: {
    default: "Sign In | Helvety",
    template: "%s | Helvety",
  },
  description: AUTH_DESCRIPTION_COPY,
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
    description: AUTH_DESCRIPTION_COPY,
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
    description: AUTH_DESCRIPTION_COPY,
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

/**
 * Root layout: fixed header (Navbar), ScrollArea main with shared container gutters, fixed footer (contact + legal links).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const nonce = (await getRequestCspNonce()) ?? undefined;
  let csrfToken = "";
  let initialUser: Awaited<ReturnType<typeof getCachedUser>> = null;

  try {
    [csrfToken, initialUser] = await Promise.all([
      getCachedCSRFToken().then((t) => t ?? ""),
      getCachedUser(),
    ]);
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
  }

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <JsonLdScript
          nonce={nonce}
          json={{
            "@context": "https://schema.org",
            "@graph": [
              createHelvetyOrganizationSchema(brandAssets.identifierPng),
              {
                "@type": "WebApplication",
                name: "Helvety Auth",
                url: urls.auth,
                description: AUTH_DESCRIPTION_COPY,
                applicationCategory: "SecurityApplication",
                operatingSystem: "Any",
              },
            ],
          }}
        />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          {/* Optional: login flows may be unauthenticated without implying a broken session */}
          <SessionRecovery mode="optional" />
          <TooltipProvider>
            <CSRFProvider csrfToken={csrfToken}>
              <EncryptionProvider>
                <div className="flex h-screen flex-col overflow-hidden">
                  <header className="shrink-0">
                    <Navbar initialUser={initialUser} />
                  </header>
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="container mx-auto w-full px-4">
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
        <VercelAnalytics />
      </body>
    </html>
  );
}
