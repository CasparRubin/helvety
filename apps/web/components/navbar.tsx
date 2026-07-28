"use client";

import { WEB_NAVBAR_ABOUT } from "@helvety/shared/app-navbar-about";
import { createPublicShellNavbar } from "@helvety/ui/create-app-navbar";

import { VERSION } from "@/lib/config/version";

/** Main navigation bar for the Web app - see `HelvetyShellNavbar` in `@helvety/ui`. */
export const Navbar = createPublicShellNavbar({
  brand: {
    currentApp: "Home",
    homeHref: "/",
    homeAriaLabel: "Go to home",
  },
  aboutDescription: WEB_NAVBAR_ABOUT,
  navigationMenuDescription: "Home navigation menu",
  versionLabel: VERSION ?? null,
});
