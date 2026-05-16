import { getRequestCspNonce } from "@helvety/shared/csp-nonce";
import { publicSans } from "@helvety/shared/fonts";
import {
  createHelvetyOrganizationSchema,
  DEFAULT_THEME_PROVIDER_PROPS,
} from "@helvety/shared/layout-primitives";
import { bootstrapE2eeLayoutSession } from "@helvety/shared/layout-session-bootstrap";

import { AuthTokenHandler } from "./auth-token-handler";
import { CSRFProvider } from "./csrf-provider";
import { EncryptionGateApp } from "./encryption-gate-app";
import { Footer } from "./footer";
import { JsonLdScript } from "./json-ld-script";
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
  /** Organization + product logo URL (e.g. `brandAssets.identifierLogo`). */
  organizationLogoUrl: string;
  softwareApplication: E2eeSoftwareApplicationLd;
  /** App-local client encryption context (e.g. `@/lib/crypto`). */
  encryptionProvider: ComponentType<{ children: ReactNode }>;
  /**
   * Fixed header for the zone (non-scrolling); conventionally the app's `Navbar`
   * component forwarding `initialUser` into `E2eeAppNavbar`.
   */
  renderNavbar: (initialUser: User | null) => ReactNode;
}>;

/**
 * Shared root shell for Contacts, Notes, Tasks, and Links: nonce, per-request CSRF +
 * user bootstrap (`getCachedCSRFToken`, `getCachedUser`), JSON-LD, theme and
 * tooltip shell, app `encryptionProvider`, `EncryptionGateApp` when authenticated.
 *
 * Main does not scroll at the layout level; list/editor pages pin the command bar
 * with {@link CommandBarPageLayout} and scroll body content via `ScrollArea`.
 */
export async function E2eeAppRootLayout({
  children,
  organizationLogoUrl,
  softwareApplication,
  encryptionProvider,
  renderNavbar,
}: E2eeAppRootLayoutProps): Promise<React.JSX.Element> {
  const EncryptionProviderSlot = encryptionProvider;
  const nonce = (await getRequestCspNonce()) ?? undefined;
  const { csrfToken, initialUser } = await bootstrapE2eeLayoutSession();

  const ldJson = {
    "@context": "https://schema.org",
    "@graph": [
      createHelvetyOrganizationSchema(organizationLogoUrl),
      {
        "@type": "SoftwareApplication",
        name: softwareApplication.name,
        url: softwareApplication.url,
        description: softwareApplication.description,
        applicationCategory: softwareApplication.applicationCategory,
        operatingSystem: "Any",
        isAccessibleForFree: true,
      },
    ],
  };

  return (
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="antialiased">
        <SkipToContent />
        <JsonLdScript nonce={nonce} json={ldJson} />
        <ThemeProvider nonce={nonce} {...DEFAULT_THEME_PROVIDER_PROPS}>
          <AuthTokenHandler />
          <SessionRecovery />
          <TooltipProvider>
            <CSRFProvider csrfToken={csrfToken}>
              <EncryptionProviderSlot>
                <div className="flex h-screen flex-col overflow-hidden">
                  <header className="shrink-0">
                    {renderNavbar(initialUser)}
                  </header>
                  <main
                    id="main-content"
                    className="flex min-h-0 flex-1 flex-col overflow-hidden"
                  >
                    <div className="container mx-auto flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4">
                      {initialUser ? (
                        <EncryptionGateApp userId={initialUser.id}>
                          {children}
                        </EncryptionGateApp>
                      ) : (
                        children
                      )}
                    </div>
                  </main>
                  <Footer className="shrink-0" />
                </div>
                <Toaster />
              </EncryptionProviderSlot>
            </CSRFProvider>
          </TooltipProvider>
        </ThemeProvider>
        <VercelAnalytics />
      </body>
    </html>
  );
}
