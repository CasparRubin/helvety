import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
import { sharedViewport } from "@helvety/shared/config";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
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
import { Providers } from "@/components/providers";
import { StoreNav } from "@/components/store-nav";

import type { User } from "@supabase/supabase-js";
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
  metadataBase: new URL("https://helvety.com/store"),
  title: {
    default: "Helvety Store | Software & Subscriptions",
    template: "%s | Helvety Store",
  },
  description:
    "Official Helvety Store. Software and subscriptions engineered & designed in Switzerland.",
  keywords: ["Helvety Store", "software", "subscriptions", "Swiss", "shop"],
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
    url: "https://helvety.com/store",
    siteName: "Helvety Store",
    title: "Helvety Store | Software & Subscriptions",
    description:
      "Official Helvety Store. Software and subscriptions engineered & designed in Switzerland.",
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
    title: "Helvety Store | Software & Subscriptions",
    description:
      "Official Helvety Store. Software and subscriptions engineered & designed in Switzerland.",
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
    canonical: "https://helvety.com/store",
  },
  category: "shopping",
};

// Prevent Next.js from caching user-specific data (supabase.auth.getUser) across sessions
export const dynamic = "force-dynamic";

/**
 * Root layout: NavbarWrapper provides fixed header, ScrollArea main, fixed footer.
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
                  "https://helvety.com/auth",
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
                name: "Helvety Store",
                url: "https://helvety.com/store",
                description:
                  "Official Helvety Store. Software and subscriptions engineered & designed in Switzerland.",
                applicationCategory: "ShoppingApplication",
                operatingSystem: "Any",
              },
            ]),
          }}
        />
        <ThemeProvider
          nonce={nonce}
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthTokenHandler />
          <TooltipProvider>
            <Providers csrfToken={csrfToken}>
              <NavbarWrapper initialUser={initialUser}>
                {children}
              </NavbarWrapper>
            </Providers>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

/**
 * Wraps content with fixed header (Navbar + StoreNav), ScrollArea main, fixed footer.
 */
async function NavbarWrapper({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="shrink-0">
        <Navbar initialUser={initialUser} />
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="mx-auto w-full max-w-[2000px]">
          <StoreNav />
          <main id="main-content" className="min-w-0">
            {children}
          </main>
        </div>
      </ScrollArea>
      <Footer className="shrink-0" />
    </div>
  );
}
