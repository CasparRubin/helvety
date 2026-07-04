import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import { sharedViewport, urls } from "@helvety/shared/config";
import { bootstrapPublicLayoutUser } from "@helvety/shared/layout-session-bootstrap";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";
import { IMAGE_EDITOR_APP_DESCRIPTION } from "@/lib/product-copy";

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.imageEditor,
  title: {
    default: "Helvety Image Editor | Annotate images in your browser",
    template: "%s | Helvety Image Editor",
  },
  description: IMAGE_EDITOR_APP_DESCRIPTION,
  keywords: [
    "Helvety Image Editor",
    "image editor",
    "annotate image",
    "crop image",
    "blur image",
    "highlight image",
    "zoom image",
    "image layers",
    "browser image editor",
    "client-side image editor",
    "privacy image tool",
    "free image editor",
  ],
  siteName: "Helvety Image Editor",
  canonicalUrl: urls.imageEditor,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety Image Editor",
    twitterAlt: "Helvety Image Editor",
  },
  manifest: "/image-editor/manifest.json",
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
  const initialUser = await bootstrapPublicLayoutUser();

  return (
    <HelvetyPublicShellRootLayout
      organizationLogoUrl={brandAssets.identifierLogo}
      jsonLdGraphTail={[
        {
          "@type": "WebApplication",
          name: "Helvety Image Editor",
          url: urls.imageEditor,
          description: IMAGE_EDITOR_APP_DESCRIPTION,
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Any",
          isAccessibleForFree: true,
          browserRequirements: "Requires a modern web browser",
        },
      ]}
      renderNavbar={<Navbar initialUser={initialUser} />}
      mainVariant="overflow-main"
    >
      {children}
    </HelvetyPublicShellRootLayout>
  );
}
