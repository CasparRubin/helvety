import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport } from "@helvety/shared/config";
import { EncryptionProvider } from "@helvety/shared/crypto/encryption-context";
import { createServerClient } from "@helvety/shared/supabase/server";
import { Footer } from "@helvety/ui/footer";
import { ScrollArea } from "@helvety/ui/scroll-area";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";

import { AuthTokenHandler } from "@/components/auth-token-handler";
import { Navbar } from "@/components/navbar";
import { CSRFProvider } from "@/hooks/use-csrf";
import { getCSRFToken } from "@/lib/csrf";

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
  metadataBase: new URL("https://helvety.com/auth"),
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
    url: "https://helvety.com/auth",
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
    canonical: "https://helvety.com/auth",
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
  // Read CSRF token set by proxy.ts (cookie generation happens there,
  // not here, because cookies().set() is not allowed in Server Components)
  const csrfToken = (await getCSRFToken()) ?? "";

  // Fetch initial user server-side to avoid loading flash in Navbar
  const supabase = await createServerClient();
  const {
    data: { user: initialUser },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Helvety",
                url: "https://helvety.com",
                logo: brandAssets.identifierPng,
                description:
                  "Software and subscriptions engineered and designed in Switzerland.",
                sameAs: [
                  "https://helvety.com",
                  "https://helvety.com/contacts",
                  "https://helvety.com/pdf",
                  "https://helvety.com/store",
                  "https://helvety.com/tasks",
                  "https://github.com/CasparRubin",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebApplication",
                name: "Helvety Auth",
                url: "https://helvety.com/auth",
                description:
                  "Sign in to your Helvety account. Engineered & Designed in Switzerland.",
                applicationCategory: "SecurityApplication",
                operatingSystem: "Any",
              },
            ]),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
                      <main>{children}</main>
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
