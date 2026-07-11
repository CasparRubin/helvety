"use client";

import { E2EE_NAVBAR_ENCRYPTION_TOOLTIP } from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { useEncryptionContext } from "@helvety/shared/crypto/encryption-context";

import { E2eeAppNavbar } from "./e2ee-app-navbar";
import { EncryptionTooltipContent } from "./encryption-tooltip-content";
import { HelvetyShellNavbar } from "./helvety-shell-navbar";

import type { HelvetyShellNavbarBrand } from "./helvety-shell-navbar";
import type { User } from "@helvety/shared/supabase-types";
import type { ComponentType } from "react";

/** Config for {@link createE2eeAppNavbar}. */
export type CreateE2eeAppNavbarConfig = Readonly<{
  currentApp: string;
  titleText: string;
  aboutDescription: string;
  versionLabel: string | null;
  navigationMenuDescription?: string;
}>;

/** Creates the standard E2EE zone navbar component. */
export function createE2eeAppNavbar(
  config: CreateE2eeAppNavbarConfig
): ComponentType<{ initialUser?: User | null }> {
  const labels = {
    currentApp: config.currentApp,
    titleText: config.titleText,
    encryptionTooltipBody: E2EE_NAVBAR_ENCRYPTION_TOOLTIP,
    aboutDescription: config.aboutDescription,
    navigationMenuDescription:
      config.navigationMenuDescription ??
      `${config.currentApp} navigation menu`,
  };

  /** E2EE zone navbar for the app shell. */
  function Navbar({ initialUser = null }: { initialUser?: User | null }) {
    return (
      <E2eeAppNavbar
        initialUser={initialUser}
        labels={labels}
        versionLabel={config.versionLabel}
      />
    );
  }

  Navbar.displayName = `${config.currentApp}Navbar`;
  return Navbar;
}

/** Config for {@link createPublicShellNavbar}. */
export type CreatePublicShellNavbarConfig = Readonly<{
  brand: HelvetyShellNavbarBrand;
  aboutDescription: string;
  versionLabel: string | null;
  navigationMenuDescription: string;
  account: Parameters<typeof HelvetyShellNavbar>[0]["account"];
  loginReturnUrl?: "current";
}>;

/** Creates a public-shell navbar (web, auth, store, pdf, image-upscaler, image-editor, ocr). */
export function createPublicShellNavbar(
  config: CreatePublicShellNavbarConfig
): ComponentType<{ initialUser?: User | null }> {
  /** Public-shell navbar for the app. */
  function Navbar({ initialUser = null }: { initialUser?: User | null }) {
    return (
      <HelvetyShellNavbar
        initialUser={initialUser}
        brand={config.brand}
        aboutDescription={config.aboutDescription}
        navigationMenuDescription={config.navigationMenuDescription}
        versionLabel={config.versionLabel}
        account={config.account}
        loginReturnUrl={config.loginReturnUrl}
      />
    );
  }

  Navbar.displayName = `${config.brand.currentApp}Navbar`;
  return Navbar;
}

/** Config for {@link createVaultAwareShellNavbar} (auth). */
export type CreateVaultAwareShellNavbarConfig = Readonly<{
  brand: HelvetyShellNavbarBrand;
  aboutDescription: string;
  encryptionTooltipBody: string;
  versionLabel: string | null;
  navigationMenuDescription: string;
  account?: Parameters<typeof HelvetyShellNavbar>[0]["account"];
}>;

/** Creates a public-shell navbar with vault encryption badge (auth). */
export function createVaultAwareShellNavbar(
  config: CreateVaultAwareShellNavbarConfig
): ComponentType<{ initialUser?: User | null }> {
  const encryptionTooltipContent = (
    <EncryptionTooltipContent body={<p>{config.encryptionTooltipBody}</p>} />
  );

  /** Vault-aware public-shell navbar (auth). */
  function Navbar({ initialUser = null }: { initialUser?: User | null }) {
    const {
      isUnlocked,
      isLoading: encryptionLoading,
      unlockedForUserId,
    } = useEncryptionContext();

    return (
      <HelvetyShellNavbar
        initialUser={initialUser}
        brand={config.brand}
        aboutDescription={config.aboutDescription}
        navigationMenuDescription={config.navigationMenuDescription}
        versionLabel={config.versionLabel}
        account={config.account ?? { variant: "external-store" }}
        loginReturnUrl="current"
        encryption={({ user }) => ({
          loading: encryptionLoading,
          showBadge: isUnlocked && !!user?.id && unlockedForUserId === user.id,
          tooltipContent: encryptionTooltipContent,
        })}
      />
    );
  }

  Navbar.displayName = `${config.brand.currentApp}Navbar`;
  return Navbar;
}

/** Default brand for tool zones that link back to helvety.com home. */
export function publicToolNavbarBrand(
  currentApp: string,
  titleText?: string
): HelvetyShellNavbarBrand {
  return {
    currentApp,
    homeHref: urls.home,
    homeAriaLabel: "Visit Helvety.com",
    titleText: titleText ?? currentApp,
    titleHref: "/",
  };
}
