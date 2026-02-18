import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport } from "@helvety/shared/config";
import { getCSRFToken } from "@helvety/shared/csrf";
import { createServerClient } from "@helvety/shared/supabase/server";
import { Footer } from "@helvety/ui/footer";
import { ScrollArea } from "@helvety/ui/scroll-area";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { AuthTokenHandler } from "@/components/auth-token-handler";
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
  const nonce = (await headers()).get("x-nonce") ?? "";

  // Get CSRF token from cookies (set by proxy.ts if missing)
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
                  "https://helvety.com/tasks",
                  "https://github.com/CasparRubin",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Helvety Store",
                url: "https://helvety.com/store",
                description:
                  "Official Helvety Store. Software and subscriptions engineered & designed in Switzerland.",
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
          <main className="min-w-0">{children}</main>
        </div>
      </ScrollArea>
      <Footer className="shrink-0" />
    </div>
  );
}
