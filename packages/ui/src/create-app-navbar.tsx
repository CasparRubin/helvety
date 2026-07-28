"use client";

import { urls } from "@helvety/shared/config";

import { HelvetyShellNavbar } from "./helvety-shell-navbar";

import type { HelvetyShellNavbarBrand } from "./helvety-shell-navbar";
import type { ComponentType } from "react";

/** Config for {@link createPublicShellNavbar}. */
export type CreatePublicShellNavbarConfig = Readonly<{
  brand: HelvetyShellNavbarBrand;
  aboutDescription: string;
  versionLabel: string | null;
  navigationMenuDescription: string;
}>;

/** Creates a public-shell navbar (web, store, pdf, image-editor, ocr). */
export function createPublicShellNavbar(
  config: CreatePublicShellNavbarConfig
): ComponentType {
  /** Public-shell navbar for the app. */
  function Navbar() {
    return (
      <HelvetyShellNavbar
        brand={config.brand}
        aboutDescription={config.aboutDescription}
        navigationMenuDescription={config.navigationMenuDescription}
        versionLabel={config.versionLabel}
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
