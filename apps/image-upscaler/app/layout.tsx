import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { AuthTokenHandler } from "@helvety/ui/auth-token-handler";
import { Footer } from "@helvety/ui/footer";
import { JsonLdScript } from "@helvety/ui/json-ld-script";
import { SessionRecovery } from "@helvety/ui/session-recovery";
import { SkipToContent } from "@helvety/ui/skip-to-content";
import { Toaster } from "@helvety/ui/sonner";
import { ThemeProvider } from "@helvety/ui/theme-provider";
import { TooltipProvider } from "@helvety/ui/tooltip";
import { VercelAnalytics } from "@helvety/ui/vercel-analytics";

import { Navbar } from "@/components/navbar";
import { IMAGE_UPSCALER_APP_DESCRIPTION_COPY } from "@/lib/product-copy";

import type { Metadata } from "next";

export const viewport = sharedViewport;

export const metadata: Metadata = {
  metadataBase: new URL(urls.imageUpscaler),
  title: {
    default: "Helvety Image Upscaler | Upscale Tool",
    template: "%s | Helvety Image Upscaler",
  },
  description: IMAGE_UPSCALER_APP_DESCRIPTION_COPY,
  keywords: [
    "Helvety Image Upscaler",
    "image upscaler",
    "upscale image",
    "webgpu image upscaler",
    "browser image upscaler",
    "client-side image processing",
    "privacy image tool",
    "free image upscaler",
  ],
  authors: [{ name: "Helvety" }],
  creator: "Helvety",
  publisher: "Helvety",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/image-upscaler/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: urls.imageUpscaler,
    siteName: "Helvety Image Upscaler",
    title: "Helvety Image Upscaler | Upscale Tool",
    description: IMAGE_UPSCALER_APP_DESCRIPTION_COPY,
    images: [
      {
        url: brandAssets.identifierPng,
        width: 500,
        height: 500,
        alt: "Helvety Image Upscaler",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Helvety Image Upscaler | Upscale Tool",
    description: IMAGE_UPSCALER_APP_DESCRIPTION_COPY,
    images: [
      {
        url: brandAssets.identifierPng,
        alt: "Helvety Image Upscaler",
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
    canonical: urls.imageUpscaler,
  },
  category: "productivity",
};

/**
 * Root layout: fixed header (Navbar), overflow-hidden main with shared container gutters, fixed footer.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const nonce = (await getRequestCspNonce()) ?? undefined;

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <JsonLdScript
          nonce={nonce}
          json={{
            "@context": "https://schema.org",
            "@graph": [
              createHelvetyOrganizationSchema(brandAssets.identifierPng),
              {
                "@type": "WebApplication",
                name: "Helvety Image Upscaler",
                url: urls.imageUpscaler,
                description: IMAGE_UPSCALER_APP_DESCRIPTION_COPY,
                applicationCategory: "UtilitiesApplication",
                operatingSystem: "Any",
                isAccessibleForFree: true,
                browserRequirements: "Requires a modern web browser",
              },
            ],
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
              <main
                id="main-content"
                className="container mx-auto min-h-0 flex-1 overflow-hidden px-4"
              >
                {children}
              </main>
              <Footer className="shrink-0" />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
