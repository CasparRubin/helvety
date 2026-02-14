import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import "./globals.css";

import { AuthTokenHandler } from "@/components/auth-token-handler";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EncryptionProvider } from "@/lib/crypto/encryption-context";
import { createServerClient } from "@/lib/supabase/server";

import type { Metadata, Viewport } from "next";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://auth.helvety.com"),
  title: {
    default: "Sign In | Helvety",
    template: "%s | Helvety",
  },
  description: "Sign in to your Helvety account",
  keywords: ["Helvety", "sign in", "login", "authentication"],
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://auth.helvety.com",
    siteName: "Helvety Auth",
    title: "Sign In | Helvety",
    description: "Sign in to your Helvety account",
    images: [
      {
        url: "/helvety_Identifier_whiteBg.svg",
        width: 500,
        height: 500,
        alt: "Helvety",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Sign In | Helvety",
    description: "Sign in to your Helvety account",
    images: [
      {
        url: "/helvety_Identifier_whiteBg.svg",
      },
    ],
  },
  icons: {
    icon: [{ url: "/helvety_Identifier_whiteBg.svg", type: "image/svg+xml" }],
    apple: [{ url: "/helvety_Identifier_whiteBg.svg", type: "image/svg+xml" }],
  },
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Root layout: fixed header (Navbar), ScrollArea main, fixed footer (contact + legal links).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch initial user server-side to avoid loading flash in Navbar
  const supabase = await createServerClient();
  const {
    data: { user: initialUser },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <EncryptionProvider>
            <TooltipProvider>
              <AuthTokenHandler />
              <div className="flex h-screen flex-col overflow-hidden">
                <header className="shrink-0">
                  <Navbar initialUser={initialUser} />
                </header>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="mx-auto w-full max-w-[2000px]">
                    {children}
                  </div>
                </ScrollArea>
                <Footer />
              </div>
              <Toaster />
            </TooltipProvider>
          </EncryptionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
