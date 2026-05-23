"use client";

import {
  docsNavbarAbout,
  DOCS_NAVBAR_ENCRYPTION_TOOLTIP,
} from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";
import { EncryptionTooltipContent } from "@helvety/ui/encryption-tooltip-content";
import { HelvetyShellNavbar } from "@helvety/ui/helvety-shell-navbar";

import { VERSION } from "@/lib/config/version";

import type { User } from "@supabase/supabase-js";

const encryptionTooltipContent = (
  <EncryptionTooltipContent body={<p>{DOCS_NAVBAR_ENCRYPTION_TOOLTIP}</p>} />
);

/** Main navigation bar for the Docs app. */
export function Navbar({ initialUser = null }: { initialUser?: User | null }) {
  const {
    isUnlocked,
    isLoading: encryptionLoading,
    unlockedForUserId,
  } = useEncryptionContext();

  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: "Docs",
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        titleText: "Docs",
        titleHref: "/",
      }}
      aboutDescription={docsNavbarAbout()}
      navigationMenuDescription="Docs navigation menu"
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
