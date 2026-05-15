"use client";

import { AUTH_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { EncryptionTooltipContent } from "@helvety/ui/encryption-tooltip-content";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User as SupabaseUser } from "@supabase/supabase-js";

const encryptionTooltipContent = (
  <EncryptionTooltipContent
    body={
      <p>
        Sensitive content is encrypted on your device before it leaves your
        browser. Helvety does not store your decryption keys. In our current
        architecture, encrypted content is designed to remain unreadable to
        Helvety during normal operation. Some structural metadata (such as
        timestamps and display preferences) is stored unencrypted to enable app
        functionality.
      </p>
    }
  />
);

/** Main navigation bar for the Auth app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export function Navbar({
  initialUser = null,
}: {
  initialUser?: SupabaseUser | null;
}) {
  const {
    isUnlocked,
    isLoading: encryptionLoading,
    unlockedForUserId,
  } = useEncryptionContext();

  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Auth",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
      }}
      aboutDescription={AUTH_NAVBAR_ABOUT}
      navigationMenuDescription="Auth navigation menu"
      versionLabel={VERSION ?? null}
      account={{ variant: "external-store" }}
      loginReturnUrl="current"
      encryption={({ user }) => ({
        loading: encryptionLoading,
        showBadge: isUnlocked && !!user?.id && unlockedForUserId === user.id,
        tooltipContent: encryptionTooltipContent,
      })}
    />
  );
}
