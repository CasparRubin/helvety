"use client";

import {
  AUTH_NAVBAR_ABOUT,
  AUTH_NAVBAR_ENCRYPTION_TOOLTIP,
} from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { createVaultAwareShellNavbar } from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the Auth app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export const Navbar = createVaultAwareShellNavbar({
  brand: {
    currentApp: "Auth",
    homeHref: urls.home,
    homeAriaLabel: "Visit Helvety.com",
  },
  aboutDescription: AUTH_NAVBAR_ABOUT,
  encryptionTooltipBody: AUTH_NAVBAR_ENCRYPTION_TOOLTIP,
  navigationMenuDescription: "Auth navigation menu",
  versionLabel: VERSION ?? null,
});
