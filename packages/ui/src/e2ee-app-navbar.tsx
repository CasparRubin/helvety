"use client";

import { urls } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";

import { EncryptionTooltipContent } from "./encryption-tooltip-content";
import { HelvetyShellNavbar } from "./helvety-shell-navbar";

import type { User } from "@supabase/supabase-js";

/** App-specific navbar copy (Contacts / Notes / Tasks / Links). */
export type E2eeAppNavbarLabels = {
  currentApp: string;
  titleText: string;
  /** First body paragraph in the encryption tooltip (after the heading). */
  encryptionTooltipBody: string;
  /** About dialog body. */
  aboutDescription: string;
  /** Screen-reader description for the mobile menu sheet (`AccessibleSheetHeader`). */
  navigationMenuDescription: string;
};

/** Props for `E2eeAppNavbar`. */
export type E2eeAppNavbarProps = {
  initialUser?: User | null;
  labels: E2eeAppNavbarLabels;
  /** Build label from the host app (e.g. `VERSION` from `@/lib/config/version`). */
  versionLabel: string | null;
};

/**
 * Shared navigation bar for Contacts, Notes, Tasks, and Links (E2EE zones).
 * Composes `HelvetyShellNavbar`, wiring `useEncryptionContext` into the
 * `encryption` prop (function of navbar auth snapshot).
 */
export function E2eeAppNavbar({
  initialUser = null,
  labels,
  versionLabel,
}: E2eeAppNavbarProps) {
  const {
    isUnlocked,
    isLoading: encryptionLoading,
    unlockedForUserId,
  } = useEncryptionContext();

  const encryptionTooltipContent = (
    <EncryptionTooltipContent body={<p>{labels.encryptionTooltipBody}</p>} />
  );

  return (
    <HelvetyShellNavbar
      initialUser={initialUser}
      brand={{
        currentApp: labels.currentApp,
        homeHref: urls.home,
        homeAriaLabel: "Visit Helvety.com",
        titleText: labels.titleText,
        titleHref: "/",
      }}
      aboutDescription={labels.aboutDescription}
      navigationMenuDescription={labels.navigationMenuDescription}
      versionLabel={versionLabel}
      account={{ variant: "external-store" }}
      encryption={({ user }) => ({
        loading: encryptionLoading,
        showBadge: isUnlocked && !!user?.id && unlockedForUserId === user.id,
        tooltipContent: encryptionTooltipContent,
      })}
    />
  );
}
