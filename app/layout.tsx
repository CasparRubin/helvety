import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";

import { AuthTokenHandler } from "@/components/auth-token-handler";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  metadataBase: new URL("https://pdf.helvety.com"),
  title: {
    default: "Helvety PDF | Free PDF Tool | Private and Secure",
    template: "%s | Helvety PDF",
  },
  description:
    "Manage PDF files with ease. Merge, reorder, delete, rotate, and extract PDF pages - all in one place. All processing happens locally in your browser. Private, secure, and 100% free with no limits.",
  keywords: [
    "Helvety PDF",
    "PDF merge",
    "PDF reorder",
    "PDF delete",
    "PDF rotate",
    "PDF extract",
    "client-side PDF",
    "privacy PDF tool",
    "secure PDF",
    "browser PDF",
    "PDF editor",
    "free PDF tool",
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
    url: "https://pdf.helvety.com",
    siteName: "Helvety PDF",
    title: "Helvety PDF | Free PDF Tool | Private and Secure",
    description:
      "Manage PDF files with ease. Merge, reorder, delete, rotate, and extract PDF pages - all in one place. All processing happens locally in your browser. 100% free with no limits.",
    images: [
      {
        url: "/helvety_Identifier_whiteBg.svg",
        width: 500,
        height: 500,
        alt: "Helvety PDF",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Helvety PDF | Free PDF Tool | Private and Secure",
    description:
      "Manage PDF files with ease. Merge, reorder, delete, rotate, and extract PDF pages - all in one place. All processing happens locally in your browser. 100% free with no limits.",
    images: [
      {
        url: "/helvety_Identifier_whiteBg.svg",
        alt: "Helvety PDF",
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
    canonical: "https://pdf.helvety.com",
  },
  category: "productivity",
};

/**
 * Root layout: fixed header (Navbar), overflow-hidden main (PDF toolkit manages its own scroll), fixed footer.
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
          <TooltipProvider>
            <div className="flex h-screen flex-col overflow-hidden">
              <header className="shrink-0">
                <Navbar initialUser={initialUser} />
              </header>
              <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
              <Footer className="shrink-0" />
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
