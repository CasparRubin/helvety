import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { getCachedUser } from "@helvety/shared/cached-server";
import { sharedViewport, urls } from "@helvety/shared/config";
import { logger } from "@helvety/shared/logger";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { IMAGE_UPSCALER_APP_DESCRIPTION } from "@/lib/product-copy";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.imageUpscaler,
  title: {
    default: "Helvety Image Upscaler | Upscale images in your browser",
    template: "%s | Helvety Image Upscaler",
  },
  description: IMAGE_UPSCALER_APP_DESCRIPTION,
  keywords: [
    "Helvety Image Upscaler",
    "image upscaler",
    "upscale image",
    "browser image upscaler",
    "client-side image resize",
    "canvas image resize",
    "privacy image tool",
    "free image upscaler",
  ],
  siteName: "Helvety Image Upscaler",
  canonicalUrl: urls.imageUpscaler,
  brandImage: {
    url: brandAssets.identifierPng,
    ogAlt: "Helvety Image Upscaler",
    twitterAlt: "Helvety Image Upscaler",
  },
  manifest: "/image-upscaler/manifest.json",
  category: "productivity",
  indexing: "all",
});

/**
 * Root layout: fixed header (Navbar), overflow-hidden main with shared container gutters, fixed footer.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  let initialUser: Awaited<ReturnType<typeof getCachedUser>> = null;

  try {
    initialUser = await getCachedUser();
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
  }

  return HelvetyPublicShellRootLayout({
    children,
    organizationLogoUrl: brandAssets.identifierPng,
    jsonLdGraphTail: [
      {
        "@type": "WebApplication",
        name: "Helvety Image Upscaler",
        url: urls.imageUpscaler,
        description: IMAGE_UPSCALER_APP_DESCRIPTION,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        browserRequirements: "Requires a modern web browser",
      },
    ],
    renderNavbar: <Navbar initialUser={initialUser} />,
    mainVariant: "overflow-main",
  });
}
