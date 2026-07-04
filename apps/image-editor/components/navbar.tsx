"use client";

import { imageEditorNavbarAbout } from "@helvety/shared/app-navbar-about";
import {
  createPublicShellNavbar,
  publicToolNavbarBrand,
} from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the Image Editor app. */
export const Navbar = createPublicShellNavbar({
  brand: publicToolNavbarBrand("Image Editor"),
  aboutDescription: imageEditorNavbarAbout(),
  navigationMenuDescription: "Image Editor navigation menu",
  versionLabel: VERSION ?? null,
  account: { variant: "external-store" },
});
