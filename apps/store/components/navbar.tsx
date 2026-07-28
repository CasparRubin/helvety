"use client";

import { STORE_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { urls } from "@helvety/shared/config";
import { createPublicShellNavbar } from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the Store app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export const Navbar = createPublicShellNavbar({
  brand: {
    currentApp: "Store",
    homeHref: urls.home,
    homeAriaLabel: "Visit Helvety.com",
    titleText: "STORE",
    titleHref: "/",
  },
  aboutDescription: STORE_NAVBAR_ABOUT,
  navigationMenuDescription: "Store navigation menu",
  versionLabel: VERSION ?? null,
});
