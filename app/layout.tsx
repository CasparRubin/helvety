import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";

import "./globals.css";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";

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
  metadataBase: new URL("https://helvety.com"),
  title: {
    default: "Helvety | Software and Apparel | Designed in Switzerland",
    template: "%s | Helvety",
  },
  description: "Helvety. Swiss Engineering.",
  keywords: [
    "Helvety",
    "Swiss software",
    "Swiss apparel",
    "Switzerland",
    "software development",
  ],
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://helvety.com",
    siteName: "Helvety",
    title: "Helvety | Software and Apparel | Designed in Switzerland",
    description: "Helvety. Swiss Engineering.",
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
    title: "Helvety | Software and Apparel | Designed in Switzerland",
    description: "Helvety. Swiss Engineering.",
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
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="flex h-screen flex-col overflow-hidden">
              <header className="shrink-0">
                <Navbar />
              </header>
              <ScrollArea className="min-h-0 flex-1">
                <div className="mx-auto w-full max-w-[2000px]">{children}</div>
              </ScrollArea>
              <Footer />
            </div>
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
