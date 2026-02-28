import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport } from "@helvety/shared/config";
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
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";

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
  metadataBase: new URL("https://helvety.com"),
  title: {
    default:
      "Helvety | Products & Services | Engineered & Designed in Switzerland",
    template: "%s | Helvety",
  },
  description:
    "Swiss-engineered products for encrypted task management, contact management, PDF tools, and SharePoint extensions. Privacy-focused and designed in Switzerland.",
  keywords: [
    "Helvety",
    "Swiss software",
    "encrypted tasks",
    "encrypted contacts",
    "PDF tools",
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
    url: "https://helvety.com",
    siteName: "Helvety",
    title:
      "Helvety | Products & Services | Engineered & Designed in Switzerland",
    description:
      "Swiss-engineered products for encrypted task management, contact management, PDF tools, and SharePoint extensions. Privacy-focused and designed in Switzerland.",
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
      "Helvety | Products & Services | Engineered & Designed in Switzerland",
    description:
      "Swiss-engineered products for encrypted task management, contact management, PDF tools, and SharePoint extensions. Privacy-focused and designed in Switzerland.",
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
    canonical: "https://helvety.com",
  },
};

/**
 * Root layout: fixed header (Navbar), ScrollArea main, fixed footer (contact + legal links).
 *
 * The web app serves only public/static pages (home, privacy, terms, impressum).
 * No explicit force-dynamic export. This layout is kept static-friendly; auth
 * state is resolved client-side in Navbar via onAuthStateChange.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const nonce = "";

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
                "@type": "WebSite",
                name: "Helvety",
                url: "https://helvety.com",
                description:
                  "Swiss-engineered products for encrypted task management, contact management, PDF tools, and SharePoint extensions. Privacy-focused and designed in Switzerland.",
              },
            ]),
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
                <div className="mx-auto w-full max-w-[2000px]">
                  <main id="main-content">{children}</main>
                </div>
              </ScrollArea>
              <Footer className="shrink-0" external={false} />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
