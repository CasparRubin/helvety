import {
  getCachedCSRFToken,
  getCachedUser,
} from "@helvety/shared/cached-server";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { logger } from "@helvety/shared/logger";
import { headers } from "next/headers";

import { AuthTokenHandler } from "./auth-token-handler";
import { CSRFProvider } from "./csrf-provider";
import { EncryptionGateApp } from "./encryption-gate-app";
import { Footer } from "./footer";
import { ScrollArea } from "./scroll-area";
import { SessionRecovery } from "./session-recovery";
import { SkipToContent } from "./skip-to-content";
import { Toaster } from "./sonner";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "./tooltip";
import { VercelAnalytics } from "./vercel-analytics";

import type { User } from "@supabase/supabase-js";
import type { ComponentType, ReactNode } from "react";

/** Second JSON-LD object: SoftwareApplication for the E2EE zone. */
export type E2eeSoftwareApplicationLd = {
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
};

/** Props for `E2eeAppRootLayout`. */
export type E2eeAppRootLayoutProps = Readonly<{
  children: ReactNode;
  /** Organization + product logo URL (e.g. `brandAssets.identifierPng`). */
  organizationLogoUrl: string;
  softwareApplication: E2eeSoftwareApplicationLd;
  /** App-local client encryption context (e.g. `@/lib/crypto`). */
  EncryptionProvider: ComponentType<{ children: ReactNode }>;
  renderNavbar: (initialUser: User | null) => ReactNode;
}>;

/**
 * Shared root shell for Contacts, Notes, and Tasks: nonce/CSRF/user bootstrap,
 * JSON-LD, providers, EncryptionGateApp when authenticated.
 */
export async function E2eeAppRootLayout({
  children,
  organizationLogoUrl,
  softwareApplication,
  EncryptionProvider,
  renderNavbar,
}: E2eeAppRootLayoutProps): Promise<React.JSX.Element> {
  let nonce = "";
  let csrfToken = "";
  let initialUser: User | null = null;

  try {
    [nonce, csrfToken, initialUser] = await Promise.all([
      headers().then((h) => h.get("x-nonce") ?? ""),
      getCachedCSRFToken().then((t) => t ?? ""),
      getCachedUser(),
    ]);
  } catch (error) {
    logger.logUnexpectedError("Layout initialization failed", error);
  }

  const ldJson = [
    createHelvetyOrganizationSchema(organizationLogoUrl),
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: softwareApplication.name,
      url: softwareApplication.url,
      description: softwareApplication.description,
      applicationCategory: softwareApplication.applicationCategory,
      operatingSystem: "Any",
      isAccessibleForFree: true,
    },
  ];

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ldJson),
          }}
        />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          <SessionRecovery />
          <TooltipProvider>
            <CSRFProvider csrfToken={csrfToken}>
              <EncryptionProvider>
                <div className="flex h-screen flex-col overflow-hidden">
                  <header className="shrink-0">
                    {renderNavbar(initialUser)}
                  </header>
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="container mx-auto w-full px-4">
                      <main id="main-content">
                        {initialUser ? (
                          <EncryptionGateApp userId={initialUser.id}>
                            {children}
                          </EncryptionGateApp>
                        ) : (
                          children
                        )}
                      </main>
                    </div>
                  </ScrollArea>
                  <Footer className="shrink-0" />
                </div>
                <Toaster />
              </EncryptionProvider>
            </CSRFProvider>
          </TooltipProvider>
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
