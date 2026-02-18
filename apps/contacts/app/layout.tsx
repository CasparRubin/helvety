import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport } from "@helvety/shared/config";
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
import { SessionRecovery } from "@/components/session-recovery";
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
    default: "Helvety Contacts | Contact Management | Private and Secure",
    template: "%s | Helvety Contacts",
  },
  description:
    "Manage your contacts with ease. Private, secure, and encrypted contact management. Engineered & Designed in Switzerland.",
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
    title: "Helvety Contacts | Contact Management | Private and Secure",
    description:
      "Manage your contacts with ease. Private, secure, and encrypted contact management. Engineered & Designed in Switzerland.",
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
    title: "Helvety Contacts | Contact Management | Private and Secure",
    description:
      "Manage your contacts with ease. Private, secure, and encrypted contact management. Engineered & Designed in Switzerland.",
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
  const nonce = (await headers()).get("x-nonce") ?? "";

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
                  "https://helvety.com/pdf",
                  "https://helvety.com/store",
                  "https://helvety.com/tasks",
                  "https://github.com/CasparRubin",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Helvety Contacts",
                url: "https://helvety.com/contacts",
                description:
                  "Private and secure contact management with end-to-end encryption. Engineered & Designed in Switzerland.",
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
        <ThemeProvider
          nonce={nonce}
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthTokenHandler />
          <SessionRecovery />
          <TooltipProvider>
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
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
