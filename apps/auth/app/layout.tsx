import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  AUTH_DESCRIPTION,
  AUTH_PWA_MANIFEST_DESCRIPTION,
} from "@helvety/shared/app-product-descriptions";
import { sharedViewport, urls } from "@helvety/shared/config";
import { EncryptionProvider } from "@helvety/shared/crypto/encryption-context";
import { bootstrapAuthLayoutSession } from "@helvety/shared/layout-session-bootstrap";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";

export { AUTH_DESCRIPTION, AUTH_PWA_MANIFEST_DESCRIPTION };

export const viewport = sharedViewport;

export const metadata = createHelvetyProductMetadata({
  metadataBase: urls.auth,
  title: {
    default: "Helvety Auth | Sign in to your account",
    template: "%s | Helvety",
  },
  description: AUTH_DESCRIPTION,
  keywords: ["Helvety", "sign in", "login", "authentication"],
  siteName: "Helvety Auth",
  canonicalUrl: urls.auth,
  brandImage: {
    url: brandAssets.identifierLogo,
    ogAlt: "Helvety",
  },
  manifest: "/auth/manifest.json",
  indexing: "none",
});

/**
 * Root layout: fixed header (Navbar), ScrollArea main with shared container gutters, fixed footer (contact + legal links).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<React.JSX.Element> {
  const { csrfToken, initialUser } = await bootstrapAuthLayoutSession();

  return HelvetyPublicShellRootLayout({
    children,
    organizationLogoUrl: brandAssets.identifierLogo,
    jsonLdGraphTail: [
      {
        "@type": "WebApplication",
        name: "Helvety Auth",
        url: urls.auth,
        description: AUTH_DESCRIPTION,
        applicationCategory: "SecurityApplication",
        operatingSystem: "Any",
      },
    ],
    renderNavbar: <Navbar initialUser={initialUser} />,
    mainVariant: "scroll-area",
    wrapInsideTooltipProvider: (shell) => (
      <CSRFProvider csrfToken={csrfToken}>
        <EncryptionProvider>{shell}</EncryptionProvider>
      </CSRFProvider>
    ),
  });
}
