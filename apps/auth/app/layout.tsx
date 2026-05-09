import "./globals.css";
import { brandAssets } from "@helvety/brand/urls";
import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
import { sharedViewport, urls } from "@helvety/shared/config";
import { EncryptionProvider } from "@helvety/shared/crypto/encryption-context";
import { logger } from "@helvety/shared/logger";
import { createHelvetyProductMetadata } from "@helvety/shared/seo";
import { CSRFProvider } from "@helvety/ui/csrf-provider";
import { HelvetyPublicShellRootLayout } from "@helvety/ui/helvety-public-shell-root-layout";

import { Navbar } from "@/components/navbar";

/** Shared auth SEO / social copy (single source for metadata + JSON-LD). */
export const AUTH_DESCRIPTION =
  "Passwordless entry for Helvety apps-OTP, passkeys, and session recovery where your platform allows. Open source, Swiss-built.";

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
  let csrfToken = "";
  let initialUser: Awaited<ReturnType<typeof getCachedUser>> = null;

  try {
    [csrfToken, initialUser] = await Promise.all([
      getCachedCSRFToken().then((t) => t ?? ""),
      getCachedUser(),
    ]);
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
  }

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
