"use client";

import {
  docsNavbarAbout,
  DOCS_NAVBAR_ENCRYPTION_TOOLTIP,
} from "@helvety/shared/app-navbar-about";
import {
  createVaultAwareShellNavbar,
  publicToolNavbarBrand,
} from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the Docs app. */
export const Navbar = createVaultAwareShellNavbar({
  brand: publicToolNavbarBrand("Docs"),
  aboutDescription: docsNavbarAbout(),
  encryptionTooltipBody: DOCS_NAVBAR_ENCRYPTION_TOOLTIP,
  navigationMenuDescription: "Docs navigation menu",
  versionLabel: VERSION ?? null,
});
