import "./globals.css";
import localFont from "next/font/local";

import { Navbar } from "@/components/navbar";
import { Providers } from "@/components/providers";
import { SubscriptionsPanel } from "@/components/subscriptions-panel";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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
  metadataBase: new URL("https://store.helvety.com"),
  title: {
    default: "Helvety Store | Software, Subscriptions & Apparel",
    template: "%s | Helvety Store",
  },
  description:
    "Official Helvety Store. Browse software, subscriptions, and apparel designed in Switzerland.",
  keywords: [
    "Helvety Store",
    "software",
    "subscriptions",
    "apparel",
    "Swiss",
    "shop",
    "merchandise",
  ],
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  icons: {
    icon: [{ url: "/helvety_Identifier_whiteBg.svg", type: "image/svg+xml" }],
    apple: [{ url: "/helvety_Identifier_whiteBg.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://store.helvety.com",
    siteName: "Helvety Store",
    title: "Helvety Store | Software, Subscriptions & Apparel",
    description:
      "Official Helvety Store. Browse software, subscriptions, and apparel designed in Switzerland.",
  },
  twitter: {
    card: "summary",
    title: "Helvety Store | Software, Subscriptions & Apparel",
    description:
      "Official Helvety Store. Browse software, subscriptions, and apparel designed in Switzerland.",
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
    canonical: "https://store.helvety.com",
  },
};

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
            <Providers>
              <NavbarWrapper>{children}</NavbarWrapper>
            </Providers>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

async function NavbarWrapper({ children }: { children: React.ReactNode }) {
  // Always show navbar
  return (
    <>
      <Navbar />
      <div className="mx-auto flex w-full max-w-[2000px]">
        <main className="min-w-0 flex-1">{children}</main>
        <SubscriptionsPanel />
      </div>
    </>
  );
}
