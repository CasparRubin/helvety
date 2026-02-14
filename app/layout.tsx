import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";

import { AuthTokenHandler } from "@/components/auth-token-handler";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { SessionRecovery } from "@/components/session-recovery";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EncryptionProvider } from "@/lib/crypto";
import { createServerClient } from "@/lib/supabase/server";
import "./globals.css";

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
  metadataBase: new URL("https://contacts.helvety.com"),
  title: {
    default: "Helvety Contacts | Contact Management | Private and Secure",
    template: "%s | Helvety Contacts",
  },
  description:
    "Manage your contacts with ease. Private, secure, and encrypted contact management.",
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
  icons: {
    icon: [{ url: "/helvety_Identifier_whiteBg.svg", type: "image/svg+xml" }],
    apple: [{ url: "/helvety_Identifier_whiteBg.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://contacts.helvety.com",
    siteName: "Helvety Contacts",
    title: "Helvety Contacts | Contact Management | Private and Secure",
    description:
      "Manage your contacts with ease. Private, secure, and encrypted contact management.",
    images: [
      {
        url: "/helvety_Identifier_whiteBg.svg",
        width: 500,
        height: 500,
        alt: "Helvety Contacts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Helvety Contacts | Contact Management | Private and Secure",
    description:
      "Manage your contacts with ease. Private, secure, and encrypted contact management.",
    images: [
      {
        url: "/helvety_Identifier_whiteBg.svg",
        alt: "Helvety Contacts",
      },
    ],
  },
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://contacts.helvety.com",
  },
  category: "productivity",
};

/**
 * Root layout: fixed header (Navbar), ScrollArea main, fixed footer.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
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
          <AuthTokenHandler />
          <SessionRecovery />
          <TooltipProvider>
            <EncryptionProvider>
              <div className="flex h-screen flex-col overflow-hidden">
                <header className="shrink-0">
                  <Navbar initialUser={initialUser} />
                </header>
                <ScrollArea className="min-h-0 flex-1">
                  <main>{children}</main>
                </ScrollArea>
                <Footer className="shrink-0" />
              </div>
              <Toaster />
            </EncryptionProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
